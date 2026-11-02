import { useEffect, useState, type ReactNode } from 'react'
import { Animated, KeyboardAvoidingView, Platform, Pressable, Modal as RNModal, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import colors from '@/theme/colors.json'
import { WEB_FRAME_WIDTH } from '@/theme/layout'
import Icon from './Icon'

// 웹의 Modal은 페이지 전체를 덮으므로, 시트를 휴대폰 화면 폭(430px) 안에 가운데 둔다
const webSheet = { width: '100%', maxWidth: WEB_FRAME_WIDTH, alignSelf: 'center' } as const

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** 레퍼런스 .modal(모바일): 아래에서 올라오는 흰 시트, 오른쪽 위 닫기 */
export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const [translateY] = useState(() => new Animated.Value(600))

  useEffect(() => {
    if (!open) return
    translateY.setValue(600)
    Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start()
  }, [open, translateY])

  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-[#15352b55]">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="닫기" />
        {/* NativeWind className은 Animated.View에 적용되지 않으므로 스타일은 안쪽 View에 둔다 */}
        <Animated.View style={[{ transform: [{ translateY }], maxHeight: '90%' }, Platform.OS === 'web' && webSheet]}>
          <View className="rounded-t-[25px] bg-paper px-6 pt-5" style={{ paddingBottom: insets.bottom + 30 }}>
            <Pressable onPress={onClose} accessibilityLabel="닫기" hitSlop={10} className="self-end">
              <Icon name="close" color={colors.ink} />
            </Pressable>
            {title ? (
              <Text className="mb-3 text-ink" style={{ fontSize: 21, fontWeight: '700', lineHeight: 30 }}>
                {title}
              </Text>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}
