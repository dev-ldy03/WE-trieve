import type { LocationPoint } from '../types'

type LatLng = Pick<LocationPoint, 'lat' | 'lng'>

const EARTH_RADIUS_M = 6_371_000

// GPS 흔들림으로 생기는 짧은 이동은 거리 합계에서 뺀다.
const NOISE_THRESHOLD_M = 20

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 두 좌표 사이의 거리(m) — haversine */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** 시간순 포인트를 이은 경로의 총 거리(m) */
export function pathDistance(points: LocationPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i])
    if (d >= NOISE_THRESHOLD_M) total += d
  }
  return total
}

/** 특정 날짜(로컬 기준)의 이동 거리 합계(m) */
export function dailyDistance(points: LocationPoint[], day: Date): number {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const end = start + 24 * 60 * 60 * 1000
  return pathDistance(points.filter((p) => p.timestamp >= start && p.timestamp < end))
}
