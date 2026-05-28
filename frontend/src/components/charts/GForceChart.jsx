// GForceChart — Real-time G-force scatter plot (lateral vs longitudinal)
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

export function GForceChart({ data = [] }) {
  const points = data.slice(-30).map(d => ({
    x: parseFloat((d.g_force_lat || 0).toFixed(3)),
    y: parseFloat((d.g_force_long || 0).toFixed(3)),
  }))

  return (
    <div className="card p-4">
      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">G-Force Plot</div>
      <ResponsiveContainer width="100%" height={160}>
        <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="x" domain={[-1.5, 1.5]} tick={{ fill: '#475569', fontSize: 9 }} label={{ value: 'LAT', position: 'insideBottom', fill: '#475569', fontSize: 9 }} />
          <YAxis dataKey="y" domain={[-1.5, 1.5]} tick={{ fill: '#475569', fontSize: 9 }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Scatter data={points} fill="#22d3ee" opacity={0.7} r={3} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
