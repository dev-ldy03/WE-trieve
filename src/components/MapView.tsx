import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { findPlaceAt } from '../data/places.ts'
import { formatDuration, formatTime } from '../lib/format.ts'
import type { LocationPoint, Stay } from '../types.ts'

const SINCHON_CENTER: [number, number] = [37.5585, 126.9375]
const ROUTE_COLOR = '#e07a5f'
const TRAIL_COLOR = '#d35f6f'

export interface LostSpot {
  stay: Stay
  items: { nearLossId: string; label: string }[]
}

interface MapViewProps {
  /** 선으로 이을 이동 경로 */
  path?: LocationPoint[]
  /** 마커를 찍을 체류 장소 */
  stays?: Stay[]
  /** 이동 시뮬레이션 경로와 진행률(0~1) */
  movingRoute?: LocationPoint[]
  movingProgress?: number
  /** 물건을 두고 와서 강조할 장소 */
  lostSpots?: LostSpot[]
  onRecover?: (nearLossId: string) => void
  className?: string
}

const iconCache = new Map<string, L.DivIcon>()

function stayIcon(emoji: string) {
  let icon = iconCache.get(emoji)
  if (!icon) {
    icon = L.divIcon({
      className: 'stay-marker',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#fff;border:2px solid ${ROUTE_COLOR};box-shadow:0 2px 6px rgb(0 0 0 / 0.15);font-size:18px">${emoji}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    })
    iconCache.set(emoji, icon)
  }
  return icon
}

const walkerIcon = L.divIcon({
  className: 'stay-marker',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:9999px;background:#fff;border:3px solid ${TRAIL_COLOR};box-shadow:0 2px 8px rgb(0 0 0 / 0.2);font-size:22px">🚶</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
})

const lostIcon = L.divIcon({
  className: 'stay-marker',
  html: '<div class="lost-spot">🧸</div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
})

/** 경로를 따라 진행률만큼 간 지점까지의 선과 현재 위치 */
function partialRoute(route: LocationPoint[], progress: number) {
  const start = route[0].timestamp
  const t = start + (route[route.length - 1].timestamp - start) * progress
  const trail: [number, number][] = [[route[0].lat, route[0].lng]]
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]
    const b = route[i]
    if (b.timestamp <= t) {
      trail.push([b.lat, b.lng])
      continue
    }
    const r = (t - a.timestamp) / (b.timestamp - a.timestamp)
    trail.push([a.lat + (b.lat - a.lat) * r, a.lng + (b.lng - a.lng) * r])
    break
  }
  return { trail, position: trail[trail.length - 1] }
}

/** 경로와 마커가 모두 보이도록 화면을 맞춘다 */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    map.fitBounds(L.latLngBounds(coords), { padding: [36, 36], maxZoom: 17 })
  }, [map, coords])
  return null
}

export default function MapView({
  path = [],
  stays = [],
  movingRoute,
  movingProgress = 0,
  lostSpots = [],
  onRecover,
  className = '',
}: MapViewProps) {
  const line = useMemo(() => path.map((p) => [p.lat, p.lng] as [number, number]), [path])
  // 같은 장소에 여러 번 머물렀으면 마커 하나에 방문을 모두 보여준다
  const stayGroups = useMemo(() => {
    const groups = new Map<string, Stay[]>()
    for (const stay of stays) groups.set(stay.placeName, [...(groups.get(stay.placeName) ?? []), stay])
    return [...groups.values()]
  }, [stays])
  const coords = useMemo(
    () => [
      ...line,
      ...stays.map((s) => [s.lat, s.lng] as [number, number]),
      ...(movingRoute ?? []).map((p) => [p.lat, p.lng] as [number, number]),
    ],
    [line, stays, movingRoute],
  )
  const moving = movingRoute && movingRoute.length > 1 ? partialRoute(movingRoute, movingProgress) : null

  return (
    <div className={`isolate overflow-hidden rounded-3xl ring-1 ring-peach ${className}`}>
      <MapContainer center={SINCHON_CENTER} zoom={15} className="h-full w-full" preferCanvas>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {line.length > 1 && (
          <Polyline positions={line} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.8 }} />
        )}
        {stayGroups.map((group) => {
          const first = group[0]
          return (
            <Marker
              key={first.id}
              position={[first.lat, first.lng]}
              icon={stayIcon(findPlaceAt(first.lat, first.lng)?.emoji ?? '📍')}
            >
              <Popup autoPanPadding={[56, 40]}>
                <p className="text-sm font-bold">{first.placeName}</p>
                {group.map((stay) => (
                  <div key={stay.id} className="mt-1.5">
                    <p className="text-xs text-ink-soft">
                      {formatTime(stay.startAt)} ~ {formatTime(stay.endAt)}
                    </p>
                    <p className="text-xs text-coral-deep">
                      {formatDuration(stay.durationMin)} 머물렀어요
                    </p>
                  </div>
                ))}
              </Popup>
            </Marker>
          )
        })}
        {moving && (
          <>
            <Polyline
              positions={moving.trail}
              pathOptions={{ color: TRAIL_COLOR, weight: 5, dashArray: '2 8', lineCap: 'round' }}
            />
            <Marker position={moving.position} icon={walkerIcon} interactive={false} zIndexOffset={2000} />
          </>
        )}
        {lostSpots.map((spot) => (
          <Marker key={spot.stay.id} position={[spot.stay.lat, spot.stay.lng]} icon={lostIcon} zIndexOffset={1000}>
            <Popup autoPanPadding={[56, 40]}>
              <p className="text-sm font-bold">{spot.stay.placeName}</p>
              <p className="mt-0.5 text-xs text-ink-soft">여기에 두고 온 것 같아요. 아직 늦지 않았어요!</p>
              {spot.items.map((item) => (
                <div key={item.nearLossId} className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm">{item.label}</span>
                  {onRecover && (
                    <button
                      type="button"
                      onClick={() => onRecover(item.nearLossId)}
                      className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-mint-deep"
                    >
                      찾았어요
                    </button>
                  )}
                </div>
              ))}
            </Popup>
          </Marker>
        ))}
        <FitBounds coords={coords} />
      </MapContainer>
    </div>
  )
}
