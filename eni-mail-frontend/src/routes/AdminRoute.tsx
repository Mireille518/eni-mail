import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AdminRoute() {
  const { hasRole, loading } = useAuth()
  if (loading) return null
  if (!hasRole('ROLE_ADMIN')) return <Navigate to="/" replace />
  return <Outlet />
}
