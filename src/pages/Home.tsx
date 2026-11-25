import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, MousePointerClick, Search, Sparkles, Zap } from 'lucide-react'
import { sections, topics } from '../data/topics'
import { BackgroundGrid } from '../components/ui/background-grid'
import { BlurText } from '../components/ui/blur-text'
import { GlowCard } from '../components/ui/glow-card'

const suggestions = [
  'Sort an array',
  'Trace BFS & DFS',
  'Build a BST',
  'Hash table collisions',
  'Shortest path',
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.05 } }),
}

export default function Home() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((s) => ({
        ...s,
        topics: s.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
            s.title.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.topics.length > 0)
  }, [query])

  let cardIndex = 0
  return (
    <div className="relative min-h-full px-4 sm:px-6 lg:px-10 py-8 sm:py-10 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#172044] via-[#101a35] to-[#0b1020] px-6 sm:px-10 py-14 sm:py-20 mb-12">
        <BackgroundGrid />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_55%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6 backdrop-blur-sm"
          >
            <Sparkles size={14} /> Interactive DSA Learning
          </motion.div>

          <div className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight mb-4">
            <BlurText text="Where should we start?" className="justify-center" delay={0.04} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-slate-400 text-base sm:text-lg mb-8"
          >
            Explore data structures and algorithms through interactive, step-by-step visualizations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="relative max-w-2xl mx-auto mb-5"
          >
            <div className="shimmer-border rounded-2xl">
              <div className="relative rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-700/60">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask for a visualizer... e.g. sorting, BFS, hash table"
                  className="w-full bg-transparent pl-11 pr-4 py-4 text-sm sm:text-base text-slate-200 placeholder:text-slate-500 focus:outline-none rounded-2xl"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300 bg-slate-900/50 border border-slate-700/60 hover:border-violet-500/40 hover:text-violet-200 hover:bg-violet-500/10 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.46 }}
            className="flex flex-wrap justify-center gap-3 text-sm"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300"><BookOpen size={16} className="text-violet-400" /> {topics.length} visualizers</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300"><MousePointerClick size={16} className="text-cyan-400" /> Interactive controls</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300"><Zap size={16} className="text-amber-400" /> Step-by-step animations</div>
          </motion.div>
        </div>
      </section>

      <div className="space-y-12">
        {filtered.map((sec) => (
          <section key={sec.id}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between mb-5"
            >
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
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">No visualizers match “{query}”. Try another search.</div>
        )}
      </div>
    </div>
  )
}
