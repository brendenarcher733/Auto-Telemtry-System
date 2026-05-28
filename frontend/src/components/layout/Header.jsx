import { useState } from 'react'
import { Link } from 'react-router-dom'

export function Header({ title = 'Fleet Overview', subtitle = '' }) {
  const now = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d1018]/80 backdrop-blur-sm sticky top-0 z-40">
      <div>
        <h1 className="text-sm font-semibold text-white font-display">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[11px] text-slate-500 font-mono hidden sm:block">{now}</span>
        <div className="flex items-center gap-2 text-xs text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[11px]">SYSTEMS NOMINAL</span>
        </div>
      </div>
    </header>
  )
}
