import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, RotateCcw } from 'lucide-react'

interface N { v:number; h:number; left:N|null; right:N|null; id:number }
let nid=1
const nn=(v:number):N=>({v,h:1,left:null,right:null,id:nid++})
const h=(n:N|null)=>n?n.h:0
const upd=(n:N)=>{ n.h=1+Math.max(h(n.left),h(n.right)); return n }
const bf=(n:N|null)=>n?h(n.left)-h(n.right):0
const rotR=(y:N)=>{ const x=y.left!; const t2=x.right; x.right=y; y.left=t2; upd(y); upd(x); return x }
const rotL=(x:N)=>{ const y=x.right!; const t2=y.left; y.left=x; x.right=t2; upd(x); upd(y); return y }

function insert(n:N|null,v:number,steps:string[]):N{
  if(!n){ steps.push(`Insert ${v}.`); return nn(v) }
  if(v<n.v){ steps.push(`${v} < ${n.v} → go left.`); n.left=insert(n.left,v,steps) }
  else if(v>n.v){ steps.push(`${v} > ${n.v} → go right.`); n.right=insert(n.right,v,steps) }
  else { steps.push(`${v} already exists.`); return n }
  upd(n); const b=bf(n)
  if(b>1 && v < n.left!.v){ steps.push(`Imbalance at ${n.v} (BF=${b}). LL rotation.`); return rotR(n) }
  if(b<-1 && v > n.right!.v){ steps.push(`Imbalance at ${n.v} (BF=${b}). RR rotation.`); return rotL(n) }
  if(b>1 && v > n.left!.v){ steps.push(`Imbalance at ${n.v} (BF=${b}). LR rotation.`); n.left=rotL(n.left!); return rotR(n) }
  if(b<-1 && v < n.right!.v){ steps.push(`Imbalance at ${n.v} (BF=${b}). RL rotation.`); n.right=rotR(n.right!); return rotL(n) }
  return n
}
function minN(n:N):N{ while(n.left) n=n.left; return n }
function del(n:N|null,v:number,steps:string[]):N|null{
  if(!n){ steps.push(`${v} not found.`); return null }
  if(v<n.v) n.left=del(n.left,v,steps)
  else if(v>n.v) n.right=del(n.right,v,steps)
  else {
    steps.push(`Delete ${v}.`)
    if(!n.left||!n.right) n=n.left||n.right
    else { const s=minN(n.right); n.v=s.v; steps.push(`Replace with inorder successor ${s.v}.`); n.right=del(n.right,s.v,steps) }
  }
  if(!n) return null
  upd(n); const b=bf(n)
  if(b>1 && bf(n.left)>=0){ steps.push(`Imbalance at ${n.v}. LL rotation.`); return rotR(n) }
  if(b>1 && bf(n.left)<0){ steps.push(`Imbalance at ${n.v}. LR rotation.`); n.left=rotL(n.left!); return rotR(n) }
  if(b<-1 && bf(n.right)<=0){ steps.push(`Imbalance at ${n.v}. RR rotation.`); return rotL(n) }
  if(b<-1 && bf(n.right)>0){ steps.push(`Imbalance at ${n.v}. RL rotation.`); n.right=rotR(n.right!); return rotL(n) }
  return n
}

function layout(root:N|null){ const pos:Record<number,{x:number;y:number;v:number;bf:number}>= {}; const edges:[number,number][]=[]; let x=0; const walk=(n:N|null,d:number)=>{ if(!n) return; walk(n.left,d+1); pos[n.id]={x:x++,y:d,v:n.v,bf:bf(n)}; if(n.left) edges.push([n.id,n.left.id]); if(n.right) edges.push([n.id,n.right.id]); walk(n.right,d+1)}; walk(root,0); const nodes=Object.entries(pos).map(([id,p])=>({id:+id,...p})); const maxX=Math.max(0,...nodes.map(n=>n.x)); const maxY=Math.max(0,...nodes.map(n=>n.y)); return {nodes,edges,maxX,maxY} }

export default function AVLTreeVisualizer() {
  const [root,setRoot]=useState<N|null>(null)
  const [val,setVal]=useState('30')
  const [log,setLog]=useState<string[]>(['Insert values to see AVL balancing and rotations.'])
  const buildFrom=(arr:number[])=>{ nid=1; let r:N|null=null; const s:string[]=[]; for(const v of arr) r=insert(r,v,s); setRoot(r); setLog(s.slice(-6)) }
  useEffect(()=>{ buildFrom([30,20,40,10,25,35,50]); },[])
  const onInsert=()=>{ const v=Math.round(Number(val)); if(!Number.isFinite(v)) return; const s:string[]=[]; setRoot(r=>insert(r,v,s)); setLog(s) }
  const onDel=()=>{ const v=Math.round(Number(val)); if(!Number.isFinite(v)) return; const s:string[]=[]; setRoot(r=>del(r,v,s)); setLog(s) }
  const reset=()=>{ nid=1; setRoot(null); setLog(['Tree cleared.']) }
  const {nodes,edges,maxX,maxY}=useMemo(()=>layout(root),[root])
  const W=Math.max(600,(maxX+1)*90), H=Math.max(260,(maxY+1)*100+60)
  const xFor=(x:number)=>((x+0.5)/(maxX+1))*W; const yFor=(y:number)=>50+y*90
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">AVL Tree</h1><p className="text-slate-400 mt-1">Self-balancing BST with LL, RR, LR, RL rotations.</p></div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div><label className="text-xs text-slate-400 block mb-1">Value</label><input value={val} onChange={e=>setVal(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"/></div>
          <button onClick={onInsert} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-sm flex gap-1 items-center"><Plus size={15}/>Insert</button>
          <button onClick={onDel} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 text-sm flex gap-1 items-center"><Trash2 size={15}/>Delete</button>
          <button onClick={()=>buildFrom([30,20,40,10,25,35,50])} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm">Sample</button>
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex gap-1 items-center"><RotateCcw size={15}/>Clear</button>
        </div>
        <div className="bg-[#0c1324] border border-slate-800 rounded-lg overflow-x-auto mb-4">
          {root ? <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{minWidth:320}}>
            {edges.map(([a,b],i)=>{ const A=nodes.find(n=>n.id===a)!, B=nodes.find(n=>n.id===b)!; return <line key={i} x1={xFor(A.x)} y1={yFor(A.y)} x2={xFor(B.x)} y2={yFor(B.y)} stroke="#475569" strokeWidth="2"/> })}
            {nodes.map(n=> <g key={n.id}><circle cx={xFor(n.x)} cy={yFor(n.y)} r="24" fill="#1e293b" stroke={Math.abs(n.bf)>1?'#f87171':'#22c55e'} strokeWidth="2.5"/><text x={xFor(n.x)} y={yFor(n.y)-2} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">{n.v}</text><text x={xFor(n.x)} y={yFor(n.y)+12} textAnchor="middle" fill="#94a3b8" fontSize="9">bf {n.bf}</text></g>)}
          </svg> : <div className="h-56 flex items-center justify-center text-slate-500">Tree is empty</div>}
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 space-y-1 max-h-40 overflow-auto">
          {log.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 text-sm text-slate-400"><span className="text-slate-200 font-semibold">Rotations:</span> LL (right rotate), RR (left rotate), LR (left-right), RL (right-left) restore balance when |BF| &gt; 1.</div>
    </div>
  )
}
