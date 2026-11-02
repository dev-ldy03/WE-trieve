import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge.tsx'
import Card from '../components/Card.tsx'
import Modal from '../components/Modal.tsx'
import { useApp } from '../context/AppContext.tsx'
import { formatDateTime } from '../lib/format.ts'
import { findLastCheck } from '../lib/predict.ts'

const EMOJIS = ['🎧', '👛', '🧥', '☂️', '🔑', '📱', '💳', '🎒', '👓', '⌚', '💻', '📚', '🧢', '🧣', '🔋', '🖊️']

export default function Items() {
  const { items, alerts, nearLosses, stayById, addItem, removeItem } = useApp()
  const [adding, setAdding] = useState(false)

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-ink-soft">늘 함께 다니는 소중한 것들</p>
          <h1 className="text-xl font-bold">내 물건</h1>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full bg-coral-deep px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          + 물건 추가
        </button>
      </header>

      {items.length === 0 && (
        <Card className="py-10 text-center text-sm text-ink-soft">
          아직 등록한 물건이 없어요.
          <br />늘 챙기는 물건을 하나 추가해 볼까요?
        </Card>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const lastCheck = findLastCheck(item.id, alerts)
          const lastPlace = lastCheck && stayById.get(lastCheck.fromStayId)?.placeName
          const isLeftBehind = nearLosses.some((nl) => nl.itemId === item.id && nl.recoveredAt === null)
          return (
            <li key={item.id}>
              <Card className={`flex items-center gap-3 ${isLeftBehind ? 'ring-2 ring-rose-deep/40' : ''}`}>
                <Link to={`/items/${item.id}`} className="flex flex-1 items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-2xl">
                    {item.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      {item.name}
                      {isLeftBehind && <Badge tone="rose">두고 옴</Badge>}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {lastCheck && lastPlace
                        ? `마지막 챙김 · ${lastPlace} ${formatDateTime(lastCheck.createdAt)}`
                        : '아직 챙김 확인 기록이 없어요'}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`${item.name} 삭제`}
                  className="rounded-full px-2 py-1 text-xs text-ink-soft hover:bg-rose hover:text-rose-deep"
                >
                  삭제
                </button>
              </Card>
            </li>
          )
        })}
      </ul>

      <AddItemModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(name, emoji) => {
          addItem(name, emoji)
          setAdding(false)
        }}
      />
    </section>
  )
}

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string, emoji: string) => void
}

function AddItemModal({ open, onClose, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), emoji)
    setName('')
    setEmoji(EMOJIS[0])
  }

  return (
    <Modal open={open} title="물건 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="예: 학생증"
            autoFocus
            className="mt-1.5 w-full rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-peach outline-none focus:ring-2 focus:ring-coral"
          />
        </label>
        <div>
          <span className="text-sm font-semibold">이모지</span>
          <div className="mt-1.5 grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                className={`flex aspect-square items-center justify-center rounded-xl text-xl transition ${
                  emoji === e ? 'bg-peach ring-2 ring-coral' : 'bg-white'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-full bg-coral-deep py-3 font-semibold text-white disabled:bg-peach disabled:text-ink-soft"
        >
          등록할게요
        </button>
      </form>
    </Modal>
  )
}
