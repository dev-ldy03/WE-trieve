import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Card from '@/components/Card'
import MapView from '@/components/MapView'
import type { LostMark } from '@/components/mapTypes'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import { HISTORY_DAYS } from '@/data/routine'
import { pathDistance } from '@/lib/distance'
import { formatDate, formatDistance, formatDuration, formatTime, startOfDay } from '@/lib/format'
import { placeKey } from '@/lib/predict'
import type { Stay } from '@/types'

const DAY = 24 * 60 * 60 * 1000

interface LostEntry {
  nearLossId: string
  itemLabel: string
  stay: Stay
  spotName: string | null
}

export default function MapHome() {
  const { points, stays, now, items, nearLosses, stayById, spotById, markRecovered } = useApp()
  const today = startOfDay(now)
  const firstDay = today - (HISTORY_DAYS - 1) * DAY
  const [selectedDay, setSelectedDay] = useState(today)
  // undefined = 아직 고르지 않음 → 오늘이면 지금 머무는 곳을 보여준다
  const [picked, setPicked] = useState<string | null | undefined>(undefined)
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
  const selectedPlace = picked === undefined ? (isToday ? dayStays.at(-1)?.placeName ?? null : null) : picked

  // 아직 찾지 못한 물건과 그 장소·자리
  const lostEntries = useMemo(() => {
    const itemById = new Map(items.map((item) => [item.id, item]))
    return nearLosses.flatMap((nl): LostEntry[] => {
      const item = itemById.get(nl.itemId)
      const stay = stayById.get(nl.stayId)
      if (nl.recoveredAt !== null || !item || !stay) return []
      const spotName = nl.spotId ? (spotById.get(nl.spotId)?.name ?? null) : null
      return [{ nearLossId: nl.id, itemLabel: `${item.emoji} ${item.name}`, stay, spotName }]
    })
  }, [items, nearLosses, stayById, spotById])
  const lostMarks = useMemo(() => {
    const marks = new Map<string, LostMark>()
    for (const e of lostEntries) {
      const label = placeKey(e.stay.placeName, e.spotName)
      marks.set(label, { key: label, label, lat: e.stay.lat, lng: e.stay.lng })
    }
    return [...marks.values()]
  }, [lostEntries])

  const moveDay = (offset: number) => {
    setSelectedDay((d) => Math.min(today, Math.max(firstDay, d + offset * DAY)))
    setPicked(undefined)
  }

  return (
    <Screen>
      <View>
        <Text className="text-sm text-ink-soft">오늘도 수고 많았어요</Text>
        <Text className="text-xl font-bold text-ink">{isToday ? '오늘의 동선' : '지난 동선'}</Text>
      </View>

      <View className="flex-row items-center justify-between rounded-full bg-white px-2 py-1.5">
        <Pressable
          onPress={() => moveDay(-1)}
          disabled={selectedDay <= firstDay}
          accessibilityLabel="이전 날"
          className={`h-9 w-9 items-center justify-center rounded-full ${selectedDay <= firstDay ? 'opacity-30' : ''}`}
        >
          <Text className="text-xl text-coral-deep">‹</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-ink">{formatDate(selectedDay)}</Text>
          {!isToday && (
            <Pressable
              onPress={() => {
                setSelectedDay(today)
                setPicked(undefined)
              }}
              className="rounded-full bg-peach px-2.5 py-0.5"
            >
              <Text className="text-xs font-semibold text-coral-deep">오늘</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => moveDay(1)}
          disabled={isToday}
          accessibilityLabel="다음 날"
          className={`h-9 w-9 items-center justify-center rounded-full ${isToday ? 'opacity-30' : ''}`}
        >
          <Text className="text-xl text-coral-deep">›</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs text-ink-soft">{isToday ? '오늘 이동 거리' : '이동 거리'}</Text>
          <Text className="mt-1 text-2xl font-bold text-coral-deep">{formatDistance(distance)}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs text-ink-soft">머문 장소</Text>
          <Text className="mt-1 text-2xl font-bold text-coral-deep">{placeCount}곳</Text>
        </Card>
      </View>

      <MapView
        path={dayPoints}
        stays={dayStays}
        lostMarks={lostMarks}
        selectedPlace={selectedPlace}
        onSelectPlace={setPicked}
      />

      {selectedPlace ? (
        <PlaceDetail
          placeName={selectedPlace}
          stays={dayStays.filter((s) => s.placeName === selectedPlace)}
          lost={lostEntries.filter((e) => e.stay.placeName === selectedPlace)}
          onRecover={markRecovered}
        />
      ) : (
        <Text className="text-center text-xs text-ink-soft">마커를 누르면 머문 시간과 자리를 볼 수 있어요</Text>
      )}
    </Screen>
  )
}

interface PlaceDetailProps {
  placeName: string
  stays: Stay[]
  lost: LostEntry[]
  onRecover: (nearLossId: string) => void
}

/** 마커를 누르면 지도 아래에 보여주는 장소 상세: 방문별 시각과 자리 타임라인 */
function PlaceDetail({ placeName, stays, lost, onRecover }: PlaceDetailProps) {
  return (
    <Card className="gap-3">
      <Text className="text-base font-bold text-ink">{placeName}</Text>

      {lost.length > 0 && (
        <View className="gap-2 rounded-2xl bg-rose/40 p-3">
          <Text className="text-xs text-rose-deep">여기에 두고 온 것 같아요. 아직 늦지 않았어요!</Text>
          {lost.map((e) => (
            <View key={e.nearLossId} className="flex-row items-center justify-between">
              <Text className="text-sm text-ink">
                {e.itemLabel}
                {e.spotName ? <Text className="text-xs text-ink-soft"> · {e.spotName}</Text> : null}
              </Text>
              <Pressable onPress={() => onRecover(e.nearLossId)} className="rounded-full bg-mint px-2.5 py-1">
                <Text className="text-xs font-semibold text-mint-deep">찾았어요</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {stays.map((stay) => (
        <View key={stay.id} className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-ink">
              {formatTime(stay.startAt)} ~ {formatTime(stay.endAt)}
            </Text>
            <Text className="text-xs font-semibold text-coral-deep">{formatDuration(stay.durationMin)} 머물렀어요</Text>
          </View>
          {stay.spots.length > 0 && (
            <View className="ml-1 gap-1.5 border-l-2 border-peach pl-3">
              {stay.spots.map((spot) => (
                <View key={spot.id} className="flex-row items-center justify-between">
                  <Text className="text-xs text-ink">🪑 {spot.name}</Text>
                  <Text className="text-xs text-ink-soft">
                    {formatTime(spot.startAt)}~{formatTime(spot.endAt)} · {formatDuration(spot.durationMin)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      {stays.length === 0 && <Text className="text-xs text-ink-soft">이날은 이곳에 머물지 않았어요.</Text>}
    </Card>
  )
}
