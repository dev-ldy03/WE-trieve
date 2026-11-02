import { Pressable, Text, View } from 'react-native'
import type { Period } from '@/lib/analytics'

const options: { value: Period; label: string }[] = [
  { value: 'day', label: '하루' },
  { value: 'week', label: '일주일' },
  { value: 'month', label: '한 달' },
]

interface PeriodToggleProps {
  value: Period
  onChange: (period: Period) => void
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <View className="flex-row rounded-full bg-peach/60 p-1" accessibilityRole="tablist">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 items-center rounded-full py-2 ${selected ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm ${selected ? 'font-semibold text-coral-deep' : 'text-ink-soft'}`}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
