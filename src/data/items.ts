import type { Item } from '../types'

const registeredAt = Date.now() - 40 * 24 * 60 * 60 * 1000

export const initialItems: Item[] = [
  { id: 'airpods', name: '에어팟', emoji: '🎧', createdAt: registeredAt },
  { id: 'wallet', name: '지갑', emoji: '👛', createdAt: registeredAt },
  { id: 'cardigan', name: '가디건', emoji: '🧥', createdAt: registeredAt },
  { id: 'umbrella', name: '우산', emoji: '☂️', createdAt: registeredAt },
]
