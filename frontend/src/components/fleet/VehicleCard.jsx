// VehicleCard — Fleet overview card for each vehicle
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const TYPE_ICONS = {
  sports: '🏎️', sedan: '🚗', suv: '🚙', truck: '🛻', ev: '⚡', formula: '🏁'
}

function HealthBar({ score }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }} />
      </div>
      <span className={clsx('text-[11px] font-mono font-bold',
        score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400')}>
        {score}
      </span>
    </div>
  )
}

export function VehicleCard({ vehicle, alertCount = 0 }) {
  const STATUS_DOT = {
    online: 'dot-online', offline: 'dot-offline',
    maintenance: 'dot-maintenance', error: 'dot-error'
  }

  return (
    <Link to={`/vehicle/${vehicle.id}`}
      className="card p-4 flex flex-col gap-3 hover:border-cyan-500/30 hover:shadow-lg transition-all duration-200 group block">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TYPE_ICONS[vehicle.vehicle_type] || '🚗'}</span>
          <div>
            <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {vehicle.name}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={clsx('w-2 h-2 rounded-full', STATUS_DOT[vehicle.status] || 'dot-offline')} />
          <span className="text-[10px] text-slate-500 font-mono capitalize">{vehicle.status}</span>
        </div>
      </div>

      {/* Health */}
      <div>
        <div className="text-[10px] text-slate-600 font-mono mb-1">VEHICLE HEALTH</div>
        <HealthBar score={vehicle.health_score} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['DRIVER', vehicle.driver?.split(' ')[0] || '—'],
          ['ALERTS', alertCount, alertCount > 0 ? 'text-red-400' : 'text-slate-400'],
          ['MILEAGE', `${(vehicle.odometer / 1000).toFixed(0)}k`],
        ].map(([l, v, cls]) => (
          <div key={l} className="bg-white/3 rounded p-1.5">
            <div className="text-[9px] text-slate-600 font-mono">{l}</div>
            <div className={clsx('text-xs font-mono font-bold', cls || 'text-slate-300')}>{v}</div>
          </div>
        ))}
      </div>

      {/* Location */}
      <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
        <span>📍</span> {vehicle.location_name}
      </div>
    </Link>
  )
}
