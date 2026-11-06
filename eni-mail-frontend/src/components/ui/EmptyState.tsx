import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[color:var(--color-border)] bg-white p-10 text-center">
      {Icon && (
        <div className="rounded-full bg-[color:var(--color-brand-50)] p-3 text-[color:var(--color-brand-600)]">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[color:var(--color-ink-muted)]">{description}</p>}
      {action}
    </div>
  )
}
