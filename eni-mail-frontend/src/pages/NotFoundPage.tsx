import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl font-bold text-[color:var(--color-brand-700)]">404</div>
      <h1 className="mt-2 text-lg font-semibold">Page introuvable</h1>
      <p className="mt-1 max-w-sm text-sm text-[color:var(--color-ink-muted)]">
        La page demandee n'existe pas ou vous n'y avez pas acces.
      </p>
      <Link to="/inbox" className="btn-primary mt-4">Retour a la boite de reception</Link>
    </div>
  )
}
