import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const NAV = [
  { to: '/',        icon: '⊞', label: 'Fleet Overview' },
  { to: '/vehicle', icon: '◈', label: 'Live Telemetry' },
  { to: '/alerts',  icon: '⚠', label: 'Alerts' },
  { to: '/ai',      icon: '◉', label: 'AI Diagnostics' },
]

export function Sidebar({ alertCount = 0 }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 lg:w-56 bg-[#0d1018] border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="px-3 lg:px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            AT
          </div>
          <div className="hidden lg:block">
            <div className="text-xs font-bold text-white tracking-wide font-display">AutoTelemetry</div>
            <div className="text-[10px] text-slate-500 font-mono">PRO v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg transition-all duration-150 group',
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}>
            <span className="text-lg flex-shrink-0 w-5 text-center">{icon}</span>
            <span className="hidden lg:block text-sm font-medium">{label}</span>
            {label === 'Alerts' && alertCount > 0 && (
              <span className="hidden lg:flex ml-auto text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-1.5 py-0.5 font-mono">
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="p-3 border-t border-white/5">
        <div className="hidden lg:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full dot-online animate-blink flex-shrink-0" />
          <span className="text-[10px] text-slate-500 font-mono">LIVE · EST</span>
        </div>
      </div>
    </aside>
  )
}
