import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Chip from '@/components/find/Chip'
import Icon from '@/components/Icon'
import { useApp } from '@/context/AppContext'
import { DEAL_CATEGORIES, demoDealPosts, type DealCategory, type DealPost, type GoodsIcon } from '@/data/community'
import { formatWon, timeAgo } from '@/lib/format'
import type { ItemKind } from '@/types'
import colors from '@/theme/colors.json'
import { Field, FieldLabel, GoodsBox, Note } from './common'

type Post = DealPost & { at: number }
const KIND_CATEGORY: Record<ItemKind, DealCategory> = { wallet: '지갑', buds: '이어폰', keys: '열쇠', charger: '충전기' }
const CATEGORY_ICON: Record<DealCategory, GoodsIcon> = { 이어폰: 'buds', 지갑: 'wallet', 열쇠: 'key', 충전기: 'plug', 기타: 'tag' }

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, ''))

/** 커뮤니티 › 알뜰 재구매: 대체품이나 더 싸게 다시 사는 경로를 나눈다 */
export default function DealView() {
  const { items, showToast, now } = useApp()
  const [posts, setPosts] = useState<Post[]>(() => demoDealPosts.map((p) => ({ ...p, at: now - p.minutesAgo * 60000 })))
  const [filter, setFilter] = useState<'전체' | DealCategory>('전체')
  const [helpful, setHelpful] = useState<Set<string>>(() => new Set())
  const [draft, setDraft] = useState<{ category: DealCategory; goods: string; route: string; newPrice: string; routePrice: string; body: string } | null>(null)

  // 내가 등록한 물건과 같은 종류의 글에는 '내 물건' 표시
  const myCategories = new Set(items.map((i) => KIND_CATEGORY[i.kind]))
  const list = posts
    .filter((p) => filter === '전체' || p.category === filter)
    .sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || b.helpful + Number(helpful.has(b.id)) - (a.helpful + Number(helpful.has(a.id))))

  const submit = () => {
    if (!draft) return
    const newPrice = toNumber(draft.newPrice)
    const routePrice = toNumber(draft.routePrice)
    if (!draft.goods.trim() || !draft.route.trim()) return showToast('물건과 구매 경로를 적어주세요.')
    if (!newPrice || !routePrice) return showToast('가격은 숫자로 적어주세요.')
    setPosts((prev) => [
      {
        id: `mine-${Date.now()}`,
        category: draft.category,
        icon: CATEGORY_ICON[draft.category],
        goods: draft.goods.trim(),
        route: draft.route.trim(),
        newPrice,
        routePrice,
        body: draft.body.trim(),
        author: '나',
        minutesAgo: 0,
        at: now,
        helpful: 0,
        mine: true,
      },
      ...prev,
    ])
    setFilter('전체')
    setDraft(null)
    showToast('알뜰 정보를 나눠 줘서 고마워요!')
  }

  return (
    <View>
      <View className="rounded-[14px] bg-accent-tint p-[18px]">
        <Text className="font-semibold text-ink">다시 살 땐, 먼저 물어봐요</Text>
        <Text className="mt-1 text-muted" style={{ fontSize: 12, lineHeight: 19 }}>
          한쪽만 교체하기, 대체품, 중고·학내 장터처럼 먼저 겪어 본 사람들이 찾은 더 싼 방법을 모았어요.
        </Text>
        <Button full small label="내 알뜰 정보 나누기" icon="plus" onPress={() => setDraft({ category: '이어폰', goods: '', route: '', newPrice: '', routePrice: '', body: '' })} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-3" contentContainerClassName="gap-[9px]">
        {DEAL_CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      {list.map((p) => {
        const saved = p.newPrice - p.routePrice
        const on = helpful.has(p.id)
        return (
          <View key={p.id} className="border-b border-[#e8ecf1] py-[18px]">
            <View className="flex-row gap-3">
              <GoodsBox icon={p.icon} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-muted" style={{ fontSize: 12 }}>{p.category} · {p.author} · {timeAgo(p.at, now)}</Text>
                  {myCategories.has(p.category) && <Badge tone="accent" label="내 물건" />}
                </View>
                <Text className="mt-1 font-semibold text-ink" style={{ fontSize: 15 }}>{p.goods}</Text>
                <Text className="text-ink" style={{ fontSize: 12 }}>{p.route}</Text>
              </View>
            </View>
            <View className="mt-3 flex-row items-center justify-between rounded-[9px] bg-surface px-3 py-2.5">
              <Text className="text-muted" style={{ fontSize: 12 }}>
                새로 사면 <Text style={{ textDecorationLine: 'line-through' }}>{formatWon(p.newPrice)}</Text>
                {'  →  '}
                <Text className="font-semibold text-ink">{formatWon(p.routePrice)}</Text>
              </Text>
              {saved > 0 && <Text className="font-semibold text-ok-text" style={{ fontSize: 12 }}>{formatWon(saved)} 아껴요</Text>}
            </View>
            {p.body ? <Text className="mt-3 text-ink" style={{ fontSize: 13, lineHeight: 20 }}>{p.body}</Text> : null}
            <Pressable
              onPress={() => setHelpful((prev) => { const next = new Set(prev); if (on) next.delete(p.id); else next.add(p.id); return next })}
              hitSlop={6}
              className="mt-3 flex-row items-center gap-1 self-start"
              accessibilityState={{ selected: on }}
            >
              <Icon name="check" size={14} color={on ? colors.accent : colors.muted} strokeWidth={on ? 2.3 : 1.7} />
              <Text style={{ fontSize: 12, color: on ? colors.accent : colors.muted }}>도움돼요 {p.helpful + (on ? 1 : 0)}</Text>
            </Pressable>
          </View>
        )
      })}
      {list.length === 0 && <Text className="py-9 text-center text-muted">아직 이 종류의 알뜰 정보가 없어요.</Text>}

      <Pressable onPress={() => router.push('/support')} className="mt-5 flex-row items-center justify-between rounded-[12px] bg-surface p-[17px]">
        <View className="flex-1">
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>재구매 지원도 함께 확인하세요</Text>
          <Text className="mt-1 text-[#89909a]" style={{ fontSize: 11 }}>지원 대상 물건이면 재구매 비용 일부를 지원받을 수 있어요</Text>
        </View>
        <Icon name="arrow" size={19} color={colors.ink} />
      </Pressable>
      <Note>가격·구매 경로·닉네임은 모두 시연용 예시예요. 실제 가격과 판매처 정보가 아니에요.</Note>

      <BottomSheet open={draft !== null} onClose={() => setDraft(null)} title="알뜰 정보 나누기">
        {draft && (
          <>
            <FieldLabel text="물건 종류" />
            <View className="flex-row flex-wrap gap-2">
              {DEAL_CATEGORIES.filter((c): c is DealCategory => c !== '전체').map((c) => (
                <Chip key={c} label={c} active={draft.category === c} onPress={() => setDraft({ ...draft, category: c })} />
              ))}
            </View>
            <FieldLabel text="다시 산 물건" />
            <Field value={draft.goods} onChangeText={(t) => setDraft({ ...draft, goods: t })} placeholder="예: 무선 이어폰 한쪽" maxLength={30} accessibilityLabel="다시 산 물건" />
            <FieldLabel text="어디서, 어떻게 샀나요?" />
            <Field value={draft.route} onChangeText={(t) => setDraft({ ...draft, route: t })} placeholder="예: 서비스센터 한쪽 교체, 학내 중고 장터" maxLength={40} accessibilityLabel="구매 경로" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldLabel text="새로 사면 (원)" />
                <Field value={draft.newPrice} onChangeText={(t) => setDraft({ ...draft, newPrice: t })} placeholder="249000" keyboardType="number-pad" maxLength={9} accessibilityLabel="새로 살 때 가격" />
              </View>
              <View className="flex-1">
                <FieldLabel text="이 방법으로 (원)" />
                <Field value={draft.routePrice} onChangeText={(t) => setDraft({ ...draft, routePrice: t })} placeholder="119000" keyboardType="number-pad" maxLength={9} accessibilityLabel="이 방법으로 산 가격" />
              </View>
            </View>
            <FieldLabel text="꿀팁" optional />
            <Field value={draft.body} onChangeText={(t) => setDraft({ ...draft, body: t })} placeholder="준비물, 주의할 점, 걸린 시간 등을 알려 주세요." multiline maxLength={300} accessibilityLabel="꿀팁" />
            <Note>시연에서는 글이 다른 사람에게 보내지지 않아요.</Note>
            <Button full label="올리기" onPress={submit} />
          </>
        )}
      </BottomSheet>
    </View>
  )
}
