import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '@/context/AppContext'
import { startOfDay } from '@/lib/format'
import colors from '@/theme/colors.json'
import Icon from './Icon'

/** 모든 화면 위의 헤더: 워드마크와 알림(종) 버튼. 오늘 답하지 않은 알림이 있으면 점을 찍는다. */
export default function AppHeader() {
  const insets = useSafeAreaInsets()
  const { alerts, now } = useApp()
  const today = startOfDay(now)
  const hasUnanswered = alerts.some(
    (a) => a.createdAt >= today && a.responses.some((r) => r.status === '미응답'),
  )

  return (
    <View
      className="flex-row items-center justify-between bg-paper px-6 pb-3"
      style={{ paddingTop: insets.top + 20 }}
    >
      <Text className="text-ink" style={{ fontSize: 24, fontWeight: '800', letterSpacing: -1 }}>
        Wetriever
      </Text>
      <Pressable
        onPress={() => router.push('/alerts')}
        accessibilityRole="button"
        accessibilityLabel="알림 보기"
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full"
      >
        <Icon name="bell" color={colors.ink} />
        {hasUnanswered && (
          <View
            className="absolute rounded-full bg-warn-dot"
            style={{ width: 6, height: 6, top: 5, right: 6 }}
          />
        )}
      </Pressable>
    </View>
  )
}
