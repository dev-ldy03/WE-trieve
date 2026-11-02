import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] animate-fade-in bg-ink/30">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 left-1/2 max-h-[85dvh] w-full max-w-[430px] -translate-x-1/2 animate-sheet-up overflow-y-auto rounded-t-3xl bg-cream px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-peach" />
        <h2 className="mb-4 text-lg leading-snug font-bold whitespace-pre-line">{title}</h2>
        {children}
      </div>
    </div>
  )
}
