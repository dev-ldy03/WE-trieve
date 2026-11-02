import { Text, View } from 'react-native'

export type BadgeTone = 'ok' | 'warn' | 'accent' | 'neutral'

const toneClass: Record<BadgeTone, { box: string; text: string }> = {
  ok: { box: 'bg-ok-soft', text: 'text-ok-text' },
  warn: { box: 'bg-warn-soft', text: 'text-warn-text' },
  accent: { box: 'bg-accent-soft', text: 'text-accent' },
  neutral: { box: 'bg-surface', text: 'text-muted' },
}

/** 레퍼런스 .pill: 작은 둥근 사각 라벨 */
export default function Badge({ tone = 'ok', label }: { tone?: BadgeTone; label: string }) {
  const { box, text } = toneClass[tone]
  return (
    <View className={`self-start rounded-[5px] px-[9px] py-1 ${box}`}>
      <Text className={text} style={{ fontSize: 11 }}>
        {label}
      </Text>
    </View>
  )
}
