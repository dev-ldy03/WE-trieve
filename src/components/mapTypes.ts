import type { LocationPoint, Stay } from '@/types'

/** 물건을 두고 와서 강조할 곳 */
export interface LostMark {
  key: string
  label: string
  placeName: string
  lat: number
  lng: number
}

/**
 * 두고 온 곳 표시: 지도 확대와 상관없이 화면 기준 고정 크기의 분홍 원.
 * 핀(36px)보다 조금 크게 핀 위에 겹쳐, 이모지는 비쳐 보이고 테두리는 핀 밖으로 드러난다.
 */
export const LOST_MARK_SIZE = 44
export const LOST_MARK_FILL = 'rgba(222, 136, 67, 0.25)'
export const LOST_MARK_BORDER = '#de8843'
export const LOST_MARK_BORDER_WIDTH = 3

/** 레퍼런스 동선 지도 색: 경로 선, 핀, 선택한 핀 */
export const MAP_ROUTE = '#6482cc'
export const MAP_PIN = '#90a3d2'
export const MAP_PIN_ACTIVE = '#345de0'
export const MAP_TRAIL = '#de8843'

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
  /** 장소별 핀 글자 (예: 방문 순서 번호). 없으면 장소 순서대로 1, 2, 3… */
  pinLabels?: Record<string, string>
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
