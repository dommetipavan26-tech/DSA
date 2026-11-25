import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface N { v:string; left:N|null; right:N|null; id:number }
let nid=1
const node=(v:string):N=>({v,left:null,right:null,id:nid++})
const isOp=(c:string)=>['+','-','*','/','^'].includes(c)

function buildFromPostfix(tokens:string[]):N|null{
  nid=1; const st:N[]=[]
  for(const t of tokens){
    if(!isOp(t)) st.push(node(t))
    else { const r=st.pop()||node('?'); const l=st.pop()||node('?'); const n=node(t); n.left=l; n.right=r; st.push(n) }
  }
  return st.pop()||null
}
function buildFromPrefix(tokens:string[]):N|null{
  nid=1; const st:N[]=[]; const rev=[...tokens].reverse()
  for(const t of rev){
    if(!isOp(t)) st.push(node(t))
    else { const l=st.pop()||node('?'); const r=st.pop()||node('?'); const n=node(t); n.left=l; n.right=r; st.push(n) }
  }
  return st.pop()||null
}

function inorder(n:N|null,out:string[]=[]){ if(n){ inorder(n.left,out); out.push(n.v); inorder(n.right,out)} return out }
function preorder(n:N|null,out:string[]=[]){ if(n){ out.push(n.v); preorder(n.left,out); preorder(n.right,out)} return out }
function postorder(n:N|null,out:string[]=[]){ if(n){ postorder(n.left,out); postorder(n.right,out); out.push(n.v)} return out }

function layout(root:N|null){ const pos:Record<number,{x:number;y:number;v:string}>= {}; const edges:[number,number][]=[]; let x=0; const walk=(n:N|null,d:number)=>{ if(!n) return; walk(n.left,d+1); pos[n.id]={x:x++,y:d,v:n.v}; if(n.left) edges.push([n.id,n.left.id]); if(n.right) edges.push([n.id,n.right.id]); walk(n.right,d+1)}; walk(root,0); const nodes=Object.entries(pos).map(([id,p])=>({id:+id,...p})); const maxX=Math.max(0,...nodes.map(n=>n.x)); const maxY=Math.max(0,...nodes.map(n=>n.y)); return {nodes,edges,maxX,maxY} }

export default function ExpressionTreeVisualizer() {
  const [mode,setMode]=useState<'postfix'|'prefix'>('postfix')
  const [expr,setExpr]=useState('A B + C D - *')
  const [root,setRoot]=useState<N|null>(()=>buildFromPostfix('A B + C D - *'.split(/\s+/).filter(Boolean)))
  const [msg,setMsg]=useState('Built expression tree from postfix: A B + C D - *')

  const build=()=>{
    const tokens=expr.trim().split(/\s+/).filter(Boolean)
    if(!tokens.length) return
    const r=mode==='postfix'?buildFromPostfix(tokens):buildFromPrefix(tokens)
    setRoot(r); setMsg(`Built from ${mode}: ${tokens.join(' ')}`)
  }
  const {nodes,edges,maxX,maxY}=useMemo(()=>layout(root),[root])
  const W=Math.max(600,(maxX+1)*90), H=Math.max(260,(maxY+1)*100+60)
  const xFor=(x:number)=>((x+0.5)/(maxX+1))*W, yFor=(y:number)=>50+y*90
  const inO=inorder(root), preO=preorder(root), postO=postorder(root)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Expression Tree</h1><p className="text-slate-400 mt-1">Build expression trees and view inorder, preorder, and postorder traversals.</p></div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-5 mb-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={()=>setMode('postfix')} className={`px-4 py-2 rounded-full text-sm border ${mode==='postfix'?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>Postfix</button>
          <button onClick={()=>setMode('prefix')} className={`px-4 py-2 rounded-full text-sm border ${mode==='prefix'?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>Prefix</button>
        </div>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="flex-1 min-w-[260px]"><label className="text-xs text-slate-400 block mb-1">{mode==='postfix'?'Postfix expression (space separated)':'Prefix expression (space separated)'}</label><input value={expr} onChange={e=>setExpr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"/></div>
          <button onClick={build} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Build</button>
          <button onClick={()=>{ setExpr(mode==='postfix'?'A B + C D - *':'* + A B - C D'); }} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm flex gap-1 items-center"><RotateCcw size={15}/>Example</button>
        </div>
        <div className="text-sm text-slate-300 mb-3">{msg}</div>
        <div className="bg-[#0c1324] border border-slate-800 rounded-lg overflow-x-auto">
          {root ? <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{minWidth:320}}>
            {edges.map(([a,b],i)=>{ const A=nodes.find(n=>n.id===a)!, B=nodes.find(n=>n.id===b)!; return <line key={i} x1={xFor(A.x)} y1={yFor(A.y)} x2={xFor(B.x)} y2={yFor(B.y)} stroke="#475569" strokeWidth="2"/> })}
            {nodes.map(n=>{ const op=isOp(n.v); return <g key={n.id}><circle cx={xFor(n.x)} cy={yFor(n.y)} r="24" fill={op?'#3b2a12':'#1e293b'} stroke={op?'#f59e0b':'#6366f1'} strokeWidth="2.5"/><text x={xFor(n.x)} y={yFor(n.y)+1} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="14" fontWeight="700">{n.v}</text></g> })}
          </svg> : <div className="h-56 flex items-center justify-center text-slate-500">Invalid expression</div>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><div className="text-white font-semibold mb-2 text-sm">Inorder</div><div className="font-mono text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded p-2">{inO.join(' ')||'—'}</div></div>
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><div className="text-white font-semibold mb-2 text-sm">Preorder</div><div className="font-mono text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded p-2">{preO.join(' ')||'—'}</div></div>
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><div className="text-white font-semibold mb-2 text-sm">Postorder</div><div className="font-mono text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded p-2">{postO.join(' ')||'—'}</div></div>
      </div>
    </div>
  )
}
