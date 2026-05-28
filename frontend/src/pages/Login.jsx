// pages/Login.jsx — Enterprise auth UI (mock)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [creds, setCreds] = useState({ user: 'engineer@autotelemetry.io', pass: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { localStorage.setItem('at_auth', '1'); navigate('/') }, 800)
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">AT</div>
          <h1 className="text-xl font-bold font-display text-white">AutoTelemetry Pro</h1>
          <p className="text-sm text-slate-500 mt-1">Vehicle Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Engineer ID
            </label>
            <input type="text" value={creds.user}
              onChange={e => setCreds(p => ({...p, user: e.target.value}))}
              className="w-full bg-[#161a28] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Access Code
            </label>
            <input type="password" value={creds.pass} placeholder="Enter access code"
              onChange={e => setCreds(p => ({...p, pass: e.target.value}))}
              className="w-full bg-[#161a28] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 rounded-lg text-sm font-mono transition-all">
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
          </button>
          <p className="text-center text-[10px] text-slate-600 font-mono">Demo: press login with any credentials</p>
        </form>

        <div className="mt-4 card p-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full dot-online animate-blink flex-shrink-0" />
          <span className="text-[10px] font-mono text-slate-500">TELEMETRY SYSTEMS ONLINE · {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}
