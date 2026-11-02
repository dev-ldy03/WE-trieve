import { useLocalSearchParams } from 'expo-router'
import BackLink from '@/components/BackLink'
import Screen from '@/components/Screen'
import Title from '@/components/Title'
import { useApp } from '@/context/AppContext'
import { initialItems } from '@/data/items'

/** 웹 정적 빌드에서 기본 물건 상세 페이지를 미리 만든다 (앱에는 영향 없음) */
export function generateStaticParams(): { id: string }[] {
  return initialItems.map((item) => ({ id: item.id }))
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { items } = useApp()
  const item = items.find((i) => i.id === id)
  return (
    <Screen>
      <BackLink label="내 물건" />
      <Title title={item?.name ?? '물건을 찾을 수 없어요'} sub="물건 상세는 다음 단계에서 채워져요." />
    </Screen>
  )
}
