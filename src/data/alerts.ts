import { startOfDay } from '../lib/format'
import { spotTransitions, stayTransitions } from '../lib/stay'
import type { CheckAlert, CheckTrigger } from '../types'
import { initialItems } from './items'
import { ALERT_DELAY_MS, initialNearLosses } from './nearLosses'
import { historyStays, seededRandom } from './routine'

const UNANSWERED_RATE = 0.08

/**
 * 장소를 옮겨 머물 때, 장소 안에서 자리를 옮길 때마다 뜬 챙김 확인 알림.
 * 오늘 알림은 아직 확인하지 않은 상태다.
 */
export const initialAlerts: CheckAlert[] = (() => {
  const rand = seededRandom(20251102)
  const todayStart = startOfDay(Date.now())

  const build = (
    trigger: CheckTrigger,
    fromId: string,
    toId: string,
    arrivedAt: number,
    leftItems: Set<string>,
  ): CheckAlert => {
    const createdAt = arrivedAt + ALERT_DELAY_MS
    const unanswered = leftItems.size === 0 && (createdAt >= todayStart || rand() < UNANSWERED_RATE)
    return {
      id: `alert-${arrivedAt}`,
      trigger,
      fromId,
      toId,
      createdAt,
      responses: initialItems.map((item) => ({
        itemId: item.id,
        status: unanswered ? '미응답' : leftItems.has(item.id) ? '두고옴' : '챙김',
      })),
    }
  }

  const leftAt = (stayId: string, spotId: string | null) =>
    new Set(
      initialNearLosses
        .filter((nl) => nl.stayId === stayId && nl.spotId === spotId)
        .map((nl) => nl.itemId),
    )

  const placeAlerts = stayTransitions(historyStays).map(({ stay, next }) =>
    build(
      '장소이동',
      stay.id,
      next.id,
      next.startAt,
      leftAt(stay.id, stay.spots[stay.spots.length - 1]?.id ?? null),
    ),
  )
  const spotAlerts = historyStays.flatMap((stay) =>
    spotTransitions(stay).map(({ spot, next }) =>
      build('자리이동', spot.id, next.id, next.startAt, leftAt(stay.id, spot.id)),
    ),
  )
  return [...placeAlerts, ...spotAlerts].sort((a, b) => a.createdAt - b.createdAt)
})()
