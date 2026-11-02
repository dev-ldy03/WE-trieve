import type { Item, LocationPoint, NearLoss, Spot, Stay } from '../types'
import { pathDistance } from './distance'
import { dateKey, josa, startOfDay, timeOfDay, weekdayName } from './format'
import { placeKey } from './predict'

const DAY = 24 * 60 * 60 * 1000

export type Period = 'day' | 'week' | 'month'

const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 }

export interface Range {
  start: number
  end: number
  days: number
}

/** 오늘을 끝으로 하는 하루 / 최근 7일 / 최근 30일 */
export function periodRange(period: Period, now: number): Range {
  const days = PERIOD_DAYS[period]
  const end = startOfDay(now) + DAY
  return { start: end - days * DAY, end, days }
}

const inRange = (ts: number, range: Range) => ts >= range.start && ts < range.end

export function pointsIn(points: LocationPoint[], range: Range) {
  return points.filter((p) => inRange(p.timestamp, range))
}

export function staysIn(stays: Stay[], range: Range) {
  return stays.filter((s) => inRange(s.startAt, range))
}

export interface MovementStats {
  totalDistance: number
  dailyAverage: number
  placeCount: number
}

/** 총 이동 거리, 일평균 거리, 머문 장소 수 */
export function movementStats(points: LocationPoint[], stays: Stay[], range: Range): MovementStats {
  const totalDistance = pathDistance(pointsIn(points, range))
  return {
    totalDistance,
    dailyAverage: totalDistance / range.days,
    placeCount: new Set(staysIn(stays, range).map((s) => s.placeName)).size,
  }
}

export interface DwellEntry {
  label: string
  minutes: number
}

