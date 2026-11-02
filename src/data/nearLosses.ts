import { stayTransitions } from '../lib/stay.ts'
import type { NearLoss } from '../types.ts'
import { historyStays } from './routine.ts'

const MINUTE = 60 * 1000

/** 알림은 다음 장소에 도착해 5분 머문 뒤 뜬다 */
export const ALERT_DELAY_MS = 5 * MINUTE

interface LossPattern {
  itemId: string
  placeName: string
  weekday?: number
  count: number
}

// 특정 장소·요일에 몰리도록: 화요일 카페 가디건, 도서관 우산, 헬스장 에어팟
const patterns: LossPattern[] = [
  { itemId: 'cardigan', placeName: '카페 온기', weekday: 2, count: 3 },
  { itemId: 'umbrella', placeName: '신촌 도서관', count: 2 },
  { itemId: 'airpods', placeName: '튼튼 헬스장', count: 2 },
]

export const initialNearLosses: NearLoss[] = patterns.flatMap((pattern) =>
  stayTransitions(historyStays)
    .filter(
      ({ stay }) =>
        stay.placeName === pattern.placeName &&
        (pattern.weekday === undefined || new Date(stay.startAt).getDay() === pattern.weekday),
    )
    .slice(-pattern.count)
    .map(({ stay, next }, i) => {
      const detectedAt = next.startAt + ALERT_DELAY_MS
      return {
        id: `nl-${pattern.itemId}-${stay.startAt}`,
        itemId: pattern.itemId,
        stayId: stay.id,
        detectedAt,
        recoveredAt: detectedAt + (25 + i * 15) * MINUTE,
      }
    }),
)
