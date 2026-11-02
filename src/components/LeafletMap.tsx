import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { findPlaceAt } from '@/data/places'
import colors from '@/theme/colors.json'
import {
  groupByPlace,
  LOST_MARK_BORDER_WIDTH,
  LOST_MARK_FILL,
  LOST_MARK_SIZE,
  partialRoute,
  type MapViewProps,
} from './mapTypes'
import './LeafletMap.css'

/**
 * 웹용 지도 본체: react-native-maps 대신 Leaflet(OpenStreetMap)으로 같은 표시를 그린다.
 * 경로 선·이모지 핀·이동 애니메이션·두고 온 곳 원의 크기와 색은 MapView.tsx와 맞춘다.
 * MapView.web.tsx가 브라우저에서만 불러온다.
 */

const SINCHON: [number, number] = [37.5585, 126.9375]
const EDGE_PADDING: [number, number] = [48, 48]

const iconCache = new Map<string, L.DivIcon>()

/** 앱의 EmojiPin과 같은 모양: 흰 원, 코랄 테두리(선택하면 진한 테두리) */
function pinIcon(emoji: string, size: number, selected = false, border = colors.coralDeep) {
  const key = `${emoji}-${size}-${selected}-${border}`
  let icon = iconCache.get(key)
  if (!icon) {
    const borderWidth = selected ? 3 : 2
    const borderColor = selected ? colors.ink : border
    icon = L.divIcon({
      className: 'wt-pin',
      html: `<div class="wt-pin-face" style="width:${size}px;height:${size}px;border:${borderWidth}px solid ${borderColor};font-size:${size * 0.5}px">${emoji}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    iconCache.set(key, icon)
  }
  return icon
}

/** 앱과 같은 두고 온 곳 표시: 화면 기준 고정 크기 분홍 원 */
const lostIcon = L.divIcon({
  className: 'wt-pin',
  html: `<div style="box-sizing:border-box;width:${LOST_MARK_SIZE}px;height:${LOST_MARK_SIZE}px;border-radius:9999px;background:${LOST_MARK_FILL};border:${LOST_MARK_BORDER_WIDTH}px solid ${colors.roseDeep}"></div>`,
  iconSize: [LOST_MARK_SIZE, LOST_MARK_SIZE],
  iconAnchor: [LOST_MARK_SIZE / 2, LOST_MARK_SIZE / 2],
})

/** 경로·마커·이동 경로가 모두 보이도록 화면을 맞춘다 */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    const timer = setTimeout(() => map.fitBounds(L.latLngBounds(coords), { padding: EDGE_PADDING, maxZoom: 17 }), 100)
    return () => clearTimeout(timer)
  }, [map, coords])
  return null
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
  const line = useMemo(() => path.map((p) => [p.lat, p.lng] as [number, number]), [path])
  const places = useMemo(() => groupByPlace(stays), [stays])

  const fitCoords = useMemo(
    () => [
      ...line,
      ...stays.map((s) => [s.lat, s.lng] as [number, number]),
      ...frequentPlaces.map((p) => [p.lat, p.lng] as [number, number]),
      ...(movingRoute ?? []).map((p) => [p.lat, p.lng] as [number, number]),
    ],
    [line, stays, frequentPlaces, movingRoute],
  )

  const moving = movingRoute && movingRoute.length > 1 ? partialRoute(movingRoute, movingProgress) : null
  const maxVisits = Math.max(1, ...frequentPlaces.map((p) => p.visits))

  return (
    <div
      className="wt-map"
      style={{
        height,
        borderRadius: 24,
        border: `1px solid ${colors.peach}`,
        overflow: 'hidden',
        // Leaflet 내부 z-index가 배너·시트 위로 올라오지 않도록 쌓임 맥락을 가둔다
        isolation: 'isolate',
      }}
    >
      <MapContainer center={SINCHON} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: colors.coralDeep, weight: 4, opacity: 1 }} />}

        {places.map(({ placeName, stay }) => (
          <Marker
            key={placeName}
            position={[stay.lat, stay.lng]}
            icon={pinIcon(findPlaceAt(stay.lat, stay.lng)?.emoji ?? '📍', 36, selectedPlace === placeName)}
            eventHandlers={{ click: () => onSelectPlace?.(placeName) }}
            title={placeName}
          />
        ))}

        {frequentPlaces.map((p) => (
          <Marker
            key={`freq-${p.placeName}`}
            position={[p.lat, p.lng]}
            icon={pinIcon(
              findPlaceAt(p.lat, p.lng)?.emoji ?? '📍',
              30 + Math.round((p.visits / maxVisits) * 22),
              selectedPlace === p.placeName,
            )}
            eventHandlers={{ click: () => onSelectPlace?.(p.placeName) }}
            title={p.placeName}
          />
        ))}

        {lostMarks.map((mark) => (
          <Marker
            key={`lost-${mark.key}`}
            position={[mark.lat, mark.lng]}
            icon={lostIcon}
            zIndexOffset={500}
            eventHandlers={{ click: () => onSelectPlace?.(mark.placeName) }}
            title={`두고 온 곳: ${mark.label}`}
          />
        ))}

        {moving && (
          <>
            <Polyline
              positions={moving.trail.map((c) => [c.latitude, c.longitude] as [number, number])}
              pathOptions={{ color: colors.roseDeep, weight: 5, dashArray: '2 8', lineCap: 'round' }}
            />
            <Marker
              position={[moving.position.latitude, moving.position.longitude]}
              icon={pinIcon('🚶', 40)}
              interactive={false}
              zIndexOffset={1000}
            />
          </>
        )}

        <FitBounds coords={fitCoords} />
      </MapContainer>
    </div>
  )
}
