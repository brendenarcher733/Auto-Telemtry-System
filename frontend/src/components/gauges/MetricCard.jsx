// MetricCard — the core telemetry display primitive
import clsx from 'clsx'

const STATUS_CONFIG = {
  normal:   { border: 'border-white/8',                  text: 'text-cyan-400',  glow: '' },
  warning:  { border: 'border-amber-400/30',              text: 'text-amber-400', glow: 'glow-amber' },
  critical: { border: 'border-red-500/40',                text: 'text-red-400',   glow: 'glow-red' },
  inactive: { border: 'border-white/5',                   text: 'text-slate-500', glow: '' },
}

export function MetricCard({ label, value, unit = '', status = 'normal', icon, small = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal
  return (
    <div className={clsx(
      'card p-3 flex flex-col gap-1 transition-all duration-300',
      cfg.border, cfg.glow, 'border'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{label}</span>
        {icon && <span className="text-sm opacity-60">{icon}</span>}
        {status !== 'normal' && (
          <span className={clsx('text-[9px] font-mono font-bold px-1.5 py-0.5 rounded',
            status === 'critical' ? 'sev-critical' : 'sev-warning')}>
            {status.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={clsx('font-mono font-bold leading-none', cfg.text, small ? 'text-xl' : 'text-2xl')}>
          {value ?? '—'}
        </span>
        {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
      </div>
    </div>
  )
}
