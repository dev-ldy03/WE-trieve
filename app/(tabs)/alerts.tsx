import { useMemo } from 'react'
import { Pressable, SectionList, Text, View } from 'react-native'
import BackLink from '@/components/BackLink'
import Badge, { type BadgeTone } from '@/components/Badge'
import Icon from '@/components/Icon'
import Title from '@/components/Title'
import { useApp } from '@/context/AppContext'
import { dateKey, formatDate, formatTime, josa, timeAgo } from '@/lib/format'
import colors from '@/theme/colors.json'
import type { CheckAlert } from '@/types'

/** 응답 결과 요약: 두고 온 게 하나라도 있으면 우선, 그다음 미응답 */
function summarize(alert: CheckAlert, itemIds: Set<string>): { label: string; tone: BadgeTone } {
  const statuses = alert.responses.filter((r) => itemIds.has(r.itemId)).map((r) => r.status)
  if (statuses.includes('두고옴')) return { label: '두고 옴 있음', tone: 'warn' }
  if (statuses.includes('미응답')) return { label: '미응답', tone: 'accent' }
  return { label: '전부 챙김', tone: 'ok' }
}

export default function Alerts() {
  const { alerts, items, now, endpointsOf, openSheet } = useApp()
  const itemIds = new Set(items.map((i) => i.id))
  const itemById = new Map(items.map((i) => [i.id, i]))

  const sections = useMemo(() => {
    const byDay = new Map<string, CheckAlert[]>()
    for (const alert of [...alerts].sort((a, b) => b.createdAt - a.createdAt)) {
      const key = dateKey(alert.createdAt)
      byDay.set(key, [...(byDay.get(key) ?? []), alert])
    }
    return [...byDay.values()].map((data) => ({ title: formatDate(data[0].createdAt), data }))
  }, [alerts])

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingTop: 18, paddingBottom: 40, paddingHorizontal: 24 }}
      sections={sections}
      keyExtractor={(a) => a.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View>
          <BackLink label="홈" />
          <Title title="알림" sub="장소나 자리를 옮길 때마다 함께 챙겨봤어요." />
        </View>
      }
      ListEmptyComponent={<Text className="py-9 text-center text-muted">아직 받은 알림이 없어요.</Text>}
      renderSectionHeader={({ section }) => (
        <Text className="mb-1 mt-6 text-muted" style={{ fontSize: 12, fontWeight: '600' }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item: alert }) => {
        const ends = endpointsOf(alert)
        const summary = summarize(alert, itemIds)
        const left = alert.responses.filter((r) => r.status === '두고옴').flatMap((r) => itemById.get(r.itemId) ?? [])
        const needsLook = summary.tone !== 'ok'
        const spot = alert.trigger === '자리이동'
        return (
          <Pressable
            onPress={() => openSheet(alert.id)}
            className={`mt-3 rounded-[13px] border border-line bg-paper p-[18px] active:opacity-70 ${needsLook ? 'border-l-[3px] border-l-warn-dot' : ''}`}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 font-semibold text-ink" numberOfLines={1}>
                {ends ? `${ends.fromLabel}에서 ${spot ? '일어났어요' : '나왔어요'}` : '챙김 확인'}
              </Text>
              <Text className="text-muted" style={{ fontSize: 12 }}>
                {now - alert.createdAt < 86400000 ? timeAgo(alert.createdAt, now) : formatTime(alert.createdAt)}
              </Text>
            </View>
            <Text className="mt-1 text-muted" style={{ fontSize: 12 }} numberOfLines={1}>
              {ends ? (spot ? `${josa(ends.toLabel, '으로/로')} 옮김 · ${ends.fromStay.placeName} 안` : `${ends.toLabel}에 도착`) : ''}
            </Text>
            {left.length > 0 && (
              <Text className="mt-1 text-warn-text" style={{ fontSize: 12 }}>
                두고 온 물건: {left.map((i) => i.name).join(', ')}
              </Text>
            )}
            <View className="mt-3 flex-row items-center gap-1.5">
              <Badge tone="neutral" label={spot ? '자리 이동' : '장소 이동'} />
              <Badge tone={summary.tone} label={summary.label} />
              <View className="flex-1" />
              {needsLook && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-accent" style={{ fontSize: 12 }}>확인하기</Text>
                  <Icon name="arrow" size={14} color={colors.accent} />
                </View>
              )}
            </View>
          </Pressable>
        )
      }}
    />
  )
}
