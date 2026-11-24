import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, MousePointerClick, Zap } from 'lucide-react'
import { topics } from '../data/topics'

export default function Home() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#121a33] via-[#10172b] to-[#0c1324] p-8 sm:p-10 mb-10">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-5">
            <Zap size={14} /> Learn by seeing
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Data Structures &amp; Algorithms
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              Visualizer Lab
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-base sm:text-lg leading-relaxed mb-6">
            Explore core DSA concepts through interactive, step-by-step visualizations.
            Build trees, run sorts, trace traversals, and understand how algorithms really work.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2"><BookOpen size={16} className="text-violet-400" /> {topics.length} visualizers</div>
            <div className="flex items-center gap-2"><MousePointerClick size={16} className="text-cyan-400" /> Interactive controls</div>
            <div className="flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Step-by-step animations</div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Explore Topics</h2>
          <span className="text-sm text-slate-500">Pick a topic to start</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {topics.map((t) => {
            const Icon = t.icon
            return (
              <Link
                key={t.id}
                to={t.path}
                className="group relative rounded-xl border border-slate-800 bg-[#121a2f]/80 hover:bg-[#16203a] hover:border-slate-700 transition-all p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${t.color}1a`, color: t.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-white font-semibold mb-1.5">{t.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{t.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
