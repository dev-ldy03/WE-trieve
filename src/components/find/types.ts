import type { Stay } from '@/types'

/** 분실 정보: 어느 날, 몇 시부터 몇 시 사이에, 어떤 특징의 물건을 */
export interface SearchCase {
  /** 그날 0시 */
  day: number
  from: string
  /** null이면 "지금까지" */
  to: string | null
  feature: string
}

/** 동선 복기의 방문 한 칸: 장소 또는 장소 안의 자리 */
export interface Stop {
  key: string
  stay: Stay
  placeName: string
  /** "연세대학교 · 도서관 3층 열람실" */
  label: string
  spotName: string | null
  startAt: number
  endAt: number
  durationMin: number
}

export const hm = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return (h * 60 + m) * 60 * 1000
}
