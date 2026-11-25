import { useMemo, useState, useEffect, useRef } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw, Plus, Trash2, Search } from 'lucide-react'

interface BSTNode {
  val: number
  left: BSTNode | null
  right: BSTNode | null
  id: number
}
let nid = 1
function newNode(val: number): BSTNode { return { val, left: null, right: null, id: nid++ } }

function insertNode(root: BSTNode | null, val: number): BSTNode {
  if (!root) return newNode(val)
  if (val < root.val) root.left = insertNode(root.left, val)
  else if (val > root.val) root.right = insertNode(root.right, val)
  return root
}

function buildBST(values: number[]): BSTNode | null {
  nid = 1
  let r: BSTNode | null = null
  for (const v of values) r = insertNode(r, v)
  return r
}

function cloneTree(n: BSTNode | null): BSTNode | null {
  if (!n) return null
  return { val: n.val, id: n.id, left: cloneTree(n.left), right: cloneTree(n.right) }
}

function findMin(n: BSTNode): BSTNode { return n.left ? findMin(n.left) : n }

function deleteNode(root: BSTNode | null, val: number): BSTNode | null {
  if (!root) return null
  if (val < root.val) root.left = deleteNode(root.left, val)
  else if (val > root.val) root.right = deleteNode(root.right, val)
  else {
    if (!root.left) return root.right
    if (!root.right) return root.left
    const succ = findMin(root.right)
    root.val = succ.val
    root.right = deleteNode(root.right, succ.val)
  }
  return root
}


type NodeState = 'normal' | 'comparing' | 'active' | 'inserted' | 'visited' | 'found' | 'deleting'

interface AnimStep {
  root: BSTNode | null
  highlights: Record<number, NodeState>
  description: string
  traversalOutput?: number[]
}

function layoutTree(root: BSTNode | null) {
  const pos: Record<number, { x: number; y: number; val: number }> = {}
  const edges: { from: number; to: number; dir: 'L' | 'R' }[] = []
  let xCounter = 0
  const walk = (n: BSTNode | null, depth: number) => {
    if (!n) return
    walk(n.left, depth + 1)
    const x = xCounter++
    pos[n.id] = { x, y: depth, val: n.val }
    if (n.left) edges.push({ from: n.id, to: n.left.id, dir: 'L' })
    if (n.right) edges.push({ from: n.id, to: n.right.id, dir: 'R' })
    walk(n.right, depth + 1)
  }
  walk(root, 0)
  const nodes = Object.entries(pos).map(([id, p]) => ({ id: Number(id), ...p }))
  const maxX = Math.max(0, ...nodes.map(n => n.x))
  const maxY = Math.max(0, ...nodes.map(n => n.y))
  return { nodes, edges, maxX, maxY }
}

function genInsertSteps(root: BSTNode | null, val: number): AnimStep[] {
  const steps: AnimStep[] = []
  const r = cloneTree(root)
  const highlights: Record<number, NodeState> = {}
  const push = (desc: string, extra: Record<number, NodeState> = {}) => {
    steps.push({ root: cloneTree(r), highlights: { ...highlights, ...extra }, description: desc })
  }
  if (!r) {
    const nr = newNode(val)
    steps.push({ root: nr, highlights: { [nr.id]: 'inserted' }, description: `Tree was empty. ${val} becomes the root.` })
    return steps
  }
  let cur: BSTNode | null = r
  while (cur) {
    highlights[cur.id] = 'comparing'
    push(`Compare ${val} with ${cur.val}.`)
    if (val === cur.val) {
      highlights[cur.id] = 'found'
      push(`${val} already exists in the BST. No duplicates inserted.`)
      return steps
    } else if (val < cur.val) {
      push(`${val} < ${cur.val}, go left.`)
      if (!cur.left) {
        cur.left = newNode(val)
        highlights[cur.left.id] = 'inserted'
        push(`Inserted ${val} as left child of ${cur.val}.`)
        return steps
      }
      highlights[cur.id] = 'visited'
      cur = cur.left
    } else {
      push(`${val} > ${cur.val}, go right.`)
      if (!cur.right) {
        cur.right = newNode(val)
        highlights[cur.right.id] = 'inserted'
        push(`Inserted ${val} as right child of ${cur.val}.`)
        return steps
      }
      highlights[cur.id] = 'visited'
      cur = cur.right
    }
  }
  return steps
}

