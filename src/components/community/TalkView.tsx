import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Badge, { type BadgeTone } from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Chip from '@/components/find/Chip'
import Icon from '@/components/Icon'
import { useApp } from '@/context/AppContext'
import { demoTalkPosts, TALK_TAGS, type TalkPost, type TalkTag } from '@/data/community'
import { timeAgo } from '@/lib/format'
import colors from '@/theme/colors.json'
import { Field, FieldLabel, Note } from './common'

type Post = TalkPost & { at: number }
const TAG_TONE: Record<TalkTag, BadgeTone> = { 하소연: 'warn', 찾았어요: 'ok', '챙김 팁': 'accent' }

/** 커뮤니티 › 이야기: 잃어버린 일을 털어놓고 서로 토닥이는 곳 */
export default function TalkView() {
  const { items, showToast, now } = useApp()
  const [posts, setPosts] = useState<Post[]>(() => demoTalkPosts.map((p) => ({ ...p, at: now - p.minutesAgo * 60000 })))
  const [filter, setFilter] = useState<'전체' | TalkTag>('전체')
  const [comforted, setComforted] = useState<Set<string>>(() => new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [draft, setDraft] = useState<{ tag: TalkTag; goods: string; body: string } | null>(null)

  const list = posts.filter((p) => filter === '전체' || p.tag === filter)
  const open = posts.find((p) => p.id === openId) ?? null

  const toggleComfort = (id: string) =>
    setComforted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const addComment = () => {
    if (!open || !comment.trim()) return
    setPosts((prev) => prev.map((p) => (p.id === open.id ? { ...p, comments: [...p.comments, { author: '나', body: comment.trim(), mine: true }] } : p)))
    setComment('')
  }

  const submit = () => {
    if (!draft) return
    if (!draft.body.trim()) return showToast('이야기를 적어주세요.')
    setPosts((prev) => [{ id: `mine-${Date.now()}`, tag: draft.tag, author: '나', minutesAgo: 0, at: now, goods: draft.goods.trim(), body: draft.body.trim(), comfort: 0, comments: [], mine: true }, ...prev])
    setFilter('전체')
    setDraft(null)
    showToast(draft.tag === '하소연' ? '털어놔 줘서 고마워요. 괜찮아요, 누구나 깜빡해요.' : '이야기를 올렸어요.')
  }

  return (
    <View>
      <Pressable
        onPress={() => setDraft({ tag: '하소연', goods: '', body: '' })}
        className="flex-row items-center gap-3 rounded-[12px] bg-surface p-4 active:opacity-80"
      >
        <Icon name="chat" size={19} color="#5b6472" />
        <View className="flex-1">
          <Text className="text-ink" style={{ fontSize: 13, fontWeight: '600' }}>오늘 뭘 두고 오셨나요?</Text>
          <Text className="mt-0.5 text-[#7f8794]" style={{ fontSize: 12 }}>누구나 깜빡해요. 털어놓으면 조금 가벼워져요.</Text>
        </View>
        <Icon name="plus" size={17} color="#737c89" />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-3" contentContainerClassName="gap-[9px]">
        {(['전체', ...TALK_TAGS] as const).map((t) => (
          <Chip key={t} label={t} active={filter === t} onPress={() => setFilter(t)} />
        ))}
      </ScrollView>

      {list.map((p) => {
        const on = comforted.has(p.id)
        return (
          <Pressable key={p.id} onPress={() => setOpenId(p.id)} className="border-b border-[#e8ecf1] py-[18px] active:opacity-80">
            <View className="flex-row items-center gap-1.5">
              <Badge tone={TAG_TONE[p.tag]} label={p.tag} />
              <Text className="text-muted" style={{ fontSize: 12 }}>{p.author} · {timeAgo(p.at, now)}</Text>
            </View>
            {p.goods ? <Text className="mt-2 font-semibold text-ink" style={{ fontSize: 14 }}>{p.goods}</Text> : null}
            <Text className="mt-1 text-ink" style={{ fontSize: 13, lineHeight: 20 }} numberOfLines={3}>{p.body}</Text>
            <View className="mt-3 flex-row items-center gap-4">
              <Pressable onPress={() => toggleComfort(p.id)} hitSlop={6} className="flex-row items-center gap-1" accessibilityLabel="토닥토닥" accessibilityState={{ selected: on }}>
                <Icon name="heart" size={15} color={on ? colors.dot : colors.muted} strokeWidth={on ? 2.3 : 1.7} />
                <Text style={{ fontSize: 12, color: on ? colors.dot : colors.muted }}>토닥토닥 {p.comfort + (on ? 1 : 0)}</Text>
              </Pressable>
              <View className="flex-row items-center gap-1">
                <Icon name="chat" size={14} color={colors.muted} />
                <Text className="text-muted" style={{ fontSize: 12 }}>댓글 {p.comments.length}</Text>
              </View>
            </View>
          </Pressable>
        )
      })}
      {list.length === 0 && <Text className="py-9 text-center text-muted">아직 올라온 이야기가 없어요.</Text>}

      <Note>서로를 탓하는 말 대신 다정한 말을 남겨 주세요. 닉네임과 이야기는 모두 시연용 예시예요.</Note>

      {/* 이야기 자세히 + 댓글 */}
      <BottomSheet open={open !== null} onClose={() => { setOpenId(null); setComment('') }}>
        {open && (
          <View>
            <View className="flex-row items-center gap-1.5">
              <Badge tone={TAG_TONE[open.tag]} label={open.tag} />
              <Text className="text-muted" style={{ fontSize: 12 }}>{open.author} · {timeAgo(open.at, now)}</Text>
            </View>
            {open.goods ? <Text className="mt-3 text-ink" style={{ fontSize: 19, fontWeight: '700' }}>{open.goods}</Text> : null}
            <Text className="mt-2 text-ink" style={{ fontSize: 14, lineHeight: 22 }}>{open.body}</Text>
            <Pressable onPress={() => toggleComfort(open.id)} className="mt-4 flex-row items-center gap-1.5 self-start rounded-[8px] border border-line px-3 py-[7px]">
              <Icon name="heart" size={15} color={comforted.has(open.id) ? colors.dot : colors.muted} strokeWidth={comforted.has(open.id) ? 2.3 : 1.7} />
              <Text style={{ fontSize: 12, color: comforted.has(open.id) ? colors.dot : colors.ink }}>
                토닥토닥 {open.comfort + (comforted.has(open.id) ? 1 : 0)}
              </Text>
            </Pressable>

            <Text className="mb-1 mt-6 font-semibold text-ink">댓글 {open.comments.length}</Text>
            {open.comments.map((c, n) => (
              <View key={n} className="border-b border-line-soft py-3">
                <Text className="text-muted" style={{ fontSize: 11 }}>{c.author}</Text>
                <Text className="mt-0.5 text-ink" style={{ fontSize: 13, lineHeight: 20 }}>{c.body}</Text>
              </View>
            ))}
            {open.comments.length === 0 && <Text className="py-3 text-muted" style={{ fontSize: 12 }}>첫 댓글로 토닥여 주세요.</Text>}
            <View className="mt-3 flex-row items-center gap-2">
              <Field value={comment} onChangeText={setComment} placeholder="따뜻한 한마디를 남겨 주세요" maxLength={200} className="flex-1" accessibilityLabel="댓글" onSubmitEditing={addComment} />
              <Pressable onPress={addComment} disabled={!comment.trim()} className={`rounded-[10px] bg-accent px-4 py-3 ${comment.trim() ? '' : 'opacity-40'}`}>
                <Text className="font-semibold text-white" style={{ fontSize: 13 }}>등록</Text>
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheet>

      {/* 이야기 쓰기 */}
      <BottomSheet open={draft !== null} onClose={() => setDraft(null)} title="이야기 쓰기">
        {draft && (
          <>
            <View className="flex-row gap-2">
              {TALK_TAGS.map((t) => (
                <Chip key={t} label={t} active={draft.tag === t} onPress={() => setDraft({ ...draft, tag: t })} />
              ))}
            </View>
            <FieldLabel text="어떤 물건인가요?" optional />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {items.map((i) => (
                <Chip key={i.id} label={i.name} active={draft.goods === i.name} onPress={() => setDraft({ ...draft, goods: draft.goods === i.name ? '' : i.name })} />
              ))}
            </ScrollView>
            <Field value={draft.goods} onChangeText={(t) => setDraft({ ...draft, goods: t })} placeholder="직접 적어도 돼요" maxLength={30} className="mt-2" accessibilityLabel="물건" />
            <FieldLabel text="이야기" />
            <Field
              value={draft.body}
              onChangeText={(t) => setDraft({ ...draft, body: t })}
              placeholder={draft.tag === '찾았어요' ? '어디서 어떻게 찾았는지 알려 주면 다른 사람에게 큰 힘이 돼요.' : draft.tag === '챙김 팁' ? '나만의 챙김 습관을 나눠 주세요.' : '속상했던 일을 편하게 적어 주세요.'}
              multiline
              maxLength={500}
              accessibilityLabel="이야기"
            />
            <Note>닉네임으로만 보여요. 시연에서는 글이 다른 사람에게 보내지지 않아요.</Note>
            <Button full label="올리기" onPress={submit} />
          </>
        )}
      </BottomSheet>
    </View>
  )
}
