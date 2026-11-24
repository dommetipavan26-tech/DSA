import { useEffect, useRef, useState } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw } from 'lucide-react'

type Mode = 'bfs' | 'dfs'
interface GNode { id: string; x: number; y: number }
interface GEdge { from: string; to: string }
interface Step { current: string | null; visited: string[]; frontier: string[]; exploredEdge: [string,string] | null; description: string; order: string[] }

const NODES: GNode[] = [
  { id:'A', x:300, y:60 }, { id:'B', x:150, y:150 }, { id:'C', x:450, y:150 },
  { id:'D', x:80, y:260 }, { id:'E', x:220, y:260 }, { id:'F', x:380, y:260 }, { id:'G', x:520, y:260 },
  { id:'H', x:150, y:360 }, { id:'I', x:450, y:360 },
]
const EDGES: GEdge[] = [
  {from:'A',to:'B'},{from:'A',to:'C'},{from:'B',to:'D'},{from:'B',to:'E'},{from:'C',to:'F'},{from:'C',to:'G'},{from:'D',to:'H'},{from:'E',to:'H'},{from:'F',to:'I'},{from:'G',to:'I'},{from:'E',to:'F'}
]
const ADJ: Record<string,string[]> = {}
for (const n of NODES) ADJ[n.id]=[]
for (const e of EDGES) { ADJ[e.from].push(e.to); ADJ[e.to].push(e.from) }
for (const k of Object.keys(ADJ)) ADJ[k].sort()

function genBFS(start: string): Step[] {
  const steps: Step[] = []
  const visited: string[] = []
  const q: string[] = [start]
  const seen = new Set([start])
  const order: string[] = []
  steps.push({ current: null, visited: [], frontier: [...q], exploredEdge: null, description: `Start BFS from ${start}. Queue: [${q.join(', ')}]`, order: [] })
  while (q.length) {
    const cur = q.shift()!
    visited.push(cur); order.push(cur)
    steps.push({ current: cur, visited: [...visited], frontier: [...q], exploredEdge: null, description: `Dequeue ${cur}. Visit it.`, order: [...order] })
    for (const nb of ADJ[cur]) {
      if (!seen.has(nb)) {
        seen.add(nb); q.push(nb)
        steps.push({ current: cur, visited: [...visited], frontier: [...q], exploredEdge: [cur,nb], description: `Discover ${nb} from ${cur}. Enqueue ${nb}.`, order: [...order] })
      }
    }
  }
  steps.push({ current: null, visited: [...visited], frontier: [], exploredEdge: null, description: `BFS complete. Order: ${order.join(' → ')}`, order: [...order] })
  return steps
}

function genDFS(start: string): Step[] {
  const steps: Step[] = []
  const visited: string[] = []
  const seen = new Set<string>()
  const order: string[] = []
  const dfs = (cur: string) => {
    seen.add(cur); visited.push(cur); order.push(cur)
    steps.push({ current: cur, visited: [...visited], frontier: [], exploredEdge: null, description: `Visit ${cur}.`, order: [...order] })
    for (const nb of ADJ[cur]) {
      if (!seen.has(nb)) {
        steps.push({ current: cur, visited: [...visited], frontier: [nb], exploredEdge: [cur,nb], description: `Go deeper: ${cur} → ${nb}.`, order: [...order] })
        dfs(nb)
        steps.push({ current: cur, visited: [...visited], frontier: [], exploredEdge: null, description: `Backtrack to ${cur}.`, order: [...order] })
      }
    }
  }
  steps.push({ current: null, visited: [], frontier: [start], exploredEdge: null, description: `Start DFS from ${start}.`, order: [] })
  dfs(start)
  steps.push({ current: null, visited: [...visited], frontier: [], exploredEdge: null, description: `DFS complete. Order: ${order.join(' → ')}`, order: [...order] })
  return steps
}