function genSearchSteps(root: BSTNode | null, val: number): AnimStep[] {
  const steps: AnimStep[] = []
  const highlights: Record<number, NodeState> = {}
  const push = (desc: string, extra: Record<number, NodeState> = {}) => {
    steps.push({ root: cloneTree(root), highlights: { ...highlights, ...extra }, description: desc })
  }
  let cur = root
  if (!cur) { push('Tree is empty.'); return steps }
  while (cur) {
    highlights[cur.id] = 'comparing'
    push(`Compare ${val} with ${cur.val}.`)
    if (val === cur.val) { highlights[cur.id] = 'found'; push(`Found ${val}!`); return steps }
    highlights[cur.id] = 'visited'
    if (val < cur.val) { push(`${val} < ${cur.val}, go left.`); cur = cur.left }
    else { push(`${val} > ${cur.val}, go right.`); cur = cur.right }
  }
  push(`${val} not found in the tree.`)
  return steps
}

function genDeleteSteps(root: BSTNode | null, val: number): AnimStep[] {
  const steps: AnimStep[] = []
  const r = cloneTree(root)
  const highlights: Record<number, NodeState> = {}
  const push = (desc: string, extra: Record<number, NodeState> = {}) => {
    steps.push({ root: cloneTree(r), highlights: { ...highlights, ...extra }, description: desc })
  }
  // find
  let cur = r
  let found: BSTNode | null = null
  while (cur) {
    highlights[cur.id] = 'comparing'
    push(`Compare ${val} with ${cur.val}.`)
    if (val === cur.val) { found = cur; highlights[cur.id] = 'deleting'; push(`Found ${val}. Mark for deletion.`); break }
    highlights[cur.id] = 'visited'
    cur = val < cur.val ? cur.left : cur.right
  }
  if (!found) { push(`${val} not found; nothing to delete.`); return steps }
  // perform actual delete on r
  const nr = deleteNode(r, val)
  steps.push({ root: cloneTree(nr), highlights: {}, description: `Deleted ${val}. BST property preserved.` })
  return steps
}

function genTraversalSteps(root: BSTNode | null, kind: 'inorder' | 'preorder' | 'postorder'): AnimStep[] {
  const steps: AnimStep[] = []
  const highlights: Record<number, NodeState> = {}
  const output: number[] = []
  const push = (desc: string) => steps.push({ root: cloneTree(root), highlights: { ...highlights }, description: desc, traversalOutput: [...output] })
  const visit = (n: BSTNode | null) => {
    if (!n) return
    highlights[n.id] = 'comparing'
    push(`Visiting ${n.val}.`)
    if (kind === 'preorder') { output.push(n.val); highlights[n.id] = 'visited'; push(`Output ${n.val} (preorder: node, left, right).`); visit(n.left); visit(n.right) }
    else if (kind === 'inorder') { visit(n.left); output.push(n.val); highlights[n.id] = 'visited'; push(`Output ${n.val} (inorder: left, node, right).`); visit(n.right) }
    else { visit(n.left); visit(n.right); output.push(n.val); highlights[n.id] = 'visited'; push(`Output ${n.val} (postorder: left, right, node).`); }
  }
  push(`Start ${kind} traversal.`)
  visit(root)
  push(`${kind} traversal complete.`)
  return steps
}

