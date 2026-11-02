import { useEffect, useState, type ComponentType } from 'react'
import { View } from 'react-native'
import type { MapViewProps } from './mapTypes'

/**
 * 웹용 MapView. Leaflet은 불러오는 순간 window를 쓰므로 정적 렌더링(Node)에서는 불러오지 않고,
 * 브라우저에서 처음 그릴 때 LeafletMap을 따로 불러온다.
 */
export default function MapView(props: MapViewProps) {
  const [LeafletMap, setLeafletMap] = useState<ComponentType<MapViewProps> | null>(null)

  useEffect(() => {
    let alive = true
    import('./LeafletMap').then((mod) => {
      if (alive) setLeafletMap(() => mod.default)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!LeafletMap) {
    return <View style={{ height: props.height ?? 340 }} className="rounded-3xl border border-peach bg-white" />
  }
  return <LeafletMap {...props} />
}
