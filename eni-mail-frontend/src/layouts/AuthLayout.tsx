import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-[color:var(--color-surface-muted)]">
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <Outlet />
      </div>
    </div>
  )
}
