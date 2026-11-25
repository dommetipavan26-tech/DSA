import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useState } from 'react'

type Mode = 'tree' | 'binary' | 'full' | 'complete' | 'perfect'
const modes: {id:Mode; label:string; desc:string}[] = [
  {id:'tree', label:'Tree', desc:'A hierarchical structure with a root node and child nodes. No cycles.'},
  {id:'binary', label:'Binary Tree', desc:'Each node has at most two children: left and right.'},
  {id:'full', label:'Full Binary Tree', desc:'Every node has 0 or 2 children (no node has only one child).'},
  {id:'complete', label:'Complete Binary Tree', desc:'All levels filled except possibly the last, which is filled left to right.'},
  {id:'perfect', label:'Perfect Binary Tree', desc:'All internal nodes have 2 children and all leaves are at the same level.'},
]

function TreeSVG({mode}:{mode:Mode}) {
  const W=700,H=320
  const N=(x:number,y:number,l:string)=>({x,y,l})
  const nodes:Record<Mode, {x:number;y:number;l:string}[]> = {
    tree: [N(350,40,'A'),N(170,120,'B'),N(350,120,'C'),N(530,120,'D'),N(100,200,'E'),N(240,200,'F'),N(350,200,'G'),N(470,200,'H'),N(590,200,'I')],
    binary: [N(350,40,'1'),N(200,120,'2'),N(500,120,'3'),N(120,200,'4'),N(280,200,'5'),N(580,200,'6')],
    full: [N(350,40,'1'),N(200,120,'2'),N(500,120,'3'),N(120,200,'4'),N(280,200,'5'),N(420,200,'6'),N(580,200,'7')],
    complete: [N(350,40,'1'),N(200,120,'2'),N(500,120,'3'),N(120,200,'4'),N(280,200,'5'),N(420,200,'6')],
    perfect: [N(350,40,'1'),N(200,120,'2'),N(500,120,'3'),N(120,200,'4'),N(280,200,'5'),N(420,200,'6'),N(580,200,'7')],
  }
  const edges:Record<Mode,[number,number][]> = {
    tree:[[0,1],[0,2],[0,3],[1,4],[1,5],[2,6],[3,7],[3,8]],
    binary:[[0,1],[0,2],[1,3],[1,4],[2,5]],
    full:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]],
    complete:[[0,1],[0,2],[1,3],[1,4],[2,5]],
    perfect:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]],
  }
  const ns=nodes[mode], es=edges[mode]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{minWidth:320}}>
      {es.map(([a,b],i)=><line key={i} x1={ns[a].x} y1={ns[a].y} x2={ns[b].x} y2={ns[b].y} stroke="#475569" strokeWidth="2"/>)}
      {ns.map((n,i)=><g key={i}><circle cx={n.x} cy={n.y} r="24" fill="#1e293b" stroke="#6366f1" strokeWidth="2.5"/><text x={n.x} y={n.y+1} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="14" fontWeight="700">{n.l}</text></g>)}
    </svg>
  )
}

export default function TreeFundamentalsVisualizer() {
  const [mode,setMode]=useState<Mode>('binary')
  const cur=modes.find(m=>m.id===mode)!
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Tree Fundamentals & Types" description="Understand tree structures and common binary tree types." />
      <div className="flex flex-wrap gap-2 mb-5">
        {modes.map(m=> <button key={m.id} onClick={()=>setMode(m.id)} className={`px-4 py-2 rounded-full text-sm border ${mode===m.id?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{m.label}</button>)}
      </div>
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-5">
        <h2 className="text-white font-semibold text-lg mb-2">{cur.label}</h2>
        <p className="text-slate-400 mb-4">{cur.desc}</p>
        <div className="bg-[#0c1324]/80 border border-slate-700/60 rounded-lg backdrop-blur-sm p-2"><TreeSVG mode={mode}/></div>
      </div>
    </motion.div>
  )
}
