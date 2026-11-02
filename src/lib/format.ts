const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const pad = (n: number) => String(n).padStart(2, '0')

/** 14:05 */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 11월 2일 (월) */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

/** 11월 2일 (월) 14:05 */
export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} ${formatTime(ts)}`
}

/** 1시간 20분 */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

/** 850m / 1.2km */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/** 0(일) → '일요일' */
export function weekdayName(day: number): string {
  return `${WEEKDAYS[day]}요일`
}

/** 시각을 오전/점심/오후/저녁/밤 시간대로 */
export function timeOfDay(ts: number): string {
  const h = new Date(ts).getHours()
  if (h < 11) return '오전'
  if (h < 14) return '점심'
  if (h < 18) return '오후'
  if (h < 21) return '저녁'
  return '밤'
}

/** 로컬 날짜 키 'YYYY-MM-DD' */
export function dateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 해당 시각이 속한 날의 0시 */
export function startOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
