import { useEffect, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '@/context/AppContext'
import { softShadow } from '@/theme/shadow'

const AUTO_DISMISS_MS = 6000

/** 화면 상단 인앱 배너. 알림과 연결된 배너를 누르면 확인 시트가 열린다. */
export default function Banner() {
  const { banner, dismissBanner, openSheet } = useApp()
  const insets = useSafeAreaInsets()
  const [translateY] = useState(() => new Animated.Value(-200))

  useEffect(() => {
    if (!banner) return
    translateY.setValue(-200)
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
    const timer = setTimeout(dismissBanner, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [banner, dismissBanner, translateY])

  if (!banner) return null

  const handlePress = () => {
    if (banner.alertId) openSheet(banner.alertId)
    else dismissBanner()
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 100, elevation: 100, transform: [{ translateY }] }}
    >
      <View style={{ paddingTop: insets.top + 8 }} className="px-4" pointerEvents="box-none">
        <Pressable
          onPress={handlePress}
          className="flex-row items-start gap-3 rounded-2xl border border-peach bg-white p-4 active:opacity-90"
          style={softShadow}
        >
          <Text className="text-2xl">🧸</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold leading-5 text-ink">{banner.message}</Text>
            {banner.alertId && <Text className="mt-1 text-xs text-coral-deep">눌러서 확인하기 →</Text>}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  )
}
