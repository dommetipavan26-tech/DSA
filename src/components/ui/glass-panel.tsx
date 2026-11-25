import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-30px_rgba(0,0,0,0.7)]', className)}>
      {children}
    </div>
  )
}
