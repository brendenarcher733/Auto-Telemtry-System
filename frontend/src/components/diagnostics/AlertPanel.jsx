// AlertPanel — Alert feed with severity indicators and resolve action
import { useState } from 'react'
import clsx from 'clsx'
import { alertsApi } from '../../services/api'

const SEV_CONFIG = {
  CRITICAL: { cls: 'sev-critical', icon: '🔴', pulse: true },
  WARNING:  { cls: 'sev-warning',  icon: '🟡', pulse: false },
  INFO:     { cls: 'sev-info',     icon: '🔵', pulse: false },
}

export function AlertPanel({ alerts = [], onResolve }) {
  const [resolving, setResolving] = useState(null)

  async function handleResolve(id) {
    setResolving(id)
    try {
      await alertsApi.resolve(id)
      onResolve?.(id)
    } finally {
      setResolving(null)
    }
  }

  if (!alerts.length) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <span className="text-2xl">✅</span>
      <span className="text-sm text-slate-400">No active alerts</span>
      <span className="text-xs text-slate-600">All systems nominal</span>
    </div>
  )

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.INFO
        return (
          <div key={alert.id}
            className={clsx('rounded-lg p-3 border text-xs transition-all', cfg.cls)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className={clsx('flex-shrink-0 mt-0.5', cfg.pulse && 'animate-blink')}>{cfg.icon}</span>
                <div>
                  <div className="font-mono font-bold text-[11px] mb-0.5">{alert.code}</div>
                  <div className="text-[11px] opacity-90 mb-1">{alert.title}</div>
                  <div className="text-[10px] opacity-70 leading-relaxed">{alert.description}</div>
                  <div className="text-[10px] opacity-50 mt-1 font-mono">
                    {new Date(alert.created_at).toLocaleTimeString()} · Vehicle #{alert.vehicle_id}
                  </div>
                </div>
              </div>
              <button onClick={() => handleResolve(alert.id)} disabled={resolving === alert.id}
                className="flex-shrink-0 text-[10px] px-2 py-1 rounded border border-white/10 bg-black/20 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono whitespace-nowrap">
                {resolving === alert.id ? '...' : 'RESOLVE'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
