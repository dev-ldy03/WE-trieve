import { useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import Screen from '@/components/Screen'

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <Screen safeTop={false}>
      <Text className="text-xl font-bold text-ink">물건 상세</Text>
      <Text className="text-sm text-ink-soft">{id} 물건의 챙김 기록을 준비하고 있어요.</Text>
    </Screen>
  )
}
