// TelemetryChart — Recharts time-series telemetry visualizer
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'

const COLORS = {
  speed_mph:      '#22d3ee',
  rpm:            '#f59e0b',
  coolant_temp_f: '#ef4444',
  oil_temp_f:     '#f97316',
  battery_voltage:'#a78bfa',
  throttle_pct:   '#4ade80',
  engine_load_pct:'#fb7185',
  brake_temp_f:   '#fbbf24',
  fuel_pct:       '#22c55e',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111422] border border-white/10 rounded-lg p-2 text-xs font-mono shadow-xl">
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.dataKey}</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function TelemetryChart({ data = [], metrics = ['speed_mph', 'rpm'], height = 220 }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-slate-600 text-xs font-mono">
      Awaiting telemetry data...
    </div>
  )

  const chartData = data.map((d, i) => ({
    t: i,
    ...Object.fromEntries(metrics.map(m => [m, d[m]]))
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="t" hide />
        <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
        <Tooltip content={<CustomTooltip />} />
        {metrics.map(m => (
          <Line key={m} type="monotone" dataKey={m}
            stroke={COLORS[m] || '#64748b'}
            dot={false} strokeWidth={1.5}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
