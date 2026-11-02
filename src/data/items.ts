import type { Item, ItemKind } from '../types'

const registeredAt = Date.now() - 40 * 24 * 60 * 60 * 1000

export const initialItems: Item[] = [
  { id: 'wallet', name: '내 지갑', kind: 'wallet', createdAt: registeredAt, protected: true },
  { id: 'airpods', name: '에어팟', kind: 'buds', createdAt: registeredAt, protected: true },
  { id: 'keys', name: '집 열쇠', kind: 'keys', createdAt: registeredAt, protected: false },
  { id: 'charger', name: '충전기', kind: 'charger', createdAt: registeredAt, protected: false },
]

export const ITEM_KINDS: { kind: ItemKind; label: string }[] = [
  { kind: 'wallet', label: '지갑' },
  { kind: 'buds', label: '이어폰' },
  { kind: 'keys', label: '열쇠' },
  { kind: 'charger', label: '충전기' },
]
