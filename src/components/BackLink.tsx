import { router } from 'expo-router'
import { Pressable, Text } from 'react-native'
import Icon from './Icon'

/** 레퍼런스의 "‹ 내 물건" 같은 뒤로 가기 줄 */
export default function BackLink({ label }: { label: string }) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      accessibilityRole="button"
      className="mb-4 flex-row items-center gap-1.5 self-start"
    >
      <Icon name="back" size={16} color="#728277" />
      <Text style={{ fontSize: 12, color: '#728277' }}>{label}</Text>
    </Pressable>
  )
}
