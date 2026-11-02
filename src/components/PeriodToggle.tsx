export type Period = 'day' | 'week' | 'month'

const options: { value: Period; label: string }[] = [
  { value: 'day', label: '하루' },
  { value: 'week', label: '일주일' },
  { value: 'month', label: '한 달' },
]

interface PeriodToggleProps {
  value: Period
  onChange: (period: Period) => void
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div role="tablist" className="flex rounded-full bg-peach/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-full py-2 text-sm transition ${
            value === opt.value ? 'bg-white font-semibold text-coral-deep shadow-sm' : 'text-ink-soft'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
