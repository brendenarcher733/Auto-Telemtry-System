// hooks/useTelemetry.js — WebSocket + polling telemetry hook

import { useState, useEffect, useRef, useCallback } from 'react'
import { createTelemetrySocket } from '../services/api'
import { telemetryApi } from '../services/api'

const HISTORY_LENGTH = 60   // data points to keep in rolling buffer

export function useTelemetry(vehicleId) {
  const [live, setLive]       = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const wsRef = useRef(null)

  const appendHistory = useCallback((snapshot) => {
    setHistory(prev => {
      const next = [...prev, { ...snapshot, _ts: Date.now() }]
      return next.slice(-HISTORY_LENGTH)
    })
  }, [])

  useEffect(() => {
    if (!vehicleId) return

    // Pre-load some history
    telemetryApi.history(vehicleId, 20)
      .then(records => setHistory(records.map(r => ({ ...r, _ts: Date.now() }))))
      .catch(() => {})

    // Open WebSocket
    const ws = createTelemetrySocket(
      vehicleId,
      (msg) => {
        if (msg.type === 'telemetry') {
          setLive(msg.data)
          appendHistory(msg.data)
          if (msg.new_alerts > 0) setAlertCount(c => c + msg.new_alerts)
          setConnected(true)
        }
      },
      () => {
        setConnected(false)
        // Fallback to polling if WS fails
        const interval = setInterval(() => {
          telemetryApi.latest(vehicleId)
            .then(snap => { setLive(snap); appendHistory(snap) })
            .catch(() => {})
        }, 2500)
        return () => clearInterval(interval)
      }
    )
    ws.onopen  = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    wsRef.current = ws

    return () => {
      ws.close()
      setConnected(false)
    }
  }, [vehicleId, appendHistory])

  return { live, history, connected, alertCount }
}
