import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import colors from '@/theme/colors.json'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
}

const tabs = [
  { name: 'index', title: '지도', emoji: '🗺️' },
  { name: 'items', title: '내 물건', emoji: '🎒' },
  { name: 'alerts', title: '알림 기록', emoji: '🔔' },
  { name: 'my', title: '마이페이지', emoji: '🙂' },
]

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream },
        tabBarActiveTintColor: colors.coralDeep,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: colors.peach },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => <TabIcon emoji={tab.emoji} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  )
}
