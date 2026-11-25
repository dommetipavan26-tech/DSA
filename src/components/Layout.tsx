import { useState, useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, PanelLeftClose, Search, X } from 'lucide-react'
import { sections } from '../data/topics'
import { cn } from '../lib/utils'

function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3.2" />
      <path d="M8.5 4.5v15" />
    </svg>
  )
}

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

  const sidebarWidth = 292

  return (
    <div className="h-full min-h-screen bg-[#0b1020] text-slate-200 flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex shrink-0 border-r border-slate-800/80 bg-[#0f1629]/95 backdrop-blur-xl overflow-hidden"
        style={{
          width: open ? sidebarWidth : 0,
          transition: 'width 0.25s ease',
          borderRightWidth: open ? 1 : 0,
        }}
      >
        <div style={{ width: sidebarWidth }} className="h-full flex flex-col shrink-0">
          <SidebarContent
            query={query}
            setQuery={setQuery}
            filteredSections={filteredSections}
            locationPath={location.pathname}
            onNavigate={() => {}}
            onClose={() => setOpen(false)}
          />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence initial={false}>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 z-30 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -sidebarWidth, opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -sidebarWidth, opacity: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed left-0 top-0 bottom-0 z-40 w-[292px] lg:hidden border-r border-slate-800/80 bg-[#0f1629]/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40"
            >
              <SidebarContent
                query={query}
                setQuery={setQuery}
                filteredSections={filteredSections}
                locationPath={location.pathname}
                onNavigate={() => setOpen(false)}
                onClose={() => setOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Sidebar toggle */}
        <div className="fixed top-3 left-3 z-50 group">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#c4c7c5] hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200 cursor-pointer"
            aria-label={open ? 'Collapse menu' : 'Expand menu'}
            aria-expanded={open}
            type="button"
          >
            <SidebarToggleIcon className="w-[22px] h-[22px]" />
          </button>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full mt-2 px-2.5 py-1.5 rounded-md bg-[#3c4043] text-white text-[12px] leading-none whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 delay-150 shadow-lg"
          >
            {open ? 'Collapse menu' : 'Expand menu'}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  query,
  setQuery,
  filteredSections,
  locationPath,
  onNavigate,
  onClose,
}: {
  query: string
  setQuery: (v: string) => void
  filteredSections: typeof sections
  locationPath: string
  onNavigate: () => void
  onClose: () => void
}) {
  return (
    <div className="w-[292px] h-full flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">DSA Visualizer Lab</div>
            <div className="text-[11px] text-slate-500">Explore &amp; learn interactively</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 flex items-center justify-center transition-colors"
            aria-label="Collapse menu"
            title="Collapse menu"
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
          onClick={onNavigate}
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
                const active = locationPath === t.path
                return (
                  <NavLink
                    key={t.id}
                    to={t.path}
                    onClick={onNavigate}
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

    </div>
  )
}
