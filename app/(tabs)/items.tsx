import { Text } from 'react-native'
import Screen from '@/components/Screen'

export default function Items() {
  return (
    <Screen>
      <Text className="text-xl font-bold text-ink">내 물건</Text>
      <Text className="text-sm text-ink-soft">늘 챙기는 소중한 물건들을 모아둘게요.</Text>
    </Screen>
  )
}
