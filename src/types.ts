export interface LocationPoint {
  lat: number
  lng: number
  timestamp: number
}

export interface Stay {
  id: string
  placeName: string
  lat: number
  lng: number
  startAt: number
  endAt: number
  durationMin: number
}

export interface Item {
  id: string
  name: string
  emoji: string
  createdAt: number
}

export type CheckStatus = '챙김' | '두고옴' | '미응답'

export interface CheckResponse {
  itemId: string
  status: CheckStatus
}

export interface CheckAlert {
  id: string
  fromStayId: string
  toStayId: string
  createdAt: number
  responses: CheckResponse[]
}

export interface NearLoss {
  id: string
  itemId: string
  stayId: string
  detectedAt: number
  recoveredAt: number | null
}
