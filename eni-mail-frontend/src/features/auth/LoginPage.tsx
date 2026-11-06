import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
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
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="rounded-lg bg-[color:var(--color-brand-600)] p-2 text-white">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-semibold">ENI Mail</div>
          <div className="text-sm text-[color:var(--color-ink-muted)]">Messagerie interne de l'ENI</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <h1 className="text-lg font-semibold">Connexion</h1>

        {serverError && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" className="input" {...register('email')} />
          {formState.errors.email && (
            <p className="text-xs text-red-600">{formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
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
          Besoin d'aide ? Contactez l'administration.
        </p>
      </form>
    </div>
  )
}
