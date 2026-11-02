import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { initialAlerts } from '../data/alerts.ts'
import { initialItems } from '../data/items.ts'
import { initialNearLosses } from '../data/nearLosses.ts'
import { placeNameAt } from '../data/places.ts'
import { historyPoints, todaySimulation } from '../data/routine.ts'
import { detectStays } from '../lib/stay.ts'
import type { CheckAlert, CheckStatus, Item, LocationPoint, NearLoss, Stay } from '../types.ts'

export interface ToastState {
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
  toast: ToastState | null
  openAlertId: string | null
  /** 데모 속 현재 시각 — 오늘 동선의 끝에서 시작해 이동 시뮬레이션으로 흘러간다 */
  now: number

  addItem: (name: string, emoji: string) => void
  removeItem: (itemId: string) => void
  appendPoints: (points: LocationPoint[]) => void
  advanceClock: (to: number) => void
  addAlert: (alert: CheckAlert) => void
  respond: (alertId: string, itemId: string, status: CheckStatus) => void
  markRecovered: (nearLossId: string) => void
  showToast: (message: string, alertId?: string) => void
  dismissToast: () => void
  openSheet: (alertId: string) => void
  closeSheet: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(initialItems)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [nearLosses, setNearLosses] = useState(initialNearLosses)
  const [extraPoints, setExtraPoints] = useState<LocationPoint[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [openAlertId, setOpenAlertId] = useState<string | null>(null)
  const [now, setNow] = useState(todaySimulation.now)

  const points = useMemo(() => [...historyPoints, ...extraPoints], [extraPoints])
  const stays = useMemo(() => detectStays(points, placeNameAt), [points])
  const stayById = useMemo(() => new Map(stays.map((s) => [s.id, s])), [stays])

  const addItem = useCallback(
    (name: string, emoji: string) => {
      setItems((prev) => [...prev, { id: `item-${Date.now()}`, name, emoji, createdAt: now }])
    },
    [now],
  )

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const appendPoints = useCallback((newPoints: LocationPoint[]) => {
    setExtraPoints((prev) => [...prev, ...newPoints])
  }, [])

  const advanceClock = useCallback((to: number) => {
    setNow((prev) => Math.max(prev, to))
  }, [])

  const addAlert = useCallback((alert: CheckAlert) => {
    setAlerts((prev) => [...prev, alert])
  }, [])

  const respond = useCallback(
    (alertId: string, itemId: string, status: CheckStatus) => {
      const alert = alerts.find((a) => a.id === alertId)
      if (!alert) return

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

      // "두고 왔어요"를 고르면 기록을 만들고, 마음을 바꿔 "챙겼어요"로 고치면 아직 못 찾은 기록은 지운다.
      setNearLosses((prev) => {
        const existing = prev.find((nl) => nl.itemId === itemId && nl.stayId === alert.fromStayId)
        if (status === '두고옴' && !existing) {
          return [
            ...prev,
            {
              id: `nl-${itemId}-${Date.now()}`,
              itemId,
              stayId: alert.fromStayId,
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
    [alerts],
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

  const showToast = useCallback((message: string, alertId?: string) => {
    setToast({ id: Date.now(), message, alertId })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])
  const openSheet = useCallback((alertId: string) => setOpenAlertId(alertId), [])
  const closeSheet = useCallback(() => setOpenAlertId(null), [])

  const value: AppContextValue = {
    items,
    alerts,
    nearLosses,
    points,
    stays,
    stayById,
    toast,
    openAlertId,
    now,
    addItem,
    removeItem,
    appendPoints,
    advanceClock,
    addAlert,
    respond,
    markRecovered,
    showToast,
    dismissToast,
    openSheet,
    closeSheet,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp은 AppProvider 안에서만 쓸 수 있어요')
  return ctx
}
