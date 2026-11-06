import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Logo } from '../../components/ui/Logo'
import { useAuth } from '../../contexts/AuthContext'
import { apiErrorMessage } from '../../services/apiClient'
import { useState } from 'react'

const schema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const { isAuthenticated, login, loading: bootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  if (!bootstrapping && isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/inbox'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (v: Values) => {
    setServerError(null)
    try {
      await login(v.email, v.password)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/inbox'
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Connexion impossible'))
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Identite visuelle */}
      <div className="mb-10 flex flex-col items-center text-center">
        <Logo size="lg" withWordmark={false} />
        <h1 className="heading-display mt-4">ENI Mail</h1>
        <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
          Messagerie interne de l'Ecole Nationale d'Informatique
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card space-y-4 p-7"
        noValidate
      >
        <div>
          <h2 className="text-base font-semibold text-[color:var(--color-ink-strong)]">
            Connexion a votre compte
          </h2>
          <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">
            Utilisez vos identifiants institutionnels.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--color-ink-strong)]" htmlFor="email">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="prenom.nom@eni.mg"
            className="input"
            aria-invalid={!!formState.errors.email}
            {...register('email')}
          />
          {formState.errors.email && (
            <p className="text-xs text-red-600">{formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[color:var(--color-ink-strong)]" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            className="input"
            aria-invalid={!!formState.errors.password}
            {...register('password')}
          />
          {formState.errors.password && (
            <p className="text-xs text-red-600">{formState.errors.password.message}</p>
          )}
        </div>

        <button className="btn-primary w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </button>

        <p className="text-center text-xs text-[color:var(--color-ink-muted)]">
          Mot de passe oublie ? Contactez l'administration.
        </p>
      </form>

      <p className="mt-6 text-center text-[11px] text-[color:var(--color-ink-subtle)]">
        &copy; {new Date().getFullYear()} Ecole Nationale d'Informatique. Tous droits reserves.
      </p>
    </div>
  )
}
