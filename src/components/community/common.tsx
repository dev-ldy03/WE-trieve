import { Text, TextInput, View, type TextInputProps } from 'react-native'
import Icon from '@/components/Icon'
import type { GoodsIcon } from '@/data/community'
import colors from '@/theme/colors.json'

/** 게시물 왼쪽의 물건 그림 칸 */
export function GoodsBox({ icon, size = 46 }: { icon: GoodsIcon; size?: number }) {
  return (
    <View className="items-center justify-center rounded-[13px] bg-[#f5f6f8]" style={{ width: size, height: size }}>
      <Icon name={icon} size={Math.round(size * 0.5)} color="#5b6472" />
    </View>
  )
}

export function FieldLabel({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <Text className="mb-[7px] mt-[17px] font-semibold text-ink" style={{ fontSize: 12 }}>
      {text} {optional && <Text className="font-normal text-muted">(선택)</Text>}
    </Text>
  )
}

/** 신청서와 같은 모양의 입력칸 */
export function Field({ multiline, className = '', style, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      multiline={multiline}
      className={`rounded-[12px] border border-[#dce3d8] bg-paper p-3 text-ink ${multiline ? 'min-h-[88px]' : ''} ${className}`}
      style={[multiline ? { textAlignVertical: 'top' } : null, style]}
      {...props}
    />
  )
}

/** 화면 아래 작은 안내 문구 */
export function Note({ children }: { children: string }) {
  return (
    <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
      {children}
    </Text>
  )
}

/** 내 위치에서의 거리 */
export function distanceLabel(m: number): string {
  if (m <= 0) return '내 위치'
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`
}
