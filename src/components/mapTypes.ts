import type { LocationPoint, Stay } from '@/types'

/** 물건을 두고 와서 강조할 곳 */
export interface LostMark {
  key: string
  label: string
  lat: number
  lng: number
}

/** 한 달 보기처럼 경로 대신 자주 간 장소만 크기로 보여줄 때 */
export interface FrequentPlace {
  placeName: string
  lat: number
  lng: number
  visits: number
}

export interface MapViewProps {
  /** 선으로 이을 이동 경로 */
  path?: LocationPoint[]
  /** 마커를 찍을 체류 (같은 장소는 마커 하나) */
  stays?: Stay[]
  frequentPlaces?: FrequentPlace[]
  /** 이동 시뮬레이션 경로와 진행률(0~1) */
  movingRoute?: LocationPoint[]
  movingProgress?: number
  lostMarks?: LostMark[]
  selectedPlace?: string | null
  onSelectPlace?: (placeName: string) => void
  height?: number
}

/** 경로를 따라 진행률만큼 간 지점까지의 선과 현재 위치 */
export function partialRoute(route: LocationPoint[], progress: number) {
  const start = route[0].timestamp
  const t = start + (route[route.length - 1].timestamp - start) * progress
  const trail = [{ latitude: route[0].lat, longitude: route[0].lng }]
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    if (b.timestamp <= t) {
      trail.push({ latitude: b.lat, longitude: b.lng })
      continue
    }
    const r = (t - a.timestamp) / (b.timestamp - a.timestamp)
    trail.push({ latitude: a.lat + (b.lat - a.lat) * r, longitude: a.lng + (b.lng - a.lng) * r })
    break
  }
  return { trail, position: trail[trail.length - 1] }
}

/** 같은 장소의 체류를 하나로 묶는다 */
export function groupByPlace(stays: Stay[]) {
  const groups = new Map<string, Stay[]>()
  for (const stay of stays) groups.set(stay.placeName, [...(groups.get(stay.placeName) ?? []), stay])
  return [...groups.entries()].map(([placeName, list]) => ({ placeName, stay: list[0] }))
}
