import { useEffect, useRef, useState } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw } from 'lucide-react'

type Mode = 'dijkstra' | 'floyd' | 'warshall'
interface Step { description: string; dist?: Record<string,number>; visited?: string[]; active?: string|null; matrix?: (number|string)[][]; labels?: string[] }

const nodes=['A','B','C','D','E']
const edges:[string,string,number][]=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2],['E','B',3]]
const INF=999

function dijkstra(): Step[] {
  const steps:Step[]=[]; const dist:Record<string,number>={}; const visited:string[]=[]
  nodes.forEach(n=>dist[n]=INF); dist['A']=0
  steps.push({description:'Initialize distances from source A. dist[A]=0, others=∞.',dist:{...dist},visited:[],active:'A'})
  for(let it=0;it<nodes.length;it++){
    let u:string|null=null; let best=INF
    for(const n of nodes){ if(!visited.includes(n)&&dist[n]<best){best=dist[n];u=n} }
    if(!u) break
    visited.push(u)
    steps.push({description:`Pick unvisited node ${u} with smallest distance ${dist[u]}.`,dist:{...dist},visited:[...visited],active:u})
    for(const [a,b,w] of edges){ if(a===u && !visited.includes(b) && dist[u]+w < dist[b]){ dist[b]=dist[u]+w; steps.push({description:`Relax ${u}→${b}: dist[${b}] = min(${dist[b]===dist[u]+w?INF:dist[b]}, ${dist[u]}+${w}) = ${dist[b]}.`,dist:{...dist},visited:[...visited],active:b}) } }
  }
  steps.push({description:'Dijkstra complete: shortest distances from A found.',dist:{...dist},visited:[...visited],active:null})
  return steps
}

function floyd(): Step[] {
  const steps:Step[]=[]; const n=nodes.length; const m:number[][]=Array.from({length:n},()=>Array(n).fill(INF))
  for(let i=0;i<n;i++) m[i][i]=0
  for(const [a,b,w] of edges){ m[nodes.indexOf(a)][nodes.indexOf(b)] = Math.min(m[nodes.indexOf(a)][nodes.indexOf(b)], w) }
  const snap=()=>m.map(r=>r.map(v=>v>=INF?'∞':v))
  steps.push({description:'Initial distance matrix from edge weights.',matrix:snap(),labels:[...nodes]})
  for(let k=0;k<n;k++){
    steps.push({description:`Consider intermediate node ${nodes[k]}.`,matrix:snap(),labels:[...nodes]})
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      if(m[i][k]+m[k][j] < m[i][j]){ m[i][j]=m[i][k]+m[k][j]; steps.push({description:`Update dist[${nodes[i]}][${nodes[j]}] via ${nodes[k]} = ${m[i][j]}.`,matrix:snap(),labels:[...nodes]}) }
    }
  }
  steps.push({description:'Floyd-Warshall complete: all-pairs shortest paths.',matrix:snap(),labels:[...nodes]})
  return steps
}

function warshall(): Step[] {
  const steps:Step[]=[]; const n=nodes.length; const r:number[][]=Array.from({length:n},()=>Array(n).fill(0))
  for(let i=0;i<n;i++) r[i][i]=1
  for(const [a,b] of edges){ r[nodes.indexOf(a)][nodes.indexOf(b)] = 1 }
  const snap=()=>r.map(row=>row.map(v=>v))
  steps.push({description:'Initial reachability matrix (1 = direct path/self).',matrix:snap(),labels:[...nodes]})
  for(let k=0;k<n;k++){
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      if(r[i][j]===0 && r[i][k]===1 && r[k][j]===1){ r[i][j]=1; steps.push({description:`${nodes[i]} can reach ${nodes[j]} through ${nodes[k]}.`,matrix:snap(),labels:[...nodes]}) }
    }
  }
  steps.push({description:"Warshall complete: transitive closure computed.",matrix:snap(),labels:[...nodes]})
  return steps
}

