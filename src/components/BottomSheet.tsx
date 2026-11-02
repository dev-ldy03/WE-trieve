import { useEffect, useState, type ReactNode } from 'react'
import { Animated, Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const [translateY] = useState(() => new Animated.Value(600))

  useEffect(() => {
    if (!open) return
    translateY.setValue(600)
    Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }).start()
  }, [open, translateY])

  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end bg-ink/30">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="닫기" />
        {/* NativeWind className은 Animated.View에 적용되지 않으므로 스타일은 안쪽 View에 둔다 */}
        <Animated.View style={{ transform: [{ translateY }], maxHeight: '88%' }}>
          <View className="rounded-t-3xl bg-cream px-5 pt-3" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-4 h-1.5 w-10 self-center rounded-full bg-peach" />
            <Text className="mb-4 text-lg font-bold leading-7 text-ink">{title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  )
}
