// pages/AIDiagnostics.jsx — Telemetry AI Engineer panel
import { useState } from 'react'
import { Header }  from '../components/layout/Header'
import { useFleet } from '../hooks/useFleet'
import { diagnosticsApi } from '../services/api'
import clsx from 'clsx'

function ScoreMeter({ score }) {
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#ef4444'
  const label = score >= 80 ? 'NOMINAL' : score >= 60 ? 'DEGRADED' : 'CRITICAL'
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${score * 3.14} 314`}
            strokeDashoffset="78.5"
            strokeLinecap="round"
            style={{ transition: 'all 1s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
          <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono">{score}</text>
          <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">HEALTH</text>
        </svg>
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{label}</span>
    </div>
  )
}

export default function AIDiagnostics() {
  const { vehicles } = useFleet(60000)
  const [selectedId, setSelectedId]   = useState(null)
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  async function runAnalysis() {
    if (!selectedId) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await diagnosticsApi.analyze(selectedId)
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="AI Diagnostics Engineer" subtitle="Telemetry AI — powered by automotive domain intelligence" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Header panel */}
        <div className="card p-5 border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              🤖
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Telemetry AI Engineer</h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Advanced diagnostic analysis engine. Select a vehicle to run a full telemetry evaluation —
                health scoring, anomaly detection, root cause analysis, and maintenance recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle selector */}
        <div className="card p-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">Select Vehicle for Analysis</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {vehicles.map(v => (
              <button key={v.id} onClick={() => setSelectedId(v.id)}
                className={clsx('text-left p-3 rounded-lg border text-xs font-mono transition-all',
                  selectedId === v.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                )}>
                <div className="font-bold text-[11px]">{v.name}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{v.year} {v.make} {v.model}</div>
              </button>
            ))}
          </div>
          <button onClick={runAnalysis} disabled={!selectedId || loading}
            className={clsx(
              'w-full py-3 rounded-lg text-sm font-bold font-mono transition-all border',
              selectedId && !loading
                ? 'bg-cyan-500 text-black border-cyan-500 hover:bg-cyan-400'
                : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed'
            )}>
            {loading ? '◉ ANALYZING TELEMETRY...' : '◈ RUN DIAGNOSTIC ANALYSIS'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="card p-4 border-red-500/20 text-red-400 text-sm font-mono">
            Analysis failed: {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
            {/* Score */}
            <div className="card p-4 flex flex-col items-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Vehicle Health Score</div>
              <ScoreMeter score={result.health_score} />
              <div className="text-center">
                <div className="text-xs text-slate-500 font-mono">{result.active_alerts} active alerts</div>
              </div>
            </div>

            {/* Analysis */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="card p-4">
                <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-wider mb-2">Diagnostic Summary</div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>
              <div className="card p-4">
                <div className="text-[10px] font-mono text-amber-500 uppercase tracking-wider mb-2">Technical Analysis</div>
                <p className="text-sm text-slate-300 leading-relaxed font-mono text-xs">{result.analysis}</p>
              </div>
              <div className="card p-4">
                <div className="text-[10px] font-mono text-green-500 uppercase tracking-wider mb-2">Recommendations</div>
                <div className="space-y-1.5">
                  {result.recommendations.split('\n').filter(Boolean).map((r, i) => (
                    <div key={i} className="text-xs text-slate-300 leading-relaxed">{r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Idle state */}
        {!result && !loading && !error && (
          <div className="card p-12 text-center border-dashed border-white/10">
            <div className="text-3xl mb-3">🔬</div>
            <div className="text-sm text-slate-500">Select a vehicle above and run analysis to see the AI diagnostic report</div>
          </div>
        )}
      </main>
    </div>
  )
}