export default function ShortestPathVisualizer() {
  const [mode,setMode]=useState<Mode>('dijkstra')
  const [steps,setSteps]=useState<Step[]>(()=>dijkstra())
  const [i,setI]=useState(0); const [playing,setPlaying]=useState(false)
  const t=useRef<number|null>(null); const s=steps[i]
  useEffect(()=>{ if(!playing) return; t.current=window.setInterval(()=>setI(x=>{ if(x>=steps.length-1){setPlaying(false);return x} return x+1 }),900); return ()=>{if(t.current)window.clearInterval(t.current)} },[playing,steps.length])
  const run=(m:Mode)=>{ setMode(m); setSteps(m==='dijkstra'?dijkstra():m==='floyd'?floyd():warshall()); setI(0); setPlaying(true) }
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Shortest Path & Connectivity</h1><p className="text-slate-400 mt-1">Dijkstra, Floyd-Warshall, and Warshall algorithms.</p></div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={()=>run('dijkstra')} className={`px-4 py-2 rounded-lg text-sm border ${mode==='dijkstra'?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>Dijkstra</button>
        <button onClick={()=>run('floyd')} className={`px-4 py-2 rounded-lg text-sm border ${mode==='floyd'?'bg-cyan-500/20 text-cyan-200 border-cyan-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>Floyd-Warshall</button>
        <button onClick={()=>run('warshall')} className={`px-4 py-2 rounded-lg text-sm border ${mode==='warshall'?'bg-emerald-500/20 text-emerald-200 border-emerald-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>Warshall</button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5">
        <div className="text-sm text-slate-300 mb-3">Step {i+1}/{steps.length} — {s.description}</div>
        {mode==='dijkstra' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0c1324] border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 mb-2">Distances from A</div>
              {nodes.map(n=> <div key={n} className={`flex justify-between px-3 py-2 rounded mb-1 ${s.active===n?'bg-amber-900/30 border border-amber-600/40':'bg-slate-900/40 border border-slate-800'}`}><span className="text-slate-200 font-mono">{n}</span><span className="text-slate-300 font-mono">{(s.dist?.[n]??INF)>=INF?'∞':s.dist?.[n]}</span></div>)}
            </div>
            <div className="bg-[#0c1324] border border-slate-800 rounded-lg p-4 text-sm text-slate-400">
              <div className="font-semibold text-slate-200 mb-2">Edges</div>
              {edges.map(([a,b,w],idx)=><div key={idx} className="font-mono text-xs py-0.5">{a} → {b} (w={w})</div>)}
              <div className="mt-3 text-xs">Visited: {s.visited?.join(', ')||'—'}</div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead><tr><th className="p-2 border border-slate-700 text-slate-400"></th>{s.labels?.map(l=><th key={l} className="p-2 border border-slate-700 text-slate-300 font-mono">{l}</th>)}</tr></thead>
              <tbody>{s.matrix?.map((row,ri)=><tr key={ri}><th className="p-2 border border-slate-700 text-slate-300 font-mono">{s.labels?.[ri]}</th>{row.map((v,ci)=><td key={ci} className="p-2 border border-slate-700 text-center font-mono text-slate-200">{String(v)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={()=>{setPlaying(false);setI(0)}} className="p-2 rounded-lg bg-slate-800 text-slate-200"><RotateCcw size={18}/></button>
          <button onClick={()=>setI(x=>Math.max(0,x-1))} className="p-2 rounded-lg bg-slate-800 text-slate-200"><StepBack size={18}/></button>
          <button onClick={()=>{ if(i>=steps.length-1) setI(0); setPlaying(p=>!p)}} className="px-4 py-2 rounded-lg bg-violet-600 text-white flex items-center gap-2">{playing?<><Pause size={18}/>Pause</>:<><Play size={18}/>Play</>}</button>
          <button onClick={()=>setI(x=>Math.min(steps.length-1,x+1))} className="p-2 rounded-lg bg-slate-800 text-slate-200"><StepForward size={18}/></button>
        </div>
      </div>
    </div>
  )
}
