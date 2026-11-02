import { useApp } from '../context/AppContext.tsx'
import { formatDateTime, formatTime, josa } from '../lib/format.ts'
import type { CheckStatus } from '../types.ts'
import BottomSheet from './BottomSheet.tsx'

const choices: { status: CheckStatus; label: string; active: string }[] = [
  { status: '챙김', label: '챙겼어요', active: 'bg-mint text-mint-deep ring-mint-deep/40' },
  { status: '두고옴', label: '두고 왔어요', active: 'bg-rose text-rose-deep ring-rose-deep/40' },
]

/** 챙김 확인 시트 — 토스트나 알림 기록에서 연다 */
export default function CheckSheet() {
  const { alerts, items, nearLosses, stayById, openAlertId, closeSheet, respond, markRecovered } = useApp()
  const alert = alerts.find((a) => a.id === openAlertId)
  const from = alert && stayById.get(alert.fromStayId)
  const to = alert && stayById.get(alert.toStayId)
  if (!alert || !from || !to) return null

  const itemById = new Map(items.map((item) => [item.id, item]))
  const rows = alert.responses.flatMap((r) => {
    const item = itemById.get(r.itemId)
    return item ? [{ item, status: r.status }] : []
  })

  return (
    <BottomSheet
      open
      title={`${from.placeName}에서 나왔네요.\n다 챙겼는지 한 번만 볼까요?`}
      onClose={closeSheet}
    >
      <p className="-mt-2 mb-4 text-xs text-ink-soft">
        {formatDateTime(alert.createdAt)} · {to.placeName}에 도착
      </p>

      <ul className="space-y-3">
        {rows.map(({ item, status }) => {
          const nearLoss = nearLosses.find((nl) => nl.itemId === item.id && nl.stayId === from.id)
          return (
            <li key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="text-2xl">{item.emoji}</span>
                  {item.name}
                </span>
                <div className="flex gap-1.5">
                  {choices.map((choice) => (
                    <button
                      key={choice.status}
                      type="button"
                      onClick={() => respond(alert.id, item.id, choice.status)}
                      aria-pressed={status === choice.status}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        status === choice.status
                          ? `${choice.active} ring-1`
                          : 'bg-cream text-ink-soft'
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === '두고옴' && nearLoss && (
                <div
                  className={`mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
                    nearLoss.recoveredAt === null ? 'bg-rose/40' : 'bg-mint/40'
                  }`}
                >
                  {nearLoss.recoveredAt === null ? (
                    <>
                      <span className="text-rose-deep">
                        괜찮아요, 지도에 {josa(from.placeName, '을/를')} 표시해 뒀어요.
                      </span>
                      <button
                        type="button"
                        onClick={() => markRecovered(nearLoss.id)}
                        className="shrink-0 rounded-full bg-mint px-2.5 py-1 font-semibold text-mint-deep"
                      >
                        찾았어요
                      </button>
                    </>
                  ) : (
                    <span className="text-mint-deep">
                      {formatTime(nearLoss.recoveredAt)}에 다시 찾았어요. 다행이에요! 💚
                    </span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={closeSheet}
        className="mt-5 w-full rounded-full bg-coral-deep py-3 font-semibold text-white"
      >
        확인했어요
      </button>
    </BottomSheet>
  )
}
