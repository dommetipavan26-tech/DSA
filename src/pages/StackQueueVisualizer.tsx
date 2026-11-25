import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, Minus, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'

type Mode = 'stack' | 'queue' | 'deque' | 'priority'

export default function StackQueueVisualizer() {
  const [mode, setMode] = useState<Mode>('stack')
  const [stack, setStack] = useState<number[]>([10,20,30])
  const [queue, setQueue] = useState<number[]>([10,20,30])
  const [deque, setDeque] = useState<number[]>([10,20,30])
  const [pq, setPq] = useState<number[]>([40,20,35,10]) // max-priority by value
  const [val, setVal] = useState('40')
  const [msg, setMsg] = useState('Stack follows LIFO (Last In, First Out).')

  const v = () => { const n=Math.round(Number(val)); return Number.isFinite(n)?n:null }
  const reset = (m: Mode) => {
    setMode(m)
    setStack([10,20,30]); setQueue([10,20,30]); setDeque([10,20,30]); setPq([40,20,35,10])
    setMsg(m==='stack'?'Stack follows LIFO.':m==='queue'?'Queue follows FIFO.':m==='deque'?'Deque supports insertion/deletion at both ends.':'Priority Queue serves highest-priority element first (max value = highest priority).')
  }

  const push = () => { const x=v(); if(x===null) return; setStack(s=>[...s,x]); setMsg(`Pushed ${x}.`) }
  const pop = () => { setStack(s=>{ if(!s.length){setMsg('Stack underflow.'); return s} const x=s[s.length-1]; setMsg(`Popped ${x}.`); return s.slice(0,-1) }) }
  const enqueue = () => { const x=v(); if(x===null) return; setQueue(q=>[...q,x]); setMsg(`Enqueued ${x}.`) }
  const dequeue = () => { setQueue(q=>{ if(!q.length){setMsg('Queue underflow.'); return q} setMsg(`Dequeued ${q[0]}.`); return q.slice(1) }) }
  const pushFront = () => { const x=v(); if(x===null) return; setDeque(d=>[x,...d]); setMsg(`Inserted ${x} at front.`) }
  const pushBack = () => { const x=v(); if(x===null) return; setDeque(d=>[...d,x]); setMsg(`Inserted ${x} at back.`) }
  const popFront = () => { setDeque(d=>{ if(!d.length){setMsg('Deque empty.'); return d} setMsg(`Removed ${d[0]} from front.`); return d.slice(1) }) }
  const popBack = () => { setDeque(d=>{ if(!d.length){setMsg('Deque empty.'); return d} setMsg(`Removed ${d[d.length-1]} from back.`); return d.slice(0,-1) }) }
  const pqInsert = () => { const x=v(); if(x===null) return; setPq(q=>{ const n=[...q,x].sort((a,b)=>b-a); setMsg(`Inserted ${x}. Queue reordered by priority.`); return n }) }
  const pqExtract = () => { setPq(q=>{ if(!q.length){setMsg('Priority queue empty.'); return q} setMsg(`Extracted highest priority ${q[0]}.`); return q.slice(1) }) }

  const Tab = ({m,label}:{m:Mode;label:string}) => <button onClick={()=>reset(m)} className={`px-4 py-2 rounded-full text-sm border ${mode===m?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{label}</button>

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Stacks & Queues" description="Stack, Queue, Deque, and Priority Queue with core operations." />
      <div className="flex flex-wrap gap-2 mb-5">
        <Tab m="stack" label="Stack" /><Tab m="queue" label="Queue" /><Tab m="deque" label="Deque" /><Tab m="priority" label="Priority Queue" />
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5">
        <p className="text-sm text-slate-300 mb-4 min-h-[40px]">{msg}</p>
        <div className="flex flex-wrap gap-2 mb-5 items-end">
          <div><label className="text-xs text-slate-400 block mb-1">Value</label><input value={val} onChange={e=>setVal(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          {mode==='stack' && <><button onClick={push} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Push</button><button onClick={pop} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex gap-1 items-center"><Minus size={15}/>Pop</button></>}
          {mode==='queue' && <><button onClick={enqueue} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Enqueue</button><button onClick={dequeue} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex gap-1 items-center"><Minus size={15}/>Dequeue</button></>}
          {mode==='deque' && <><button onClick={pushFront} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm">Push Front</button><button onClick={pushBack} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm">Push Back</button><button onClick={popFront} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm">Pop Front</button><button onClick={popBack} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm">Pop Back</button></>}
          {mode==='priority' && <><button onClick={pqInsert} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Insert</button><button onClick={pqExtract} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex gap-1 items-center"><Minus size={15}/>Extract Max</button></>}
          <button onClick={()=>reset(mode)} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex gap-1 items-center"><RotateCcw size={15}/>Reset</button>
        </div>

        {mode==='stack' && (
          <div className="flex justify-center"><div className="w-52 min-h-[280px] border-x-2 border-b-2 border-slate-600 rounded-b-lg bg-slate-900/40 flex flex-col-reverse p-2 gap-2">
            {stack.map((x,i)=><div key={i} className={`h-10 rounded-md flex items-center justify-center font-semibold text-sm border ${i===stack.length-1?'bg-cyan-900/50 border-cyan-500 text-cyan-200':'bg-slate-800 border-slate-700 text-slate-200'}`}>{x}</div>)}
            {stack.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
          </div></div>
        )}
        {mode==='queue' && (
          <div className="min-h-[200px] flex items-center"><div className="w-full">
            <div className="flex justify-between text-xs text-slate-500 mb-2 px-1"><span>Front</span><span>Rear</span></div>
            <div className="flex gap-2 items-center overflow-x-auto p-3 bg-slate-900/40 rounded-lg border border-slate-700 min-h-[88px]">
              {queue.map((x,i)=><div key={i} className="flex items-center gap-2 shrink-0"><div className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold border ${i===0?'bg-amber-900/50 border-amber-500 text-amber-200':i===queue.length-1?'bg-cyan-900/40 border-cyan-500 text-cyan-200':'bg-slate-800 border-slate-700 text-slate-200'}`}>{x}</div>{i<queue.length-1&&<ArrowRight size={16} className="text-slate-600"/>}</div>)}
              {queue.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
            </div>
          </div></div>
        )}
        {mode==='deque' && (
          <div className="min-h-[200px] flex items-center"><div className="w-full">
            <div className="flex justify-between text-xs text-slate-500 mb-2 px-1"><span><ArrowLeft size={12} className="inline"/> Front</span><span>Back <ArrowRight size={12} className="inline"/></span></div>
            <div className="flex gap-2 items-center overflow-x-auto p-3 bg-slate-900/40 rounded-lg border border-slate-700 min-h-[88px]">
              {deque.map((x,i)=><div key={i} className="flex items-center gap-2 shrink-0"><div className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold border ${i===0||i===deque.length-1?'bg-violet-900/40 border-violet-500 text-violet-200':'bg-slate-800 border-slate-700 text-slate-200'}`}>{x}</div>{i<deque.length-1&&<span className="text-slate-600">↔</span>}</div>)}
              {deque.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
            </div>
          </div></div>
        )}
        {mode==='priority' && (
          <div className="min-h-[200px]"><div className="text-xs text-slate-500 mb-2">Highest priority (max value) at front</div>
            <div className="flex gap-2 items-center overflow-x-auto p-3 bg-slate-900/40 rounded-lg border border-slate-700 min-h-[88px]">
              {pq.map((x,i)=><div key={i} className="flex items-center gap-2 shrink-0"><div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-semibold border ${i===0?'bg-amber-900/50 border-amber-500 text-amber-200':'bg-slate-800 border-slate-700 text-slate-200'}`}><span>{x}</span><span className="text-[9px] text-slate-500">p{i===0?' max':''}</span></div>{i<pq.length-1&&<ArrowRight size={16} className="text-slate-600"/>}</div>)}
              {pq.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
