import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'

interface RNode { id: number; label: string; x: number; y: number; parent: number | null; val: number | null; active: boolean; done: boolean }
let uid = 0

function buildFib(n: number) {
  uid = 0
  const nodes: RNode[] = []
  const edges: { from: number; to: number }[] = []
  // layout via DFS assigning x ranges
  let leafX = 0
  const dfs = (k: number, depth: number, parent: number | null): { id: number; val: number } => {
    const id = uid++
    const node: RNode = { id, label: `fib(${k})`, x: 0, y: depth, parent, val: null, active: false, done: false }
    nodes.push(node)
    if (parent !== null) edges.push({ from: parent, to: id })
    if (k <= 1) {
      node.val = k
      node.x = leafX++
      return { id, val: k }
    }
    const l = dfs(k - 1, depth + 1, id)
    const r = dfs(k - 2, depth + 1, id)
    node.val = l.val + r.val
    node.x = (nodes[l.id].x + nodes[r.id].x) / 2
    return { id, val: node.val }
  }
  dfs(n, 0, null)
  // normalize x
  const minX = Math.min(...nodes.map(n=>n.x)), maxX = Math.max(...nodes.map(n=>n.x))
  const span = Math.max(1, maxX - minX)
  for (const nd of nodes) nd.x = ((nd.x - minX) / span) * 800 + 60
  return { nodes, edges }
}

interface Step { activeId: number | null; doneIds: number[]; stack: string[]; description: string }

function genSteps(n: number): Step[] {
  const { nodes } = buildFib(n)
  const steps2: Step[] = []
  const doneIds: number[] = []
  const stk: string[] = []
  const call = (nodeIdx: number) => {
    const nd = nodes[nodeIdx]
    stk.push(nd.label)
    steps2.push({ activeId: nd.id, doneIds: [...doneIds], stack: [...stk], description: `Call ${nd.label}.` })
    const kids = nodes.filter(x => x.parent === nd.id)
    const left = kids[0], right = kids[1]
    if (left) call(nodes.indexOf(left))
    if (right) call(nodes.indexOf(right))
    if (nd.val !== null && (left || right)) {
      steps2.push({ activeId: nd.id, doneIds: [...doneIds], stack: [...stk], description: `${nd.label} = ${left?.val} + ${right?.val} = ${nd.val}.` })
    } else {
      steps2.push({ activeId: nd.id, doneIds: [...doneIds], stack: [...stk], description: `Base case: ${nd.label} = ${nd.val}.` })
    }
    doneIds.push(nd.id)
    stk.pop()
    steps2.push({ activeId: nd.id, doneIds: [...doneIds], stack: [...stk], description: `Return ${nd.val} from ${nd.label}.` })
  }
  if (nodes.length) call(0)
  steps2.push({ activeId: null, doneIds: nodes.map(n => n.id), stack: [], description: `Done. fib(${n}) = ${nodes[0]?.val}.` })
  return steps2
}

export default function RecursionVisualizer() {
  const [n, setN] = useState(5)
  const [steps, setSteps] = useState<Step[]>(() => genSteps(5))
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const tree = useMemo(() => buildFib(n), [n])
  const run = () => { setSteps(genSteps(n)); setStepIdx(0); setPlaying(true) }
  const reset = (nn: number) => { setN(nn); setSteps(genSteps(nn)); setStepIdx(0); setPlaying(false) }

  // auto play
  // I'll use useEffect below via inline trick? No, just add useEffect.
  return <RecursionInner n={n} tree={tree} steps={steps} stepIdx={stepIdx} setStepIdx={setStepIdx} playing={playing} setPlaying={setPlaying} run={run} reset={reset} />
}

function RecursionInner({ n, tree, steps, stepIdx, setStepIdx, playing, setPlaying, run, reset }: any) {
  const step = steps[stepIdx]
  // playing effect
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setStepIdx((i: number) => { if (i >= steps.length - 1) { setPlaying(false); return i } return i + 1 }), 650)
    return () => window.clearInterval(t)
  }, [playing, steps.length, setStepIdx, setPlaying])

  const { nodes, edges } = tree
  const maxY = Math.max(0, ...nodes.map((nd: RNode) => nd.y))
  const W = 920, H = Math.max(280, (maxY + 1) * 100 + 60)
  const yFor = (y: number) => 50 + y * 90

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Recursion Tree Visualizer" description="See how recursive calls branch out and unwind. Example: Fibonacci." />
      <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <label className="text-sm text-slate-300">n =</label>
          <select value={n} onChange={e => reset(Number(e.target.value))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
            {[2,3,4,5,6].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={run} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2"><Play size={16}/> Run</button>
          <button onClick={() => { setPlaying(false); setStepIdx(0) }} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm flex items-center gap-1"><RotateCcw size={15}/> Reset</button>
          <span className="ml-auto text-sm text-slate-400">Step {stepIdx+1}/{steps.length}</span>
        </div>
        <div className="text-sm text-slate-300 mb-3">{step?.description}</div>
        <div className="bg-[#0c1324]/80 border border-slate-700/60 rounded-lg backdrop-blur-sm overflow-x-auto mb-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{minWidth:340}}>
            {edges.map((e: any, i: number) => { const a=nodes.find((x:RNode)=>x.id===e.from), b=nodes.find((x:RNode)=>x.id===e.to); if(!a||!b) return null; return <line key={i} x1={a.x} y1={yFor(a.y)} x2={b.x} y2={yFor(b.y)} stroke="#475569" strokeWidth="2" /> })}
            {nodes.map((nd: RNode) => {
              const active = step?.activeId === nd.id
              const done = step?.doneIds?.includes(nd.id)
              let fill='#1e293b', stroke='#475569', text='#e2e8f0'
              if (active && done) { fill='#14532d'; stroke='#22c55e'; text='#bbf7d0' }
              else if (active) { fill='#78350f'; stroke='#f59e0b'; text='#fde68a' }
              else if (done) { fill='#312e81'; stroke='#818cf8'; text='#c7d2fe' }
              return (
                <g key={nd.id}>
                  <circle cx={nd.x} cy={yFor(nd.y)} r="28" fill={fill} stroke={stroke} strokeWidth="2.5" />
                  <text x={nd.x} y={yFor(nd.y)-2} textAnchor="middle" fill={text} fontSize="11" fontWeight="700">{nd.label}</text>
                  <text x={nd.x} y={yFor(nd.y)+12} textAnchor="middle" fill={done||active?text:'#64748b'} fontSize="10">{nd.val!==null && (done||active)?`=${nd.val}`:''}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-white font-semibold mb-2 text-sm">Call Stack</h3>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 min-h-[120px] flex flex-col-reverse gap-1">
              {(step?.stack||[]).map((s:string,i:number)=>(<div key={i} className={`px-2 py-1 rounded text-xs font-mono ${i===step.stack.length-1?'bg-amber-900/40 text-amber-200 border border-amber-700/40':'bg-slate-800 text-slate-300'}`}>{s}</div>))}
              {(!step?.stack||step.stack.length===0) && <span className="text-slate-500 text-xs">Stack empty</span>}
            </div>
          </div>
          <div className="text-sm text-slate-400">
            <h3 className="text-white font-semibold mb-2 text-sm">About</h3>
            <p className="mb-2">This shows the recursion tree for <code className="text-slate-200">fib(n)</code>. Each node is a function call. Leaves are base cases (n≤1).</p>
            <p>Notice how many calls repeat — naive recursion is exponential. Memoization or DP avoids this.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
