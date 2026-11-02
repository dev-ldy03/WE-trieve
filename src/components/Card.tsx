import type { ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

interface CardProps {
  children: ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

/** 레퍼런스 .card: 흰 바탕, 옅은 테두리, 둥근 모서리 13 */
export default function Card({ children, className = '', style, onPress }: CardProps) {
  const base = `rounded-[13px] border border-line bg-paper p-[18px] ${className}`
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className={`${base} active:opacity-70`} style={style}>
        {children}
      </Pressable>
    )
  }
  return (
    <View className={base} style={style}>
      {children}
    </View>
  )
}
