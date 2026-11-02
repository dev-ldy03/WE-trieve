import { useEffect, useMemo, useRef } from 'react'
import { Text, View } from 'react-native'
import RNMapView, { Marker, Polyline } from 'react-native-maps'
import {
  groupByPlace,
  LOST_MARK_BORDER,
  LOST_MARK_BORDER_WIDTH,
  LOST_MARK_FILL,
  LOST_MARK_SIZE,
  MAP_PIN,
  MAP_PIN_ACTIVE,
  MAP_ROUTE,
  MAP_TRAIL,
  partialRoute,
  type MapViewProps,
} from './mapTypes'

const SINCHON = { latitude: 37.5585, longitude: 126.9375, latitudeDelta: 0.014, longitudeDelta: 0.014 }
const EDGE = { top: 48, right: 48, bottom: 48, left: 48 }

/** 레퍼런스 동선 지도의 번호 핀: 파란 원, 흰 테두리, 흰 글자 */
function Pin({ label, active, size = 24 }: { label: string; active?: boolean; size?: number }) {
  const d = active ? size + 6 : size
  return (
    <View
      style={{
        width: d,
        height: d,
        borderRadius: d / 2,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: active ? MAP_PIN_ACTIVE : MAP_PIN,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  )
}

export default function MapView({
  path = [],
  stays = [],
  frequentPlaces = [],
  movingRoute,
  movingProgress = 0,
  lostMarks = [],
  selectedPlace,
  onSelectPlace,
  pinLabels,
  height = 340,
}: MapViewProps) {
  const ref = useRef<RNMapView>(null)
  const line = useMemo(() => path.map((p) => ({ latitude: p.lat, longitude: p.lng })), [path])
  const places = useMemo(() => groupByPlace(stays), [stays])

  // 경로·마커·이동 경로가 모두 보이도록 화면을 맞춘다
  const fitCoords = useMemo(
    () => [
      ...line,
      ...stays.map((s) => ({ latitude: s.lat, longitude: s.lng })),
      ...frequentPlaces.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      ...lostMarks.map((m) => ({ latitude: m.lat, longitude: m.lng })),
      ...(movingRoute ?? []).map((p) => ({ latitude: p.lat, longitude: p.lng })),
    ],
    [line, stays, frequentPlaces, lostMarks, movingRoute],
  )
  useEffect(() => {
    if (fitCoords.length === 0) return
    const timer = setTimeout(() => ref.current?.fitToCoordinates(fitCoords, { edgePadding: EDGE, animated: true }), 100)
    return () => clearTimeout(timer)
  }, [fitCoords])

  const moving = movingRoute && movingRoute.length > 1 ? partialRoute(movingRoute, movingProgress) : null
  const maxVisits = Math.max(1, ...frequentPlaces.map((p) => p.visits))

  return (
    <View style={{ height }} className="overflow-hidden rounded-[14px] border border-line">
      <RNMapView ref={ref} style={{ flex: 1 }} initialRegion={SINCHON} toolbarEnabled={false}>
        {line.length > 1 && <Polyline coordinates={line} strokeColor={MAP_ROUTE} strokeWidth={4} />}

        {places.map(({ placeName, stay }, i) => (
          <Marker
            key={placeName}
            coordinate={{ latitude: stay.lat, longitude: stay.lng }}
            onPress={() => onSelectPlace?.(placeName)}
            anchor={{ x: 0.5, y: 0.5 }}
            title={placeName}
          >
            <Pin label={pinLabels?.[placeName] ?? String(i + 1)} active={selectedPlace === placeName} />
          </Marker>
        ))}

        {frequentPlaces.map((p) => (
          <Marker
            key={`freq-${p.placeName}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            onPress={() => onSelectPlace?.(p.placeName)}
            anchor={{ x: 0.5, y: 0.5 }}
            title={p.placeName}
          >
            <Pin label={String(p.visits)} active={selectedPlace === p.placeName} size={22 + Math.round((p.visits / maxVisits) * 18)} />
          </Marker>
        ))}

        {lostMarks.map((mark) => (
          <Marker
            key={`lost-${mark.key}`}
            coordinate={{ latitude: mark.lat, longitude: mark.lng }}
            onPress={() => onSelectPlace?.(mark.placeName)}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={5}
          >
            <View
              style={{
                width: LOST_MARK_SIZE,
                height: LOST_MARK_SIZE,
                borderRadius: LOST_MARK_SIZE / 2,
                backgroundColor: LOST_MARK_FILL,
                borderWidth: LOST_MARK_BORDER_WIDTH,
                borderColor: LOST_MARK_BORDER,
              }}
            />
          </Marker>
        ))}

        {moving && (
          <>
            <Polyline coordinates={moving.trail} strokeColor={MAP_TRAIL} strokeWidth={5} lineDashPattern={[2, 8]} />
            <Marker coordinate={moving.position} anchor={{ x: 0.5, y: 0.5 }} zIndex={10}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', borderWidth: 3, borderColor: MAP_PIN_ACTIVE, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🚶</Text>
              </View>
            </Marker>
          </>
        )}
      </RNMapView>
    </View>
  )
}
