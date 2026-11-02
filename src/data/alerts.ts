import { startOfDay } from '../lib/format.ts'
import { stayTransitions } from '../lib/stay.ts'
import type { CheckAlert } from '../types.ts'
import { initialItems } from './items.ts'
import { ALERT_DELAY_MS, initialNearLosses } from './nearLosses.ts'
import { historyStays, seededRandom } from './routine.ts'

const UNANSWERED_RATE = 0.08

/** 장소를 옮겨 머물 때마다 뜬 챙김 확인 알림. 오늘 알림은 아직 확인하지 않은 상태다. */
export const initialAlerts: CheckAlert[] = (() => {
  const rand = seededRandom(20251102)
  const todayStart = startOfDay(Date.now())
  return stayTransitions(historyStays).map(({ stay, next }) => {
    const leftItems = new Set(
      initialNearLosses.filter((nl) => nl.stayId === stay.id).map((nl) => nl.itemId),
    )
    const createdAt = next.startAt + ALERT_DELAY_MS
    const unanswered = leftItems.size === 0 && (createdAt >= todayStart || rand() < UNANSWERED_RATE)
    return {
      id: `alert-${next.startAt}`,
      fromStayId: stay.id,
      toStayId: next.id,
      createdAt,
      responses: initialItems.map((item) => ({
        itemId: item.id,
        status: unanswered ? '미응답' : leftItems.has(item.id) ? '두고옴' : '챙김',
      })),
    }
  })
})()
