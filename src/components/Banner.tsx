import { useEffect, useState } from 'react'
import { Animated, Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '@/context/AppContext'
import colors from '@/theme/colors.json'
import Icon from './Icon'

const AUTO_DISMISS_MS = 6000

/** 화면 상단 인앱 배너. 알림과 연결된 배너를 누르면 확인 시트가 열린다. */
export default function Banner() {
  const { banner, dismissBanner, openSheet } = useApp()
  const insets = useSafeAreaInsets()
  const [translateY] = useState(() => new Animated.Value(-200))

  useEffect(() => {
    if (!banner) return
    translateY.setValue(-200)
    Animated.spring(translateY, { toValue: 0, useNativeDriver: Platform.OS !== 'web', bounciness: 4 }).start()
    const timer = setTimeout(dismissBanner, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [banner, dismissBanner, translateY])

  if (!banner) return null

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 100, elevation: 100, transform: [{ translateY }] }}
    >
      <View style={{ paddingTop: insets.top + 12 }} className="px-4" pointerEvents="box-none">
        <Pressable
          onPress={() => (banner.alertId ? openSheet(banner.alertId) : dismissBanner())}
          className="flex-row items-start gap-3 rounded-[14px] border border-line bg-paper p-4 active:opacity-90"
          style={{ shadowColor: '#17243a', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
            <Icon name="bell" size={18} color={colors.accent} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-ink" style={{ fontSize: 13, lineHeight: 19 }}>
              {banner.message}
            </Text>
            {banner.alertId && (
              <Text className="mt-1 text-accent" style={{ fontSize: 12 }}>
                눌러서 확인하기
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  )
}
