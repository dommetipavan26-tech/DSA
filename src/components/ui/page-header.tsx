import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        Visualizer
      </div>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-cyan-200">{title}</span>
      </h1>
      <p className="text-slate-400 mt-2 max-w-3xl">{description}</p>
      {children}
    </motion.div>
  )
}
