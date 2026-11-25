import { useState, useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, PanelLeftClose, Search, X } from 'lucide-react'
import { sections } from '../data/topics'
import { cn } from '../lib/utils'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((sec) => ({
        ...sec,
        topics: sec.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q)),
        ),
      }))
      .filter((sec) => sec.topics.length > 0)
  }, [query])

  return (
    <div className="h-full min-h-screen bg-[#0b1020] text-slate-200 flex overflow-hidden">
      {/* Slim rail */}
      <div className="relative z-40 w-[68px] shrink-0 border-r border-slate-800/80 bg-[#0c1326]/95 backdrop-blur-xl flex flex-col items-center py-4 gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="group relative w-11 h-11 rounded-2xl flex items-center justify-center border border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all duration-300 shadow-[0_0_24px_rgba(139,92,246,0.15)]"
          aria-label={open ? 'Close sidebar' : 'Open sidebar'}
          title={open ? 'Close sidebar' : 'Open sidebar'}
        >
          <img src="/sidebar-toggle.png" alt="" className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        </button>

        <div className="mt-auto pb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" title="Interactive" />
        </div>
      </div>

      {/* Slide sidebar */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={{ width: 0, opacity: 0, x: -12 }}
            animate={{ width: 292, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed lg:relative left-[68px] lg:left-0 top-0 bottom-0 z-30 shrink-0 border-r border-slate-800/80 bg-[#0f1629]/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30 lg:shadow-none"
          >
            <div className="w-[292px] h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white tracking-tight">DSA Visualizer Lab</div>
                    <div className="text-[11px] text-slate-500">Explore &amp; learn interactively</div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 flex items-center justify-center transition-colors"
                    aria-label="Close sidebar"
                    title="Close sidebar"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="sidebar-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search visualizers..."
                    className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <NavLink
                  to="/"
                  end
                  onClick={() => { if (window.innerWidth < 1024) setOpen(false) }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive ? 'bg-violet-500/15 text-violet-200 border border-violet-500/20' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent',
                    )
                  }
                >
                  <span className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center"><Home size={15} /></span>
                  <span>Home</span>
                </NavLink>

                {filteredSections.map((sec, si) => (
                  <motion.div
                    key={sec.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: si * 0.03 }}
                    className="pt-3"
                  >
                    <div className="pb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{sec.title}</div>
                    <div className="space-y-1">
                      {sec.topics.map((t) => {
                        const Icon = t.icon
                        const active = location.pathname === t.path
                        return (
                          <NavLink
                            key={t.id}
                            to={t.path}
                            onClick={() => { if (window.innerWidth < 1024) setOpen(false) }}
                            className={cn(
                              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                              active
                                ? 'bg-slate-800/90 text-white border-slate-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-transparent hover:border-slate-800/80',
                            )}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-shadow duration-300"
                              style={{ backgroundColor: `${t.color}18`, color: t.color, boxShadow: active ? `0 0 14px ${t.color}30` : undefined }}
                            >
                              <Icon size={15} />
                            </span>
                            <span className="truncate">{t.title}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
                {filteredSections.length === 0 && (
                  <div className="px-3 py-8 text-sm text-slate-500 text-center">No visualizers found.</div>
                )}
              </nav>

              <div className="px-4 py-3 border-t border-slate-800/80">
                <div className="rounded-xl bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 border border-slate-800/80 px-3 py-2.5 text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {sections.reduce((a, s) => a + s.topics.length, 0)} visualizers ready
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 z-20 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
