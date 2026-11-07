import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Chip from '@/components/find/Chip'
import Icon from '@/components/Icon'
import { useApp } from '@/context/AppContext'
import { demoLendPosts, GOODS_ICON_OPTIONS, LEND_FILTERS, type GoodsIcon, type LendPost, type LendType } from '@/data/community'
import { josa, timeAgo } from '@/lib/format'
import { placeKey } from '@/lib/predict'
import type { ItemKind } from '@/types'
import colors from '@/theme/colors.json'
import { distanceLabel, Field, FieldLabel, GoodsBox, Note } from './common'

type Post = LendPost & { at: number }
interface Draft {
  type: LendType
  goods: string
  icon: GoodsIcon
  place: string
  until: string
  note: string
}

const KIND_ICON: Record<ItemKind, GoodsIcon> = { wallet: 'wallet', buds: 'buds', keys: 'key', charger: 'plug' }

/** 커뮤니티 › 빌려 쓰기: 두고 나온 물건을 근처 사람에게 잠깐 빌리거나 빌려준다 */
export default function LendView() {
  const { items, stays, statusOf, showToast, now } = useApp()
  const [posts, setPosts] = useState<Post[]>(() => demoLendPosts.map((p) => ({ ...p, at: now - p.minutesAgo * 60000 })))
  const [filter, setFilter] = useState<(typeof LEND_FILTERS)[number]>('전체')
  const [asked, setAsked] = useState<Set<string>>(() => new Set())
  const [draft, setDraft] = useState<Draft | null>(null)

  // 지금 머무는 곳 (마지막 체류의 마지막 자리)
  const lastStay = stays[stays.length - 1]
  const lastSpot = lastStay?.spots[lastStay.spots.length - 1]
  const here = lastStay ? placeKey(lastStay.placeName, lastSpot?.name ?? null) : ''

  // 두고 온 물건이 있으면 찾는 동안 빌려 쓰자고 권한다
  const lost = items.find((i) => statusOf(i.id).state === '두고옴')
  const list = posts.filter((p) => filter === '전체' || p.type === filter)

  const startDraft = (type: LendType, goods = '', icon: GoodsIcon = 'plug') =>
    setDraft({ type, goods, icon, place: here, until: '', note: '' })

  const submit = () => {
    if (!draft) return
    if (!draft.goods.trim() || !draft.place.trim() || !draft.until.trim()) return showToast('물건, 장소, 기간을 적어주세요.')
    const post: Post = {
      id: `mine-${Date.now()}`,
      type: draft.type,
      goods: draft.goods.trim(),
      icon: draft.icon,
      author: '나',
      place: draft.place.trim(),
      distanceM: 0,
      minutesAgo: 0,
      at: now,
      until: draft.until.trim(),
      note: draft.note.trim(),
      mine: true,
    }
    setPosts((prev) => [post, ...prev])
    setFilter('전체')
    setDraft(null)
    showToast(draft.type === '빌려요' ? '근처 사람들에게 글을 올렸어요. (시연)' : '빌려줄 물건을 올렸어요. 고마워요! (시연)')
  }

  return (
    <View>
      {lost && (
        <Pressable
          onPress={() => startDraft('빌려요', lost.name, KIND_ICON[lost.kind])}
          className="mb-4 flex-row items-center gap-3 rounded-[12px] bg-accent-tint p-4 active:opacity-80"
        >
          <Icon name="people" size={19} color="#5270d2" />
          <View className="flex-1">
            <Text className="text-ink" style={{ fontSize: 13, fontWeight: '600' }}>{josa(lost.name, '을/를')} 찾는 동안 빌려 쓸까요?</Text>
            <Text className="mt-0.5 text-[#7f8794]" style={{ fontSize: 12 }}>근처 사람들에게 잠깐 빌려 달라고 물어볼 수 있어요</Text>
          </View>
          <Icon name="arrow" size={16} color="#9ca5b5" />
        </Pressable>
      )}

      <View className="flex-row gap-2.5">
        <Button small label="빌려요" icon="plus" onPress={() => startDraft('빌려요')} />
        <Button small variant="secondary" label="빌려줄게요" icon="plus" onPress={() => startDraft('빌려줄게요')} />
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700' }}>내 주변 {list.length}건</Text>
        <Text className="text-muted" style={{ fontSize: 11 }}>{here || '내 위치'} 기준</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-3" contentContainerClassName="gap-[9px]">
        {LEND_FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      {list.map((p) => {
        const sent = asked.has(p.id)
        return (
          <View key={p.id} className="border-b border-[#e8ecf1] py-[18px]">
            <View className="flex-row gap-3">
              <GoodsBox icon={p.icon} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Badge tone={p.type === '빌려요' ? 'warn' : 'ok'} label={p.type} />
                  {p.mine && <Badge tone="accent" label="내 글" />}
                </View>
                <Text className="mt-1.5 font-semibold text-ink" style={{ fontSize: 15 }}>{p.goods}</Text>
                <Text className="text-muted" style={{ fontSize: 12 }} numberOfLines={1}>
                  {p.place} · {distanceLabel(p.distanceM)} · {timeAgo(p.at, now)}
                </Text>
              </View>
            </View>
            {p.note ? <Text className="mt-3 text-ink" style={{ fontSize: 13, lineHeight: 20 }}>{p.note}</Text> : null}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Icon name="clock" size={13} color={colors.muted} />
                <Text className="text-muted" style={{ fontSize: 11 }}>{p.until}</Text>
              </View>
              {p.mine ? (
                <Pressable onPress={() => { setPosts((prev) => prev.filter((x) => x.id !== p.id)); showToast('글을 내렸어요.') }} hitSlop={6}>
                  <Text className="text-muted" style={{ fontSize: 12 }}>글 내리기</Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled={sent}
                  onPress={() => {
                    setAsked((prev) => new Set(prev).add(p.id))
                    showToast(`${p.author}님에게 ${p.type === '빌려요' ? '빌려줄 수 있다고' : '빌려 쓰고 싶다고'} 전했어요. (시연)`)
                  }}
                  className={`rounded-[7px] px-3 py-[7px] ${sent ? 'bg-surface' : 'bg-[#f0f3f9]'}`}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: sent ? colors.muted : '#52678d' }}>
                    {sent ? '연락 보냄' : p.type === '빌려요' ? '빌려줄게요' : '빌려 쓸래요'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )
      })}
      {list.length === 0 && <Text className="py-9 text-center text-muted">아직 올라온 글이 없어요.</Text>}

      <Note>
        물건은 사람이 많은 곳에서 주고받고, 돌려받을 때 상태를 함께 확인해요. 닉네임·게시물·거리는 모두 시연용 예시예요.
      </Note>

      <BottomSheet open={draft !== null} onClose={() => setDraft(null)} title={draft?.type === '빌려줄게요' ? '빌려줄 물건 올리기' : '잠깐 빌려 쓰기'}>
        {draft && (
          <>
            <View className="flex-row gap-2">
              {(['빌려요', '빌려줄게요'] as const).map((t) => (
                <Chip key={t} label={t} active={draft.type === t} onPress={() => setDraft({ ...draft, type: t })} />
              ))}
            </View>
            <FieldLabel text="물건" />
            <Field value={draft.goods} onChangeText={(t) => setDraft({ ...draft, goods: t })} placeholder="예: 공학용 계산기, 고데기" maxLength={30} accessibilityLabel="물건" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2" contentContainerClassName="gap-2">
              {GOODS_ICON_OPTIONS.map((o) => (
                <Pressable
                  key={o.icon}
                  onPress={() => setDraft({ ...draft, icon: o.icon, goods: draft.goods || o.label })}
                  accessibilityLabel={o.label}
                  accessibilityState={{ selected: draft.icon === o.icon }}
                  className={`items-center rounded-[10px] border px-2.5 py-2 ${draft.icon === o.icon ? 'border-accent-soft bg-accent-soft' : 'border-line'}`}
                >
                  <Icon name={o.icon} size={18} color={draft.icon === o.icon ? colors.accent : '#5b6472'} />
                  <Text className={draft.icon === o.icon ? 'text-accent' : 'text-muted'} style={{ fontSize: 10, marginTop: 3 }}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <FieldLabel text={draft.type === '빌려요' ? '받을 곳' : '건네줄 곳'} />
            <Field value={draft.place} onChangeText={(t) => setDraft({ ...draft, place: t })} placeholder="예: 중앙도서관 1층 로비" maxLength={50} accessibilityLabel="장소" />
            <FieldLabel text={draft.type === '빌려요' ? '언제까지 필요해요?' : '언제까지 빌려줄 수 있어요?'} />
            <Field value={draft.until} onChangeText={(t) => setDraft({ ...draft, until: t })} placeholder="예: 오늘 18시까지" maxLength={30} accessibilityLabel="기간" />
            <FieldLabel text="한마디" optional />
            <Field
              value={draft.note}
              onChangeText={(t) => setDraft({ ...draft, note: t })}
              placeholder={draft.type === '빌려요' ? '사정을 짧게 적어 주면 더 빨리 도움받을 수 있어요.' : '건네줄 방법이나 주의할 점을 적어 주세요.'}
              multiline
              maxLength={200}
              accessibilityLabel="한마디"
            />
            <Note>지금 머무는 곳을 미리 채웠어요. 시연에서는 글이 다른 사람에게 보내지지 않아요.</Note>
            <Button full label="올리기" onPress={submit} />
          </>
        )}
      </BottomSheet>
    </View>
  )
}
