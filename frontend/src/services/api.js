// services/api.js — Centralized API client

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(new Error(err.response?.data?.detail || err.message || 'API Error'))
)

export const vehiclesApi = {
  list:   ()   => api.get('/api/vehicles/'),
  get:    (id) => api.get(`/api/vehicles/${id}`),
}

export const telemetryApi = {
  latest:  (id)           => api.get(`/api/telemetry/${id}`),
  history: (id, limit=60) => api.get(`/api/telemetry/${id}/history?limit=${limit}`),
}

export const alertsApi = {
  list:    (vehicleId=null, limit=50) =>
    api.get(`/api/alerts/?limit=${limit}${vehicleId ? `&vehicle_id=${vehicleId}` : ''}`),
  resolve: (id) => api.put(`/api/alerts/${id}/resolve`),
}

export const diagnosticsApi = {
  analyze: (vehicleId) => api.post('/api/diagnostics/analyze', { vehicle_id: vehicleId }),
}

// WebSocket helper
export function createTelemetrySocket(vehicleId, onMessage, onError) {
  const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace('http', 'ws')
  const ws = new WebSocket(`${wsBase}/api/telemetry/ws/${vehicleId}`)
  ws.onmessage = e => { try { onMessage(JSON.parse(e.data)) } catch {} }
  ws.onerror   = onError || (() => {})
  return ws
}
