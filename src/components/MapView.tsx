import { useEffect, useMemo, useRef } from 'react'
import { Text, View } from 'react-native'
import RNMapView, { Circle, Marker, Polyline } from 'react-native-maps'
import { findPlaceAt } from '@/data/places'
import colors from '@/theme/colors.json'
import { groupByPlace, partialRoute, type MapViewProps } from './mapTypes'

const SINCHON = { latitude: 37.5585, longitude: 126.9375, latitudeDelta: 0.014, longitudeDelta: 0.014 }
const EDGE = { top: 48, right: 48, bottom: 48, left: 48 }

function EmojiPin({ emoji, selected, size = 36 }: { emoji: string; selected?: boolean; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: selected ? 3 : 2,
        borderColor: selected ? colors.ink : colors.coralDeep,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
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
      ...(movingRoute ?? []).map((p) => ({ latitude: p.lat, longitude: p.lng })),
    ],
    [line, stays, frequentPlaces, movingRoute],
  )
  useEffect(() => {
    if (fitCoords.length === 0) return
    const timer = setTimeout(() => ref.current?.fitToCoordinates(fitCoords, { edgePadding: EDGE, animated: true }), 100)
    return () => clearTimeout(timer)
  }, [fitCoords])

  const moving = movingRoute && movingRoute.length > 1 ? partialRoute(movingRoute, movingProgress) : null
  const maxVisits = Math.max(1, ...frequentPlaces.map((p) => p.visits))

  return (
    <View style={{ height }} className="overflow-hidden rounded-3xl border border-peach">
      <RNMapView ref={ref} style={{ flex: 1 }} initialRegion={SINCHON} toolbarEnabled={false}>
        {line.length > 1 && <Polyline coordinates={line} strokeColor={colors.coralDeep} strokeWidth={4} />}

        {places.map(({ placeName, stay }) => (
          <Marker
            key={placeName}
            coordinate={{ latitude: stay.lat, longitude: stay.lng }}
            onPress={() => onSelectPlace?.(placeName)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <EmojiPin emoji={findPlaceAt(stay.lat, stay.lng)?.emoji ?? '📍'} selected={selectedPlace === placeName} />
          </Marker>
        ))}

        {frequentPlaces.map((p) => (
          <Marker
            key={`freq-${p.placeName}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            onPress={() => onSelectPlace?.(p.placeName)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <EmojiPin
              emoji={findPlaceAt(p.lat, p.lng)?.emoji ?? '📍'}
              selected={selectedPlace === p.placeName}
              size={30 + Math.round((p.visits / maxVisits) * 22)}
            />
          </Marker>
        ))}

        {lostMarks.map((mark) => (
          <Circle
            key={`lost-area-${mark.key}`}
            center={{ latitude: mark.lat, longitude: mark.lng }}
            radius={45}
            fillColor="rgba(211, 95, 111, 0.25)"
            strokeColor={colors.roseDeep}
            strokeWidth={2}
          />
        ))}

        {moving && (
          <>
            <Polyline coordinates={moving.trail} strokeColor={colors.roseDeep} strokeWidth={5} lineDashPattern={[2, 8]} />
            <Marker coordinate={moving.position} anchor={{ x: 0.5, y: 0.5 }} zIndex={10}>
              <EmojiPin emoji="🚶" size={40} />
            </Marker>
          </>
        )}
      </RNMapView>
    </View>
  )
}
