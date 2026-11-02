import { Pressable, Text } from 'react-native'

/** 레퍼런스 .chip: 선택하면 옅은 파랑 */
export default function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      className={`rounded-[8px] border px-3.5 py-[7px] ${active ? 'border-accent-soft bg-accent-soft' : 'border-line bg-paper'}`}
    >
      <Text className={active ? 'text-accent' : 'text-ink'} style={{ fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  )
}
