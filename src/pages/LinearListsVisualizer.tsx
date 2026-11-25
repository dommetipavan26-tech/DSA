import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, Trash2, Search, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'

type Mode = 'array' | 'singly' | 'doubly' | 'circular'
interface Node { id: number; val: number }
let nid = 1
const mk = (v: number): Node => ({ id: nid++, val: v })
const init = () => { nid = 1; return [mk(10), mk(20), mk(30), mk(40)] }

export default function LinearListsVisualizer() {
  const [mode, setMode] = useState<Mode>('singly')
  const [arr, setArr] = useState<number[]>([10,20,30,40])
  const [nodes, setNodes] = useState<Node[]>(init)
  const [val, setVal] = useState('50')
  const [idx, setIdx] = useState('2')
  const [msg, setMsg] = useState('Choose a structure and perform insert/delete/search operations.')
  const [hl, setHl] = useState<number | null>(null)

  const v = () => { const n = Math.round(Number(val)); return Number.isFinite(n) ? n : null }
  const i = () => { const n = Math.round(Number(idx)); return Number.isFinite(n) ? n : 0 }
  const reset = (m: Mode = mode) => { nid=1; setMode(m); setArr([10,20,30,40]); setNodes([mk(10),mk(20),mk(30),mk(40)]); setHl(null); setMsg(`${m} reset.`) }

  const insertHead = () => { const x=v(); if(x===null) return; if(mode==='array'){setArr(a=>[x,...a]); setMsg(`Inserted ${x} at index 0 (array shifts elements right).`)} else {const nn=mk(x); setNodes(n=>[nn,...n]); setHl(nn.id); setMsg(`Inserted ${x} at head.`)} }
  const insertTail = () => { const x=v(); if(x===null) return; if(mode==='array'){setArr(a=>[...a,x]); setMsg(`Inserted ${x} at end.`)} else {const nn=mk(x); setNodes(n=>[...n,nn]); setHl(nn.id); setMsg(`Inserted ${x} at tail.`)} }
  const insertAt = () => { const x=v(); if(x===null) return; const p=Math.max(0,Math.min(i(), mode==='array'?arr.length:nodes.length)); if(mode==='array'){setArr(a=>{const n=a.slice(); n.splice(p,0,x); return n}); setMsg(`Inserted ${x} at index ${p}.`)} else {const nn=mk(x); setNodes(n=>{const c=n.slice(); c.splice(p,0,nn); return c}); setHl(nn.id); setMsg(`Inserted ${x} at index ${p}.`)} }
  const deleteVal = () => { const x=v(); if(x===null) return; setHl(null); if(mode==='array'){setArr(a=>{const k=a.indexOf(x); if(k===-1){setMsg(`${x} not found.`); return a} const n=a.slice(); n.splice(k,1); setMsg(`Deleted ${x} at index ${k}.`); return n})} else {setNodes(n=>{const k=n.findIndex(z=>z.val===x); if(k===-1){setMsg(`${x} not found.`); return n} const c=n.slice(); c.splice(k,1); setMsg(`Deleted ${x}.`); return c})} }
  const searchVal = () => { const x=v(); if(x===null) return; if(mode==='array'){const k=arr.indexOf(x); setMsg(k===-1?`${x} not found.`:`Found ${x} at index ${k}.`)} else {const k=nodes.findIndex(z=>z.val===x); if(k===-1){setHl(null); setMsg(`${x} not found.`)} else {setHl(nodes[k].id); setMsg(`Found ${x} at index ${k}.`)}} }

  const modeLabel: Record<Mode,string> = { array:'List (Array)', singly:'Singly Linked List', doubly:'Doubly Linked List', circular:'Circular Linked List' }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Lists & Linked Lists" description="Visualize List, Singly, Doubly, and Circular Linked List operations." />
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(modeLabel) as Mode[]).map(m => <button key={m} onClick={()=>reset(m)} className={`px-4 py-2 rounded-full text-sm border ${mode===m?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{modeLabel[m]}</button>)}
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div><label className="text-xs text-slate-400 block mb-1">Value</label><input value={val} onChange={e=>setVal(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <div><label className="text-xs text-slate-400 block mb-1">Index</label><input value={idx} onChange={e=>setIdx(e.target.value)} className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <button onClick={insertHead} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Head</button>
          <button onClick={insertTail} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Tail</button>
          <button onClick={insertAt} className="px-3 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>At Index</button>
          <button onClick={deleteVal} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex gap-1 items-center"><Trash2 size={15}/>Delete</button>
          <button onClick={searchVal} className="px-3 py-2 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-sm flex gap-1 items-center"><Search size={15}/>Search</button>
          <button onClick={()=>reset(mode)} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex gap-1 items-center"><RotateCcw size={15}/>Reset</button>
        </div>
        <div className="text-sm text-slate-300 mb-5">{msg}</div>

        <div className="overflow-x-auto py-6">
          {mode === 'array' ? (
            <div className="flex gap-2 min-w-max px-2">
              {arr.map((x,k)=>(
                <div key={k} className="flex flex-col items-center gap-1">
                  <div className="w-16 h-14 rounded-lg border-2 border-indigo-500/50 bg-slate-800 flex items-center justify-center text-white font-semibold">{x}</div>
                  <span className="text-[10px] text-slate-500">{k}</span>
                </div>
              ))}
              {arr.length===0 && <span className="text-slate-500">Empty list</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-max px-2">
              {mode!=='circular' && <span className="text-xs text-slate-500 font-mono mr-1">HEAD</span>}
              {nodes.map((n,k)=>(
                <div key={n.id} className="flex items-center gap-2">
                  {mode==='doubly' && k>0 && <ArrowLeft size={16} className="text-slate-600" />}
                  <div className={`w-20 h-16 rounded-xl border-2 flex flex-col items-center justify-center ${hl===n.id?'bg-cyan-900/40 border-cyan-400 text-cyan-200':'bg-slate-800 border-slate-600 text-slate-200'}`}>
                    <span className="font-bold">{n.val}</span>
                    <span className="text-[10px] text-slate-500">idx {k}</span>
                  </div>
                  {k < nodes.length-1 ? <ArrowRight size={18} className="text-slate-500" /> : mode==='circular' ? <span className="text-xs text-cyan-400 font-mono">→ HEAD</span> : <span className="text-slate-600 text-sm font-mono ml-1">NULL</span>}
                </div>
              ))}
              {nodes.length===0 && <span className="text-slate-500 font-mono">Empty</span>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5 text-sm text-slate-400">
        <h3 className="text-white font-semibold mb-2">{modeLabel[mode]}</h3>
        {mode==='array' && <p>Array/list stores elements contiguously. Index access is O(1), but middle inserts/deletes require shifting elements.</p>}
        {mode==='singly' && <p>Each node stores data and a next pointer. Insert/delete at head is O(1); search is O(n).</p>}
        {mode==='doubly' && <p>Each node has next and prev pointers, allowing traversal in both directions. Deletion is easier when node reference is known.</p>}
        {mode==='circular' && <p>The last node points back to head, forming a circle. Useful for round-robin scheduling and cyclic traversals.</p>}
      </div>
    </motion.div>
  )
}
