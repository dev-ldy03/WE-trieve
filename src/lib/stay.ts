import type { LocationPoint, Stay } from '../types.ts'
import { haversine } from './distance.ts'

export const STAY_RADIUS_M = 50
export const STAY_MIN_MINUTES = 5
// 기록이 이만큼 끊기면(예: 밤사이) 같은 자리여도 다른 체류로 본다
export const MAX_GAP_MINUTES = 30

const MINUTE = 60 * 1000

type NameResolver = (lat: number, lng: number) => string

/**
 * 반경 50m 안에서 5분 이상 머문 구간을 Stay로 묶는다.
 * 구간의 중심(평균 좌표)에서 50m를 벗어나거나 기록이 30분 넘게 끊기면 구간을 끊는다.
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
