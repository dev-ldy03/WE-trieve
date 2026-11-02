import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { initialAlerts } from '../data/alerts'
import { initialItems } from '../data/items'
import { ALERT_DELAY_MS, initialNearLosses } from '../data/nearLosses'
import { placeNameAt } from '../data/places'
import {
  historyEvents,
  historyPoints,
  spotNameAt,
  todaySimulation,
  type SimMove,
  type SimState,
} from '../data/routine'
import { findLastCheck, placeKey } from '../lib/predict'
import { alertEndpoints, alertMessage, detectStays, withSpots, type AlertEndpoints } from '../lib/stay'
import type {
  ActivityEvent,
  CheckAlert,
  CheckStatus,
  Item,
  ItemKind,
  LocationPoint,
  NearLoss,
  Spot,
  Stay,
} from '../types'

/** 물건의 지금 상태: 마지막 챙김 확인 결과 */
export interface ItemStatus {
  state: '챙김' | '두고옴' | '확인 전'
  /** "연세대학교 · 도서관 3층 열람실" */
  place: string | null
  at: number | null
  stayId: string | null
  nearLossId: string | null
}

/** 재구매 지원 신청 (시연) */
export interface Claim {
  itemId: string
  date: string
  place: string
  story: string
  createdAt: number
}

export interface BannerState {
  id: number
  message: string
  alertId?: string
}

interface AppContextValue {
  items: Item[]
  alerts: CheckAlert[]
  nearLosses: NearLoss[]
  points: LocationPoint[]
  stays: Stay[]
  stayById: Map<string, Stay>
  spotById: Map<string, Spot>
  banner: BannerState | null
  openAlertId: string | null
  /** 데모 속 현재 시각 — 오늘 동선의 끝에서 시작해 시뮬레이션으로 흘러간다 */
  now: number
  /** 시뮬레이션 진행 위치 (todaySimulation.stops 기준) */
  sim: SimState
  /** 분실 예방 알림(두고 오면 알려주기) 켜짐 여부 */
  notify: boolean
  toast: { id: number; message: string } | null
  claim: Claim | null

