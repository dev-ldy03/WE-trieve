import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card.tsx'
import MapView, { type LostSpot } from '../components/MapView.tsx'
import { useApp } from '../context/AppContext.tsx'
import { placeById } from '../data/places.ts'
import { buildSimulatedMove, HISTORY_DAYS, todaySimulation } from '../data/routine.ts'
import { pathDistance } from '../lib/distance.ts'
import { formatDate, formatDistance, josa, startOfDay } from '../lib/format.ts'

const DAY = 24 * 60 * 60 * 1000
const MOVE_ANIMATION_MS = 3000

type Move = ReturnType<typeof buildSimulatedMove>

export default function MapHome() {
  const { points, stays, now, simStep, completeMove, items, nearLosses, stayById, markRecovered } =
    useApp()
  const [move, setMove] = useState<Move | null>(null)
  const [progress, setProgress] = useState(0)
  const today = startOfDay(now)
  const firstDay = today - (HISTORY_DAYS - 1) * DAY
  const [selectedDay, setSelectedDay] = useState(today)
  const isToday = selectedDay === today

  const dayPoints = useMemo(
    () => points.filter((p) => p.timestamp >= selectedDay && p.timestamp < selectedDay + DAY),
    [points, selectedDay],
  )
  const dayStays = useMemo(
    () => stays.filter((s) => s.startAt >= selectedDay && s.startAt < selectedDay + DAY),
    [stays, selectedDay],
  )
  const distance = pathDistance(dayPoints)
  const placeCount = new Set(dayStays.map((s) => s.placeName)).size

  // 아직 찾지 못한 물건이 있는 장소
  const lostSpots = useMemo(() => {
    const itemById = new Map(items.map((item) => [item.id, item]))
    const spots = new Map<string, LostSpot>()
    for (const nl of nearLosses) {
      const item = itemById.get(nl.itemId)
      const stay = stayById.get(nl.stayId)
      if (nl.recoveredAt !== null || !item || !stay) continue
      const spot = spots.get(stay.id) ?? { stay, items: [] }
      spot.items.push({ nearLossId: nl.id, label: `${item.emoji} ${item.name}` })
      spots.set(stay.id, spot)
    }
    return [...spots.values()]
  }, [items, nearLosses, stayById])

  const nextStop = todaySimulation.stops[simStep + 1]

  const startMove = () => {
    setSelectedDay(today)
    setProgress(0)
    setMove(buildSimulatedMove(simStep, now))
  }

  useEffect(() => {
    if (!move) return
    let frame = 0
    const startedAt = performance.now()
    const tick = (time: number) => {
      const p = Math.min(1, (time - startedAt) / MOVE_ANIMATION_MS)
      setProgress(p)
      if (p < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        completeMove(move.points)
        setMove(null)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [move, completeMove])

  const moveDay = (offset: number) =>
    setSelectedDay((d) => Math.min(today, Math.max(firstDay, d + offset * DAY)))

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm text-ink-soft">오늘도 수고 많았어요</p>
        <h1 className="text-xl font-bold">{isToday ? '오늘의 동선' : '지난 동선'}</h1>
      </header>

      <div className="flex items-center justify-between rounded-full bg-white px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => moveDay(-1)}
          disabled={selectedDay <= firstDay}
          aria-label="이전 날"
          className="h-9 w-9 rounded-full text-lg text-coral-deep disabled:opacity-30"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatDate(selectedDay)}</span>
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDay(today)}
              className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-semibold text-coral-deep"
            >
              오늘
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => moveDay(1)}
          disabled={isToday}
          aria-label="다음 날"
          className="h-9 w-9 rounded-full text-lg text-coral-deep disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-ink-soft">{isToday ? '오늘 이동 거리' : '이동 거리'}</p>
          <p className="mt-1 text-2xl font-bold text-coral-deep">{formatDistance(distance)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-soft">머문 장소</p>
          <p className="mt-1 text-2xl font-bold text-coral-deep">{placeCount}곳</p>
        </Card>
      </div>

      <MapView
        path={dayPoints}
        stays={dayStays}
        movingRoute={move?.walk}
        movingProgress={progress}
        lostSpots={lostSpots}
        onRecover={markRecovered}
        className="h-[380px]"
      />
      <p className="text-center text-xs text-ink-soft">마커를 누르면 머문 시간을 볼 수 있어요</p>

      <button
        type="button"
        onClick={startMove}
        disabled={!nextStop || move !== null}
        className="w-full rounded-full bg-coral-deep py-3.5 font-semibold text-white shadow-md transition active:scale-[0.98] disabled:bg-peach disabled:text-ink-soft disabled:shadow-none"
      >
        {move
          ? `${josa(placeById[move.toPlaceId].name, '으로/로')} 이동 중이에요…`
          : nextStop
            ? '🚶 이동 시뮬레이션'
            : '오늘 일정은 여기까지예요. 푹 쉬어요 🌙'}
      </button>
      {nextStop && !move && (
        <p className="-mt-2 text-center text-xs text-ink-soft">
          다음 장소: {placeById[nextStop.placeId].name}
        </p>
      )}
    </section>
  )
}
