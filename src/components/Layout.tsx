import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Home, Sparkles } from 'lucide-react'
import { sections } from '../data/topics'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-full min-h-screen bg-[#0b1020] text-slate-200 flex">
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0f1629] border-r border-slate-800/80 flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight leading-tight">DSA Lab</div>
              <div className="text-[11px] text-slate-400 -mt-0.5">Interactive Visualizers</div>
            </div>
          </NavLink>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/" end onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-violet-500/15 text-violet-300' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}>
            <Home size={18} />
            <span>Home</span>
          </NavLink>

          {sections.map((sec) => (
            <div key={sec.id} className="pt-4">
              <div className="pb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{sec.title}</div>
              <div className="space-y-1">
                {sec.topics.map((t) => {
                  const Icon = t.icon
                  const active = location.pathname === t.path
                  return (
                    <NavLink key={t.id} to={t.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}>
                      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${t.color}22`, color: t.color }}>
                        <Icon size={16} />
                      </span>
                      <span className="truncate">{t.title}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          Built for learning · Interactive DSA Lab
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-[#0f1629]/95 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center gap-3">
          <button className="text-slate-300 hover:text-white" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-semibold text-white">DSA Lab</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
