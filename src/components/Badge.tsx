import type { ReactNode } from 'react'

export type BadgeTone = 'mint' | 'rose' | 'butter' | 'coral' | 'neutral'

const toneClass: Record<BadgeTone, string> = {
  mint: 'bg-mint text-mint-deep',
  rose: 'bg-rose text-rose-deep',
  butter: 'bg-butter text-ink',
  coral: 'bg-peach text-coral-deep',
  neutral: 'bg-cream text-ink-soft ring-1 ring-peach',
}

export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  )
}