  /** 알림이 가리키는 떠난 곳·새로 머무는 곳 */
  endpointsOf: (alert: CheckAlert) => AlertEndpoints | null
  statusOf: (itemId: string) => ItemStatus
  addItem: (name: string, kind: ItemKind) => void
  setNotify: (on: boolean) => void
  showToast: (message: string) => void
  setClaim: (claim: Claim) => void
  toggleProtected: (itemIds: string[]) => void
  removeItem: (itemId: string) => void
  /** 시뮬레이션 이동을 기록하고 챙김 확인 알림을 띄운다 */
  completeMove: (move: SimMove) => void
  respond: (alertId: string, itemId: string, status: CheckStatus) => void
  markRecovered: (nearLossId: string) => void
  dismissBanner: () => void
  openSheet: (alertId: string) => void
  closeSheet: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function buildStays(points: LocationPoint[], events: ActivityEvent[]) {
  return withSpots(detectStays(points, placeNameAt), events, spotNameAt)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(initialItems)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [nearLosses, setNearLosses] = useState(initialNearLosses)
  const [extraPoints, setExtraPoints] = useState<LocationPoint[]>([])
  const [extraEvents, setExtraEvents] = useState<ActivityEvent[]>([])
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [openAlertId, setOpenAlertId] = useState<string | null>(null)
  const [now, setNow] = useState(todaySimulation.now)
  const [sim, setSim] = useState<SimState>({ stop: 0, spot: 0 })
  const [notify, setNotify] = useState(true)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [claim, setClaim] = useState<Claim | null>(null)

  const points = useMemo(() => [...historyPoints, ...extraPoints], [extraPoints])
  const events = useMemo(() => [...historyEvents, ...extraEvents], [extraEvents])
  const stays = useMemo(() => buildStays(points, events), [points, events])
  const stayById = useMemo(() => new Map(stays.map((s) => [s.id, s])), [stays])
  const spotById = useMemo(
    () => new Map(stays.flatMap((s) => s.spots.map((spot) => [spot.id, spot] as const))),
    [stays],
  )

  const endpointsOf = useCallback(
    (alert: CheckAlert) => alertEndpoints(alert, stayById, spotById),
    [stayById, spotById],
  )

  const addItem = useCallback(
    (name: string, kind: ItemKind) => {
      setItems((prev) => [...prev, { id: `item-${Date.now()}`, name, kind, createdAt: now, protected: false }])
    },
    [now],
  )

  /** 지원 대상 물건을 itemIds로 바꾼다 */
  const toggleProtected = useCallback((itemIds: string[]) => {
    setItems((prev) => prev.map((item) => ({ ...item, protected: itemIds.includes(item.id) })))
  }, [])

  const showToast = useCallback((message: string) => setToast({ id: Date.now(), message }), [])

  // 아직 못 찾은 기록이 있으면 '두고옴', 아니면 마지막으로 챙긴 알림 기준 '챙김', 둘 다 없으면 '확인 전'
  const statusOf = useCallback(
    (itemId: string): ItemStatus => {
      const lost = nearLosses
        .filter((nl) => nl.itemId === itemId && nl.recoveredAt === null)
        .sort((a, b) => b.detectedAt - a.detectedAt)[0]
      if (lost) {
        const stay = stayById.get(lost.stayId)
        const spotName = lost.spotId ? (spotById.get(lost.spotId)?.name ?? null) : null
        return {
          state: '두고옴',
          place: stay ? placeKey(stay.placeName, spotName) : null,
          at: lost.detectedAt,
          stayId: lost.stayId,
          nearLossId: lost.id,
        }
      }
      const check = findLastCheck(itemId, alerts)
      const ends = check && alertEndpoints(check, stayById, spotById)
      if (check && ends) {
        return {
          state: '챙김',
          place: placeKey(ends.fromStay.placeName, ends.fromSpot?.name ?? null),
          at: check.createdAt,
          stayId: ends.fromStay.id,
          nearLossId: null,
        }
      }
      return { state: '확인 전', place: null, at: null, stayId: null, nearLossId: null }
    },
    [nearLosses, alerts, stayById, spotById],
  )

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const completeMove = useCallback(
    (move: SimMove) => {
      const nextStays = buildStays([...points, ...move.points], [...events, ...move.events])
      const lastStay = nextStays[nextStays.length - 1]
      const [from, to] =
        move.trigger === '장소이동'
          ? [nextStays[nextStays.length - 2], lastStay]
          : lastStay.spots.slice(-2)
      const fromLabel = 'placeName' in from ? from.placeName : from.name

      const alert: CheckAlert = {
        id: `alert-${to.startAt}`,
        trigger: move.trigger,
        fromId: from.id,
        toId: to.id,
        createdAt: to.startAt + ALERT_DELAY_MS,
        responses: items.map((item) => ({ itemId: item.id, status: '미응답' })),
      }

      setExtraPoints((prev) => [...prev, ...move.points])
      setExtraEvents((prev) => [...prev, ...move.events])
      setAlerts((prev) => [...prev, alert])
      setNow(move.points[move.points.length - 1].timestamp)
      setSim((prev) =>
        move.trigger === '장소이동' ? { stop: prev.stop + 1, spot: 0 } : { ...prev, spot: prev.spot + 1 },
      )
      // 분실 예방 알림을 꺼 두면 기록만 남기고 배너는 띄우지 않는다
      if (notify) setBanner({ id: Date.now(), message: alertMessage(move.trigger, fromLabel), alertId: alert.id })
    },
    [points, events, items, notify],
  )

  const respond = useCallback(
    (alertId: string, itemId: string, status: CheckStatus) => {
      const alert = alerts.find((a) => a.id === alertId)
      const ends = alert && endpointsOf(alert)
      if (!alert || !ends) return

      setAlerts((prev) =>
        prev.map((a) =>
          a.id !== alertId
            ? a
            : {
                ...a,
                responses: a.responses.map((r) => (r.itemId === itemId ? { ...r, status } : r)),
              },
        ),
      )

      // "두고 왔어요"를 고르면 떠난 장소·자리에 기록을 만들고,
      // 마음을 바꿔 "챙겼어요"로 고치면 아직 못 찾은 기록은 지운다.
      const stayId = ends.fromStay.id
      const spotId = ends.fromSpot?.id ?? null
      setNearLosses((prev) => {
        const existing = prev.find(
          (nl) => nl.itemId === itemId && nl.stayId === stayId && nl.spotId === spotId,
        )
        if (status === '두고옴' && !existing) {
          return [
            ...prev,
            {
              id: `nl-${itemId}-${Date.now()}`,
              itemId,
              stayId,
              spotId,
              detectedAt: alert.createdAt,
              recoveredAt: null,
            },
          ]
        }
        if (status !== '두고옴' && existing && existing.recoveredAt === null) {
          return prev.filter((nl) => nl !== existing)
        }
        return prev
      })
    },
    [alerts, endpointsOf],
  )

  const markRecovered = useCallback(
    (nearLossId: string) => {
      setNearLosses((prev) =>
        prev.map((nl) =>
          nl.id === nearLossId ? { ...nl, recoveredAt: Math.max(now, nl.detectedAt) } : nl,
        ),
      )
    },
    [now],
  )

  const dismissBanner = useCallback(() => setBanner(null), [])
  const openSheet = useCallback((alertId: string) => {
    setOpenAlertId(alertId)
    setBanner(null)
  }, [])
  const closeSheet = useCallback(() => setOpenAlertId(null), [])

  const value: AppContextValue = {
    items,
    alerts,
    nearLosses,
    points,
    stays,
    stayById,
    spotById,
    banner,
    openAlertId,
    now,
    sim,
    notify,
    toast,
    claim,
    statusOf,
    setNotify,
    showToast,
    setClaim,
    toggleProtected,
    endpointsOf,
    addItem,
    removeItem,
    completeMove,
    respond,
    markRecovered,
    dismissBanner,
    openSheet,
    closeSheet,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp은 AppProvider 안에서만 쓸 수 있어요')
  return ctx
}
