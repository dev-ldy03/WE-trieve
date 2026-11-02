import { useMemo } from 'react'
import { SectionList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Badge, { type BadgeTone } from '@/components/Badge'
import Card from '@/components/Card'
import { useApp } from '@/context/AppContext'
import { dateKey, formatDate, formatTime } from '@/lib/format'
import colors from '@/theme/colors.json'
import type { CheckAlert } from '@/types'

type Summary = { label: string; tone: BadgeTone }

/** 응답 결과 요약: 두고 온 게 하나라도 있으면 우선, 그다음 미응답 */
function summarize(alert: CheckAlert, itemIds: Set<string>): Summary {
  const statuses = alert.responses.filter((r) => itemIds.has(r.itemId)).map((r) => r.status)
  if (statuses.includes('두고옴')) return { label: '두고 옴 있음', tone: 'rose' }
  if (statuses.includes('미응답')) return { label: '미응답', tone: 'butter' }
  return { label: '전부 챙김', tone: 'mint' }
}

export default function Alerts() {
  const { alerts, items, endpointsOf, openSheet } = useApp()
  const insets = useSafeAreaInsets()

  const sections = useMemo(() => {
    const byDay = new Map<string, CheckAlert[]>()
    for (const alert of [...alerts].sort((a, b) => b.createdAt - a.createdAt)) {
      const key = dateKey(alert.createdAt)
      byDay.set(key, [...(byDay.get(key) ?? []), alert])
    }
    return [...byDay.values()].map((data) => ({ title: formatDate(data[0].createdAt), data }))
  }, [alerts])

  const itemIds = new Set(items.map((item) => item.id))
  const itemById = new Map(items.map((item) => [item.id, item]))

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      sections={sections}
      keyExtractor={(alert) => alert.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View className="mb-2">
          <Text className="text-sm text-ink-soft">장소나 자리를 옮길 때마다 함께 챙겨봤어요</Text>
          <Text className="text-xl font-bold text-ink">알림 기록</Text>
        </View>
      }
      ListEmptyComponent={
        <Card className="items-center py-10">
          <Text className="text-sm text-ink-soft">아직 받은 알림이 없어요.</Text>
        </Card>
      }
      renderSectionHeader={({ section }) => (
        <Text className="mb-2 mt-4 px-1 text-xs font-semibold text-ink-soft">{section.title}</Text>
      )}
      ItemSeparatorComponent={() => <View className="h-2" />}
      renderItem={({ item: alert }) => {
        const ends = endpointsOf(alert)
        const summary = summarize(alert, itemIds)
        const leftBehind = alert.responses
          .filter((r) => r.status === '두고옴')
          .flatMap((r) => itemById.get(r.itemId) ?? [])
        return (
          <Card onPress={() => openSheet(alert.id)} className="flex-row items-center gap-3">
            <Text className="w-11 text-sm font-semibold text-ink-soft">{formatTime(alert.createdAt)}</Text>
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                {ends ? `${ends.fromLabel} → ${ends.toLabel}` : '알 수 없는 장소'}
              </Text>
              {alert.trigger === '자리이동' && ends && (
                <Text className="text-xs text-ink-soft">{ends.fromStay.placeName} 안에서</Text>
              )}
              {leftBehind.length > 0 && (
                <Text className="text-xs text-rose-deep" numberOfLines={1}>
                  {leftBehind.map((item) => `${item.emoji} ${item.name}`).join(', ')}
                </Text>
              )}
            </View>
            <View className="items-end gap-1">
              <Badge
                tone={alert.trigger === '자리이동' ? 'neutral' : 'coral'}
                label={alert.trigger === '자리이동' ? '🪑 자리 이동' : '🚶 장소 이동'}
              />
              <Badge tone={summary.tone} label={summary.label} />
            </View>
          </Card>
        )
      }}
    />
  )
}