/** 장소·자리별 누적 체류 시간 Top N (자리가 있으면 자리 단위로) */
export function topDwell(stays: Stay[], range: Range, limit = 5): DwellEntry[] {
  const minutes = new Map<string, number>()
  for (const stay of staysIn(stays, range)) {
    const parts =
      stay.spots.length > 0
        ? stay.spots.map((spot) => [placeKey(stay.placeName, spot.name), spot.durationMin] as const)
        : [[stay.placeName, stay.durationMin] as const]
    for (const [label, min] of parts) minutes.set(label, (minutes.get(label) ?? 0) + min)
  }
  return [...minutes.entries()]
    .map(([label, m]) => ({ label, minutes: m }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit)
}

/** 요일(0~6)·시간대별 머문 시간(분) */
export function activityByTime(stays: Stay[], range: Range): Map<string, number> {
  const result = new Map<string, number>()
  for (const stay of staysIn(stays, range)) {
    const key = `${new Date(stay.startAt).getDay()}-${timeOfDay(stay.startAt)}`
    result.set(key, (result.get(key) ?? 0) + stay.durationMin)
  }
  return result
}

/** 기간 안의 잃어버릴 뻔한 기록과, 그 기록이 가리키는 장소·자리 */
interface LossDetail {
  nearLoss: NearLoss
  item: Item
  label: string
  spotName: string | null
}

function lossesIn(
  nearLosses: NearLoss[],
  items: Item[],
  stayById: Map<string, Stay>,
  spotById: Map<string, Spot>,
  range: Range,
): LossDetail[] {
  const itemById = new Map(items.map((item) => [item.id, item]))
  return nearLosses.flatMap((nl) => {
    const item = itemById.get(nl.itemId)
    const stay = stayById.get(nl.stayId)
    if (!item || !stay || !inRange(nl.detectedAt, range)) return []
    const spotName = nl.spotId ? (spotById.get(nl.spotId)?.name ?? null) : null
    return [{ nearLoss: nl, item, label: placeKey(stay.placeName, spotName), spotName }]
  })
}

const countBy = <T,>(list: T[], key: (x: T) => string) => {
  const counts = new Map<string, number>()
  for (const x of list) counts.set(key(x), (counts.get(key(x)) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export interface LossAnalysis {
  /** 물건별 잃어버릴 뻔한 횟수 (0번인 물건 포함) */
  byItem: { item: Item; count: number }[]
  /** 자주 깜빡하는 장소·자리 Top 3 */
  topPlaces: { label: string; count: number }[]
  /** 가장 자주 깜빡한 요일·시간대 */
  topWeekday: { name: string; count: number } | null
  topTimeOfDay: { name: string; count: number } | null
  total: number
  insight: string
}

export function analyzeLosses(
  nearLosses: NearLoss[],
  items: Item[],
  stayById: Map<string, Stay>,
  spotById: Map<string, Spot>,
  range: Range,
): LossAnalysis {
  const losses = lossesIn(nearLosses, items, stayById, spotById, range)
  const byItemCount = new Map(countBy(losses, (l) => l.item.id))
  const weekday = countBy(losses, (l) => weekdayName(new Date(l.nearLoss.detectedAt).getDay()))[0]
  const slot = countBy(losses, (l) => timeOfDay(l.nearLoss.detectedAt))[0]

  return {
    byItem: items
      .map((item) => ({ item, count: byItemCount.get(item.id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    topPlaces: countBy(losses, (l) => l.label)
      .slice(0, 3)
      .map(([label, count]) => ({ label, count })),
    topWeekday: weekday ? { name: weekday[0], count: weekday[1] } : null,
    topTimeOfDay: slot ? { name: slot[0], count: slot[1] } : null,
    total: losses.length,
    insight: buildInsight(losses),
  }
}

/** 위로형 인사이트: 같은 물건을 같은 곳에서 두 번 이상 두고 왔으면 그 패턴을 짚어 준다 */
function buildInsight(losses: LossDetail[]): string {
  if (losses.length === 0) return '이번 기간엔 두고 온 물건이 하나도 없어요. 정말 잘하고 있어요! 🌷'

  const [topKey, topCount] = countBy(losses, (l) => `${l.item.id}|${l.label}`)[0]
  if (topCount < 2) return '가끔 깜빡해도 괜찮아요. 다음에 자리를 옮길 때도 저희가 같이 챙길게요.'

  const group = losses.filter((l) => `${l.item.id}|${l.label}` === topKey)
  const { item, spotName, label } = group[0]
  const where = spotName ? `${spotName}에서 일어날 때` : `${label}에서 나올 때`
  const [day, dayCount] = countBy(group, (l) => weekdayName(new Date(l.nearLoss.detectedAt).getDay()))[0]
  const what = `${josa(item.name, '을/를')} 자주 두고 오셨어요.`
  return dayCount >= 2
    ? `${day} ${where} ${what} ${day}엔 저희가 한 번 더 챙길게요.`
    : `${where} ${what} 그곳에선 저희가 한 번 더 챙길게요.`
}

/** 기간 안에서 두고 온 물건이 하나도 없었던 날 수 */
export function goodDays(nearLosses: NearLoss[], range: Range): number {
  const badDays = new Set(nearLosses.filter((nl) => inRange(nl.detectedAt, range)).map((nl) => dateKey(nl.detectedAt)))
  return range.days - badDays.size
}

export interface FrequentPlaceStat {
  placeName: string
  lat: number
  lng: number
  visits: number
}

/** 기간 안에 minVisits번 이상 간 장소 (한 달 지도용) */
export function frequentPlaces(stays: Stay[], range: Range, minVisits = 3): FrequentPlaceStat[] {
  const groups = new Map<string, Stay[]>()
  for (const stay of staysIn(stays, range)) {
    groups.set(stay.placeName, [...(groups.get(stay.placeName) ?? []), stay])
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= minVisits)
    .map(([placeName, list]) => ({ placeName, lat: list[0].lat, lng: list[0].lng, visits: list.length }))
    .sort((a, b) => b.visits - a.visits)
}
