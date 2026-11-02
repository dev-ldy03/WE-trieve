import { spotTransitions, stayTransitions } from '../lib/stay'
import type { NearLoss } from '../types'
import { historyStays } from './routine'

const MINUTE = 60 * 1000

/** 알림은 다음 장소·자리에 도착해 5분 머문 뒤 뜬다 */
export const ALERT_DELAY_MS = 5 * MINUTE

interface LossPattern {
  itemId: string
  placeName: string
  /** 있으면 그 자리에서 일어날 때 두고 온 것 */
  spotName?: string
  weekday?: number
  count: number
}

// 특정 장소·자리·요일에 몰리도록: 화요일 열람실 에어팟, 카페 온기 충전기, 도서관 집 열쇠
const patterns: LossPattern[] = [
  { itemId: 'airpods', placeName: '연세대학교', spotName: '도서관 3층 열람실', weekday: 2, count: 3 },
  { itemId: 'charger', placeName: '카페 온기', count: 2 },
  { itemId: 'keys', placeName: '신촌 도서관', count: 2 },
]

/** 떠난 곳과, 다음 곳에 도착한 시각 */
interface Departure {
  stayId: string
  spotId: string | null
  startAt: number
  arrivedNextAt: number
}

function departuresFor(pattern: LossPattern): Departure[] {
  if (pattern.spotName) {
    return historyStays
      .filter((stay) => stay.placeName === pattern.placeName)
      .flatMap((stay) =>
        spotTransitions(stay)
          .filter(({ spot }) => spot.name === pattern.spotName)
          .map(({ spot, next }) => ({
            stayId: stay.id,
            spotId: spot.id,
            startAt: spot.startAt,
            arrivedNextAt: next.startAt,
          })),
      )
  }
  return stayTransitions(historyStays)
    .filter(({ stay }) => stay.placeName === pattern.placeName)
    .map(({ stay, next }) => ({
      stayId: stay.id,
      spotId: stay.spots[stay.spots.length - 1]?.id ?? null,
      startAt: stay.startAt,
      arrivedNextAt: next.startAt,
    }))
}

export const initialNearLosses: NearLoss[] = patterns.flatMap((pattern) =>
  departuresFor(pattern)
    .filter((d) => pattern.weekday === undefined || new Date(d.startAt).getDay() === pattern.weekday)
    .slice(-pattern.count)
    .map((d, i) => {
      const detectedAt = d.arrivedNextAt + ALERT_DELAY_MS
      return {
        id: `nl-${pattern.itemId}-${d.startAt}`,
        itemId: pattern.itemId,
        stayId: d.stayId,
        spotId: d.spotId,
        detectedAt,
        recoveredAt: detectedAt + (25 + i * 15) * MINUTE,
      }
    }),
)
