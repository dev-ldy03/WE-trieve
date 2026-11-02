import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import { formatDateTime } from '@/lib/format'
import { findLastCheck } from '@/lib/predict'
import { checkMomentLabel } from '@/lib/stay'
import colors from '@/theme/colors.json'

const EMOJIS = ['🎧', '👛', '🧥', '☂️', '🔑', '📱', '💳', '🎒', '👓', '⌚', '💻', '📚', '🧢', '🧣', '🔋', '🖊️']

export default function Items() {
  const { items, alerts, nearLosses, endpointsOf, addItem, removeItem } = useApp()
  const [adding, setAdding] = useState(false)

  return (
    <Screen>
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-sm text-ink-soft">늘 함께 다니는 소중한 것들</Text>
          <Text className="text-xl font-bold text-ink">내 물건</Text>
        </View>
        <Pressable onPress={() => setAdding(true)} className="rounded-full bg-coral-deep px-4 py-2 active:opacity-80">
          <Text className="text-sm font-semibold text-white">+ 물건 추가</Text>
        </Pressable>
      </View>

      {items.length === 0 && (
        <Card className="items-center py-10">
          <Text className="text-center text-sm leading-6 text-ink-soft">
            아직 등록한 물건이 없어요.{'\n'}늘 챙기는 물건을 하나 추가해 볼까요?
          </Text>
        </Card>
      )}

      {items.map((item) => {
        const lastCheck = findLastCheck(item.id, alerts)
        const ends = lastCheck && endpointsOf(lastCheck)
        const isLeftBehind = nearLosses.some((nl) => nl.itemId === item.id && nl.recoveredAt === null)
        return (
          <Card
            key={item.id}
            className="flex-row items-center gap-3"
            style={isLeftBehind ? { borderWidth: 2, borderColor: colors.rose } : undefined}
          >
            <Pressable
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
              className="flex-1 flex-row items-center gap-3 active:opacity-70"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-cream">
                <Text className="text-2xl">{item.emoji}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="font-semibold text-ink">{item.name}</Text>
                  {isLeftBehind && <Badge tone="rose" label="두고 옴" />}
                </View>
                <Text className="text-xs text-ink-soft" numberOfLines={2}>
                  {lastCheck && ends
                    ? `마지막 챙김 · ${checkMomentLabel(lastCheck.trigger, ends)}, ${formatDateTime(lastCheck.createdAt)}`
                    : '아직 챙김 확인 기록이 없어요'}
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => removeItem(item.id)}
              accessibilityLabel={`${item.name} 삭제`}
              hitSlop={8}
              className="rounded-full px-2 py-1 active:bg-rose"
            >
              <Text className="text-xs text-ink-soft">삭제</Text>
            </Pressable>
          </Card>
        )
      })}

      <AddItemModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(name, emoji) => {
          addItem(name, emoji)
          setAdding(false)
        }}
      />
    </Screen>
  )
}

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string, emoji: string) => void
}

function AddItemModal({ open, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const canSubmit = name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    onAdd(name.trim(), emoji)
    setName('')
    setEmoji(EMOJIS[0])
  }

  return (
    <Modal open={open} title="물건 추가" onClose={onClose}>
      <View className="gap-4">
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-ink">이름</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={12}
            placeholder="예: 학생증"
            placeholderTextColor={colors.inkSoft}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="물건 이름"
            className="rounded-2xl border border-peach bg-white px-4 py-3 text-sm text-ink"
          />
        </View>
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-ink">이모지</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                accessibilityLabel={`이모지 ${e}`}
                accessibilityState={{ selected: emoji === e }}
                className={`h-10 w-10 items-center justify-center rounded-xl ${
                  emoji === e ? 'border-2 border-coral bg-peach' : 'bg-white'
                }`}
              >
                <Text className="text-xl">{e}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          accessibilityState={{ disabled: !canSubmit }}
          className={`items-center rounded-full py-3.5 ${canSubmit ? 'bg-coral-deep' : 'bg-peach'}`}
        >
          <Text className={`font-semibold ${canSubmit ? 'text-white' : 'text-ink-soft'}`}>등록할게요</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