export default function GraphVisualizer() {
  const [mode, setMode] = useState<Mode>('bfs')
  const [start, setStart] = useState('A')
  const [steps, setSteps] = useState<Step[]>(() => genBFS('A'))
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed] = useState(800)
  const timer = useRef<number|null>(null)
  const step = steps[stepIdx]

  useEffect(()=>{ if(!playing) return; timer.current=window.setInterval(()=>setStepIdx(i=>{ if(i>=steps.length-1){setPlaying(false);return i} return i+1 }), speed); return ()=>{ if(timer.current) window.clearInterval(timer.current) } },[playing,speed,steps.length])

  const run = (m: Mode, s: string) => { setMode(m); setStart(s); const st = m==='bfs'?genBFS(s):genDFS(s); setSteps(st); setStepIdx(0); setPlaying(true) }

  const isVisited = (id: string) => step.visited.includes(id)
  const isFrontier = (id: string) => step.frontier.includes(id)
  const isCurrent = (id: string) => step.current === id

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Graph Traversal Visualizer</h1><p className="text-slate-400 mt-1">Explore BFS and DFS on an undirected graph.</p></div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex gap-2">
            <button onClick={()=>run('bfs',start)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode==='bfs'?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>BFS</button>
            <button onClick={()=>run('dfs',start)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode==='dfs'?'bg-cyan-500/20 text-cyan-200 border-cyan-500/40':'bg-slate-800 text-slate-300 border-slate-700'}`}>DFS</button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Start:</span>
            <select value={start} onChange={e=>{setStart(e.target.value); run(mode,e.target.value)}} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200">
              {NODES.map(n=><option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>{setPlaying(false);setStepIdx(0)}} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><RotateCcw size={18}/></button>
            <button onClick={()=>setStepIdx(i=>Math.max(0,i-1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepBack size={18}/></button>
            <button onClick={()=>{ if(stepIdx>=steps.length-1) setStepIdx(0); setPlaying(p=>!p)}} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center gap-2">{playing?<><Pause size={18}/>Pause</>:<><Play size={18}/>Play</>}</button>
            <button onClick={()=>setStepIdx(i=>Math.min(steps.length-1,i+1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepForward size={18}/></button>
          </div>
        </div>
        <div className="text-sm text-slate-300 mb-3">Step {stepIdx+1}/{steps.length} — {step.description}</div>
        <div className="bg-[#0c1324] border border-slate-800 rounded-lg overflow-x-auto">
          <svg viewBox="0 0 600 420" className="w-full h-auto max-h-[460px]" style={{minWidth:320}}>
            {EDGES.map((e,i)=>{
              const a=NODES.find(n=>n.id===e.from)!, b=NODES.find(n=>n.id===e.to)!
              const active = step.exploredEdge && ((step.exploredEdge[0]===e.from&&step.exploredEdge[1]===e.to)||(step.exploredEdge[1]===e.from&&step.exploredEdge[0]===e.to))
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active?'#f59e0b':'#334155'} strokeWidth={active?3:2} />
            })}
            {NODES.map(n=>{
              let fill='#1e293b', stroke='#475569', text='#e2e8f0'
              if (isCurrent(n.id)) { fill='#78350f'; stroke='#f59e0b'; text='#fde68a' }
              else if (isFrontier(n.id)) { fill='#164e63'; stroke='#22d3ee'; text='#a5f3fc' }
              else if (isVisited(n.id)) { fill='#312e81'; stroke='#818cf8'; text='#c7d2fe' }
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r="24" fill={fill} stroke={stroke} strokeWidth="2.5" />
                  <text x={n.x} y={n.y+1} textAnchor="middle" dominantBaseline="middle" fill={text} fontSize="15" fontWeight="700">{n.id}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500"/> Current</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-400"/> Frontier/Queue/Stack</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-400"/> Visited</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-500"/> Unvisited</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><h3 className="text-white font-semibold mb-2">Traversal Order</h3><div className="text-sm font-mono text-slate-300 bg-slate-900 border border-slate-700 rounded-lg p-3 min-h-[48px]">{step.order.length?step.order.join(' → '):<span className="text-slate-500">—</span>}</div></div>
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 text-sm text-slate-400"><h3 className="text-white font-semibold mb-2">{mode==='bfs'?'Breadth-First Search':'Depth-First Search'}</h3>{mode==='bfs'?'Explores level by level using a queue. Good for shortest paths in unweighted graphs. Time O(V+E).':'Explores as deep as possible before backtracking. Uses a stack (recursion). Time O(V+E).'}</div>
      </div>
    </div>
  )
}
