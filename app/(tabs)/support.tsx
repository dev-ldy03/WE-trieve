import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Chip from '@/components/find/Chip'
import Icon from '@/components/Icon'
import ItemArt from '@/components/ItemArt'
import Screen from '@/components/Screen'
import Title from '@/components/Title'
import { useApp, type Claim } from '@/context/AppContext'
import { dateKey } from '@/lib/format'
import colors from '@/theme/colors.json'

type SupportView = 'main' | 'bundle' | 'claim' | 'status'

export default function Support() {
  const { items, claim, setClaim, toggleProtected, statusOf, showToast, now } = useApp()
  const [view, setView] = useState<SupportView>('main')
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const protectedItems = items.filter((i) => i.protected)

  // 함께 묶기
  const [bundle, setBundle] = useState<Set<string>>(() => new Set(protectedItems.map((i) => i.id)))
  // 신청서
  const [draft, setDraft] = useState<Claim | null>(null)
  // 장소는 그 물건을 마지막으로 챙긴(또는 두고 온) 곳으로 미리 채운다
  const [form, setForm] = useState(() => {
    const first = protectedItems[0]?.id ?? ''
    return { itemId: first, date: dateKey(now), place: first ? (statusOf(first).place ?? '') : '', story: '' }
  })

  const back = (label: string, to: SupportView) => (
    <Pressable onPress={() => setView(to)} className="mb-4 flex-row items-center gap-1.5 self-start">
      <Icon name="back" size={16} color="#728277" />
      <Text style={{ fontSize: 12, color: '#728277' }}>{label}</Text>
    </Pressable>
  )
  const label = (t: string, optional = false) => (
    <Text className="mb-[7px] mt-[17px] font-semibold text-ink" style={{ fontSize: 12 }}>
      {t} {optional && <Text className="font-normal text-muted">(선택)</Text>}
    </Text>
  )
  const input = 'rounded-[12px] border border-[#dce3d8] bg-paper p-3 text-ink'

  if (view === 'bundle') {
    return (
      <Screen>
        {back('재구매 지원', 'main')}
        <Title title="지원받을 물건 선택" sub="자주 가지고 다니는 물건을 골라주세요." />
        <Card className="mt-4 py-1">
          {items.map((i) => {
            const on = bundle.has(i.id)
            return (
              <Pressable
                key={i.id}
                onPress={() => setBundle((prev) => { const next = new Set(prev); if (on) next.delete(i.id); else next.add(i.id); return next })}
                className="flex-row items-center gap-3 border-b border-line py-[13px] last:border-b-0"
              >
                <ItemArt kind={i.kind} width={46} height={40} />
                <Text className="flex-1 font-semibold text-ink">{i.name}</Text>
                <View className={`h-[23px] w-[23px] items-center justify-center rounded-[7px] border ${on ? 'border-accent bg-accent' : 'border-[#bdc9bc]'}`}>
                  {on && <Icon name="check" size={15} color="#fff" />}
                </View>
              </Pressable>
            )
          })}
        </Card>
        <Card className="mt-3 flex-row justify-between">
          <Text className="text-ink">선택한 물건</Text>
          <Text className="font-bold text-ink">{bundle.size}개</Text>
        </Card>
        <Text className="my-[15px] text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
          여러 물건을 함께 등록하는 화면이에요. 묶음 가격과 지원 조건은 추후 안내돼요.
        </Text>
        <Button
          full
          label="선택한 물건 저장"
          onPress={() => {
            if (!bundle.size) return showToast('물건을 하나 이상 선택해주세요.')
            toggleProtected([...bundle])
            setView('main')
            showToast('선택한 물건을 저장했어요. (시연)')
          }}
        />
      </Screen>
    )
  }

  if (view === 'claim') {
    const submit = () => {
      if (!form.itemId) return showToast('지원받을 물건을 먼저 골라주세요.')
      if (!form.place.trim() || !form.story.trim()) return showToast('장소와 분실 상황을 입력해주세요.')
      setDraft({ ...form, place: form.place.trim(), story: form.story.trim(), createdAt: now })
    }
    const draftItem = items.find((i) => i.id === draft?.itemId)
    return (
      <Screen>
        {back('재구매 지원', 'main')}
        <Title title="분실 지원 신청" sub="확인에 필요한 내용을 알려주세요." />
        <View className="my-4 flex-row items-center gap-2">
          <View className="h-[21px] w-[21px] items-center justify-center rounded-full bg-accent">
            <Text className="text-white" style={{ fontSize: 11 }}>1</Text>
          </View>
          <Text className="text-muted" style={{ fontSize: 11 }}>분실 내용 ──── 2 확인 및 접수</Text>
        </View>
        {label('잃어버린 물건')}
        <View className="flex-row flex-wrap gap-2">
          {protectedItems.map((i) => (
            <Chip
              key={i.id}
              label={i.name}
              active={form.itemId === i.id}
              onPress={() => setForm({ ...form, itemId: i.id, place: statusOf(i.id).place ?? form.place })}
            />
          ))}
        </View>
        {label('분실을 알아챈 날짜')}
        <TextInput value={form.date} onChangeText={(t) => setForm({ ...form, date: t })} maxLength={10} className={input} accessibilityLabel="분실을 알아챈 날짜" />
        {label('마지막으로 기억하는 장소')}
        <TextInput value={form.place} onChangeText={(t) => setForm({ ...form, place: t })} placeholder="예: 도서관 3층 열람실" placeholderTextColor={colors.faint} maxLength={100} className={input} accessibilityLabel="마지막으로 기억하는 장소" />
        {label('분실 상황과 찾아본 방법')}
        <TextInput
          value={form.story}
          onChangeText={(t) => setForm({ ...form, story: t })}
          placeholder="마지막으로 사용한 때와 찾아본 곳을 알려주세요."
          placeholderTextColor={colors.faint}
          multiline
          maxLength={1000}
          className={`${input} min-h-[88px]`}
          style={{ textAlignVertical: 'top' }}
          accessibilityLabel="분실 상황과 찾아본 방법"
        />
        {label('관련 자료', true)}
        <View className="rounded-[12px] border border-dashed border-[#dce3d8] p-3">
          <Text className="text-muted" style={{ fontSize: 12 }}>시연에서는 사진·구매 내역을 첨부하지 않아요.</Text>
        </View>
        <Button full label="입력 내용 확인" trailingIcon="arrow" onPress={submit} />

        <BottomSheet open={draft !== null} onClose={() => setDraft(null)} title="신청 내용을 확인해주세요">
          {draft && (
            <>
              <Card>
                <Text className="font-semibold text-ink">{draftItem?.name}</Text>
                <Text className="text-muted" style={{ fontSize: 12 }}>{draft.date} · {draft.place}</Text>
                <Text className="mt-1 text-ink" style={{ fontSize: 12 }}>{draft.story}</Text>
                <Text className="mt-3 text-[#9299a2]" style={{ fontSize: 11 }}>첨부 · 없음</Text>
              </Card>
              <Text className="my-[15px] text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
                입력 내용은 외부로 보내지 않아요. 다음 화면에서 진행 상태를 확인할 수 있어요.
              </Text>
              <Button
                full
                label="시연 신청 완료"
                onPress={() => {
                  setClaim(draft)
                  setDraft(null)
                  setView('status')
                }}
              />
            </>
          )}
        </BottomSheet>
      </Screen>
    )
  }

  if (view === 'status') {
    const claimItem = items.find((i) => i.id === claim?.itemId)
    const steps = [
      ['신청 내용 작성 완료', '입력한 내용을 확인했어요.'],
      ['분실 내용 확인', '실제 서비스에서는 동선·챙김 기록과 자료를 검토해요.'],
      ['결과 안내', '검토 후 지원 가능 여부를 알려드려요.'],
    ]
    return (
      <Screen>
        <View className="mx-auto mb-5 mt-6 h-[65px] w-[65px] items-center justify-center rounded-full bg-accent-soft">
          <Icon name="check" size={30} color={colors.accent} />
        </View>
        <Text className="text-center text-ink" style={{ fontSize: 25, fontWeight: '700' }}>신청 내용을 저장했어요</Text>
        <Text className="text-center text-muted" style={{ fontSize: 12 }}>실제 접수 전 흐름을 보여주는 시연 화면이에요.</Text>
        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-ink">{claimItem?.name ?? '물건'}</Text>
            <Badge label="접수 예시" />
          </View>
          <Text className="text-muted" style={{ fontSize: 12 }}>분실 확인일 · {claim?.date}</Text>
        </Card>
        <Card className="mt-3">
          <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700' }}>신청 진행 상태</Text>
          <View className="mx-2.5 my-5 border-l-2 border-[#dfe8dc] pl-5">
            {steps.map(([t, d], i) => (
              <View key={t} className="pb-[22px]">
                <View className={`absolute -left-[25px] top-[7px] h-2 w-2 rounded-full ${i === 0 ? 'bg-accent' : 'bg-[#bdc9bc]'}`} />
                <Text className={i === 0 ? 'font-semibold text-ink' : 'font-semibold text-muted'}>{t}</Text>
                <Text className="text-muted" style={{ fontSize: 12 }}>{d}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Button full label="내 물건으로 돌아가기" onPress={() => { setView('main'); router.push('/') }} />
      </Screen>
    )
  }

  return (
    <Screen>
      <Title title="재구매 지원" />
      <View className="mb-5 mt-3 flex-row gap-[22px] border-b border-[#edf0f4]">
        {(
          [
            ['new', '새 신청'],
            ['history', '신청 내역'],
          ] as const
        ).map(([id, t]) => (
          <Pressable key={id} onPress={() => setTab(id)} className={`-mb-px border-b-2 pb-2.5 pt-3 ${tab === id ? 'border-[#252e3a]' : 'border-transparent'}`}>
            <Text style={{ fontSize: 13, color: tab === id ? '#252e3a' : '#9299a4', fontWeight: tab === id ? '700' : '400' }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'history' ? (
        claim ? (
          <Card onPress={() => setView('status')}>
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-ink">{items.find((i) => i.id === claim.itemId)?.name}</Text>
              <Badge label="작성 완료" />
            </View>
            <Text className="text-muted" style={{ fontSize: 12 }}>{claim.date} · 예시 신청</Text>
            <View className="mt-3 flex-row items-center gap-1">
              <Text style={{ fontSize: 12, color: '#6279bd' }}>상세 보기</Text>
              <Icon name="arrow" size={14} color="#6279bd" />
            </View>
          </Card>
        ) : (
          <View className="items-center px-2.5 py-9">
            <Icon name="file" size={32} color={colors.muted} />
            <Text className="mt-4 text-ink" style={{ fontSize: 17, fontWeight: '700' }}>아직 신청 내역이 없어요</Text>
            <Text className="mb-4 mt-1 text-muted" style={{ fontSize: 12 }}>새 신청에서 분실 내용을 작성할 수 있어요.</Text>
            <View className="w-40"><Button label="새 신청하기" onPress={() => setTab('new')} /></View>
          </View>
        )
      ) : (
        <>
          <Text className="text-muted" style={{ fontSize: 12 }}>등록한 물건의 지원 내용을 확인하세요.</Text>
          <View className="my-5 rounded-[14px] bg-accent-tint p-[22px]">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-ink">내 물건 안심 플랜</Text>
              <View className="rounded-[5px] bg-[#e7ecfb] px-[9px] py-1"><Text style={{ fontSize: 11, color: '#5874bf' }}>예시 플랜</Text></View>
            </View>
            <Text className="my-[13px] text-ink" style={{ fontSize: 28, fontWeight: '700', letterSpacing: -1 }}>
              3,000원 <Text className="text-muted" style={{ fontSize: 13, fontWeight: '400' }}>/ 월 · 물건 1개 기준</Text>
            </Text>
            <View className="border-t border-[#dfe5f5] pt-3.5"><Text className="text-ink" style={{ fontSize: 13 }}>10만 원 물건 · 최대 7만 원 지원</Text></View>
            <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>분실 확인 후 재구매 비용 일부를 지원해요.</Text>
          </View>

          <View className="mb-1 mt-2 flex-row items-center justify-between">
            <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700' }}>지원받을 물건</Text>
            <Pressable onPress={() => setView('bundle')} className="flex-row items-center gap-1">
              <Text className="text-accent" style={{ fontSize: 12 }}>함께 묶기</Text>
              <Icon name="plus" size={14} color={colors.accent} />
            </Pressable>
          </View>
          {protectedItems.length === 0 && <Text className="py-4 text-muted">아직 지원받을 물건이 없어요. 함께 묶기로 골라주세요.</Text>}
          {protectedItems.map((i) => (
            <Card key={i.id} className="mt-3 flex-row items-center gap-3">
              <ItemArt kind={i.kind} width={46} height={40} />
              <View className="flex-1">
                <Text className="font-semibold text-ink">{i.name}</Text>
                <Text className="text-muted" style={{ fontSize: 12 }}>재구매 지원 대상</Text>
              </View>
              <Badge label="등록됨" />
            </Card>
          ))}
          <Button full label="분실 후 지원 신청" trailingIcon="arrow" onPress={() => setView('claim')} />
          {claim && <Button full variant="ghost" label="내 신청 내역 보기" onPress={() => setView('status')} />}
          <Card className="mt-3">
            <Text className="font-semibold text-ink">이렇게 진행돼요</Text>
            <Text className="text-muted" style={{ fontSize: 12, lineHeight: 24 }}>
              01 물건과 분실 상황을 알려주세요.{'\n'}02 동선·챙김 기록과 분실 기록을 확인해요.{'\n'}03 확인이 끝나면 재구매를 도와드려요.
            </Text>
          </Card>
          <Text className="my-[15px] text-[#9299a2]" style={{ fontSize: 11 }}>화면의 가격·지원 한도는 시연용 예시예요.</Text>
        </>
      )}
    </Screen>
  )
}
