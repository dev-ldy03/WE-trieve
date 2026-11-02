import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import colors from '@/theme/colors.json'
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
import './LeafletMap.css'

/**
 * 웹용 지도 본체: react-native-maps 대신 Leaflet(OpenStreetMap)으로 같은 표시를 그린다.
 * 경로 선·이모지 핀·이동 애니메이션·두고 온 곳 원의 크기와 색은 MapView.tsx와 맞춘다.
 * MapView.web.tsx가 브라우저에서만 불러온다.
 */

const SINCHON: [number, number] = [37.5585, 126.9375]

// OpenStreetMap 공식 서버는 출처(Referer)가 없는 요청을 막는데, Chrome은 파일(file://)로 연 페이지에서
// 출처를 보내지 않는다. 공유용 HTML을 파일로 열었을 때는 출처 없이도 받아 주는 독일 OSM 서버를 쓴다.
const TILE_URL =
  typeof location !== 'undefined' && location.protocol === 'file:'
    ? 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const EDGE_PADDING: [number, number] = [48, 48]

const iconCache = new Map<string, L.DivIcon>()

/** 앱의 Pin과 같은 모양: 파란 원, 흰 테두리, 흰 글자(선택하면 진한 파랑·조금 크게) */
function pinIcon(label: string, size: number, active = false) {
  const key = `${label}-${size}-${active}`
  let icon = iconCache.get(key)
  if (!icon) {
    const d = active ? size + 6 : size
    icon = L.divIcon({
      className: 'wt-pin',
      html: `<div class="wt-pin-face" style="width:${d}px;height:${d}px;border:3px solid #fff;background:${active ? MAP_PIN_ACTIVE : MAP_PIN};color:#fff;font-size:11px;font-weight:700;box-shadow:0 2px 7px rgba(0,0,0,.13)">${label}</div>`,
      iconSize: [d, d],
      iconAnchor: [d / 2, d / 2],
    })
    iconCache.set(key, icon)
  }
  return icon
}

const walkerIcon = L.divIcon({
  className: 'wt-pin',
  html: `<div class="wt-pin-face" style="width:38px;height:38px;border:3px solid ${MAP_PIN_ACTIVE};font-size:18px">🚶</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

/** 앱과 같은 두고 온 곳 표시: 화면 기준 고정 크기 분홍 원 */
const lostIcon = L.divIcon({
  className: 'wt-pin',
  html: `<div style="box-sizing:border-box;width:${LOST_MARK_SIZE}px;height:${LOST_MARK_SIZE}px;border-radius:9999px;background:${LOST_MARK_FILL};border:${LOST_MARK_BORDER_WIDTH}px solid ${LOST_MARK_BORDER}"></div>`,
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
  pinLabels,
  height = 340,
}: MapViewProps) {
  const line = useMemo(() => path.map((p) => [p.lat, p.lng] as [number, number]), [path])
  const places = useMemo(() => groupByPlace(stays), [stays])

  const fitCoords = useMemo(
    () => [
      ...line,
      ...stays.map((s) => [s.lat, s.lng] as [number, number]),
      ...frequentPlaces.map((p) => [p.lat, p.lng] as [number, number]),
      ...lostMarks.map((m) => [m.lat, m.lng] as [number, number]),
      ...(movingRoute ?? []).map((p) => [p.lat, p.lng] as [number, number]),
    ],
    [line, stays, frequentPlaces, lostMarks, movingRoute],
  )

  const moving = movingRoute && movingRoute.length > 1 ? partialRoute(movingRoute, movingProgress) : null
  const maxVisits = Math.max(1, ...frequentPlaces.map((p) => p.visits))

  return (
    <div
      className="wt-map"
      style={{
        height,
        borderRadius: 14,
        border: `1px solid ${colors.line}`,
        overflow: 'hidden',
        // Leaflet 내부 z-index가 배너·시트 위로 올라오지 않도록 쌓임 맥락을 가둔다
        isolation: 'isolate',
      }}
    >
      <MapContainer center={SINCHON} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={TILE_URL}
        />

        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: MAP_ROUTE, weight: 4, opacity: 1 }} />}

        {places.map(({ placeName, stay }, i) => (
          <Marker
            key={placeName}
            position={[stay.lat, stay.lng]}
            icon={pinIcon(pinLabels?.[placeName] ?? String(i + 1), 24, selectedPlace === placeName)}
            eventHandlers={{ click: () => onSelectPlace?.(placeName) }}
            title={placeName}
          />
        ))}

        {frequentPlaces.map((p) => (
          <Marker
            key={`freq-${p.placeName}`}
            position={[p.lat, p.lng]}
            icon={pinIcon(String(p.visits), 22 + Math.round((p.visits / maxVisits) * 18), selectedPlace === p.placeName)}
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
              pathOptions={{ color: MAP_TRAIL, weight: 5, dashArray: '2 8', lineCap: 'round' }}
            />
            <Marker
              position={[moving.position.latitude, moving.position.longitude]}
              icon={walkerIcon}
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
