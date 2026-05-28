// hooks/useFleet.js — Fleet data with auto-refresh

import { useState, useEffect, useCallback } from 'react'
import { vehiclesApi } from '../services/api'
import { alertsApi }   from '../services/api'

export function useFleet(refreshInterval = 10000) {
  const [vehicles, setVehicles] = useState([])
  const [alerts,   setAlerts]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [vData, aData] = await Promise.all([vehiclesApi.list(), alertsApi.list()])
      setVehicles(vData)
      setAlerts(aData)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchAll, refreshInterval])

  return { vehicles, alerts, loading, error, refetch: fetchAll }
}
