import type { ActivityEvent, CheckAlert, LocationPoint, Spot, Stay } from '../types'
import { haversine } from './distance'

export const STAY_RADIUS_M = 50
export const STAY_MIN_MINUTES = 5
// 기록이 이만큼 끊기면(예: 밤사이) 같은 자리여도 다른 체류로 본다
export const MAX_GAP_MINUTES = 30

const MINUTE = 60 * 1000

type NameResolver = (lat: number, lng: number) => string
/** 자리 이름을 아는 경우에만 돌려준다 (정지 시각, 몇 번째 자리) */
export type SpotNameResolver = (startAt: number, index: number) => string | undefined

/**
 * 반경 50m 안에서 5분 이상 머문 구간을 Stay로 묶는다.
 * 구간의 중심(평균 좌표)에서 50m를 벗어나거나 기록이 30분 넘게 끊기면 구간을 끊는다.
 * 자리(spots)는 withSpots로 채운다.
 */
export function detectStays(
  points: LocationPoint[],
  resolveName: NameResolver = () => '이름 없는 장소',
): Stay[] {
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp)
  const stays: Stay[] = []

  let cluster: LocationPoint[] = []
  let sumLat = 0
  let sumLng = 0

  const flush = () => {
    if (cluster.length === 0) return
    const startAt = cluster[0].timestamp
    const endAt = cluster[cluster.length - 1].timestamp
    const durationMin = Math.round((endAt - startAt) / MINUTE)
    if (durationMin >= STAY_MIN_MINUTES) {
      const lat = sumLat / cluster.length
      const lng = sumLng / cluster.length
      stays.push({
        id: `stay-${startAt}`,
        placeName: resolveName(lat, lng),
        lat,
        lng,
        startAt,
        endAt,
        durationMin,
        spots: [],
      })
    }
  }

  for (const p of sorted) {
    if (cluster.length > 0) {
      const center = { lat: sumLat / cluster.length, lng: sumLng / cluster.length }
      const last = cluster[cluster.length - 1]
      const gapMin = (p.timestamp - last.timestamp) / MINUTE
      if (haversine(center, p) > STAY_RADIUS_M || gapMin > MAX_GAP_MINUTES) {
        flush()
        cluster = []
        sumLat = 0
        sumLng = 0
      }
    }
    cluster.push(p)
    sumLat += p.lat
    sumLng += p.lng
  }
  flush()

  return stays
}

/**
 * Stay 안에서 5분 이상 정지했다가 다시 걷기 시작한 구간을 Spot으로 나눈다.
 * 아직 걷기 전(지금 앉아 있는 자리)이면 Stay가 끝나는 시각까지를 한 자리로 본다.
 */
export function detectSpots(
  stay: Stay,
  events: ActivityEvent[],
  resolveName: SpotNameResolver = () => undefined,
): Spot[] {
  const inside = events
    .filter((e) => e.timestamp >= stay.startAt - MINUTE && e.timestamp <= stay.endAt)
    .sort((a, b) => a.timestamp - b.timestamp)

  const ranges: [number, number][] = []
  let stoppedAt: number | null = null
  for (const e of inside) {
    if (e.type === '정지') {
      stoppedAt ??= Math.max(e.timestamp, stay.startAt)
    } else if (stoppedAt !== null) {
      ranges.push([stoppedAt, e.timestamp])
      stoppedAt = null
    }
  }
  if (stoppedAt !== null) ranges.push([stoppedAt, stay.endAt])

  return ranges
    .filter(([start, end]) => end - start >= STAY_MIN_MINUTES * MINUTE)
    .map(([startAt, endAt], i) => ({
      id: `spot-${startAt}`,
      stayId: stay.id,
      name: resolveName(startAt, i) ?? `자리 ${i + 1}`,
      startAt,
      endAt,
      durationMin: Math.round((endAt - startAt) / MINUTE),
    }))
}

/**
 * 모든 Stay에 자리를 붙인다.
 * 한 장소에 통째로 머문 경우(자리가 하나뿐이고 이름도 모름)는 자리로 나누지 않는다.
 */
export function withSpots(
  stays: Stay[],
  events: ActivityEvent[],
  resolveName: SpotNameResolver = () => undefined,
): Stay[] {
  return stays.map((stay) => {
    const spots = detectSpots(stay, events, resolveName)
    const named = spots.some((s, i) => resolveName(s.startAt, i) !== undefined)
    return { ...stay, spots: spots.length >= 2 || named ? spots : [] }
  })
}

/** 서로 다른 장소로 옮겨 간 연속 체류 쌍 (떠난 체류 → 새로 머무는 체류) */
export function stayTransitions(stays: Stay[]): { stay: Stay; next: Stay }[] {
  const result: { stay: Stay; next: Stay }[] = []
  for (let i = 0; i < stays.length - 1; i++) {
    if (stays[i].placeName !== stays[i + 1].placeName) {
      result.push({ stay: stays[i], next: stays[i + 1] })
    }
  }
  return result
}

/** 한 장소 안에서 옮겨 간 연속 자리 쌍 */
export function spotTransitions(stay: Stay): { spot: Spot; next: Spot }[] {
  return stay.spots.slice(1).map((next, i) => ({ spot: stay.spots[i], next }))
}

export interface AlertEndpoints {
  fromStay: Stay
  toStay: Stay
  fromSpot: Spot | null
  toSpot: Spot | null
  /** "카페 온기" 또는 "도서관 3층 열람실" */
  fromLabel: string
  toLabel: string
}

/** 알림이 가리키는 떠난 곳·새로 머무는 곳 */
export function alertEndpoints(
  alert: CheckAlert,
  stayById: Map<string, Stay>,
  spotById: Map<string, Spot>,
): AlertEndpoints | null {
  if (alert.trigger === '자리이동') {
    const fromSpot = spotById.get(alert.fromId)
    const toSpot = spotById.get(alert.toId)
    const stay = fromSpot && stayById.get(fromSpot.stayId)
    if (!fromSpot || !toSpot || !stay) return null
    return { fromStay: stay, toStay: stay, fromSpot, toSpot, fromLabel: fromSpot.name, toLabel: toSpot.name }
  }
  const fromStay = stayById.get(alert.fromId)
  const toStay = stayById.get(alert.toId)
  if (!fromStay || !toStay) return null
  return {
    fromStay,
    toStay,
    fromSpot: fromStay.spots[fromStay.spots.length - 1] ?? null,
    toSpot: toStay.spots[0] ?? null,
    fromLabel: fromStay.placeName,
    toLabel: toStay.placeName,
  }
}

/** 알림 문구: 장소를 나왔는지, 자리에서 일어났는지 */
export function alertMessage(trigger: CheckAlert['trigger'], fromLabel: string): string {
  const lead = trigger === '자리이동' ? `${fromLabel}에서 일어나셨네요.` : `${fromLabel}에서 나왔네요.`
  return `${lead}\n다 챙겼는지 한 번만 볼까요?`
}
