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
    <View className="flex-row rounded-[10px] bg-surface p-1" accessibilityRole="tablist">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 items-center rounded-[8px] py-2 ${selected ? 'bg-paper' : ''}`}
          >
            <Text className={`text-sm ${selected ? 'font-semibold text-accent' : 'text-muted'}`}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
