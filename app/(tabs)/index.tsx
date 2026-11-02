import { Text } from 'react-native'
import Screen from '@/components/Screen'

export default function MapHome() {
  return (
    <Screen>
      <Text className="text-xl font-bold text-ink">오늘의 동선</Text>
      <Text className="text-sm text-ink-soft">오늘 다녀온 곳을 지도에 그려드릴게요.</Text>
    </Screen>
  )
}
