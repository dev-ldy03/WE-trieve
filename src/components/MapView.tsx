import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { findPlaceAt } from '../data/places.ts'
import { formatDuration, formatTime } from '../lib/format.ts'
import type { LocationPoint, Stay } from '../types.ts'

const SINCHON_CENTER: [number, number] = [37.5585, 126.9375]
const ROUTE_COLOR = '#e07a5f'

interface MapViewProps {
  /** 선으로 이을 이동 경로 */
  path?: LocationPoint[]
  /** 마커를 찍을 체류 장소 */
  stays?: Stay[]
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

/** 경로와 마커가 모두 보이도록 화면을 맞춘다 */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    map.fitBounds(L.latLngBounds(coords), { padding: [36, 36], maxZoom: 17 })
  }, [map, coords])
  return null
}

export default function MapView({ path = [], stays = [], className = '' }: MapViewProps) {
  const line = useMemo(() => path.map((p) => [p.lat, p.lng] as [number, number]), [path])
  // 같은 장소에 여러 번 머물렀으면 마커 하나에 방문을 모두 보여준다
  const stayGroups = useMemo(() => {
    const groups = new Map<string, Stay[]>()
    for (const stay of stays) groups.set(stay.placeName, [...(groups.get(stay.placeName) ?? []), stay])
    return [...groups.values()]
  }, [stays])
  const coords = useMemo(
    () => [...line, ...stays.map((s) => [s.lat, s.lng] as [number, number])],
    [line, stays],
  )

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
        <FitBounds coords={coords} />
      </MapContainer>
    </div>
  )
}
