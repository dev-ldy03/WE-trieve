import { useMemo, useState } from 'react'
import Card from '../components/Card.tsx'
import MapView from '../components/MapView.tsx'
import { useApp } from '../context/AppContext.tsx'
import { HISTORY_DAYS } from '../data/routine.ts'
import { pathDistance } from '../lib/distance.ts'
import { formatDate, formatDistance, startOfDay } from '../lib/format.ts'

const DAY = 24 * 60 * 60 * 1000

export default function MapHome() {
  const { points, stays, now } = useApp()
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

      <MapView path={dayPoints} stays={dayStays} className="h-[380px]" />
      <p className="text-center text-xs text-ink-soft">마커를 누르면 머문 시간을 볼 수 있어요</p>
    </section>
  )
}
