import { haversine } from '../lib/distance'
import { startOfDay } from '../lib/format'
import { detectStays, withSpots } from '../lib/stay'
import type { ActivityEvent, LocationPoint } from '../types'
import { placeById, placeNameAt, type PlaceId } from './places'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

export const HISTORY_DAYS = 30

const DAY_START = '08:00'
const DAY_END = '23:00'
const WALK_M_PER_MIN = 70
const STAY_SAMPLE_MIN = 3
/** 건물 안에서 자리를 옮길 때 걷는 시간 */
const INDOOR_WALK_MIN = 2
/** 알림은 새 장소·자리에서 5분 머문 뒤 뜬다 (시뮬레이션에서는 바로 5분을 채운다) */
const ARRIVAL_STAY_MIN = 5

/** 장소 안의 자리. 마지막 자리는 장소를 떠날 때까지 머문다. */
export interface SpotPlan {
  name: string
  until?: string
}

/** 한 장소에 until 시각까지 머문 뒤 다음 장소로 걸어간다 */
export interface RoutineStop {
  placeId: PlaceId
  until: string
  spots?: SpotPlan[]
}

// 학교 안의 자리
const READING_ROOM = '도서관 3층 열람실'
const CAFETERIA = '학생식당'
const LECTURE_HALL = '공학관 강의실'
const CLUB_ROOM = '동아리방'

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
    { placeId: 'univ', until: '12:30', spots: [{ name: LECTURE_HALL, until: '10:50' }, { name: CLUB_ROOM }] },
    { placeId: 'restaurant', until: '13:30' },
    { placeId: 'univ', until: '17:00', spots: [{ name: READING_ROOM, until: '15:30' }, { name: LECTURE_HALL }] },
    { placeId: 'gym', until: '18:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:30' },
    { placeId: 'univ', until: '12:00', spots: [{ name: READING_ROOM, until: '11:10' }, { name: LECTURE_HALL }] },
    { placeId: 'restaurant', until: '13:00' },
    { placeId: 'cafeOnggi', until: '17:30' },
    { placeId: 'library', until: '20:00' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:00' },
    {
      placeId: 'univ',
      until: '15:00',
      spots: [
        { name: LECTURE_HALL, until: '10:50' },
        { name: CAFETERIA, until: '12:40' },
        { name: READING_ROOM },
      ],
    },
    { placeId: 'cafeDalbit', until: '17:00' },
    { placeId: 'gym', until: '18:30' },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:30' },
    { placeId: 'univ', until: '12:00', spots: [{ name: READING_ROOM, until: '10:50' }, { name: LECTURE_HALL }] },
    { placeId: 'restaurant', until: '13:00' },
    { placeId: 'cafeOnggi', until: '16:00' },
    { placeId: 'univ', until: '18:00', spots: [{ name: CAFETERIA, until: '16:40' }, { name: CLUB_ROOM }] },
    { placeId: 'home', until: DAY_END },
  ],
  [
    { placeId: 'home', until: '09:00' },
    { placeId: 'univ', until: '13:00', spots: [{ name: LECTURE_HALL, until: '11:00' }, { name: CAFETERIA }] },
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

// 시연용 오늘 일정: 요일과 상관없이 학교 열람실에 앉아 있는 상태에서 시작한다
const demoRoutine: RoutineStop[] = [
  { placeId: 'home', until: '09:00' },
  {
    placeId: 'univ',
    until: '15:30',
    spots: [
      { name: READING_ROOM, until: '11:50' },
      { name: CAFETERIA, until: '13:00' },
      { name: LECTURE_HALL },
    ],
  },
  { placeId: 'cafeOnggi', until: '18:00' },
  { placeId: 'home', until: DAY_END },
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

/** 자리 i를 떠나는 계획 시각 (마지막 자리는 장소를 떠나는 시각) */
const spotUntil = (stop: RoutineStop, i: number) => stop.spots?.[i]?.until ?? stop.until

// ---- 자리 이름: 실제 센서는 이름을 모르므로, 더미 데이터가 정지 시각별로 이름을 기억해 둔다 ----

const spotLabels = new Map<number, string>()

export function spotNameAt(startAt: number): string | undefined {
  return spotLabels.get(startAt)
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

/** 한 장소에서 머무는 동안의 포인트 (실내 GPS 흔들림 포함) */
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
function walkPoints(fromId: PlaceId, toId: PlaceId, departAt: number, rand: () => number) {
  const from = placeById[fromId]
  const to = placeById[toId]
  const corner = { lat: from.lat, lng: to.lng }
  const firstLeg = haversine(from, corner)
  const total = firstLeg + haversine(corner, to)
  const minutes = Math.max(2, Math.round(total / WALK_M_PER_MIN))

  const points: LocationPoint[] = []
  for (let i = 1; i < minutes; i++) {
    const dist = (total * i) / minutes
    const [a, b, d] = dist <= firstLeg ? [from, corner, dist] : [corner, to, dist - firstLeg]
    const ratio = d / Math.max(1, haversine(a, b))
    const lat = a.lat + (b.lat - a.lat) * ratio
    const lng = a.lng + (b.lng - a.lng) * ratio
    points.push({ ...jitter(lat, lng, 3, rand), timestamp: departAt + i * MINUTE })
  }
  return { points, arriveAt: departAt + minutes * MINUTE }
}

/** 하루 루틴에 결정적인 변동(시각 ±10분, 헬스장 가끔 건너뜀)을 준다 */
function planForDay(dayStart: number, base: RoutineStop[]): RoutineStop[] {
  const rand = seededRandom(dayStart / MINUTE)
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

/**
 * 계획대로 하루를 보낸 포인트와 활동(걷기/정지) 이벤트. stopAt을 주면 그 시각까지만 만든다.
 * 장소 안에서 자리를 옮길 때는 GPS는 그대로 두고 걷기→정지 이벤트만 남긴다.
 */
function buildDay(dayStart: number, plan: RoutineStop[], stopAt = Infinity) {
  const rand = seededRandom(dayStart / MINUTE + 7)
  const points: LocationPoint[] = []
  const events: ActivityEvent[] = []
  let arriveAt = atTime(dayStart, DAY_START)

  for (let i = 0; i < plan.length; i++) {
    const stop = plan[i]
    // 너무 늦게 도착했으면 최소 15분은 머문다
    const leaveAt = Math.max(atTime(dayStart, stop.until), arriveAt + 15 * MINUTE)
    events.push({ type: '정지', timestamp: arriveAt })

    const spots = stop.spots ?? []
    let sitAt = arriveAt
    spots.forEach((spot, j) => {
      spotLabels.set(sitAt, spot.name)
      if (j === spots.length - 1) return
      const standAt = Math.min(
        Math.max(atTime(dayStart, spotUntil(stop, j)), sitAt + 10 * MINUTE),
        leaveAt - 15 * MINUTE,
      )
      events.push({ type: '걷기', timestamp: standAt })
      sitAt = standAt + INDOOR_WALK_MIN * MINUTE
      events.push({ type: '정지', timestamp: sitAt })
    })

    points.push(...stayPoints(stop.placeId, arriveAt, Math.min(leaveAt, stopAt), rand))
    if (leaveAt >= stopAt || i === plan.length - 1) break

    events.push({ type: '걷기', timestamp: leaveAt })
    const walk = walkPoints(stop.placeId, plan[i + 1].placeId, leaveAt, rand)
    points.push(...walk.points)
    arriveAt = walk.arriveAt
  }
  return { points, events: events.filter((e) => e.timestamp <= stopAt), arriveAt }
}

// ---- 오늘: 학교 열람실에 도착해 40분쯤 앉아 있는 시점까지만 기록돼 있다 ----

const todayStart = startOfDay(Date.now())
const todayPlan = planForDay(todayStart, demoRoutine)
const CURRENT_INDEX = 1

const todayCutoff = (() => {
  const { arriveAt } = buildDay(todayStart, todayPlan.slice(0, CURRENT_INDEX + 1))
  return arriveAt + 40 * MINUTE
})()

/** 이동 시뮬레이션에 쓸 오늘의 일정. stops[0]이 지금 머무는 곳이다. */
export const todaySimulation = {
  stops: todayPlan.slice(CURRENT_INDEX),
  now: todayCutoff,
}

/** 시뮬레이션 진행 위치: 몇 번째 장소의 몇 번째 자리에 있는지 */
export interface SimState {
  stop: number
  spot: number
}

export interface SimMove {
  trigger: '장소이동' | '자리이동'
  points: LocationPoint[]
  events: ActivityEvent[]
  /** 장소이동일 때 지도 애니메이션 경로 (출발·도착 지점 포함) */
  walk: LocationPoint[]
  /** 새로 머물 곳 이름 */
  toLabel: string
}

/** 지금 장소 안에서 다음 자리로 옮길 수 있으면 그 이름 */
export function nextSpotName(sim: SimState): string | undefined {
  return todaySimulation.stops[sim.stop]?.spots?.[sim.spot + 1]?.name
}

/** 다음 장소가 있으면 그 이름 */
export function nextPlaceName(sim: SimState): string | undefined {
  const next = todaySimulation.stops[sim.stop + 1]
  return next && placeById[next.placeId].name
}

/** "자리에서 일어나기": 계획한 시각까지 앉아 있다가 같은 장소 안의 다음 자리로 옮겨 5분 머문다 */
export function buildSpotMove(sim: SimState, now: number): SimMove | null {
  const stop = todaySimulation.stops[sim.stop]
  const nextName = nextSpotName(sim)
  if (!stop || !nextName) return null

  const rand = seededRandom(now / MINUTE + 11)
  const standAt = Math.max(now, atTime(todayStart, spotUntil(stop, sim.spot)))
  const sitAt = standAt + INDOOR_WALK_MIN * MINUTE
  spotLabels.set(sitAt, nextName)

  return {
    trigger: '자리이동',
    points: stayPoints(stop.placeId, now + STAY_SAMPLE_MIN * MINUTE, sitAt + ARRIVAL_STAY_MIN * MINUTE, rand),
    events: [
      { type: '걷기', timestamp: standAt },
      { type: '정지', timestamp: sitAt },
    ],
    walk: [],
    toLabel: nextName,
  }
}

/** "다른 장소로 이동": 계획한 시각까지 머문 뒤 다음 장소로 걸어가 5분 머문다 */
export function buildPlaceMove(sim: SimState, now: number): SimMove | null {
  const from = todaySimulation.stops[sim.stop]
  const to = todaySimulation.stops[sim.stop + 1]
  if (!from || !to) return null

  const rand = seededRandom(now / MINUTE + 13)
  const departAt = Math.max(now, atTime(todayStart, spotUntil(from, sim.spot)))
  const waitFrom = now + STAY_SAMPLE_MIN * MINUTE
  const waiting = departAt > waitFrom ? stayPoints(from.placeId, waitFrom, departAt, rand) : []
  const walk = walkPoints(from.placeId, to.placeId, departAt, rand)
  const arrival = stayPoints(to.placeId, walk.arriveAt, walk.arriveAt + ARRIVAL_STAY_MIN * MINUTE, rand)
  if (to.spots?.length) spotLabels.set(walk.arriveAt, to.spots[0].name)

  const fromPlace = placeById[from.placeId]
  const toPlace = placeById[to.placeId]
  return {
    trigger: '장소이동',
    points: [...waiting, ...walk.points, ...arrival],
    events: [
      { type: '걷기', timestamp: departAt },
      { type: '정지', timestamp: walk.arriveAt },
    ],
    walk: [
      { lat: fromPlace.lat, lng: fromPlace.lng, timestamp: departAt },
      ...walk.points,
      { lat: toPlace.lat, lng: toPlace.lng, timestamp: walk.arriveAt },
    ],
    toLabel: toPlace.name,
  }
}

// ---- 최근 30일 동선 ----

const history = (() => {
  const points: LocationPoint[] = []
  const events: ActivityEvent[] = []
  for (let d = HISTORY_DAYS - 1; d >= 1; d--) {
    const dayStart = startOfDay(todayStart - d * DAY + 12 * 60 * MINUTE)
    const day = buildDay(dayStart, planForDay(dayStart, weeklyRoutine[new Date(dayStart).getDay()]))
    points.push(...day.points)
    events.push(...day.events)
  }
  const today = buildDay(todayStart, todayPlan, todayCutoff)
  points.push(...today.points)
  events.push(...today.events)
  return { points, events }
})()

export const historyPoints = history.points
export const historyEvents = history.events
export const historyStays = withSpots(detectStays(historyPoints, placeNameAt), historyEvents, spotNameAt)
