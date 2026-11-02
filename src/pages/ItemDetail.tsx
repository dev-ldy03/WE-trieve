import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../components/Badge.tsx'
import Card from '../components/Card.tsx'
import { useApp } from '../context/AppContext.tsx'
import { formatDate, formatDateTime, formatTime, josa } from '../lib/format.ts'
import { findLastCheck, predictLostPlace } from '../lib/predict.ts'

const DAY = 24 * 60 * 60 * 1000

export default function ItemDetail() {
  const { id } = useParams()
  const { items, alerts, nearLosses, stays, stayById, now, markRecovered } = useApp()
  const [showPrediction, setShowPrediction] = useState(false)
  const item = items.find((i) => i.id === id)

  const lastCheck = item && findLastCheck(item.id, alerts)
  const lastCheckPlace = lastCheck && stayById.get(lastCheck.fromStayId)

  const history = useMemo(
    () =>
      nearLosses
        .filter((nl) => nl.itemId === id)
        .sort((a, b) => b.detectedAt - a.detectedAt),
    [nearLosses, id],
  )

  const predictions = useMemo(() => {
    if (!item) return []
    // 챙김 확인 기록이 없으면 최근 하루를 본다
    const since = lastCheck?.createdAt ?? now - DAY
    return predictLostPlace(item, stays, nearLosses, since)
  }, [item, lastCheck, stays, nearLosses, now])

  if (!item) {
    return (
      <section className="space-y-4 pt-10 text-center">
        <p className="text-4xl">🫧</p>
        <p className="text-sm text-ink-soft">이 물건을 찾을 수 없어요.</p>
        <Link to="/items" className="inline-block text-sm font-semibold text-coral-deep">
          내 물건으로 돌아가기
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <Link to="/items" className="text-sm text-ink-soft">
        ‹ 내 물건
      </Link>

      <header className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
          {item.emoji}
        </span>
        <div>
          <h1 className="text-xl font-bold">{item.name}</h1>
          <p className="text-xs text-ink-soft">{formatDate(item.createdAt)}부터 함께하고 있어요</p>
        </div>
      </header>

      <Card>
        <p className="text-xs text-ink-soft">마지막으로 챙김을 확인한 곳</p>
        {lastCheck && lastCheckPlace ? (
          <>
            <p className="mt-1 font-semibold">{lastCheckPlace.placeName}에서 나올 때</p>
            <p className="text-sm text-ink-soft">{formatDateTime(lastCheck.createdAt)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm">아직 챙김 확인 기록이 없어요</p>
        )}
      </Card>

      <div>
        <button
          type="button"
          onClick={() => setShowPrediction((v) => !v)}
          className="w-full rounded-full bg-coral-deep py-3.5 font-semibold text-white shadow-md transition active:scale-[0.98]"
        >
          🔮 어디에 두고 왔을까?
        </button>
        {showPrediction && (
          <Card className="mt-3 animate-pop-in space-y-4">
            <p className="text-xs text-ink-soft">
              마지막으로 챙긴 뒤 머문 곳들 중에서, 오래 머물렀고 예전에 깜빡한 적이 있는 곳일수록
              가능성이 높아요.
            </p>
            {predictions.length === 0 ? (
              <p className="text-sm">아직 짐작할 만한 기록이 부족해요.</p>
            ) : (
              <ol className="space-y-4">
                {predictions.map((p, i) => (
                  <li key={p.placeName}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold">
                        {i + 1}. {p.placeName}
                      </span>
                      <span className="text-lg font-bold text-coral-deep">{p.probability}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-coral transition-[width] duration-700"
                        style={{ width: `${p.probability}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{p.reason}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-bold">잃어버릴 뻔한 기록</h2>
        {history.length === 0 ? (
          <Card className="text-sm text-ink-soft">
            한 번도 두고 온 적이 없어요. 정말 잘 챙기고 있어요! 🌷
          </Card>
        ) : (
          <ul className="space-y-2">
            {history.map((nl) => {
              const stay = stayById.get(nl.stayId)
              return (
                <li key={nl.id}>
                  <Card className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{stay?.placeName ?? '알 수 없는 장소'}</p>
                      <p className="text-xs text-ink-soft">{formatDateTime(nl.detectedAt)}</p>
                    </div>
                    {nl.recoveredAt === null ? (
                      <button
                        type="button"
                        onClick={() => markRecovered(nl.id)}
                        className="shrink-0 rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-mint-deep"
                      >
                        찾았어요
                      </button>
                    ) : (
                      <Badge tone="mint">{formatTime(nl.recoveredAt)}에 찾음</Badge>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
        {history.length > 0 && (
          <p className="mt-2 text-center text-xs text-ink-soft">
            {josa(item.name, '을/를')} {history.length}번 두고 올 뻔했지만, 괜찮아요. 우리가 같이 챙길게요.
          </p>
        )}
      </div>
    </section>
  )
}
