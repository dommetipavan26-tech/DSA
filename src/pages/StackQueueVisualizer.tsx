import { useState } from 'react'
import { Plus, Minus, RotateCcw, ArrowRight, ArrowDown } from 'lucide-react'

export default function StackQueueVisualizer() {
  const [stack, setStack] = useState<number[]>([10, 20, 30])
  const [queue, setQueue] = useState<number[]>([10, 20, 30])
  const [sInput, setSInput] = useState('40')
  const [qInput, setQInput] = useState('40')
  const [sMsg, setSMsg] = useState('Stack follows LIFO (Last In, First Out).')
  const [qMsg, setQMsg] = useState('Queue follows FIFO (First In, First Out).')
  const [sHighlight, setSHighlight] = useState<number | null>(null)
  const [qHighlight, setQHighlight] = useState<number | null>(null)

  const pushStack = () => { const v = Math.round(Number(sInput)); if(!Number.isFinite(v)) return; setStack(s=>{ const n=[...s,v]; setSHighlight(n.length-1); return n }); setSMsg(`Pushed ${v} onto the stack.`) }
  const popStack = () => { setStack(s=>{ if(!s.length){setSMsg('Stack underflow — nothing to pop.'); return s} const v=s[s.length-1]; const n=s.slice(0,-1); setSHighlight(null); setSMsg(`Popped ${v} from the top of the stack.`); return n }) }
  const enqueue = () => { const v=Math.round(Number(qInput)); if(!Number.isFinite(v)) return; setQueue(q=>{ const n=[...q,v]; setQHighlight(n.length-1); return n }); setQMsg(`Enqueued ${v} at the rear.`) }
  const dequeue = () => { setQueue(q=>{ if(!q.length){setQMsg('Queue underflow — nothing to dequeue.'); return q} const v=q[0]; const n=q.slice(1); setQHighlight(null); setQMsg(`Dequeued ${v} from the front.`); return n }) }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Stack & Queue Visualizer</h1><p className="text-slate-400 mt-1">Understand LIFO and FIFO with interactive operations.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stack */}
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Stack <span className="text-sm font-normal text-cyan-400">(LIFO)</span></h2>
            <button onClick={()=>{setStack([10,20,30]);setSMsg('Stack reset.');setSHighlight(null)}} className="text-slate-400 hover:text-white"><RotateCcw size={18}/></button>
          </div>
          <p className="text-sm text-slate-400 mb-4 min-h-[40px]">{sMsg}</p>
          <div className="flex gap-2 mb-5">
            <input value={sInput} onChange={e=>setSInput(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" />
            <button onClick={pushStack} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15}/> Push</button>
            <button onClick={popStack} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex items-center gap-1"><Minus size={15}/> Pop</button>
          </div>
          <div className="flex justify-center">
            <div className="w-48 min-h-[280px] border-x-2 border-b-2 border-slate-600 rounded-b-lg bg-slate-900/40 flex flex-col-reverse p-2 gap-2">
              {stack.map((v,i)=>(
                <div key={i} className={`h-10 rounded-md flex items-center justify-center font-semibold text-sm border ${i===stack.length-1 ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-200'} ${sHighlight===i?'ring-2 ring-emerald-400':''}`}>
                  {v}
                </div>
              ))}
              {stack.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-slate-500 flex items-center justify-center gap-1"><ArrowDown size={14}/> Top is here</div>
        </div>

        {/* Queue */}
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Queue <span className="text-sm font-normal text-amber-400">(FIFO)</span></h2>
            <button onClick={()=>{setQueue([10,20,30]);setQMsg('Queue reset.');setQHighlight(null)}} className="text-slate-400 hover:text-white"><RotateCcw size={18}/></button>
          </div>
          <p className="text-sm text-slate-400 mb-4 min-h-[40px]">{qMsg}</p>
          <div className="flex gap-2 mb-5">
            <input value={qInput} onChange={e=>setQInput(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" />
            <button onClick={enqueue} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex items-center gap-1"><Plus size={15}/> Enqueue</button>
            <button onClick={dequeue} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex items-center gap-1"><Minus size={15}/> Dequeue</button>
          </div>
          <div className="min-h-[280px] flex items-center">
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-500 mb-2 px-1"><span>Front (dequeue)</span><span>Rear (enqueue)</span></div>
              <div className="flex gap-2 items-center overflow-x-auto p-3 bg-slate-900/40 rounded-lg border border-slate-700 min-h-[88px]">
                {queue.map((v,i)=>(
                  <div key={i} className="flex items-center gap-2 shrink-0">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold border ${i===0 ? 'bg-amber-900/50 border-amber-500 text-amber-200' : i===queue.length-1 ? 'bg-cyan-900/40 border-cyan-500 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-200'} ${qHighlight===i?'ring-2 ring-emerald-400':''}`}>
                      {v}
                    </div>
                    {i < queue.length-1 && <ArrowRight size={16} className="text-slate-600" />}
                  </div>
                ))}
                {queue.length===0 && <div className="m-auto text-slate-600 text-sm">Empty</div>}
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <div><span className="text-amber-400">Front</span> — elements leave from here (dequeue).</div>
            <div><span className="text-cyan-400">Rear</span> — new elements enter here (enqueue).</div>
          </div>
        </div>
      </div>
    </div>
  )
}
