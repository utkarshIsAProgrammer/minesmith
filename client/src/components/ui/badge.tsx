import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground border-primary',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    destructive: 'bg-destructive text-destructive-foreground border-destructive',
    outline: 'bg-transparent text-foreground border-border',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
        'shadow-[2px_2px_0_rgba(0,0,0,0.4)]',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
