import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenProps {
  children: ReactNode
  /** 상단 safe area 여백 — 스택 헤더가 있는 화면은 false */
  safeTop?: boolean
}

/** 화면 공통 틀: 크림색 배경, 좌우 여백, 세로 스크롤 */
export default function Screen({ children, safeTop = true }: ScreenProps) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ paddingTop: safeTop ? insets.top + 16 : 16, paddingBottom: 32 }}
      contentContainerClassName="gap-4 px-5"
    >
      {children}
    </ScrollView>
  )
}
