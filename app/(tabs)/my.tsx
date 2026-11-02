import { Text } from 'react-native'
import Screen from '@/components/Screen'

export default function MyPage() {
  return (
    <Screen>
      <Text className="text-xl font-bold text-ink">마이페이지</Text>
      <Text className="text-sm text-ink-soft">나의 동선과 깜빡 패턴을 함께 살펴봐요.</Text>
    </Screen>
  )
}
