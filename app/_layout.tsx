import '../global.css'

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AppHeader from '@/components/AppHeader'
import Banner from '@/components/Banner'
import CheckSheet from '@/components/CheckSheet'
import WebPhoneFrame from '@/components/WebPhoneFrame'
import { AppProvider } from '@/context/AppContext'
import colors from '@/theme/colors.json'

export default function RootLayout() {
  return (
    <AppProvider>
      <WebPhoneFrame>
        <StatusBar style="dark" />
        <AppHeader />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
        <Banner />
        <CheckSheet />
      </WebPhoneFrame>
    </AppProvider>
  )
}
