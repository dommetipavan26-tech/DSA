import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, MousePointerClick, Sparkles, Zap } from 'lucide-react'
import { sections, topics } from '../data/topics'
import { BackgroundGrid } from '../components/ui/background-grid'
import { BlurText } from '../components/ui/blur-text'
import { GlowCard } from '../components/ui/glow-card'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.06 } }),
}

export default function Home() {
  let cardIndex = 0
  return (
    <div className="relative px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <section className="shimmer-border relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#121a33] via-[#10172b] to-[#0c1324] p-8 sm:p-12 mb-12">
        <BackgroundGrid />
        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-5 backdrop-blur-sm">
            <Sparkles size={14} /> Interactive DSA Learning
          </motion.div>
          <div className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5">
            <BlurText text="Data Structures & Algorithms" className="block" delay={0.05} />
            <motion.span initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.5, delay: 0.35 }} className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
              Visualizer Lab
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="text-slate-400 max-w-2xl text-base sm:text-lg leading-relaxed mb-8">
            Explore core DSA concepts through interactive, step-by-step visualizations.
            Build structures, trace algorithms, and understand how they really work.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-300"><BookOpen size={16} className="text-violet-400" /> {topics.length} visualizers</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-300"><MousePointerClick size={16} className="text-cyan-400" /> Interactive controls</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-300"><Zap size={16} className="text-amber-400" /> Step-by-step animations</div>
          </motion.div>
        </div>
      </section>

      <div className="space-y-12">
        {sections.map((sec) => (
          <section key={sec.id}>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">{sec.title}</h2>
                <div className="h-1 w-16 mt-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
              </div>
              <span className="text-sm text-slate-500">{sec.topics.length} topic{sec.topics.length > 1 ? 's' : ''}</span>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sec.topics.map((t) => {
                const Icon = t.icon
                const i = cardIndex++
                return (
                  <motion.div key={t.id} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }} custom={i}>
                    <Link to={t.path} className="block h-full">
                      <GlowCard className="h-full group hover:border-slate-600/80 transition-colors duration-300">
                        <div className="p-5 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center ring-1 ring-white/5" style={{ backgroundColor: `${t.color}1a`, color: t.color, boxShadow: `0 0 24px ${t.color}22` }}>
                              <Icon size={22} />
                            </div>
                            <ArrowRight size={18} className="text-slate-600 group-hover:text-violet-300 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <h3 className="text-white font-semibold mb-1.5 group-hover:text-violet-100 transition-colors">{t.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{t.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {t.tags.map((tag) => (
                              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </GlowCard>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
