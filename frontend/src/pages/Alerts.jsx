import { useState, useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { AlertPanel } from '../components/diagnostics/AlertPanel'
import { alertsApi } from '../services/api'

export default function Alerts() {
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => {
    alertsApi.list(null, 100).then(a => { setAlerts(a); setLoading(false) })
  }, [])

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter)
  const counts = { CRITICAL: 0, WARNING: 0, INFO: 0 }
  alerts.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1 })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Alert Center" subtitle={`${alerts.length} active alerts across fleet`} />
      <main className="flex-1 overflow-y-auto p-6">

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[['CRITICAL','text-red-400','border-red-500/20'],
            ['WARNING', 'text-amber-400','border-amber-400/20'],
            ['INFO',    'text-cyan-400', 'border-cyan-500/20']].map(([sev, cls, border]) => (
            <div key={sev} className={`card p-4 text-center border ${border}`}>
              <div className={`text-2xl font-bold font-mono ${cls}`}>{counts[sev] || 0}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">{sev}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {['ALL','CRITICAL','WARNING','INFO'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded font-mono border transition-all ${
                filter === f ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'text-slate-500 border-white/5 hover:text-white'
              }`}>{f}</button>
          ))}
        </div>

        <div className="card p-4">
          {loading
            ? <div className="text-center py-8 text-slate-600 font-mono text-sm">Loading alerts...</div>
            : <AlertPanel alerts={filtered} onResolve={id => setAlerts(prev => prev.filter(a => a.id !== id))} />
          }
        </div>
      </main>
    </div>
  )
}
