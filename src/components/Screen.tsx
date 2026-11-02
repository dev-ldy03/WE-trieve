import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'

/** 화면 공통 틀: 흰 바탕, 좌우 24px 여백, 세로 스크롤 (헤더는 루트 레이아웃이 그린다) */
export default function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{ paddingTop: 18, paddingBottom: 40 }}
      contentContainerClassName="px-6"
    >
      {children}
    </ScrollView>
  )
}