function TreeView({ root, highlights }: { root: BSTNode | null; highlights: Record<number, NodeState> }) {
  const { nodes, edges, maxX, maxY } = useMemo(() => layoutTree(root), [root])
  if (!root) return <div className="h-72 flex items-center justify-center text-slate-500">Tree is empty. Build or insert nodes.</div>
  const width = Math.max(600, (maxX + 1) * 90)
  const height = Math.max(260, (maxY + 1) * 100 + 60)
  const xFor = (x: number) => ((x + 0.5) / (maxX + 1)) * width
  const yFor = (y: number) => 50 + y * 90
  const colorFor = (s: NodeState | undefined) => {
    switch (s) {
      case 'comparing': return { fill: '#78350f', stroke: '#f59e0b', text: '#fde68a' }
      case 'active': return { fill: '#1e3a8a', stroke: '#60a5fa', text: '#bfdbfe' }
      case 'inserted': return { fill: '#14532d', stroke: '#22c55e', text: '#bbf7d0' }
      case 'visited': return { fill: '#312e81', stroke: '#818cf8', text: '#c7d2fe' }
      case 'found': return { fill: '#064e3b', stroke: '#34d399', text: '#a7f3d0' }
      case 'deleting': return { fill: '#7f1d1d', stroke: '#f87171', text: '#fecaca' }
      default: return { fill: '#172033', stroke: '#475569', text: '#e2e8f0' }
    }
  }
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ minHeight: 260 }}>
        {edges.map((e) => {
          const a = nodes.find(n => n.id === e.from)!
          const b = nodes.find(n => n.id === e.to)!
          const ax = xFor(a.x), ay = yFor(a.y), bx = xFor(b.x), by = yFor(b.y)
          const mx = (ax + bx) / 2, my = (ay + by) / 2
          return (
            <g key={`${e.from}-${e.to}`}>
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#475569" strokeWidth="2" />
              <text x={mx + (e.dir === 'L' ? -8 : 8)} y={my - 4} fill="#64748b" fontSize="10" textAnchor="middle">{e.dir}</text>
            </g>
          )
        })}
        {nodes.map((n) => {
          const c = colorFor(highlights[n.id])
          const cx = xFor(n.x), cy = yFor(n.y)
          return (
            <g key={n.id}>
              <circle cx={cx} cy={cy} r="24" fill={c.fill} stroke={c.stroke} strokeWidth="2.5" />
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={c.text} fontSize="14" fontWeight="700">{n.val}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function BinaryTreeOpsVisualizer() {
  const [inputStr, setInputStr] = useState('45, 25, 65, 15, 35, 55, 75, 10, 30, 50, 70, 60')
  const [root, setRoot] = useState<BSTNode | null>(() => buildBST([45,25,65,15,35,55,75,10,30,50,70,60]))
  const [valInput, setValInput] = useState('60')
  const [steps, setSteps] = useState<AnimStep[]>([{ root: buildBST([45,25,65,15,35,55,75,10,30,50,70,60]), highlights: {}, description: 'BST built. Choose an operation or traversal.' }])
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [traversalOutput, setTraversalOutput] = useState<number[]>([])
  const timerRef = useRef<number | null>(null)

  const step = steps[stepIdx]

  useEffect(() => {
    if (!playing) return
    timerRef.current = window.setInterval(() => {
      setStepIdx((i) => {
        if (i >= steps.length - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, speed)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [playing, speed, steps.length])

  useEffect(() => {
    if (step?.traversalOutput) setTraversalOutput(step.traversalOutput)
  }, [step])

  const runSteps = (s: AnimStep[], finalRoot?: BSTNode | null) => {
    setSteps(s)
    setStepIdx(0)
    setPlaying(true)
    if (finalRoot !== undefined) setRoot(finalRoot)
  }

  const build = () => {
    const nums = inputStr.split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n)).map(n => Math.round(n))
    const unique: number[] = []
    for (const n of nums) if (!unique.includes(n)) unique.push(n)
    const r = buildBST(unique.slice(0, 20))
    setRoot(r)
    setSteps([{ root: cloneTree(r), highlights: {}, description: `Built BST with ${unique.length} values.` }])
    setStepIdx(0)
    setPlaying(false)
    setTraversalOutput([])
  }

  const clearTree = () => {
    nid = 1
    setRoot(null)
    setSteps([{ root: null, highlights: {}, description: 'Tree cleared.' }])
    setStepIdx(0)
    setPlaying(false)
    setTraversalOutput([])
  }

  const val = () => { const n = Number(valInput); return Number.isFinite(n) ? Math.round(n) : null }

  useEffect(() => {
    // sync root to current step's tree state so operations chain correctly
    if (steps.length > 0 && stepIdx === steps.length - 1) {
      setRoot(cloneTree(steps[steps.length - 1].root))
    }
  }, [stepIdx, steps])

  const onInsert = () => { const v = val(); if (v === null) return; const s = genInsertSteps(root, v); runSteps(s, s[s.length-1]?.root ?? root) }
  const onDelete = () => { const v = val(); if (v === null) return; const s = genDeleteSteps(root, v); runSteps(s, s[s.length-1]?.root ?? root) }
  const onFind = () => { const v = val(); if (v === null) return; const s = genSearchSteps(root, v); setSteps(s); setStepIdx(0); setPlaying(true); setTraversalOutput([]) }
  const onTraversal = (k: 'inorder' | 'preorder' | 'postorder') => { const s = genTraversalSteps(root, k); setSteps(s); setStepIdx(0); setPlaying(true); setTraversalOutput([]) }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Binary Tree Operations & Traversals</h1>
        <p className="text-slate-400 mt-1">Insert, delete, search, and animate Inorder/Preorder/Postorder traversals on a binary search tree.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5 mb-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Input array (comma separated)</label>
            <input value={inputStr} onChange={e => setInputStr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={build} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Build Tree</button>
            <button onClick={clearTree} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">Clear Tree</button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Value</label>
            <input value={valInput} onChange={e => setValInput(e.target.value)} className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
          </div>
          <button onClick={onInsert} className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-sm flex items-center gap-1.5"><Plus size={16} /> Insert</button>
          <button onClick={onDelete} className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-sm flex items-center gap-1.5"><Trash2 size={16} /> Delete</button>
          <button onClick={onFind} className="px-3 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 text-sm flex items-center gap-1.5"><Search size={16} /> Find</button>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Presets:</span>
            <select className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200" onChange={(e) => { if(e.target.value) { setInputStr(e.target.value); } }} defaultValue="">
              <option value="">Choose...</option>
              <option value="45, 25, 65, 15, 35, 55, 75, 10, 30, 50, 70, 60">Default (12 nodes)</option>
              <option value="50, 30, 70, 20, 40, 60, 80">Balanced (7 nodes)</option>
              <option value="10, 20, 30, 40, 50, 60">Skewed Right</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => { setPlaying(false); setStepIdx(0) }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><RotateCcw size={18} /></button>
          <button onClick={() => setStepIdx(i => Math.max(0, i-1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepBack size={18} /></button>
          <button onClick={() => { if (stepIdx >= steps.length - 1) setStepIdx(0); setPlaying(p => !p) }} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center gap-2">
            {playing ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Play</>}
          </button>
          <button onClick={() => setStepIdx(i => Math.min(steps.length - 1, i+1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepForward size={18} /></button>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
            <span>Speed</span>
            <input type="range" min={100} max={1200} step={50} value={1300-speed} onChange={e => setSpeed(1300-Number(e.target.value))} className="w-28 accent-violet-500" />
          </div>
        </div>

        <div className="text-sm text-slate-300 mb-2">Step {stepIdx + 1} / {steps.length} — {step?.description}</div>

        <div className="border border-slate-800 rounded-lg bg-[#0c1324] p-2">
          <TreeView root={step?.root ?? null} highlights={step?.highlights ?? {}} />
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-500" /> Normal</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Comparing</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> Inserted/Found</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-400" /> Visited</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" /> Deleting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-3">Traversals</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onTraversal('inorder')} className="px-4 py-2 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 text-sm">Inorder</button>
            <button onClick={() => onTraversal('preorder')} className="px-4 py-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 text-sm">Preorder</button>
            <button onClick={() => onTraversal('postorder')} className="px-4 py-2 rounded-lg bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/30 text-sm">Postorder</button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-3">Traversal Output</h3>
          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 min-h-[52px] text-sm font-mono text-slate-200">
            {traversalOutput.length ? traversalOutput.join(' → ') : <span className="text-slate-500">Run a traversal to see the sequence...</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
