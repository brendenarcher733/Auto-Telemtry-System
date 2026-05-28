import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar }          from './components/layout/Sidebar'
import Fleet                from './pages/Fleet'
import VehicleDashboard     from './pages/VehicleDashboard'
import Alerts               from './pages/Alerts'
import AIDiagnostics        from './pages/AIDiagnostics'
import Login                from './pages/Login'
import './styles/globals.css'

function RequireAuth({ children }) {
  const authed = localStorage.getItem('at_auth')
  return authed ? children : <Navigate to="/login" replace />
}

function AppShell() {
  return (
    <div className="flex h-screen bg-[#0a0c14] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-16 lg:ml-56">
        <Routes>
          <Route path="/"              element={<RequireAuth><Fleet /></RequireAuth>} />
          <Route path="/vehicle"       element={<RequireAuth><VehicleDashboard /></RequireAuth>} />
          <Route path="/vehicle/:id"   element={<RequireAuth><VehicleDashboard /></RequireAuth>} />
          <Route path="/alerts"        element={<RequireAuth><Alerts /></RequireAuth>} />
          <Route path="/ai"            element={<RequireAuth><AIDiagnostics /></RequireAuth>} />
          <Route path="/login"         element={<Login />} />
        </Routes>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
)
