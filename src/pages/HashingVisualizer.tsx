import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, RotateCcw } from 'lucide-react'

type Mode = 'chaining' | 'linear' | 'quadratic'

interface Entry { key: number; id: number }
let eid = 1

function hash(k: number, size: number) { return ((k % size) + size) % size }

export default function HashingVisualizer() {
  const [size, setSize] = useState(7)
  const [mode, setMode] = useState<Mode>('chaining')
  const [input, setInput] = useState('15')
  const [table, setTable] = useState<(Entry[] | (Entry | null))[]>(() => Array.from({ length: 7 }, () => []))
  const [msg, setMsg] = useState('Choose a collision strategy, then insert/search/delete keys.')
  const [highlight, setHighlight] = useState<number[]>([])
  const [found, setFound] = useState<number | null>(null)

  const reset = (m: Mode = mode, s: number = size) => {
    setMode(m); setSize(s); setHighlight([]); setFound(null)
    setTable(Array.from({ length: s }, () => m === 'chaining' ? [] : null))
    setMsg(`Reset table (size ${s}, ${m}).`)
  }

  const insert = () => {
    const k = Math.round(Number(input)); if (!Number.isFinite(k)) return
    setFound(null)
    if (mode === 'chaining') {
      const idx = hash(k, size)
      setTable(t => {
        const n = t.map(b => Array.isArray(b) ? [...b] : b) as Entry[][]
        const bucket = n[idx]
        if (bucket.some(e => e.key === k)) { setMsg(`${k} already exists in bucket ${idx}.`); setHighlight([idx]); return t }
        bucket.push({ key: k, id: eid++ })
        setMsg(`h(${k}) = ${idx}. Inserted ${k} into bucket ${idx}${bucket.length > 1 ? ' (collision handled by chaining)' : ''}.`)
        setHighlight([idx])
        return n
      })
    } else {
      setTable(t => {
        const n = t.slice() as (Entry | null)[]
        let i = 0; let idx = -1
        const tried: number[] = []
        while (i < size) {
          idx = mode === 'linear' ? (hash(k, size) + i) % size : (hash(k, size) + i * i) % size
          tried.push(idx)
          const cur = n[idx]
          if (cur === null) {
            n[idx] = { key: k, id: eid++ }
            setMsg(`Inserted ${k} at index ${idx}. Probes: ${tried.join(' → ')}${tried.length > 1 ? ' (collision resolved)' : ''}.`)
            setHighlight(tried); setFound(idx)
            return n
          }
          if (cur.key === k) { setMsg(`${k} already exists at index ${idx}.`); setHighlight(tried); setFound(idx); return t }
          i++
        }
        setMsg(`Table full or no slot found for ${k}. Probes: ${tried.join(' → ')}`)
        setHighlight(tried)
        return t
      })
    }
  }

  const search = () => {
    const k = Math.round(Number(input)); if (!Number.isFinite(k)) return
    if (mode === 'chaining') {
      const idx = hash(k, size)
      const bucket = table[idx] as Entry[]
      const hit = bucket.find(e => e.key === k)
      setHighlight([idx]); setFound(hit ? idx : null)
      setMsg(hit ? `Found ${k} in bucket ${idx}.` : `${k} not found in bucket ${idx}.`)
    } else {
      const n = table as (Entry|null)[]
      let i=0; const tried:number[]=[]
      while (i<size) {
        const idx = mode==='linear' ? (hash(k,size)+i)%size : (hash(k,size)+i*i)%size
        tried.push(idx)
        const cur=n[idx]
        if (cur===null) { setHighlight(tried); setFound(null); setMsg(`${k} not found. Empty slot at ${idx}.`); return }
        if (cur.key===k) { setHighlight(tried); setFound(idx); setMsg(`Found ${k} at index ${idx}. Probes: ${tried.join(' → ')}`); return }
        i++
      }
      setHighlight(tried); setFound(null); setMsg(`${k} not found after probing all slots.`)
    }
  }

  const remove = () => {
    const k = Math.round(Number(input)); if (!Number.isFinite(k)) return
    setFound(null)
    if (mode === 'chaining') {
      const idx = hash(k,size)
      setTable(t => {
        const n = t.map(b => Array.isArray(b) ? [...b] : b) as Entry[][]
        const b = n[idx]
        const bi = b.findIndex(e=>e.key===k)
        if (bi===-1) { setMsg(`${k} not found in bucket ${idx}.`); setHighlight([idx]); return t }
        b.splice(bi,1)
        setMsg(`Deleted ${k} from bucket ${idx}.`)
        setHighlight([idx])
        return n
      })
    } else {
      const idx = (table as (Entry|null)[]).findIndex(e=>e?.key===k)
      if (idx===-1) { setMsg(`${k} not found.`); setHighlight([]); return }
      setTable(t => { const n=t.slice() as (Entry|null)[]; n[idx]=null; return n })
      setHighlight([idx]); setMsg(`Deleted ${k} from index ${idx}. (Simple delete; probing chains may be affected in real open addressing.)`)
    }
  }

  const loadFactor = useMemo(() => {
    const count = mode === 'chaining' ? (table as Entry[][]).reduce((s,b)=>s+b.length,0) : (table as (Entry|null)[]).filter(Boolean).length
    return (count / size).toFixed(2)
  }, [table, size, mode])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Hashing Visualizer" description="Explore hash functions, collisions, and collision resolution strategies." />
      <div className="flex flex-wrap gap-2 mb-5">
        {([['chaining','Chaining'],['linear','Linear Probing'],['quadratic','Quadratic Probing']] as [Mode,string][]).map(([m,label])=>(
          <button key={m} onClick={()=>reset(m,size)} className={`px-4 py-2 rounded-full text-sm border ${mode===m?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5">
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div><label className="text-xs text-slate-400 block mb-1">Key</label><input value={input} onChange={e=>setInput(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">Table size</label><input type="number" min={3} max={15} value={size} onChange={e=>{const s=Math.max(3,Math.min(15,Math.round(Number(e.target.value)||7))); setSize(s); reset(mode,s)}} className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
            <button onClick={insert} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15}/> Insert</button>
            <button onClick={search} className="px-3 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 text-sm flex items-center gap-1"><Search size={15}/> Search</button>
            <button onClick={remove} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex items-center gap-1"><Trash2 size={15}/> Delete</button>
            <button onClick={()=>reset(mode,size)} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex items-center gap-1"><RotateCcw size={15}/> Reset</button>
          </div>
          <div className="text-sm text-slate-300 mb-4 min-h-[40px]">{msg}</div>

          <div className="space-y-2">
            {Array.from({length:size}).map((_,i)=>{
              const hl = highlight.includes(i)
              const isFound = found===i
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${isFound?'border-emerald-500/50 bg-emerald-900/10':hl?'border-amber-500/40 bg-amber-900/10':'border-slate-800 bg-slate-900/30'}`}>
                  <div className="w-10 text-xs text-slate-500 font-mono">[{i}]</div>
                  <div className="flex flex-wrap gap-2 items-center flex-1">
                    {mode === 'chaining' ? (
                      ((table[i] as Entry[])||[]).length ? (table[i] as Entry[]).map((e,bi)=>(
                        <div key={e.id} className="flex items-center gap-1">
                          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-slate-200 text-sm font-mono">{e.key}</span>
                          {bi < (table[i] as Entry[]).length-1 && <span className="text-slate-600">→</span>}
                        </div>
                      )) : <span className="text-slate-600 text-sm">empty</span>
                    ) : (
                      (table[i] as Entry|null) ? <span className={`px-2.5 py-1 rounded border text-sm font-mono ${isFound?'bg-emerald-900/40 border-emerald-500 text-emerald-200':'bg-slate-800 border-slate-600 text-slate-200'}`}>{(table[i] as Entry).key}</span> : <span className="text-slate-600 text-sm">empty</span>
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
            <p><span className="text-slate-300">Hash function:</span> h(k) = k mod {size}</p>
            <p><span className="text-slate-300">Strategy:</span> {mode==='chaining'?'Chaining':mode==='linear'?'Linear Probing (h(k)+i)%m':'Quadratic Probing (h(k)+i²)%m'}</p>
            <p><span className="text-slate-300">Load factor:</span> {loadFactor}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 text-sm text-slate-400 space-y-2">
            <h3 className="text-white font-semibold">Collision Resolution</h3>
            <p><span className="text-slate-300">Chaining:</span> store colliding keys in a bucket list.</p>
            <p><span className="text-slate-300">Linear probing:</span> try next slots sequentially.</p>
            <p><span className="text-slate-300">Quadratic probing:</span> try slots at i² offsets to reduce clustering.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
