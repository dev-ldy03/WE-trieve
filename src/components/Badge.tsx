import { Text, View } from 'react-native'

export type BadgeTone = 'mint' | 'rose' | 'butter' | 'coral' | 'neutral'

const toneClass: Record<BadgeTone, { box: string; text: string }> = {
  mint: { box: 'bg-mint', text: 'text-mint-deep' },
  rose: { box: 'bg-rose', text: 'text-rose-deep' },
  butter: { box: 'bg-butter', text: 'text-ink' },
  coral: { box: 'bg-peach', text: 'text-coral-deep' },
  neutral: { box: 'bg-cream border border-peach', text: 'text-ink-soft' },
}

export default function Badge({ tone = 'neutral', label }: { tone?: BadgeTone; label: string }) {
  const { box, text } = toneClass[tone]
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${box}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  )
}
