import { Pressable, View } from 'react-native'

/** 레퍼런스 .toggle 스위치 */
export default function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className={`h-6 w-10 justify-center rounded-full px-[3px] ${value ? 'bg-accent' : 'bg-[#d9dfd8]'}`}
    >
      <View className="h-[18px] w-[18px] rounded-full bg-white" style={{ transform: [{ translateX: value ? 16 : 0 }] }} />
    </Pressable>
  )
}
