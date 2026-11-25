import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, RotateCcw, Upload } from 'lucide-react'

type Mode = 'chaining' | 'linear' | 'quadratic' | 'double'

interface Entry { key: number; id: number }
let eid = 1

function safeEval(expr: string, k: number, size: number, i = 0): number {
  const trimmed = expr.trim()
  if (!trimmed) throw new Error('Empty expression')
  if (!/^[0-9k\s+\-*/%().,<>!=&|?:a-zA-Z_]+$/.test(trimmed)) throw new Error('Invalid characters in expression')
  // eslint-disable-next-line no-new-func
  const fn = new Function('k', 'size', 'i', 'Math', 'floor', 'ceil', 'abs', 'pow', 'min', 'max', `return (${trimmed});`)
  const v = fn(k, size, i, Math, Math.floor, Math.ceil, Math.abs, Math.pow, Math.min, Math.max)
  const n = Number(v)
  if (!Number.isFinite(n)) throw new Error('Expression did not return a finite number')
  return n
}

function mod(n: number, m: number) { return ((n % m) + m) % m }

export default function HashingVisualizer() {
  const [size, setSize] = useState(7)
  const [mode, setMode] = useState<Mode>('chaining')
  const [input, setInput] = useState('15')
  const [bulkInput, setBulkInput] = useState('15, 22, 1, 8, 29')
  const [h1Expr, setH1Expr] = useState('k % size')
  const [h2Expr, setH2Expr] = useState('1 + (k % (size - 1))')
  const [table, setTable] = useState<(Entry[] | (Entry | null))[]>(() => Array.from({ length: 7 }, () => []))
  const [msg, setMsg] = useState('Choose a collision strategy, then insert/search/delete keys.')
  const [highlight, setHighlight] = useState<number[]>([])
  const [found, setFound] = useState<number | null>(null)

  const h1 = (k: number, s: number = size) => mod(Math.trunc(safeEval(h1Expr, k, s, 0)), s)
  const h2 = (k: number, s: number = size) => {
    const v = Math.trunc(safeEval(h2Expr, k, s, 0))
    const m = mod(v, s)
    return m === 0 ? 1 : m
  }

  const probeIndex = (k: number, i: number, s: number = size) => {
    if (mode === 'linear') return mod(h1(k, s) + i, s)
    if (mode === 'quadratic') return mod(h1(k, s) + i * i, s)
    return mod(h1(k, s) + i * h2(k, s), s)
  }

  const reset = (m: Mode = mode, s: number = size) => {
    setMode(m); setSize(s); setHighlight([]); setFound(null)
    setTable(Array.from({ length: s }, () => m === 'chaining' ? [] : null))
    setMsg(`Reset table (size ${s}, ${labelFor(m)}).`)
  }

  const labelFor = (m: Mode) => m === 'chaining' ? 'Chaining' : m === 'linear' ? 'Linear Probing' : m === 'quadratic' ? 'Quadratic Probing' : 'Double Hashing'

  const parseKey = () => {
    const k = Math.round(Number(input))
    if (!Number.isFinite(k)) { setMsg('Enter a valid numeric key.'); return null }
    return k
  }

  const insertKey = (k: number, t: (Entry[] | (Entry | null))[], s: number, m: Mode): { table: (Entry[] | (Entry | null))[]; msg: string; highlight: number[]; found: number | null } => {
    if (m === 'chaining') {
      const n = t.map(b => Array.isArray(b) ? [...b] : b) as Entry[][]
      const idx = mod(Math.trunc(safeEval(h1Expr, k, s, 0)), s)
      const bucket = n[idx]
      if (bucket.some(e => e.key === k)) return { table: t, msg: `${k} already exists in bucket ${idx}.`, highlight: [idx], found: null }
      bucket.push({ key: k, id: eid++ })
      return { table: n, msg: `h(${k}) = ${idx}. Inserted ${k} into bucket ${idx}${bucket.length > 1 ? ' (collision handled by chaining)' : ''}.`, highlight: [idx], found: null }
    }
    const n = t.slice() as (Entry | null)[]
    const tried: number[] = []
    for (let i = 0; i < s; i++) {
      const idx = m === 'linear'
        ? mod(Math.trunc(safeEval(h1Expr, k, s, 0)) + i, s)
        : m === 'quadratic'
          ? mod(Math.trunc(safeEval(h1Expr, k, s, 0)) + i * i, s)
          : mod(Math.trunc(safeEval(h1Expr, k, s, 0)) + i * (() => { const v = Math.trunc(safeEval(h2Expr, k, s, 0)); const mv = mod(v, s); return mv === 0 ? 1 : mv })(), s)
      tried.push(idx)
      const cur = n[idx]
      if (cur === null) {
        n[idx] = { key: k, id: eid++ }
        return { table: n, msg: `Inserted ${k} at index ${idx}. Probes: ${tried.join(' → ')}${tried.length > 1 ? ' (collision resolved)' : ''}.`, highlight: tried, found: idx }
      }
      if (cur.key === k) return { table: t, msg: `${k} already exists at index ${idx}.`, highlight: tried, found: idx }
    }
    return { table: t, msg: `No slot found for ${k}. Probes: ${tried.join(' → ')}`, highlight: tried, found: null }
  }

  const insert = () => {
    const k = parseKey(); if (k === null) return
    setFound(null)
    try {
      const res = insertKey(k, table, size, mode)
      setTable(res.table); setMsg(res.msg); setHighlight(res.highlight); setFound(res.found)
    } catch (e) { setMsg(`Hash function error: ${(e as Error).message}`); setHighlight([]); setFound(null) }
  }

  const search = () => {
    const k = parseKey(); if (k === null) return
    try {
      if (mode === 'chaining') {
        const idx = h1(k)
        const bucket = table[idx] as Entry[]
        const hit = bucket.find(e => e.key === k)
        setHighlight([idx]); setFound(hit ? idx : null)
        setMsg(hit ? `Found ${k} in bucket ${idx}.` : `${k} not found in bucket ${idx}.`)
      } else {
        const n = table as (Entry | null)[]
        const tried: number[] = []
        for (let i = 0; i < size; i++) {
          const idx = probeIndex(k, i)
          tried.push(idx)
          const cur = n[idx]
          if (cur === null) { setHighlight(tried); setFound(null); setMsg(`${k} not found. Empty slot at ${idx}. Probes: ${tried.join(' → ')}`); return }
          if (cur.key === k) { setHighlight(tried); setFound(idx); setMsg(`Found ${k} at index ${idx}. Probes: ${tried.join(' → ')}`); return }
        }
        setHighlight(tried); setFound(null); setMsg(`${k} not found after probing all slots.`)
      }
    } catch (e) { setMsg(`Hash function error: ${(e as Error).message}`); setHighlight([]); setFound(null) }
  }

  const remove = () => {
    const k = parseKey(); if (k === null) return
    setFound(null)
    if (mode === 'chaining') {
      try {
        const idx = h1(k)
        setTable(t => {
          const n = t.map(b => Array.isArray(b) ? [...b] : b) as Entry[][]
          const b = n[idx]
          const bi = b.findIndex(e => e.key === k)
          if (bi === -1) { setMsg(`${k} not found in bucket ${idx}.`); setHighlight([idx]); return t }
          b.splice(bi, 1)
          setMsg(`Deleted ${k} from bucket ${idx}.`)
          setHighlight([idx])
          return n
        })
      } catch (e) { setMsg(`Hash function error: ${(e as Error).message}`) }
    } else {
      const idx = (table as (Entry | null)[]).findIndex(e => e?.key === k)
      if (idx === -1) { setMsg(`${k} not found.`); setHighlight([]); return }
      setTable(t => { const n = t.slice() as (Entry | null)[]; n[idx] = null; return n })
      setHighlight([idx]); setMsg(`Deleted ${k} from index ${idx}. (Simple delete; probing chains may be affected in real open addressing.)`)
    }
  }

  const loadBulk = () => {
    const keys = bulkInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number)
    if (keys.some(k => !Number.isFinite(k))) { setMsg('Bulk input must be comma/space separated numbers.'); return }
    let t: (Entry[] | (Entry | null))[] = Array.from({ length: size }, () => mode === 'chaining' ? [] : null)
    let last = { msg: 'Loaded keys.', highlight: [] as number[], found: null as number | null }
    try {
      for (const raw of keys) {
        const k = Math.round(raw)
        const res = insertKey(k, t, size, mode)
        t = res.table; last = { msg: res.msg, highlight: res.highlight, found: res.found }
      }
      setTable(t); setHighlight(last.highlight); setFound(last.found)
      setMsg(`Loaded ${keys.length} key(s): [${keys.map(k => Math.round(k)).join(', ')}]. ${last.msg}`)
    } catch (e) { setMsg(`Hash function error: ${(e as Error).message}`) }
  }

  const loadFactor = useMemo(() => {
    const count = mode === 'chaining' ? (table as Entry[][]).reduce((s, b) => s + b.length, 0) : (table as (Entry | null)[]).filter(Boolean).length
    return (count / size).toFixed(2)
  }, [table, size, mode])

  const modeDesc = mode === 'chaining'
    ? 'Chaining: store colliding keys in a bucket list.'
    : mode === 'linear'
      ? 'Linear Probing: try next slots sequentially (h(k)+i)%m.'
      : mode === 'quadratic'
        ? 'Quadratic Probing: try slots at i² offsets (h(k)+i²)%m.'
        : 'Double Hashing: use a second hash to compute probe step (h1(k)+i*h2(k))%m.'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Hashing Visualizer" description="Explore hash functions, collisions, and collision resolution strategies including double hashing." />
      <div className="flex flex-wrap gap-2 mb-5">
        {([['chaining', 'Chaining'], ['linear', 'Linear Probing'], ['quadratic', 'Quadratic Probing'], ['double', 'Double Hashing']] as [Mode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => reset(m, size)} className={`px-4 py-2 rounded-full text-sm border ${mode === m ? 'bg-violet-500/20 text-violet-200 border-violet-500/40' : 'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5">
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div><label className="text-xs text-slate-400 block mb-1">Key</label><input value={input} onChange={e => setInput(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Table size</label><input type="number" min={3} max={15} value={size} onChange={e => { const s = Math.max(3, Math.min(15, Math.round(Number(e.target.value) || 7))); setSize(s); reset(mode, s) }} className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
            <button onClick={insert} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15} /> Insert</button>
            <button onClick={search} className="px-3 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 text-sm flex items-center gap-1"><Search size={15} /> Search</button>
            <button onClick={remove} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex items-center gap-1"><Trash2 size={15} /> Delete</button>
            <button onClick={() => reset(mode, size)} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex items-center gap-1"><RotateCcw size={15} /> Reset</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Hash function h1(k) = <span className="text-slate-500">(uses k, size)</span></label>
              <input value={h1Expr} onChange={e => setH1Expr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono" placeholder="k % size" />
            </div>
            {mode === 'double' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Hash function h2(k) = <span className="text-slate-500">(step; must not be 0)</span></label>
                <input value={h2Expr} onChange={e => setH2Expr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono" placeholder="1 + (k % (size - 1))" />
              </div>
            )}
            <div className={mode === 'double' ? 'sm:col-span-2' : ''}>
              <label className="text-xs text-slate-400 block mb-1">Bulk load keys <span className="text-slate-500">(comma/space separated)</span></label>
              <div className="flex gap-2">
                <input value={bulkInput} onChange={e => setBulkInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono" placeholder="15, 22, 1, 8, 29" />
                <button onClick={loadBulk} className="px-3 py-2 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 text-sm flex items-center gap-1"><Upload size={15} /> Load</button>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-300 mb-4 min-h-[40px]">{msg}</div>

          <div className="space-y-2">
            {Array.from({ length: size }).map((_, i) => {
              const hl = highlight.includes(i)
              const isFound = found === i
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${isFound ? 'border-emerald-500/50 bg-emerald-900/10' : hl ? 'border-amber-500/40 bg-amber-900/10' : 'border-slate-800 bg-slate-900/30'}`}>
                  <div className="w-10 text-xs text-slate-500 font-mono">[{i}]</div>
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    {mode === 'chaining' ? (
                      ((table[i] as Entry[]) || []).length ? (table[i] as Entry[]).map((e, bi) => (
                        <div key={e.id} className="flex items-center gap-1">
                          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-slate-200 text-sm font-mono">{e.key}</span>
                          {bi < (table[i] as Entry[]).length - 1 && <span className="text-slate-600">→</span>}
                        </div>
                      )) : <span className="text-slate-600 text-sm">empty</span>
                    ) : (
                      (table[i] as Entry | null) ? <span className={`px-2.5 py-1 rounded border text-sm font-mono ${isFound ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-600 text-slate-200'}`}>{(table[i] as Entry).key}</span> : <span className="text-slate-600 text-sm">empty</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 text-sm text-slate-400 space-y-2">
            <h3 className="text-white font-semibold">Hash Info</h3>
            <p><span className="text-slate-300">h1(k):</span> <span className="font-mono text-slate-200">{h1Expr}</span></p>
            {mode === 'double' && <p><span className="text-slate-300">h2(k):</span> <span className="font-mono text-slate-200">{h2Expr}</span></p>}
            <p><span className="text-slate-300">Strategy:</span> {labelFor(mode)}</p>
            <p><span className="text-slate-300">Load factor:</span> {loadFactor}</p>
            <p><span className="text-slate-300">Table size:</span> {size}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 text-sm text-slate-400 space-y-2">
            <h3 className="text-white font-semibold">Collision Resolution</h3>
            <p><span className="text-slate-300">Chaining:</span> store colliding keys in a bucket list.</p>
            <p><span className="text-slate-300">Linear probing:</span> try next slots sequentially.</p>
            <p><span className="text-slate-300">Quadratic probing:</span> try slots at i² offsets.</p>
            <p><span className="text-slate-300">Double hashing:</span> use a second hash for probe step.</p>
            <p className="text-slate-500 text-xs pt-1">{modeDesc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
