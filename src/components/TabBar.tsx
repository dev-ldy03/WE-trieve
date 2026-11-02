import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/alerts', label: '알림', icon: '🔔' },
  { to: '/predict', label: 'AI 예측', icon: '🔮' },
  { to: '/report', label: '분실 신고', icon: '📝' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-peach bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  isActive ? 'font-semibold text-coral-deep' : 'text-ink-soft'
                }`
              }
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
