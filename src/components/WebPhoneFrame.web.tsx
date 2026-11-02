import { useSyncExternalStore, type ReactNode } from 'react'
import { View } from 'react-native'
import colors from '@/theme/colors.json'
import { WEB_FRAME_WIDTH } from '@/theme/layout'

const subscribe = () => () => {}

/**
 * 웹에서 최대 너비 430px로 가운데 정렬해 휴대폰 화면처럼 보이게 한다.
 * 더미 데이터가 "지금" 시각으로 만들어지므로, 빌드할 때(정적 렌더링)는 틀만 그리고
 * 내용은 방문자의 브라우저에서 그린다.
 */
export default function WebPhoneFrame({ children }: { children: ReactNode }) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return (
    <View style={{ flex: 1, backgroundColor: colors.peach }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: WEB_FRAME_WIDTH,
          alignSelf: 'center',
          overflow: 'hidden',
          backgroundColor: colors.cream,
          boxShadow: '0 0 24px rgba(224, 122, 95, 0.18)',
        }}
      >
        {inBrowser ? children : null}
      </View>
    </View>
  )
}
