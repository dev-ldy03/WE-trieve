import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useApp } from '@/context/AppContext'

/** 레퍼런스 .toast: 아래쪽 어두운 알림, 3.5초 뒤 사라진다 */
export default function Toast() {
  const { toast, showToast } = useApp()
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => showToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast, showToast])
  if (!toast?.message) return null
  return (
    <View pointerEvents="none" className="absolute bottom-24 left-0 right-0 items-center px-6" style={{ zIndex: 50, elevation: 50 }}>
      <View className="rounded-[14px] bg-ink px-5 py-3">
        <Text className="text-white" style={{ fontSize: 13 }}>
          {toast.message}
        </Text>
      </View>
    </View>
  )
}
