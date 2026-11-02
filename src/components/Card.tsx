import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  const base = `rounded-3xl bg-white p-4 shadow-[0_4px_16px_rgba(224,122,95,0.08)] ${className}`
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} block w-full text-left transition active:scale-[0.98]`}
      >
        {children}
      </button>
    )
  }
  return <div className={base}>{children}</div>
}
