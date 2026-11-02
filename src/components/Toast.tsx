import { useEffect } from 'react'
import { useApp } from '../context/AppContext.tsx'

const AUTO_DISMISS_MS = 6000

/** 상단 토스트. 알림과 연결된 토스트를 누르면 확인 시트가 열린다. */
export default function Toast() {
  const { toast, dismissToast, openSheet } = useApp()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismissToast, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null

  const handleClick = () => {
    if (toast.alertId) openSheet(toast.alertId)
    dismissToast()
  }

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-[1100] w-full max-w-[430px] -translate-x-1/2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <button
        key={toast.id}
        type="button"
        onClick={handleClick}
        className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-2xl bg-white/95 p-4 text-left shadow-lg ring-1 ring-peach backdrop-blur"
      >
        <span className="text-2xl">🧸</span>
        <span className="flex-1">
          <span className="block text-sm leading-snug font-semibold whitespace-pre-line">{toast.message}</span>
          {toast.alertId && (
            <span className="mt-1 block text-xs text-coral-deep">눌러서 확인하기 →</span>
          )}
        </span>
      </button>
    </div>
  )
}
