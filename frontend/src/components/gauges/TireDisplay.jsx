// TireDisplay — 4-corner tire pressure visual
import clsx from 'clsx'

function TireCell({ label, psi, pos }) {
  const status = psi < 22 ? 'critical' : psi < 26 ? 'warning' : 'ok'
  const color  = status === 'critical' ? 'text-red-400 border-red-500/40' :
                 status === 'warning'  ? 'text-amber-400 border-amber-400/30' :
                 'text-cyan-400 border-cyan-500/20'

  return (
    <div className={clsx('flex flex-col items-center gap-1 p-2 rounded-lg bg-[#111422] border', color)}>
      <span className="text-[9px] font-mono text-slate-500">{label}</span>
      <span className={clsx('text-lg font-mono font-bold', color.split(' ')[0])}>
        {psi?.toFixed(1) ?? '—'}
      </span>
      <span className="text-[9px] text-slate-500 font-mono">PSI</span>
      {status !== 'ok' && (
        <span className={clsx('text-[8px] font-bold font-mono px-1 rounded',
          status === 'critical' ? 'sev-critical' : 'sev-warning')}>
          {status.toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function TireDisplay({ fl, fr, rl, rr }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">Tire Pressure</div>
      <div className="relative">
        {/* Car silhouette */}
        <div className="grid grid-cols-2 gap-2">
          <TireCell label="F-LEFT"  psi={fl} />
          <TireCell label="F-RIGHT" psi={fr} />
          <TireCell label="R-LEFT"  psi={rl} />
          <TireCell label="R-RIGHT" psi={rr} />
        </div>
      </div>
    </div>
  )
}
