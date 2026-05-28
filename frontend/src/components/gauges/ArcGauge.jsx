// ArcGauge — SVG arc gauge for RPM, speed, etc.
import clsx from 'clsx'

export function ArcGauge({ value = 0, max = 100, label = '', unit = '',
                            dangerZone = 0.85, warningZone = 0.7,
                            size = 140, strokeWidth = 10 }) {
  const radius   = (size / 2) - strokeWidth - 4
  const cx = size / 2, cy = size / 2
  const startAngle = 220, endAngle = 320   // sweep 320 degrees
  const totalArc   = 360 - (360 - startAngle) - endAngle   // = 320 deg sweep
  const sweepDeg   = 320
  const pct        = Math.min(Math.max(value / max, 0), 1)
  const fillDeg    = pct * sweepDeg

  const toXY = (angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const start = toXY(startAngle)
  const end   = toXY(startAngle + fillDeg)
  const large = fillDeg > 180 ? 1 : 0

  const trackStart = toXY(startAngle)
  const trackEnd   = toXY(startAngle + sweepDeg)

  const fillColor =
    pct >= dangerZone  ? '#ef4444' :
    pct >= warningZone ? '#fbbf24' : '#22d3ee'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillDeg > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`}
            fill="none" stroke={fillColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${fillColor}88)`, transition: 'all 0.3s ease' }}
          />
        )}
        {/* Center value */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white"
          fontSize="18" fontWeight="700" fontFamily="JetBrains Mono">
          {typeof value === 'number' ? Math.round(value).toLocaleString() : value}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
          {unit}
        </text>
      </svg>
      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{label}</span>
    </div>
  )
}
