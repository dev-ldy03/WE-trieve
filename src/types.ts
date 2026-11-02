export interface LocationPoint {
  lat: number
  lng: number
  timestamp: number
}

/** 휴대폰 활동 인식: 걷기 시작 / 멈춤 */
export interface ActivityEvent {
  type: '걷기' | '정지'
  timestamp: number
}

/** 장소(건물) 안에서 한자리에 머문 구간 */
export interface Spot {
  id: string
  stayId: string
  name: string
  startAt: number
  endAt: number
  durationMin: number
}

export interface Stay {
  id: string
  placeName: string
  lat: number
  lng: number
  startAt: number
  endAt: number
  durationMin: number
  spots: Spot[]
}

export type ItemKind = 'wallet' | 'buds' | 'keys' | 'charger'

export interface Item {
  id: string
  name: string
  kind: ItemKind
  createdAt: number
  /** 재구매 지원 대상 */
  protected: boolean
}

export type CheckStatus = '챙김' | '두고옴' | '미응답'
export type CheckTrigger = '장소이동' | '자리이동'

export interface CheckResponse {
  itemId: string
  status: CheckStatus
}

export interface CheckAlert {
  id: string
  trigger: CheckTrigger
  /** 장소이동이면 Stay id, 자리이동이면 Spot id */
  fromId: string
  toId: string
  createdAt: number
  responses: CheckResponse[]
}

export interface NearLoss {
  id: string
  itemId: string
  stayId: string
  spotId: string | null
  detectedAt: number
  recoveredAt: number | null
}
