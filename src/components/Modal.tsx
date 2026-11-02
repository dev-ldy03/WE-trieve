import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Modal as RNModal, Text, View } from 'react-native'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center bg-ink/30 px-6"
      >
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="닫기" />
        <View className="w-full max-w-[380px] rounded-3xl bg-cream p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-ink">{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="닫기" hitSlop={12}>
              <Text className="text-xl text-ink-soft">✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}
