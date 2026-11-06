import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6"
      style={{
        backgroundImage:
          'radial-gradient(1200px 600px at 10% -10%, oklch(95% 0.03 150 / 0.65), transparent 55%),' +
          'radial-gradient(1000px 500px at 100% 100%, oklch(97% 0.015 250), transparent 60%)',
        backgroundColor: 'var(--color-surface-muted)',
      }}
    >
      {/* Grille discrete en arriere-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-border) 1px, transparent 1px),' +
            'linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
