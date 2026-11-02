import { useSyncExternalStore, type ComponentType } from 'react'
import { View } from 'react-native'
import type { MapViewProps } from './mapTypes'

const subscribe = () => () => {}

/**
 * 웹용 MapView. Leaflet은 불러오는 순간 window를 쓰므로 정적 렌더링(Node)에서는 불러오지 않고,
 * 브라우저에서 그릴 때만 LeafletMap을 불러온다.
 * 동적 import 대신 require를 써서 별도 조각 파일 없이 한 번들에 담는다 (HTML 한 파일 공유용).
 */
export default function MapView(props: MapViewProps) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  if (!inBrowser) {
    return <View style={{ height: props.height ?? 340 }} className="rounded-[14px] border border-line bg-surface" />
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LeafletMap: ComponentType<MapViewProps> = require('./LeafletMap').default
  return <LeafletMap {...props} />
}
