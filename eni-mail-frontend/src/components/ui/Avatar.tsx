import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'

interface Props {
  name: string | null | undefined
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ name, src, size = 'md', className }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('rounded-full object-cover ring-1 ring-black/5', sizeMap[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand-100)] font-semibold text-[color:var(--color-brand-700)] ring-1 ring-black/5',
        sizeMap[size],
        className,
      )}
      aria-label={name ?? ''}
    >
      {initials(name)}
    </div>
  )
}
