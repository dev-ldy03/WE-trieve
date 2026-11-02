import { Text } from 'react-native'
import Screen from '@/components/Screen'

export default function Alerts() {
  return (
    <Screen>
      <Text className="text-xl font-bold text-ink">알림 기록</Text>
      <Text className="text-sm text-ink-soft">그동안 챙김 확인 알림을 여기 모아둘게요.</Text>
    </Screen>
  )
}
