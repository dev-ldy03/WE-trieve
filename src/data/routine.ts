import { haversine } from '../lib/distance.ts'
import { startOfDay } from '../lib/format.ts'
import { detectStays } from '../lib/stay.ts'
import type { LocationPoint } from '../types.ts'
import { placeById, placeNameAt, type PlaceId } from './places.ts'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

export const HISTORY_DAYS = 30

const DAY_START = '08:00'
const DAY_END = '23:00'
const WALK_M_PER_MIN = 70
const STAY_SAMPLE_MIN = 3

/** 한 장소에 until 시각까지 머문 뒤 다음 장소로 걸어간다 */
export interface RoutineStop {
  placeId: PlaceId
  until: string
}

// 요일별 루틴 (0 = 일요일). 마지막 집은 DAY_END까지 머문다.
const weeklyRoutine: RoutineStop[][] = [
  [
    { placeId: 'home', until: '12:30' },
    { placeId: 'library', until: '17:00' },
    { placeId: 'restaurant', until: '18:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:00' },
    { placeId: 'univ', until: '12:30' },
    { placeId: 'restaurant', until: '13:30' },
    { placeId: 'univ', until: '17:00' },
    { placeId: 'gym', until: '18:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:30' },
    { placeId: 'univ', until: '12:00' },
    { placeId: 'restaurant', until: '13:00' },
    { placeId: 'cafeOnggi', until: '17:30' },
    { placeId: 'library', until: '20:00' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:00' },
    { placeId: 'univ', until: '15:00' },
    { placeId: 'cafeDalbit', until: '17:00' },
    { placeId: 'gym', until: '18:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:30' },
    { placeId: 'univ', until: '12:00' },
    { placeId: 'restaurant', until: '13:00' },
    { placeId: 'cafeOnggi', until: '16:00' },
    { placeId: 'univ', until: '18:00' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:00' },
    { placeId: 'univ', until: '13:00' },
    { placeId: 'cafeDalbit', until: '16:30' },
    { placeId: 'restaurant', until: '19:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '10:30' },
    { placeId: 'gym', until: '12:30' },
    { placeId: 'cafeOnggi', until: '17:00' },
    { placeId: 'home', until: DAY_END },
  ],
]

/** 결정적 난수 (mulberry32) */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const atTime = (dayStart: number, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return dayStart + (h * 60 + m) * MINUTE
}

/** 위경도에 반경 maxM 이내의 작은 흔들림을 준다 */
function jitter(lat: number, lng: number, maxM: number, rand: () => number) {
  const r = maxM * Math.sqrt(rand())
  const theta = rand() * 2 * Math.PI
  return {
    lat: lat + (r * Math.cos(theta)) / 111_320,
    lng: lng + (r * Math.sin(theta)) / (111_320 * Math.cos((lat * Math.PI) / 180)),
  }
}

/** 한 장소에서 머무는 동안의 포인트 */
function stayPoints(placeId: PlaceId, from: number, to: number, rand: () => number) {
  const place = placeById[placeId]
  const points: LocationPoint[] = []
  for (let t = from; t < to; t += STAY_SAMPLE_MIN * MINUTE) {
    points.push({ ...jitter(place.lat, place.lng, 8, rand), timestamp: t })
  }
  points.push({ ...jitter(place.lat, place.lng, 8, rand), timestamp: to })
  return points
}

/**
 * from 장소에서 to 장소까지 걸어가는 포인트 (1분 간격).
 * 골목을 따라 걷는 느낌이 나도록 ㄱ자로 꺾어서 간다.
 */
export function walkPoints(fromId: PlaceId, toId: PlaceId, departAt: number, rand = Math.random) {
  const from = placeById[fromId]
  const to = placeById[toId]
  const corner = { lat: from.lat, lng: to.lng }
  const legs = [
    [from, corner],
    [corner, to],
  ] as const
  const total = haversine(from, corner) + haversine(corner, to)
  const minutes = Math.max(2, Math.round(total / WALK_M_PER_MIN))

  const points: LocationPoint[] = []
  for (let i = 1; i < minutes; i++) {
    let dist = (total * i) / minutes
    const [a, b] = dist <= haversine(...legs[0]) ? legs[0] : legs[1]
    if (a === corner) dist -= haversine(...legs[0])
    const ratio = dist / Math.max(1, haversine(a, b))
    const lat = a.lat + (b.lat - a.lat) * ratio
    const lng = a.lng + (b.lng - a.lng) * ratio
    points.push({ ...jitter(lat, lng, 3, rand), timestamp: departAt + i * MINUTE })
  }
  return { points, arriveAt: departAt + minutes * MINUTE }
}

/** 하루 루틴에 결정적인 변동(시각 ±10분, 헬스장 가끔 건너뜀)을 준다 */
function planForDay(dayStart: number): RoutineStop[] {
  const rand = seededRandom(dayStart / MINUTE)
  const base = weeklyRoutine[new Date(dayStart).getDay()]
  return base
    .filter((stop) => stop.placeId !== 'gym' || rand() > 0.2)
    .map((stop) => {
      if (stop.until === DAY_END) return stop
      const shifted = atTime(0, stop.until) / MINUTE + Math.round((rand() - 0.5) * 20)
      const h = Math.floor(shifted / 60)
      const m = shifted % 60
      return { ...stop, until: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
    })
}

/** 계획대로 하루를 보낸 포인트. stopAt을 주면 그 시각까지만 만든다. */
function buildDayPoints(dayStart: number, plan: RoutineStop[], stopAt = Infinity) {
  const rand = seededRandom(dayStart / MINUTE + 7)
  const points: LocationPoint[] = []
  let arriveAt = atTime(dayStart, DAY_START)

  for (let i = 0; i < plan.length; i++) {
    const stop = plan[i]
    // 너무 늦게 도착했으면 최소 15분은 머문다
    const leaveAt = Math.max(atTime(dayStart, stop.until), arriveAt + 15 * MINUTE)
    points.push(...stayPoints(stop.placeId, arriveAt, Math.min(leaveAt, stopAt), rand))
    if (leaveAt >= stopAt || i === plan.length - 1) break

    const walk = walkPoints(stop.placeId, plan[i + 1].placeId, leaveAt, rand)
    points.push(...walk.points)
    arriveAt = walk.arriveAt
  }
  return { points, arriveAt }
}

// ---- 오늘: 세 번째 장소에 도착해 20분쯤 머문 시점까지만 기록돼 있다 ----

const todayStart = startOfDay(Date.now())
const todayPlan = planForDay(todayStart)
const currentIndex = Math.min(2, todayPlan.length - 2)

/** 현재 장소에 도착하고 20분 뒤 (떠날 시각보다는 앞) */
const todayCutoff = (() => {
  const { arriveAt } = buildDayPoints(todayStart, todayPlan.slice(0, currentIndex + 1))
  const leaveAt = atTime(todayStart, todayPlan[currentIndex].until)
  return Math.max(arriveAt + 10 * MINUTE, Math.min(arriveAt + 20 * MINUTE, leaveAt - MINUTE))
})()

/** 이동 시뮬레이션에 쓸 오늘의 일정. stops[0]이 지금 머무는 곳이다. */
export const todaySimulation = {
  stops: todayPlan.slice(currentIndex),
  now: todayCutoff,
}

/** 알림은 새 장소에서 5분 머문 뒤 뜬다 (시뮬레이션에서는 바로 5분을 채운다) */
const ARRIVAL_STAY_MIN = 5

/**
 * 시뮬레이션 한 걸음: 지금 장소에서 계획한 시각까지 머문 뒤 다음 장소로 걸어가 5분 머문다.
 * walk는 지도 애니메이션용 경로(출발·도착 지점 포함)다.
 */
export function buildSimulatedMove(step: number, now: number) {
  const rand = seededRandom(now / MINUTE + step)
  const from = todaySimulation.stops[step]
  const to = todaySimulation.stops[step + 1]
  const departAt = Math.max(now, atTime(todayStart, from.until))

  const waiting = departAt > now ? stayPoints(from.placeId, now + STAY_SAMPLE_MIN * MINUTE, departAt, rand) : []
  const walk = walkPoints(from.placeId, to.placeId, departAt, rand)
  const arrival = stayPoints(to.placeId, walk.arriveAt, walk.arriveAt + ARRIVAL_STAY_MIN * MINUTE, rand)

  const fromPlace = placeById[from.placeId]
  const toPlace = placeById[to.placeId]
  return {
    toPlaceId: to.placeId,
    points: [...waiting, ...walk.points, ...arrival],
    walk: [
      { lat: fromPlace.lat, lng: fromPlace.lng, timestamp: departAt },
      ...walk.points,
      { lat: toPlace.lat, lng: toPlace.lng, timestamp: walk.arriveAt },
    ],
  }
}

// ---- 최근 30일 동선 ----

export const historyPoints: LocationPoint[] = (() => {
  const all: LocationPoint[] = []
  for (let d = HISTORY_DAYS - 1; d >= 1; d--) {
    const dayStart = startOfDay(todayStart - d * DAY + 12 * 60 * MINUTE)
    all.push(...buildDayPoints(dayStart, planForDay(dayStart)).points)
  }
  all.push(...buildDayPoints(todayStart, todayPlan, todayCutoff).points)
  return all
})()

export const historyStays = detectStays(historyPoints, placeNameAt)
