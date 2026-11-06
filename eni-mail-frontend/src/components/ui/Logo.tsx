import { cn } from '../../lib/cn'

interface Props {
  /**
   * sm = topbar / inline ; md = sidebar header ; lg = login / dashboard hero.
   */
  size?: 'sm' | 'md' | 'lg'
  /** Afficher le mot ENI Mail a cote du mark. */
  withWordmark?: boolean
  className?: string
}

const markSize = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-14 w-14',
}

const wordmarkSize = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
}

const taglineSize = {
  sm: 'text-[10px]',
  md: 'text-[11px]',
  lg: 'text-xs',
}

/**
 * Logo officiel ENI Mail. Le fichier source vit dans /public/brand/eni-mail-logo.png
 * (image fournie par l'ENI - ne pas remplacer par une icone generique).
 */
export function Logo({ size = 'md', withWordmark = true, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/brand/eni-mail-logo.png"
        alt="ENI Mail"
        className={cn(
          'shrink-0 object-contain select-none',
          markSize[size],
        )}
        draggable={false}
      />
      {withWordmark && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              'font-display font-semibold tracking-tight text-[color:var(--color-ink)]',
              wordmarkSize[size],
            )}
          >
            ENI Mail
          </span>
          {size !== 'sm' && (
            <span
              className={cn(
                'font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink-muted)]',
                taglineSize[size],
              )}
            >
              Messagerie interne
            </span>
          )}
        </div>
      )}
    </div>
  )
}
