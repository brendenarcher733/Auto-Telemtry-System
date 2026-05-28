// pages/VehicleDashboard.jsx — Live telemetry dashboard for a single vehicle
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTelemetry } from '../hooks/useTelemetry'
import { useFleet }     from '../hooks/useFleet'
import { Header }       from '../components/layout/Header'
import { MetricCard }   from '../components/gauges/MetricCard'
import { ArcGauge }     from '../components/gauges/ArcGauge'
import { TireDisplay }  from '../components/gauges/TireDisplay'
import { TelemetryChart } from '../components/charts/TelemetryChart'
import { GForceChart }    from '../components/charts/GForceChart'
import { AlertPanel }     from '../components/diagnostics/AlertPanel'
import { alertsApi }      from '../services/api'
import clsx from 'clsx'

function getMetricStatus(key, value) {
  const rules = {
    coolant_temp_f:  [[235, 'critical'], [220, 'warning']],
    oil_temp_f:      [[265, 'critical'], [245, 'warning']],
    brake_temp_f:    [[400, 'critical'], [300, 'warning']],
    battery_voltage: [[11.8, 'critical', true], [12.2, 'warning', true]],
    fuel_pct:        [[8, 'critical', true], [15, 'warning', true]],
    rpm:             [[7200, 'critical'], [6500, 'warning']],
  }
  const r = rules[key]
  if (!r || value == null) return 'normal'
  for (const [thresh, sev, low] of r) {
    if (low ? value <= thresh : value >= thresh) return sev
  }
  return 'normal'
}

const CHART_SETS = [
  { label: 'Speed & Throttle',   metrics: ['speed_mph', 'throttle_pct', 'engine_load_pct'] },
  { label: 'Thermal',            metrics: ['coolant_temp_f', 'oil_temp_f', 'brake_temp_f'] },
  { label: 'RPM & Gear',         metrics: ['rpm'] },
  { label: 'Electrical & Fuel',  metrics: ['battery_voltage', 'fuel_pct'] },
]

