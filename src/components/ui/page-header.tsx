import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BlurText } from './blur-text'

export function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mb-6 relative">
      <div className="absolute -top-6 -left-6 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Interactive Visualizer
      </div>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
        <BlurText text={title} className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-cyan-200" />
      </h1>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="text-slate-400 mt-2 max-w-3xl">
        {description}
      </motion.p>
      {children}
    </motion.div>
  )
}
