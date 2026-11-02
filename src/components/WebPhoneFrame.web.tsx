import { useSyncExternalStore, type ReactNode } from 'react'
import { useWindowDimensions, View } from 'react-native'
import colors from '@/theme/colors.json'
import { WEB_FRAME_WIDTH } from '@/theme/layout'

const subscribe = () => () => {}

// 레퍼런스처럼 넓은 화면에서는 가운데 앱 카드, 760px 이하에서는 화면을 꽉 채운다
const NARROW_MAX = 760
const CARD_MAX_HEIGHT = 940

/**
 * 웹에서 휴대폰 화면처럼 보이게 하는 틀.
 * 더미 데이터가 "지금" 시각으로 만들어지므로, 빌드할 때(정적 렌더링)는 틀만 그리고
 * 내용은 방문자의 브라우저에서 그린다.
 */
export default function WebPhoneFrame({ children }: { children: ReactNode }) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const { width, height } = useWindowDimensions()
  const narrow = inBrowser && width <= NARROW_MAX

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: narrow ? colors.paper : colors.backdrop,
        alignItems: 'center',
        justifyContent: 'center',
        padding: narrow ? 0 : 24,
      }}
    >
      <View
        style={
          narrow
            ? { flex: 1, width: '100%', maxWidth: 480, backgroundColor: colors.paper }
            : {
                width: WEB_FRAME_WIDTH,
                height: Math.max(600, Math.min(CARD_MAX_HEIGHT, height - 48)),
                backgroundColor: colors.paper,
                borderWidth: 1,
                borderColor: colors.frameBorder,
                borderRadius: 26,
                overflow: 'hidden',
                boxShadow: '0 10px 45px rgba(23, 36, 58, 0.04)',
              }
        }
      >
        {inBrowser ? children : null}
      </View>
    </View>
  )
}
