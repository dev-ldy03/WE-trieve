import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import Card from '@/components/Card'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import { formatDate, formatDateTime, formatTime, josa } from '@/lib/format'
import { findLastCheck, placeKey, predictLostPlace } from '@/lib/predict'
import { checkMomentLabel } from '@/lib/stay'

const DAY = 24 * 60 * 60 * 1000

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { items, alerts, nearLosses, stays, stayById, spotById, now, endpointsOf, markRecovered } = useApp()
  const [showPrediction, setShowPrediction] = useState(false)
  const item = items.find((i) => i.id === id)

  const lastCheck = item && findLastCheck(item.id, alerts)
  const lastEnds = lastCheck && endpointsOf(lastCheck)

  const history = useMemo(
    () => nearLosses.filter((nl) => nl.itemId === id).sort((a, b) => b.detectedAt - a.detectedAt),
    [nearLosses, id],
  )

  const predictions = useMemo(() => {
    if (!item) return []
    // 챙김 확인 기록이 없으면 최근 하루를 본다
    const since = lastCheck?.createdAt ?? now - DAY
    return predictLostPlace(item, stays, nearLosses, since)
  }, [item, lastCheck, stays, nearLosses, now])

  if (!item) {
    return (
      <Screen safeTop={false}>
        <View className="items-center gap-3 pt-10">
          <Text className="text-4xl">🫧</Text>
          <Text className="text-sm text-ink-soft">이 물건을 찾을 수 없어요.</Text>
          <Pressable onPress={() => router.replace('/items')}>
            <Text className="text-sm font-semibold text-coral-deep">내 물건으로 돌아가기</Text>
          </Pressable>
        </View>
      </Screen>
    )
  }

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: item.name }} />

      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white">
          <Text className="text-4xl">{item.emoji}</Text>
        </View>
        <View>
          <Text className="text-xl font-bold text-ink">{item.name}</Text>
          <Text className="text-xs text-ink-soft">{formatDate(item.createdAt)}부터 함께하고 있어요</Text>
        </View>
      </View>

      <Card>
        <Text className="text-xs text-ink-soft">마지막으로 챙김을 확인한 곳</Text>
        {lastCheck && lastEnds ? (
          <>
            <Text className="mt-1 font-semibold text-ink">{checkMomentLabel(lastCheck.trigger, lastEnds)}</Text>
            <Text className="text-sm text-ink-soft">{formatDateTime(lastCheck.createdAt)}</Text>
          </>
        ) : (
          <Text className="mt-1 text-sm text-ink">아직 챙김 확인 기록이 없어요</Text>
        )}
      </Card>

      <View className="gap-3">
        <Pressable
          onPress={() => setShowPrediction((v) => !v)}
          className="items-center rounded-full bg-coral-deep py-3.5 active:opacity-80"
        >
          <Text className="font-semibold text-white">🔮 어디에 두고 왔을까?</Text>
        </Pressable>
        {showPrediction && (
          <Card className="gap-4">
            <Text className="text-xs leading-5 text-ink-soft">
              마지막으로 챙긴 뒤 머문 장소·자리 중에서, 오래 머물렀고 예전에 깜빡한 적이 있는 곳일수록 가능성이
              높아요.
            </Text>
            {predictions.length === 0 ? (
              <Text className="text-sm text-ink">아직 짐작할 만한 기록이 부족해요.</Text>
            ) : (
              predictions.map((p, i) => (
                <View key={p.label} className="gap-1.5">
                  <View className="flex-row items-baseline justify-between gap-2">
                    <Text className="flex-1 font-semibold text-ink">
                      {i + 1}. {p.label}
                    </Text>
                    <Text className="text-lg font-bold text-coral-deep">{p.probability}%</Text>
                  </View>
                  <View className="h-2.5 overflow-hidden rounded-full bg-cream">
                    <View className="h-full rounded-full bg-coral" style={{ width: `${p.probability}%` }} />
                  </View>
                  <Text className="text-xs leading-5 text-ink-soft">{p.reason}</Text>
                </View>
              ))
            )}
          </Card>
        )}
      </View>

      <View className="gap-2">
        <Text className="font-bold text-ink">잃어버릴 뻔한 기록</Text>
        {history.length === 0 ? (
          <Card>
            <Text className="text-sm text-ink-soft">한 번도 두고 온 적이 없어요. 정말 잘 챙기고 있어요! 🌷</Text>
          </Card>
        ) : (
          history.map((nl) => {
            const stay = stayById.get(nl.stayId)
            const spotName = nl.spotId ? (spotById.get(nl.spotId)?.name ?? null) : null
            return (
              <Card key={nl.id} className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">
                    {stay ? placeKey(stay.placeName, spotName) : '알 수 없는 장소'}
                  </Text>
                  <Text className="text-xs text-ink-soft">{formatDateTime(nl.detectedAt)}</Text>
                </View>
                {nl.recoveredAt === null ? (
                  <Pressable onPress={() => markRecovered(nl.id)} className="rounded-full bg-mint px-3 py-1.5">
                    <Text className="text-xs font-semibold text-mint-deep">찾았어요</Text>
                  </Pressable>
                ) : (
                  <Badge tone="mint" label={`${formatTime(nl.recoveredAt)}에 찾음`} />
                )}
              </Card>
            )
          })
        )}
        {history.length > 0 && (
          <Text className="mt-1 text-center text-xs text-ink-soft">
            {josa(item.name, '을/를')} {history.length}번 두고 올 뻔했지만, 괜찮아요. 우리가 같이 챙길게요.
          </Text>
        )}
      </View>
    </Screen>
  )
}
