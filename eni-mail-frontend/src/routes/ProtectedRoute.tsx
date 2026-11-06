import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--color-ink-muted)]">
        Chargement...
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
