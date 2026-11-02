import type { CheckAlert, Item, NearLoss, Stay } from '../types'
import { formatDuration, josa, timeOfDay, weekdayName } from './format'

export interface Prediction {
  /** "카페 온기" 또는 "연세대학교 · 도서관 3층 열람실" */
  label: string
  placeName: string
  spotName: string | null
  lat: number
  lng: number
  /** 0~100 */
  probability: number
  reason: string
}

// 과거에 그곳에서 잃어버릴 뻔한 이력이 있으면 점수를 두 배로
const HISTORY_WEIGHT = 2

/** 이 물건을 "챙겼어요"라고 답한 가장 최근 알림 */
export function findLastCheck(itemId: string, alerts: CheckAlert[]): CheckAlert | undefined {
  let latest: CheckAlert | undefined
  for (const alert of alerts) {
    const checked = alert.responses.some((r) => r.itemId === itemId && r.status === '챙김')
    if (checked && (!latest || alert.createdAt > latest.createdAt)) latest = alert
  }
  return latest
}

export const placeKey = (placeName: string, spotName: string | null) =>
  spotName ? `${placeName} · ${spotName}` : placeName

interface Visit {
  placeName: string
  spotName: string | null
  lat: number
  lng: number
  startAt: number
  durationMin: number
}

/** 체류를 후보 단위로 편다: 자리가 있으면 자리별로, 없으면 장소 통째로 */
function visitsSince(stays: Stay[], since: number): Visit[] {
  return stays.flatMap((stay): Visit[] => {
    if (stay.endAt < since) return []
    const base = { placeName: stay.placeName, lat: stay.lat, lng: stay.lng }
    if (stay.spots.length === 0) {
      return [{ ...base, spotName: null, startAt: stay.startAt, durationMin: stay.durationMin }]
    }
    return stay.spots
      .filter((spot) => spot.endAt >= since)
      .map((spot) => ({ ...base, spotName: spot.name, startAt: spot.startAt, durationMin: spot.durationMin }))
  })
}

/**
 * 물건을 마지막으로 챙긴 뒤(since 이후) 머문 장소·자리 중 두고 왔을 가능성이 높은 곳 Top 3.
 * 점수 = 누적 체류 시간 × (그곳에서 이 물건을 잃어버릴 뻔한 과거 이력이 있으면 2)
 * 확률은 후보 전체 점수 합으로 정규화한다.
 */
export function predictLostPlace(
  item: Item,
  stays: Stay[],
  nearLosses: NearLoss[],
  since: number,
): Prediction[] {
  const stayById = new Map(stays.map((s) => [s.id, s]))
  const spotNameById = new Map(stays.flatMap((s) => s.spots.map((spot) => [spot.id, spot.name])))

  // 마지막으로 챙긴 뒤에 생긴 기록은 "과거 이력"이 아니다
  const pastLosses = nearLosses.flatMap((nl) => {
    const stay = stayById.get(nl.stayId)
    if (nl.itemId !== item.id || nl.detectedAt >= since || !stay) return []
    return [{ placeName: stay.placeName, spotName: nl.spotId ? (spotNameById.get(nl.spotId) ?? null) : null }]
  })
  const lossCount = (placeName: string, spotName: string | null) =>
    pastLosses.filter(
      (l) => l.placeName === placeName && (l.spotName === null || l.spotName === spotName),
    ).length

  const groups = new Map<string, Visit[]>()
  for (const visit of visitsSince(stays, since)) {
    const key = placeKey(visit.placeName, visit.spotName)
    groups.set(key, [...(groups.get(key) ?? []), visit])
  }

  const scored = [...groups.entries()].map(([label, visits]) => {
    const { placeName, spotName } = visits[0]
    const totalMin = visits.reduce((sum, v) => sum + v.durationMin, 0)
    const losses = lossCount(placeName, spotName)
    const longest = visits.reduce((a, b) => (b.durationMin > a.durationMin ? b : a))
    return {
      label,
      placeName,
      spotName,
      lat: longest.lat,
      lng: longest.lng,
      score: totalMin * (losses > 0 ? HISTORY_WEIGHT : 1),
      reason: buildReason(item, spotName ?? placeName, visits.length, longest, totalMin, losses),
    }
  })

  const total = scored.reduce((sum, s) => sum + s.score, 0)
  if (total === 0) return []

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...rest }) => ({ ...rest, probability: Math.round((score / total) * 100) }))
}

function buildReason(
  item: Item,
  where: string,
  visitCount: number,
  longest: Visit,
  totalMin: number,
  losses: number,
) {
  const when = `${weekdayName(new Date(longest.startAt).getDay())} ${timeOfDay(longest.startAt)}`
  const stayText =
    visitCount > 1
      ? `${when}을 포함해 ${where}에 ${visitCount}번, 모두 ${formatDuration(totalMin)} 머물렀어요`
      : `${when}에 ${where}에서 ${formatDuration(totalMin)} 머물렀어요`
  if (losses === 0) return stayText
  return `${stayText}. 예전에도 여기서 ${josa(item.name, '을/를')} ${losses}번 두고 올 뻔했어요`
}