export default function VehicleDashboard() {
  const { id } = useParams()
  const vehicleId = parseInt(id) || 1
  const { live, history, connected, alertCount } = useTelemetry(vehicleId)
  const { vehicles } = useFleet(30000)
  const [alerts, setAlerts]       = useState([])
  const [activeChart, setActiveChart] = useState(0)

  const vehicle = vehicles.find(v => v.id === vehicleId)

  useEffect(() => {
    alertsApi.list(vehicleId, 20).then(setAlerts).catch(() => {})
  }, [vehicleId, alertCount])

  const t = live || {}

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={vehicle ? `${vehicle.name} — ${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Live Telemetry'}
        subtitle={vehicle?.driver ? `Driver: ${vehicle.driver} · ${vehicle.location_name}` : ''}
      />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">

        {/* Connection status + vehicle selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={clsx('w-2 h-2 rounded-full', connected ? 'dot-online animate-blink' : 'dot-offline')} />
            <span className="text-xs font-mono text-slate-500">
              {connected ? 'LIVE · 2s interval' : 'RECONNECTING...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {vehicles.map(v => (
              <Link key={v.id} to={`/vehicle/${v.id}`}
                className={clsx('text-xs px-2.5 py-1 rounded font-mono transition-all border',
                  vehicleId === v.id
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'text-slate-500 border-white/5 hover:text-white'
                )}>
                {v.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Primary gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 lg:col-span-1 flex justify-center card p-4">
            <ArcGauge value={t.speed_mph || 0} max={160} label="SPEED" unit="MPH"
              warningZone={0.7} dangerZone={0.88} />
          </div>
          <div className="col-span-2 lg:col-span-1 flex justify-center card p-4">
            <ArcGauge value={t.rpm || 0} max={8500} label="ENGINE RPM" unit="RPM"
              warningZone={0.75} dangerZone={0.9} />
          </div>
          <div className="col-span-2 lg:col-span-1 flex justify-center card p-4">
            <ArcGauge value={t.throttle_pct || 0} max={100} label="THROTTLE" unit="%" />
          </div>
          <div className="col-span-2 lg:col-span-1 flex justify-center card p-4">
            <ArcGauge value={t.fuel_pct || 0} max={100} label="FUEL / BATT" unit="%"
              warningZone={0.99} dangerZone={0.99}
              dangerZone={0.08} warningZone={0.15}
            />
          </div>
        </div>

        {/* Metric cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'coolant_temp_f',  label: 'Coolant',     unit: '°F', icon: '🌡️' },
            { key: 'oil_temp_f',      label: 'Oil Temp',    unit: '°F', icon: '🛢️' },
            { key: 'brake_temp_f',    label: 'Brakes',      unit: '°F', icon: '🔥' },
            { key: 'battery_voltage', label: 'Voltage',     unit: 'V',  icon: '⚡' },
            { key: 'engine_load_pct', label: 'Engine Load', unit: '%',  icon: '⚙️' },
            { key: 'transmission_temp', label: 'Trans Temp',unit: '°F', icon: '🔧' },
          ].map(({ key, label, unit, icon }) => (
            <MetricCard key={key} label={label} unit={unit} icon={icon}
              value={t[key] != null ? Number(t[key]).toFixed(1) : '—'}
              status={getMetricStatus(key, t[key])}
            />
          ))}
        </div>

        {/* Charts + tires + g-force */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main chart */}
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {CHART_SETS[activeChart].label}
              </div>
              <div className="flex gap-1">
                {CHART_SETS.map((cs, i) => (
                  <button key={i} onClick={() => setActiveChart(i)}
                    className={clsx('text-[9px] px-2 py-1 rounded font-mono transition-all',
                      activeChart === i
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-600 hover:text-slate-400'
                    )}>
                    {cs.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <TelemetryChart data={history} metrics={CHART_SETS[activeChart].metrics} height={200} />
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            <TireDisplay fl={t.tire_fl_psi} fr={t.tire_fr_psi} rl={t.tire_rl_psi} rr={t.tire_rr_psi} />
            <GForceChart data={history} />
          </div>
        </div>

        {/* Status flags + alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* System flags */}
          <div className="card p-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">System Flags</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { flag: t.check_engine,   label: 'CHECK ENGINE', icon: '⚠️' },
                { flag: t.abs_active,     label: 'ABS ACTIVE',   icon: '🛑' },
                { flag: t.traction_active,label: 'TRACTION',     icon: '🔄' },
              ].map(({ flag, label, icon }) => (
                <div key={label} className={clsx('rounded-lg p-3 text-center border transition-all',
                  flag
                    ? 'bg-amber-500/10 border-amber-400/30 text-amber-400'
                    : 'bg-white/3 border-white/5 text-slate-600'
                )}>
                  <div className="text-lg">{icon}</div>
                  <div className="text-[9px] font-mono font-bold mt-1">{label}</div>
                  <div className={clsx('text-[10px] font-mono', flag ? 'text-amber-400' : 'text-slate-600')}>
                    {flag ? 'ACTIVE' : 'OK'}
                  </div>
                </div>
              ))}
            </div>

            {/* Gear + GPS */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <MetricCard label="Gear" value={t.gear || '—'} unit="" small />
              <MetricCard label="Altitude" value={t.altitude_ft?.toFixed(0)} unit="ft" small />
            </div>
          </div>

          {/* Alert feed */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Active Alerts {alerts.length > 0 && <span className="text-red-400">({alerts.length})</span>}
              </div>
              <Link to="/alerts" className="text-[10px] font-mono text-slate-600 hover:text-cyan-400 transition-colors">
                VIEW ALL →
              </Link>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              <AlertPanel alerts={alerts.slice(0, 5)} onResolve={id => setAlerts(prev => prev.filter(a => a.id !== id))} />
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
