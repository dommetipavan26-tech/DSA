import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, Trash2, Search, RotateCcw, ArrowRight } from 'lucide-react'

interface Node { id: number; val: number }
let nextId = 1
function node(v: number): Node { return { id: nextId++, val: v } }

export default function LinkedListVisualizer() {
  const [list, setList] = useState<Node[]>(() => { nextId=1; return [node(10), node(20), node(30), node(40)] })
  const [valInput, setValInput] = useState('50')
  const [idxInput, setIdxInput] = useState('2')
  const [msg, setMsg] = useState('Singly linked list: each node points to the next.')
  const [highlight, setHighlight] = useState<number | null>(null)
  const [found, setFound] = useState<number | null>(null)

  const v = () => { const n=Math.round(Number(valInput)); return Number.isFinite(n)?n:null }
  const idx = () => { const n=Math.round(Number(idxInput)); return Number.isFinite(n)?n:NaN }

  const clearHL = () => { setHighlight(null); setFound(null) }
  const insertHead = () => { const n=v(); if(n===null) return; clearHL(); const nd=node(n); setList(l=>[nd,...l]); setHighlight(nd.id); setMsg(`Inserted ${n} at head.`) }
  const insertTail = () => { const n=v(); if(n===null) return; clearHL(); const nd=node(n); setList(l=>[...l,nd]); setHighlight(nd.id); setMsg(`Inserted ${n} at tail.`) }
  const insertAt = () => { const n=v(), i=idx(); if(n===null||!Number.isFinite(i)) return; clearHL(); setList(l=>{ const ii=Math.max(0,Math.min(i,l.length)); const nd=node(n); const nl=[...l]; nl.splice(ii,0,nd); setHighlight(nd.id); setMsg(`Inserted ${n} at index ${ii}.`); return nl }) }
  const deleteVal = () => { const n=v(); if(n===null) return; clearHL(); setList(l=>{ const i=l.findIndex(x=>x.val===n); if(i===-1){setMsg(`${n} not found.`); return l} const nl=[...l]; nl.splice(i,1); setMsg(`Deleted ${n} from index ${i}.`); return nl }) }
  const searchVal = () => { const n=v(); if(n===null) return; setHighlight(null); const i=list.findIndex(x=>x.val===n); if(i===-1){setFound(null); setMsg(`${n} not found in the list.`)} else {setFound(list[i].id); setMsg(`Found ${n} at index ${i}.`)} }
  const reset = () => { nextId=1; setList([node(10),node(20),node(30),node(40)]); clearHL(); setMsg('List reset.') }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Linked List Visualizer" description="Visualize singly linked list operations: insert, delete, search, traverse." />
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div><label className="text-xs text-slate-400 block mb-1">Value</label><input value={valInput} onChange={e=>setValInput(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <div><label className="text-xs text-slate-400 block mb-1">Index</label><input value={idxInput} onChange={e=>setIdxInput(e.target.value)} className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <button onClick={insertHead} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15}/> Head</button>
          <button onClick={insertTail} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15}/> Tail</button>
          <button onClick={insertAt} className="px-3 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 text-sm flex items-center gap-1"><Plus size={15}/> At Index</button>
          <button onClick={deleteVal} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex items-center gap-1"><Trash2 size={15}/> Delete</button>
          <button onClick={searchVal} className="px-3 py-2 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-sm flex items-center gap-1"><Search size={15}/> Search</button>
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm flex items-center gap-1"><RotateCcw size={15}/> Reset</button>
        </div>
        <div className="text-sm text-slate-300 mb-5">{msg}</div>
        <div className="overflow-x-auto py-6">
          <div className="flex items-center gap-2 min-w-max px-2">
            <div className="text-xs text-slate-500 font-mono mr-1">HEAD</div>
            {list.map((n, i) => (
              <div key={n.id} className="flex items-center gap-2">
                <div className={`relative w-20 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${found===n.id ? 'bg-emerald-900/50 border-emerald-400 text-emerald-200' : highlight===n.id ? 'bg-cyan-900/50 border-cyan-400 text-cyan-200' : 'bg-slate-800 border-slate-600 text-slate-200'}`}>
                  <span className="font-bold">{n.val}</span>
                  <span className="text-[10px] text-slate-500">idx {i}</span>
                </div>
                {i < list.length - 1 ? <ArrowRight className="text-slate-500 shrink-0" size={20} /> : <span className="text-slate-600 text-sm font-mono ml-1">NULL</span>}
              </div>
            ))}
            {list.length === 0 && <span className="text-slate-500 font-mono">NULL (empty list)</span>}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5 text-sm text-slate-400">
        <h3 className="text-white font-semibold mb-2">About Singly Linked List</h3>
        <p>A linked list is a linear structure where each node holds a value and a reference to the next node. Unlike arrays, nodes are not contiguous in memory. Insert/delete at head is O(1); search and indexed operations are O(n).</p>
      </div>
    </motion.div>
  )
}
