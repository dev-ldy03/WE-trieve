import '../global.css'

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Banner from '@/components/Banner'
import CheckSheet from '@/components/CheckSheet'
import { AppProvider } from '@/context/AppContext'
import colors from '@/theme/colors.json'

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.cream },
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.coralDeep,
          headerTitleStyle: { color: colors.ink },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="items/[id]" options={{ title: '물건 상세', headerBackTitle: '내 물건' }} />
      </Stack>
      <Banner />
      <CheckSheet />
    </AppProvider>
  )
}
