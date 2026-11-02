import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import MapView from '@/components/MapView'
import type { LostMark } from '@/components/mapTypes'
import { useApp } from '@/context/AppContext'
import { buildPlaceMove, buildSpotMove, nextPlaceName, nextSpotName, type SimMove } from '@/data/routine'
import { formatDuration, formatTime, josa } from '@/lib/format'
import { predictLostPlace } from '@/lib/predict'
import colors from '@/theme/colors.json'
import type { Item, LocationPoint } from '@/types'
import type { Stop } from './types'

const WALK_ANIMATION_MS = 3000
const SPOT_MOVE_MS = 1200
const TRANSPORTS = ['티머니', '카카오T', 'Uber']

interface RouteViewProps {
  item: Item
  stops: Stop[]
  path: LocationPoint[]
  since: number
  isToday: boolean
  placeIndex: number
  setPlaceIndex: (i: number) => void
  isChecked: (key: string) => boolean
  toggleChecked: (key: string) => void
  onContact: (i: number) => void
  onOnline: () => void
}

/** 찾기 › 동선 복기: 실제 지도, 먼저 확인해볼 곳, 방문 목록, 시뮬레이션 */
export default function RouteView(props: RouteViewProps) {
  const { item, stops, path, since, isToday, placeIndex, setPlaceIndex, isChecked, toggleChecked, onContact, onOnline } = props
  const { stays, nearLosses, now, sim, completeMove, stayById } = useApp()
  const [move, setMove] = useState<SimMove | null>(null)
  const [progress, setProgress] = useState(0)
  const [transportOpen, setTransportOpen] = useState(false)
  const [sources, setSources] = useState<Set<string>>(() => new Set(['티머니', '카카오T']))

  const predictions = useMemo(() => predictLostPlace(item, stays, nearLosses, since), [item, stays, nearLosses, since])

  // 지도: 범위 안의 체류, 핀 번호는 그 장소가 목록에 처음 나온 순서
  const mapStays = useMemo(() => [...new Map(stops.map((s) => [s.stay.id, s.stay])).values()], [stops])
  const pinLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    stops.forEach((s, i) => (labels[s.placeName] ??= String(i + 1)))
    return labels
  }, [stops])
  const lostMarks = useMemo(
    () =>
      nearLosses.flatMap((nl): LostMark[] => {
        const stay = stayById.get(nl.stayId)
        if (nl.itemId !== item.id || nl.recoveredAt !== null || !stay) return []
        return [{ key: nl.id, label: stay.placeName, placeName: stay.placeName, lat: stay.lat, lng: stay.lng }]
      }),
    [nearLosses, stayById, item.id],
  )

  // 장소 이동은 경로를 따라 걷는 애니메이션을, 자리 이동은 잠깐 기다린 뒤 기록한다
  useEffect(() => {
    if (!move) return
    if (move.trigger === '자리이동') {
      const timer = setTimeout(() => {
        completeMove(move)
        setMove(null)
      }, SPOT_MOVE_MS)
      return () => clearTimeout(timer)
    }
    let frame = 0
    const startedAt = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - startedAt) / WALK_ANIMATION_MS)
      setProgress(p)
      if (p < 1) frame = requestAnimationFrame(tick)
      else {
        completeMove(move)
        setMove(null)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [move, completeMove])

  const start = (built: SimMove | null) => {
    if (!built) return
    setProgress(0)
    setMove(built)
  }

  const selected = stops[placeIndex]
  const nextPlace = nextPlaceName(sim)
  const nextSpot = nextSpotName(sim)

  return (
    <View>
      <MapView
        height={240}
        path={path}
        stays={mapStays}
        pinLabels={pinLabels}
        lostMarks={lostMarks}
        selectedPlace={selected?.placeName}
        movingRoute={move?.trigger === '장소이동' ? move.walk : undefined}
        movingProgress={progress}
        onSelectPlace={(name) => {
          const i = stops.findIndex((s) => s.placeName === name)
          if (i >= 0) setPlaceIndex(i)
        }}
      />

      {isToday && (
        <View className="mt-4 rounded-[12px] bg-accent-tint p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>
              오늘 동선 이어가기
            </Text>
            <Badge tone="accent" label="시연" />
          </View>
          <Text className="mt-1 text-muted" style={{ fontSize: 11 }}>
            장소를 옮기거나 자리에서 일어나면 챙김 확인 알림이 와요.
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Button
              small
              label={move?.trigger === '장소이동' ? `${josa(move.toLabel, '으로/로')} 이동 중…` : nextPlace ? '다른 장소로 이동' : '오늘 일정 끝'}
              disabled={!nextPlace || move !== null}
              onPress={() => start(buildPlaceMove(sim, now))}
            />
            <Button
              small
              variant="secondary"
              label={move?.trigger === '자리이동' ? '자리를 옮기는 중…' : nextSpot ? '자리에서 일어나기' : '옮길 자리 없음'}
              disabled={!nextSpot || move !== null}
              onPress={() => start(buildSpotMove(sim, now))}
            />
          </View>
          {!move && (nextPlace || nextSpot) && (
            <Text className="mt-2 text-muted" style={{ fontSize: 11 }}>
              {[nextPlace && `다음 장소: ${nextPlace}`, nextSpot && `다음 자리: ${nextSpot}`].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      )}

      {predictions.length > 0 && (
        <View className="mt-6">
          <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>
            먼저 확인해볼 곳
          </Text>
          <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>
            {josa(item.name, '을/를')} 마지막으로 챙긴 뒤 오래 머문 곳, 예전에 깜빡한 곳일수록 위에 있어요.
          </Text>
          {predictions.map((p, i) => {
            const key = `pred-${p.label}`
            return (
              <View key={p.label} className={`mt-3 rounded-[13px] border border-line bg-paper py-[18px] pl-12 pr-[18px] ${isChecked(key) ? 'opacity-55' : ''}`}>
                <View className="absolute left-4 top-[18px] h-[23px] w-[23px] items-center justify-center rounded-[8px] bg-[#f0f3fc]">
                  <Text className="text-accent" style={{ fontSize: 12 }}>{i + 1}</Text>
                </View>
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-semibold text-ink" style={{ fontSize: 14 }}>{p.label}</Text>
                  <Text className="text-accent" style={{ fontSize: 14, fontWeight: '700' }}>{p.probability}%</Text>
                </View>
                <Text className="mb-3 mt-[7px] text-[#7f8982]" style={{ fontSize: 12, lineHeight: 20 }}>{p.reason}</Text>
                <Pressable onPress={() => toggleChecked(key)} className="self-start rounded-[9px] border border-line px-2.5 py-1.5">
                  <Text className="text-ink" style={{ fontSize: 11 }}>{isChecked(key) ? '✓ 확인했어요' : '여기는 확인했어요'}</Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      <View className="mt-7 flex-row items-center justify-between">
        <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>
          내가 지나온 동선
        </Text>
        <Pressable onPress={() => setTransportOpen(true)} className="rounded-[7px] bg-[#f0f3f9] px-3 py-[7px]">
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#52678d' }}>교통 기록</Text>
        </Pressable>
      </View>
      <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>
        물건의 위치가 아닌, 내 휴대폰의 위치 기록이에요.
      </Text>
      <View className="my-3 flex-row justify-between rounded-[8px] bg-[#f5f7fc] p-2.5">
        <Text style={{ fontSize: 11, color: '#637796' }}>
          {sources.size ? `${[...sources].join(' · ')} 연동 · 이 시간대 탑승 내역 없음` : '교통 기록 연동 안 함'}
        </Text>
        <Text style={{ fontSize: 11, color: '#929dac' }}>가상 연동</Text>
      </View>

      {stops.length === 0 ? (
        <Text className="py-9 text-center text-muted" style={{ fontSize: 13, lineHeight: 21 }}>
          선택한 시간대에 기록이 없어요.{'\n'}분실 정보에서 시간을 넓혀보세요.
        </Text>
      ) : (
        <>
          {stops.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => setPlaceIndex(i)}
              className={`flex-row items-center gap-[13px] rounded-[8px] border-b border-[#eef0f3] px-2.5 py-[15px] ${i === placeIndex ? 'bg-[#f3f6ff]' : ''}`}
            >
              <View className="h-[23px] w-[23px] items-center justify-center rounded-full border border-[#d6dff0]">
                <Text style={{ fontSize: 11, color: '#627cac' }}>{i + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted" style={{ fontSize: 12 }}>
                  {formatTime(s.startAt)}–{formatTime(s.endAt)} · 체류 {formatDuration(s.durationMin)}
                </Text>
                <Text className="font-semibold text-ink" style={{ fontSize: 14 }}>{s.label}</Text>
                <Text style={{ fontSize: 10, color: '#94a0ac', marginTop: 3 }}>
                  휴대폰 위치 기록{s.spotName ? ' · 걷기·정지 감지' : ''}
                  {isChecked(s.key) ? ' · 확인 완료' : ''}
                </Text>
              </View>
              <Icon name="arrow" size={14} color={colors.faint} />
            </Pressable>
          ))}

          {selected && (
            <View className="mt-[17px] rounded-[12px] border border-[#e4e9f1] p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 font-semibold text-ink">{selected.label}</Text>
                <Badge label="휴대폰 위치 기록" />
              </View>
              <Text className="my-2.5 text-[#87919c]" style={{ fontSize: 12, lineHeight: 19 }}>
                {selected.spotName
                  ? `${formatDuration(selected.durationMin)} 동안 ${selected.spotName}에 앉아 있다가 일어났어요. 앉았던 자리와 주변을 확인해보세요.`
                  : `${formatDuration(selected.durationMin)} 머물렀어요. 머문 자리 주변과 안내 데스크를 확인해보세요.`}
              </Text>
              <View className="flex-row gap-[9px]">
                <Button
                  small
                  variant="secondary"
                  label={isChecked(selected.key) ? '✓ 확인 완료' : '여기는 확인했어요'}
                  onPress={() => toggleChecked(selected.key)}
                />
                <Button small label="이곳에 문의" onPress={() => onContact(placeIndex)} />
              </View>
            </View>
          )}
        </>
      )}

      <Button full variant="ghost" label="이 동선 주변의 습득물 보기" trailingIcon="arrow" onPress={onOnline} />
      <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
        동선은 시연용 더미 기록입니다. 실제 티머니·카카오T·Uber 계정은 연결하지 않습니다.
      </Text>

      <BottomSheet open={transportOpen} onClose={() => setTransportOpen(false)} title="교통 이용 내역">
        <Text className="mb-2 text-muted" style={{ fontSize: 12 }}>
          연동했을 때의 화면을 체험해보세요.
        </Text>
        {TRANSPORTS.map((t) => (
          <Pressable
            key={t}
            onPress={() =>
              setSources((prev) => {
                const next = new Set(prev)
                if (next.has(t)) next.delete(t)
                else next.add(t)
                return next
              })
            }
            className="flex-row items-center gap-3 border-b border-line py-[15px]"
          >
            <View className="flex-1">
              <Text className="font-semibold text-ink">{t}</Text>
              <Text className="text-muted" style={{ fontSize: 12 }}>선택 시간대 탑승 내역 없음</Text>
            </View>
            <Badge tone={sources.has(t) ? 'ok' : 'neutral'} label={sources.has(t) ? '연동됨' : '연동하기'} />
          </Pressable>
        ))}
        <Text className="mt-4 text-[#9299a2]" style={{ fontSize: 11 }}>시연용 연결 상태만 바꿔요.</Text>
      </BottomSheet>
    </View>
  )
}
