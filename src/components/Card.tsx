import type { ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { softShadow } from '@/theme/shadow'

interface CardProps {
  children: ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export default function Card({ children, className = '', style, onPress }: CardProps) {
  const base = `rounded-3xl bg-white p-4 ${className}`
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`} style={[softShadow, style]}>
        {children}
      </Pressable>
    )
  }
  return (
    <View className={base} style={[softShadow, style]}>
      {children}
    </View>
  )
}
