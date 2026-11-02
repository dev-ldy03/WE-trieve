import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import colors from '@/theme/colors.json'
import Icon, { type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost'

const style: Record<Variant, { box: string; text: string; icon: string }> = {
  primary: { box: 'bg-accent', text: 'text-white', icon: '#ffffff' },
  secondary: { box: 'bg-[#f1f3f7]', text: 'text-ink', icon: colors.ink },
  ghost: { box: 'bg-paper border border-[#e5e8ef]', text: 'text-accent', icon: colors.accent },
}

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  icon?: IconName
  /** 오른쪽 화살표 등 뒤에 붙는 아이콘 */
  trailingIcon?: IconName
  full?: boolean
  disabled?: boolean
  small?: boolean
  children?: ReactNode
}

/** 레퍼런스 .btn (primary 파랑 / secondary 회색 / ghost 테두리) */
export default function Button({ label, onPress, variant = 'primary', icon, trailingIcon, full, disabled, small }: ButtonProps) {
  const s = style[variant]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`flex-row items-center justify-center gap-2 rounded-[10px] active:opacity-80 ${s.box} ${
        full ? 'mt-3 w-full' : 'flex-1'
      } ${small ? 'px-2 py-3' : 'px-4 py-[13px]'} ${disabled ? 'opacity-40' : ''}`}
    >
      {icon && <Icon name={icon} size={17} color={s.icon} />}
      <Text className={`font-semibold ${s.text}`} style={{ fontSize: small ? 12 : 14 }}>
        {label}
      </Text>
      {trailingIcon && <View><Icon name={trailingIcon} size={15} color={s.icon} /></View>}
    </Pressable>
  )
}
