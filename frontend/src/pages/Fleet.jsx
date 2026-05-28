// pages/Fleet.jsx — Fleet overview dashboard
import { useState } from 'react'
import { VehicleCard } from '../components/fleet/VehicleCard'
import { Header } from '../components/layout/Header'
import { useFleet } from '../hooks/useFleet'

function StatBadge({ label, value, color = 'text-cyan-400' }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

export default function Fleet() {
  const { vehicles, alerts, loading, error, refetch } = useFleet(8000)
  const [filter, setFilter] = useState('all')

  const stats = {
    online:   vehicles.filter(v => v.status === 'online').length,
    offline:  vehicles.filter(v => v.status === 'offline').length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    warnings: alerts.filter(a => a.severity === 'WARNING').length,
  }

  const filtered = filter === 'all' ? vehicles :
    vehicles.filter(v => v.status === filter)

  const alertsByVehicle = alerts.reduce((acc, a) => {
    acc[a.vehicle_id] = (acc[a.vehicle_id] || 0) + 1; return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Fleet Overview" subtitle={`${vehicles.length} vehicles · ${alerts.length} active alerts`} />
      <main className="flex-1 overflow-y-auto p-6">

        {/* Fleet stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatBadge label="Online"   value={stats.online}   color="text-green-400" />
          <StatBadge label="Offline"  value={stats.offline}  color="text-slate-400" />
          <StatBadge label="Critical" value={stats.critical} color="text-red-400" />
          <StatBadge label="Warnings" value={stats.warnings} color="text-amber-400" />
        </div>

        {/* Filter + refresh */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {['all','online','offline','maintenance'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-500 hover:text-white border border-white/5'
                }`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={refetch} className="text-xs text-slate-500 hover:text-cyan-400 font-mono transition-colors">
            ↻ REFRESH
          </button>
        </div>

        {/* Loading / error */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 h-48 animate-pulse bg-white/3" />
            ))}
          </div>
        )}

        {error && (
          <div className="card p-6 text-center border-red-500/20">
            <div className="text-red-400 text-sm font-mono">{error}</div>
            <div className="text-slate-600 text-xs mt-1">Check that the backend is running on port 8000</div>
          </div>
        )}

        {/* Vehicle grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <VehicleCard key={v.id} vehicle={v} alertCount={alertsByVehicle[v.id] || 0} />
            ))}
            {!filtered.length && (
              <div className="col-span-3 text-center py-16 text-slate-600 text-sm font-mono">
                No vehicles match the current filter.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
