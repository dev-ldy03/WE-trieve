import { haversine } from '../lib/distance'

export type PlaceId = 'home' | 'univ' | 'cafeOnggi' | 'cafeDalbit' | 'library' | 'gym' | 'restaurant'

export interface Place {
  id: PlaceId
  name: string
  emoji: string
  lat: number
  lng: number
}

// 서울 신촌 일대
export const places: Place[] = [
  { id: 'home', name: '집', emoji: '🏠', lat: 37.5568, lng: 126.9326 },
  { id: 'univ', name: '연세대학교', emoji: '🏫', lat: 37.564, lng: 126.938 },
  { id: 'cafeOnggi', name: '카페 온기', emoji: '☕', lat: 37.5559, lng: 126.9368 },
  { id: 'cafeDalbit', name: '카페 달빛', emoji: '🌙', lat: 37.5598, lng: 126.9395 },
  { id: 'library', name: '신촌 도서관', emoji: '📚', lat: 37.5585, lng: 126.9445 },
  { id: 'gym', name: '튼튼 헬스장', emoji: '💪', lat: 37.5547, lng: 126.9395 },
  { id: 'restaurant', name: '밥심 식당', emoji: '🍚', lat: 37.5575, lng: 126.936 },
]

export const placeById = Object.fromEntries(places.map((p) => [p.id, p])) as Record<PlaceId, Place>

const MATCH_RADIUS_M = 80

/** 좌표에서 가장 가까운 등록 장소 (80m 이내) */
export function findPlaceAt(lat: number, lng: number): Place | undefined {
  let best: Place | undefined
  let bestDist = MATCH_RADIUS_M
  for (const p of places) {
    const d = haversine(p, { lat, lng })
    if (d <= bestDist) {
      best = p
      bestDist = d
    }
  }
  return best
}

export function placeNameAt(lat: number, lng: number): string {
  return findPlaceAt(lat, lng)?.name ?? '이름 없는 장소'
}
