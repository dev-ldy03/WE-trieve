import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon, { type IconName } from '@/components/Icon'
import colors from '@/theme/colors.json'

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: '홈', icon: 'home' },
  { name: 'find', title: '찾기', icon: 'search' },
  { name: 'support', title: '재구매 지원', icon: 'shield' },
  { name: 'my', title: '마이', icon: 'user' },
]

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      // 알림·물건 상세에서 뒤로 가면 직전 화면으로 돌아간다
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.navInactive,
        // 레퍼런스 탭 바처럼 아이콘·라벨 위아래로 여유를 둔다 (휴대폰 하단 안전 영역 포함)
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.lineSoft,
          height: 72 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ fontSize: 11, color: String(color), fontWeight: focused ? '700' : '400' }}>{tab.title}</Text>
            ),
            tabBarIcon: ({ focused, color }) => (
              <Icon name={tab.icon} color={String(color)} strokeWidth={focused ? 2.3 : 1.7} />
            ),
          }}
        />
      ))}
      {/* 탭 버튼 없이 탭 바를 유지한 채 여는 화면 (레퍼런스처럼 하단 메뉴가 계속 보인다).
          SDK 58의 href: null은 화면 자체를 막아 버리므로, 버튼만 숨긴다. */}
      <Tabs.Screen name="alerts" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="item/[id]" options={{ tabBarButton: () => null }} />
    </Tabs>
  )
}
