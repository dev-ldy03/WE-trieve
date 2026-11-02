import { useMemo } from 'react'
import Badge, { type BadgeTone } from '../components/Badge.tsx'
import Card from '../components/Card.tsx'
import { useApp } from '../context/AppContext.tsx'
import { dateKey, formatDate, formatTime } from '../lib/format.ts'
import type { CheckAlert } from '../types.ts'

type Summary = { label: string; tone: BadgeTone }

/** 응답 결과 요약: 두고 온 게 하나라도 있으면 우선, 그다음 미응답 */
function summarize(alert: CheckAlert, itemIds: Set<string>): Summary {
  const statuses = alert.responses.filter((r) => itemIds.has(r.itemId)).map((r) => r.status)
  if (statuses.includes('두고옴')) return { label: '두고 옴 있음', tone: 'rose' }
  if (statuses.includes('미응답')) return { label: '미응답', tone: 'butter' }
  return { label: '전부 챙김', tone: 'mint' }
}

export default function Alerts() {
  const { alerts, items, stayById, openSheet } = useApp()

  const groups = useMemo(() => {
    const byDay = new Map<string, CheckAlert[]>()
    for (const alert of [...alerts].sort((a, b) => b.createdAt - a.createdAt)) {
      const key = dateKey(alert.createdAt)
      byDay.set(key, [...(byDay.get(key) ?? []), alert])
    }
    return [...byDay.values()]
  }, [alerts])

  const itemIds = new Set(items.map((item) => item.id))
  const itemById = new Map(items.map((item) => [item.id, item]))

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sm text-ink-soft">장소를 옮길 때마다 함께 챙겨봤어요</p>
        <h1 className="text-xl font-bold">알림 기록</h1>
      </header>

      {groups.length === 0 && (
        <Card className="py-10 text-center text-sm text-ink-soft">아직 받은 알림이 없어요.</Card>
      )}

      {groups.map((group) => (
        <div key={group[0].id}>
          <h2 className="mb-2 px-1 text-xs font-semibold text-ink-soft">{formatDate(group[0].createdAt)}</h2>
          <ul className="space-y-2">
            {group.map((alert) => {
              const from = stayById.get(alert.fromStayId)
              const to = stayById.get(alert.toStayId)
              const summary = summarize(alert, itemIds)
              const leftBehind = alert.responses
                .filter((r) => r.status === '두고옴')
                .flatMap((r) => itemById.get(r.itemId) ?? [])
              return (
                <li key={alert.id}>
                  <Card onClick={() => openSheet(alert.id)} className="flex items-center gap-3">
                    <span className="w-11 shrink-0 text-sm font-semibold text-ink-soft">
                      {formatTime(alert.createdAt)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {from?.placeName ?? '알 수 없는 장소'} → {to?.placeName ?? '알 수 없는 장소'}
                      </span>
                      {leftBehind.length > 0 && (
                        <span className="mt-0.5 block truncate text-xs text-rose-deep">
                          {leftBehind.map((item) => `${item.emoji} ${item.name}`).join(', ')}
                        </span>
                      )}
                    </span>
                    <Badge tone={summary.tone}>{summary.label}</Badge>
                  </Card>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
