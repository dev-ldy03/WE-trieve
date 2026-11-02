import type { CheckAlert, Item, NearLoss, Stay } from '../types.ts'
import { formatDuration, josa, timeOfDay, weekdayName } from './format.ts'

export interface Prediction {
  placeName: string
  lat: number
  lng: number
  /** 0~100 */
  probability: number
  reason: string
}

// 과거에 그 장소에서 잃어버릴 뻔한 이력이 있으면 점수를 두 배로
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

/**
 * 물건을 마지막으로 챙긴 뒤(since 이후) 머문 장소들 중 두고 왔을 가능성이 높은 곳 Top 3.
 * 점수 = 장소별 누적 체류 시간 × (그 장소에서 이 물건을 잃어버릴 뻔한 이력이 있으면 2)
 * 확률은 후보 전체 점수 합으로 정규화한다.
 */
export function predictLostPlace(
  item: Item,
  stays: Stay[],
  nearLosses: NearLoss[],
  since: number,
): Prediction[] {
  const stayById = new Map(stays.map((s) => [s.id, s]))

  const lossCount = new Map<string, number>()
  for (const nl of nearLosses) {
    // 마지막으로 챙긴 뒤에 생긴 기록은 "과거 이력"이 아니다
    if (nl.itemId !== item.id || nl.detectedAt >= since) continue
    const place = stayById.get(nl.stayId)?.placeName
    if (place) lossCount.set(place, (lossCount.get(place) ?? 0) + 1)
  }

  const visits = new Map<string, Stay[]>()
  for (const stay of stays) {
    if (stay.endAt < since) continue
    visits.set(stay.placeName, [...(visits.get(stay.placeName) ?? []), stay])
  }

  const scored = [...visits.entries()].map(([placeName, placeStays]) => {
    const totalMin = placeStays.reduce((sum, s) => sum + s.durationMin, 0)
    const losses = lossCount.get(placeName) ?? 0
    const longest = placeStays.reduce((a, b) => (b.durationMin > a.durationMin ? b : a))
    return {
      placeName,
      lat: longest.lat,
      lng: longest.lng,
      score: totalMin * (losses > 0 ? HISTORY_WEIGHT : 1),
      reason: buildReason(item, placeName, placeStays, longest, totalMin, losses),
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
  placeName: string,
  placeStays: Stay[],
  longest: Stay,
  totalMin: number,
  losses: number,
) {
  const when = `${weekdayName(new Date(longest.startAt).getDay())} ${timeOfDay(longest.startAt)}`
  const stayText =
    placeStays.length > 1
      ? `${when}을 포함해 ${placeName}에 ${placeStays.length}번, 모두 ${formatDuration(totalMin)} 머물렀어요`
      : `${when}에 ${placeName}에서 ${formatDuration(totalMin)} 머물렀어요`
  if (losses === 0) return stayText
  return `${stayText}. 예전에도 여기서 ${josa(item.name, '을/를')} ${losses}번 두고 올 뻔했어요`
}
