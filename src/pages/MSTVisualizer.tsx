import { useEffect, useRef, useState } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw } from 'lucide-react'

type Mode = 'prim' | 'kruskal'
interface N { id:string; x:number; y:number }
interface E { a:string; b:string; w:number }
interface Step { visited:string[]; mst:string[]; active:string|null; edge:string|null; description:string; total:number }

const NODES:N[]=[{id:'A',x:120,y:80},{id:'B',x:320,y:60},{id:'C',x:520,y:90},{id:'D',x:100,y:240},{id:'E',x:300,y:220},{id:'F',x:500,y:250},{id:'G',x:300,y:350}]
const EDGES:E[]=[{a:'A',b:'B',w:4},{a:'A',b:'D',w:2},{a:'B',b:'C',w:6},{a:'B',b:'E',w:5},{a:'C',b:'F',w:3},{a:'D',b:'E',w:1},{a:'D',b:'G',w:7},{a:'E',b:'F',w:4},{a:'E',b:'G',w:3},{a:'F',b:'G',w:2},{a:'B',b:'D',w:8}]
const ek=(a:string,b:string)=>[a,b].sort().join('-')

function prim(): Step[] {
  const steps:Step[]=[]; const visited:string[]=['A']; const mst:string[]=[]; let total=0
  steps.push({visited:[...visited],mst:[],active:'A',edge:null,description:'Start Prim\'s at A.',total:0})
  while(visited.length<NODES.length){
    let best:E|null=null
    for(const e of EDGES){ const inA=visited.includes(e.a), inB=visited.includes(e.b); if(inA!==inB){ if(!best||e.w<best.w) best=e } }
    if(!best) break
    const next=visited.includes(best.a)?best.b:best.a
    const key=ek(best.a,best.b)
    steps.push({visited:[...visited],mst:[...mst],active:next,edge:key,description:`Pick minimum edge ${best.a}-${best.b} (w=${best.w}) connecting to ${next}.`,total})
    visited.push(next); mst.push(key); total+=best.w
    steps.push({visited:[...visited],mst:[...mst],active:next,edge:key,description:`Added ${next} to MST. Total=${total}.`,total})
  }
  steps.push({visited:[...visited],mst:[...mst],active:null,edge:null,description:`Prim's complete. MST weight=${total}.`,total})
  return steps
}
function kruskal(): Step[] {
  const steps:Step[]=[]; const sorted=[...EDGES].sort((a,b)=>a.w-b.w)
  const parent:Record<string,string>={}; NODES.forEach(n=>parent[n.id]=n.id)
  const find=(x:string):string=>parent[x]===x?x:(parent[x]=find(parent[x]))
  const union=(a:string,b:string)=>{a=find(a);b=find(b); if(a!==b) parent[b]=a; return a!==b}
  const mst:string[]=[]; let total=0
  steps.push({visited:[],mst:[],active:null,edge:null,description:"Sort edges by weight and process smallest first.",total:0})
  for(const e of sorted){
    const key=ek(e.a,e.b)
    steps.push({visited:[],mst:[...mst],active:null,edge:key,description:`Consider edge ${e.a}-${e.b} (w=${e.w}).`,total})
    if(union(e.a,e.b)){ mst.push(key); total+=e.w; steps.push({visited:[],mst:[...mst],active:null,edge:key,description:`Add ${e.a}-${e.b}. No cycle. Total=${total}.`,total}) }
    else steps.push({visited:[],mst:[...mst],active:null,edge:key,description:`Skip ${e.a}-${e.b}; it would form a cycle.`,total})
  }
  steps.push({visited:NODES.map(n=>n.id),mst:[...mst],active:null,edge:null,description:`Kruskal's complete. MST weight=${total}.`,total})
  return steps
}

export default function MSTVisualizer() {
  const [mode,setMode]=useState<Mode>('prim')
  const [steps,setSteps]=useState<Step[]>(()=>prim())
  const [i,setI]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [speed]=useState(900)
  const t=useRef<number|null>(null)
  const s=steps[i]
  useEffect(()=>{ if(!playing) return; t.current=window.setInterval(()=>setI(x=>{ if(x>=steps.length-1){setPlaying(false);return x} return x+1 }),speed); return ()=>{if(t.current)window.clearInterval(t.current)} },[playing,steps.length,speed])
  const run=(m:Mode)=>{ setMode(m); setSteps(m==='prim'?prim():kruskal()); setI(0); setPlaying(true) }
  const inMST=(e:E)=>s.mst.includes(ek(e.a,e.b))
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Minimum Spanning Tree</h1><p className="text-slate-400 mt-1">Visualize Prim’s and Kruskal’s algorithms.</p></div>
      <div className="flex gap-2 mb-4">
        <button onClick={()=>run('prim')} className={`px-4 py-2 rounded-lg text-sm border ${mode==='prim'?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>Prim's</button>
        <button onClick={()=>run('kruskal')} className={`px-4 py-2 rounded-lg text-sm border ${mode==='kruskal'?'bg-cyan-500/20 text-cyan-200 border-cyan-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>Kruskal's</button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5">
        <div className="text-sm text-slate-300 mb-3">Step {i+1}/{steps.length} — {s.description}</div>
        <div className="bg-[#0c1324] border border-slate-800 rounded-lg overflow-x-auto">
          <svg viewBox="0 0 620 420" className="w-full h-auto" style={{minWidth:320}}>
            {EDGES.map((e,idx)=>{ const a=NODES.find(n=>n.id===e.a)!, b=NODES.find(n=>n.id===e.b)!; const k=ek(e.a,e.b); const active=s.edge===k; const mst=inMST(e); return <g key={idx}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={mst?'#22c55e':active?'#f59e0b':'#334155'} strokeWidth={mst?4:active?3:2}/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-6} fill={mst?'#86efac':active?'#fde68a':'#94a3b8'} fontSize="11" textAnchor="middle">{e.w}</text></g> })}
            {NODES.map(n=>{ const vis=s.visited.includes(n.id); const active=s.active===n.id; return <g key={n.id}><circle cx={n.x} cy={n.y} r="22" fill={active?'#78350f':vis||s.mst.length>0&&mode==='kruskal'?'#1e293b':'#1e293b'} stroke={active?'#f59e0b':vis?'#22c55e':'#475569'} strokeWidth="2.5"/><text x={n.x} y={n.y+1} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="14" fontWeight="700">{n.id}</text></g> })}
          </svg>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={()=>{setPlaying(false);setI(0)}} className="p-2 rounded-lg bg-slate-800 text-slate-200"><RotateCcw size={18}/></button>
          <button onClick={()=>setI(x=>Math.max(0,x-1))} className="p-2 rounded-lg bg-slate-800 text-slate-200"><StepBack size={18}/></button>
          <button onClick={()=>{ if(i>=steps.length-1) setI(0); setPlaying(p=>!p)}} className="px-4 py-2 rounded-lg bg-violet-600 text-white flex items-center gap-2">{playing?<><Pause size={18}/>Pause</>:<><Play size={18}/>Play</>}</button>
          <button onClick={()=>setI(x=>Math.min(steps.length-1,x+1))} className="p-2 rounded-lg bg-slate-800 text-slate-200"><StepForward size={18}/></button>
          <span className="ml-auto text-sm text-slate-400">MST weight: <span className="text-white font-semibold">{s.total}</span></span>
        </div>
      </div>
    </div>
  )
}
