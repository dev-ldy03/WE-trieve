import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Chip from '@/components/find/Chip'
import ContactView from '@/components/find/ContactView'
import OnlineView from '@/components/find/OnlineView'
import RouteView from '@/components/find/RouteView'
import { hm, type SearchCase, type Stop } from '@/components/find/types'
import Icon from '@/components/Icon'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import { HISTORY_DAYS } from '@/data/routine'
import { formatDate, startOfDay } from '@/lib/format'
import { findLastCheck, placeKey } from '@/lib/predict'
import colors from '@/theme/colors.json'

const DAY = 24 * 60 * 60 * 1000
type FindTab = 'route' | 'online' | 'contact'
const TABS: [FindTab, string][] = [
  ['route', '동선 복기'],
  ['online', '온라인 탐색'],
  ['contact', '신고·문의'],
]

export default function Find() {
  const params = useLocalSearchParams<{ item?: string }>()
  const { items, points, stays, alerts, now } = useApp()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const itemId = pickedId ?? params.item ?? items[0]?.id
  const item = items.find((i) => i.id === itemId) ?? items[0]

  const today = startOfDay(now)
  const [searchCase, setSearchCase] = useState<SearchCase>({ day: today, from: '08:00', to: null, feature: '흰색 케이스, 파란 별 스티커' })
  const [tab, setTab] = useState<FindTab>('route')
  const [placeIndex, setPlaceIndex] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [editing, setEditing] = useState(false)

  const fromTs = searchCase.day + hm(searchCase.from)
  const toTs = searchCase.to ? searchCase.day + hm(searchCase.to) : searchCase.day === today ? now : searchCase.day + DAY
  const isToday = searchCase.day === today

  // 선택한 시간대에 겹치는 체류를 장소·자리 단위로 편다
  const stops = useMemo(
    () =>
      stays
        .filter((s) => s.endAt >= fromTs && s.startAt <= toTs)
        .flatMap((stay): Stop[] => {
          const base = { stay, placeName: stay.placeName }
          if (stay.spots.length === 0) {
            return [{ ...base, key: stay.id, label: stay.placeName, spotName: null, startAt: stay.startAt, endAt: stay.endAt, durationMin: stay.durationMin }]
          }
          return stay.spots
            .filter((spot) => spot.endAt >= fromTs && spot.startAt <= toTs)
            .map((spot) => ({ ...base, key: spot.id, label: placeKey(stay.placeName, spot.name), spotName: spot.name, startAt: spot.startAt, endAt: spot.endAt, durationMin: spot.durationMin }))
        }),
    [stays, fromTs, toTs],
  )
  const path = useMemo(() => points.filter((p) => p.timestamp >= fromTs && p.timestamp <= toTs), [points, fromTs, toTs])
  const lastCheck = item ? findLastCheck(item.id, alerts) : undefined
  const since = Math.max(fromTs, lastCheck && lastCheck.createdAt < toTs ? lastCheck.createdAt : fromTs)
  const safeIndex = Math.min(placeIndex, Math.max(0, stops.length - 1))

  const toggleChecked = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      const k = `${item?.id}-${key}`
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  if (!item) {
    return (
      <Screen>
        <Text className="text-muted">먼저 물건을 등록해 주세요.</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Text className="text-ink" style={{ fontSize: 22, fontWeight: '700', letterSpacing: -1 }}>
          물건 찾기
        </Text>
        <Text className="text-muted" style={{ fontSize: 12 }}>시연 모드</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-2.5" contentContainerClassName="gap-[9px]">
        {items.map((i) => (
          <Chip key={i.id} label={i.name} active={i.id === item.id} onPress={() => setPickedId(i.id)} />
        ))}
      </ScrollView>

      <Pressable onPress={() => setEditing(true)} className="flex-row justify-between py-2">
        <Text className="text-[#808b9b]" style={{ fontSize: 11 }}>
          {formatDate(searchCase.day)} · {searchCase.from}–{searchCase.to ?? '지금'}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-[#808b9b]" style={{ fontSize: 11 }}>분실 정보 수정</Text>
          <Icon name="arrow" size={12} color="#808b9b" />
        </View>
      </Pressable>

      <View className="mb-5 flex-row gap-[21px] border-b border-[#edf0f4]">
        {TABS.map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            className={`-mb-px border-b-2 pb-2.5 pt-3 ${tab === id ? 'border-[#252e3a]' : 'border-transparent'}`}
          >
            <Text style={{ fontSize: 13, color: tab === id ? '#252e3a' : '#9299a4', fontWeight: tab === id ? '700' : '400' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* 세 화면을 모두 띄워 두고 보이는 것만 바꿔, 탭을 오가도 확인·저장 기록이 남게 한다 */}
      <View style={{ display: tab === 'route' ? 'flex' : 'none' }}>
        <RouteView
          item={item}
          stops={stops}
          path={path}
          since={since}
          isToday={isToday}
          placeIndex={safeIndex}
          setPlaceIndex={setPlaceIndex}
          isChecked={(key) => checked.has(`${item.id}-${key}`)}
          toggleChecked={toggleChecked}
          onContact={(i) => {
            setPlaceIndex(i)
            setTab('contact')
          }}
          onOnline={() => setTab('online')}
        />
      </View>
      <View style={{ display: tab === 'online' ? 'flex' : 'none' }}>
        <OnlineView
          item={item}
          searchCase={searchCase}
          onContact={() => setTab('contact')}
          onContactPlace={(name) => {
            const i = stops.findIndex((s) => s.placeName === name)
            if (i < 0) return false
            setPlaceIndex(i)
            setTab('contact')
            return true
          }}
        />
      </View>
      <View style={{ display: tab === 'contact' ? 'flex' : 'none' }}>
        <ContactView item={item} searchCase={searchCase} stops={stops} index={safeIndex} setIndex={setPlaceIndex} />
      </View>

      <CaseSheet
        open={editing}
        value={searchCase}
        today={today}
        onClose={() => setEditing(false)}
        onSave={(c) => {
          setSearchCase(c)
          setPlaceIndex(0)
          setEditing(false)
        }}
      />
    </Screen>
  )
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** 분실 정보 수정: 날짜(최근 30일), 마지막으로 본 시간 ~ 알아챈 시간, 특징 */
function CaseSheet({ open, value, today, onClose, onSave }: { open: boolean; value: SearchCase; today: number; onClose: () => void; onSave: (c: SearchCase) => void }) {
  const { showToast } = useApp()
  const [draft, setDraft] = useState(value)
  const [toText, setToText] = useState(value.to ?? '')
  const firstDay = today - (HISTORY_DAYS - 1) * DAY

  const save = () => {
    const to = toText.trim() || null
    if (!TIME_RE.test(draft.from) || (to && !TIME_RE.test(to))) return showToast('시간은 13:00처럼 적어주세요.')
    if (to && to < draft.from) return showToast('시간 순서를 확인해주세요.')
    onSave({ ...draft, to })
  }
  const input = 'rounded-[12px] border border-[#dce3d8] bg-paper p-3 text-ink'
  const label = (t: string) => (
    <Text className="mb-[7px] mt-[17px] font-semibold text-ink" style={{ fontSize: 12 }}>{t}</Text>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="분실 정보">
      {label('날짜')}
      <View className="flex-row items-center justify-between rounded-[12px] border border-[#dce3d8] px-2 py-1.5">
        <Pressable disabled={draft.day <= firstDay} onPress={() => setDraft({ ...draft, day: draft.day - DAY })} className={`p-2 ${draft.day <= firstDay ? 'opacity-30' : ''}`} accessibilityLabel="이전 날">
          <Icon name="back" size={16} color={colors.ink} />
        </Pressable>
        <Text className="text-ink">{formatDate(draft.day)}</Text>
        <Pressable disabled={draft.day >= today} onPress={() => setDraft({ ...draft, day: draft.day + DAY })} className={`p-2 ${draft.day >= today ? 'opacity-30' : ''}`} accessibilityLabel="다음 날">
          <Icon name="arrow" size={16} color={colors.ink} />
        </Pressable>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          {label('마지막으로 본 시간')}
          <TextInput value={draft.from} onChangeText={(t) => setDraft({ ...draft, from: t })} placeholder="13:00" maxLength={5} className={input} accessibilityLabel="마지막으로 본 시간" />
        </View>
        <View className="flex-1">
          {label('분실을 알아챈 시간')}
          <TextInput value={toText} onChangeText={setToText} placeholder="비우면 지금까지" placeholderTextColor={colors.faint} maxLength={5} className={input} accessibilityLabel="분실을 알아챈 시간" />
        </View>
      </View>
      {label('색상·케이스·고유 특징')}
      <TextInput value={draft.feature} onChangeText={(t) => setDraft({ ...draft, feature: t })} className={input} accessibilityLabel="고유 특징" />
      <Text className="my-[15px] text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
        입력한 시간 범위로 동선을 좁히고, 특징을 게시물과 비교해요.
      </Text>
      <Button full label="이 정보로 찾기" onPress={save} />
    </BottomSheet>
  )
}
