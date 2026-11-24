import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, StepForward, StepBack, Shuffle } from 'lucide-react'

type Algo = 'selection' | 'insertion' | 'bubble' | 'merge' | 'quick'
type PivotMode = 'last' | 'first' | 'middle' | 'custom'

interface MergeNode {
  id: string
  values: number[]
  depth: number
  role: 'divide' | 'leaf' | 'merge'
  state: 'pending' | 'active' | 'done'
  sourceId?: string // leaf/merge node id mapping
}

interface MergeTreeSnapshot {
  nodes: MergeNode[]
  edges: { from: string; to: string; label: 'divide' | 'merge' }[]
}

interface Step {
  array: number[]
  active: number[]
  comparing: number[]
  swapping: number[]
  sorted: number[]
  pivot?: number
  description: string
  mergeTree?: MergeTreeSnapshot
}

const ALGOS: { id: Algo; name: string }[] = [
  { id: 'selection', name: 'Selection Sort' },
  { id: 'insertion', name: 'Insertion Sort' },
  { id: 'bubble', name: 'Bubble Sort' },
  { id: 'merge', name: 'Merge Sort' },
  { id: 'quick', name: 'Quick Sort' },
]

const PRESETS: Record<string, number[]> = {
  Default: [45, 20, 75, 10, 60, 35, 90, 25],
  'Nearly Sorted': [10, 20, 30, 50, 40, 60, 70, 80],
  Reversed: [90, 80, 70, 60, 50, 40, 30, 20],
  'Merge Example': [6, 3, 9, 1, 5, 4, 7, 2],
}

function clone(a: number[]) { return a.slice() }

// ---------- Merge tree helpers ----------
interface MTreeBuild {
  nodes: Record<string, MergeNode>
  edges: { from: string; to: string; label: 'divide' | 'merge' }[]
  divideIdByRange: Record<string, string>
  mergeIdByRange: Record<string, string>
}

function buildMergeTree(arr: number[]): MTreeBuild {
  const nodes: Record<string, MergeNode> = {}
  const edges: { from: string; to: string; label: 'divide' | 'merge' }[] = []
  const divideIdByRange: Record<string, string> = {}
  const mergeIdByRange: Record<string, string> = {}
  let uid = 0
  const key = (l: number, r: number) => `${l}-${r}`

  const buildDivide = (l: number, r: number, depth: number): string => {
    const id = `d${uid++}`
    const vals = arr.slice(l, r + 1)
    const isLeaf = l === r
    nodes[id] = { id, values: vals, depth, role: isLeaf ? 'leaf' : 'divide', state: 'pending' }
    divideIdByRange[key(l, r)] = id
    if (!isLeaf) {
      const m = Math.floor((l + r) / 2)
      const leftId = buildDivide(l, m, depth + 1)
      const rightId = buildDivide(m + 1, r, depth + 1)
      edges.push({ from: id, to: leftId, label: 'divide' })
      edges.push({ from: id, to: rightId, label: 'divide' })
    }
    return id
  }

  buildDivide(0, arr.length - 1, 0)

  // Build merge nodes bottom-up mirroring divide structure
  const buildMerge = (l: number, r: number, depth: number): string => {
    const k = key(l, r)
    if (l === r) {
      // leaf merges represented by the same leaf node in layout? We'll create merge leaf ref
      mergeIdByRange[k] = divideIdByRange[k]
      return divideIdByRange[k]
    }
    const m = Math.floor((l + r) / 2)
    const leftMerge = buildMerge(l, m, depth + 1)
    const rightMerge = buildMerge(m + 1, r, depth + 1)
    const id = `m${uid++}`
    // merged values will be filled during simulation; placeholder sorted for final
    const mergedVals = arr.slice(l, r + 1).slice().sort((a, b) => a - b)
    nodes[id] = { id, values: mergedVals, depth, role: 'merge', state: 'pending' }
    mergeIdByRange[k] = id
    edges.push({ from: leftMerge, to: id, label: 'merge' })
    edges.push({ from: rightMerge, to: id, label: 'merge' })
    return id
  }

  buildMerge(0, arr.length - 1, 0)
  return { nodes, edges, divideIdByRange, mergeIdByRange }
}

function snapshotMergeTree(mt: MTreeBuild): MergeTreeSnapshot {
  return {
    nodes: Object.values(mt.nodes).map(n => ({ ...n, values: clone(n.values) })),
    edges: mt.edges.map(e => ({ ...e })),
  }
}

function genSteps(algo: Algo, input: number[], pivotMode: PivotMode = 'last', customPivotIndex = 0): Step[] {
  const arr = clone(input)
  const n = arr.length
  const steps: Step[] = []
  const sorted: number[] = []

  let mergeTree: MTreeBuild | null = null
  if (algo === 'merge') mergeTree = buildMergeTree(arr)

  const push = (s: Partial<Step> & { description: string }) => {
    steps.push({
      array: clone(arr),
      active: s.active ? clone(s.active) : [],
      comparing: s.comparing ? clone(s.comparing) : [],
      swapping: s.swapping ? clone(s.swapping) : [],
      sorted: s.sorted ? clone(s.sorted) : clone(sorted),
      pivot: s.pivot,
      description: s.description,
      mergeTree: mergeTree ? snapshotMergeTree(mergeTree) : undefined,
    })
  }

  push({ description: 'Initial array. Press Play or Step to start.' })

  if (algo === 'bubble') {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        push({ comparing: [j, j + 1], description: `Compare ${arr[j]} and ${arr[j + 1]}.` })
        if (arr[j] > arr[j + 1]) {
          ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
          push({ swapping: [j, j + 1], description: `Swap them → [${arr[j]}, ${arr[j + 1]}].` })
        }
      }
      sorted.unshift(n - i - 1)
      push({ sorted: clone(sorted), description: `Position ${n - i - 1} is sorted (${arr[n - i - 1]}).` })
    }
  } else if (algo === 'selection') {
    for (let i = 0; i < n; i++) {
      let minIdx = i
      push({ active: [i], description: `Pass ${i + 1}: assume minimum is ${arr[i]} at index ${i}.` })
      for (let j = i + 1; j < n; j++) {
        push({ active: [minIdx], comparing: [j], description: `Compare min ${arr[minIdx]} with ${arr[j]}.` })
        if (arr[j] < arr[minIdx]) {
          minIdx = j
          push({ active: [minIdx], description: `New minimum: ${arr[minIdx]} at index ${minIdx}.` })
        }
      }
      if (minIdx !== i) {
        ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
        push({ swapping: [i, minIdx], description: `Swap index ${i} and ${minIdx}.` })
      }
      sorted.push(i)
      push({ sorted: clone(sorted), description: `Index ${i} is in its final position.` })
    }
  } else if (algo === 'insertion') {
    sorted.push(0)
    push({ sorted: clone(sorted), description: 'First element is trivially sorted.' })
    for (let i = 1; i < n; i++) {
      const key = arr[i]
      let j = i - 1
      push({ active: [i], sorted: clone(sorted), description: `Pick key ${key} at index ${i}.` })
      while (j >= 0 && arr[j] > key) {
        push({ comparing: [j, j + 1], active: [j + 1], sorted: clone(sorted.filter(x => x < i)), description: `${arr[j]} > ${key}, shift ${arr[j]} right.` })
        arr[j + 1] = arr[j]
        push({ swapping: [j, j + 1], sorted: clone(sorted.filter(x => x < i)), description: `Shifted to index ${j + 1}.` })
        j--
      }
      arr[j + 1] = key
      if (!sorted.includes(i)) sorted.push(i)
      push({ active: [j + 1], sorted: clone(sorted), description: `Placed ${key} at index ${j + 1}.` })
    }
  } else if (algo === 'merge' && mergeTree) {
    const mt = mergeTree
    const key = (l: number, r: number) => `${l}-${r}`
    const setState = (id: string, state: MergeNode['state']) => { if (mt.nodes[id]) mt.nodes[id].state = state }
    const setValues = (id: string, vals: number[]) => { if (mt.nodes[id]) mt.nodes[id].values = clone(vals) }

    // mark root active
    setState(mt.divideIdByRange[key(0, n - 1)], 'active')
    push({ active: Array.from({ length: n }, (_, i) => i), description: 'Start merge sort: divide the array recursively.' })

    const mergeSort = (l: number, r: number) => {
      const id = mt.divideIdByRange[key(l, r)]
      setState(id, 'active')
      if (l === r) {
        push({ active: [l], description: `Single element [${arr[l]}] — already sorted.` })
        setState(id, 'done')
        return
      }
      const m = Math.floor((l + r) / 2)
      push({ active: Array.from({ length: r - l + 1 }, (_, i) => l + i), description: `Divide [${arr.slice(l, r + 1).join(', ')}] into left [${l}..${m}] and right [${m + 1}..${r}].` })
      setState(mt.divideIdByRange[key(l, m)], 'active')
      setState(mt.divideIdByRange[key(m + 1, r)], 'active')
      mergeSort(l, m)
      mergeSort(m + 1, r)

      // merge phase
      const mergeId = mt.mergeIdByRange[key(l, r)]
      setState(mergeId, 'active')
      const left = arr.slice(l, m + 1)
      const right = arr.slice(m + 1, r + 1)
      push({ active: Array.from({ length: r - l + 1 }, (_, i) => l + i), description: `Merge [${left.join(', ')}] and [${right.join(', ')}].` })
      let i = 0, j = 0, k = l
      while (i < left.length && j < right.length) {
        push({ comparing: [k], active: Array.from({ length: r - l + 1 }, (_, x) => l + x), description: `Compare ${left[i]} and ${right[j]}.` })
        if (left[i] <= right[j]) { arr[k] = left[i++]; }
        else { arr[k] = right[j++]; }
        setValues(mergeId, arr.slice(l, k + 1).concat(Array(Math.max(0, r - k)).fill(0)).slice(0, r - l + 1).map((v, idx) => idx <= k - l ? arr[l + idx] : v))
        push({ swapping: [k], active: Array.from({ length: r - l + 1 }, (_, x) => l + x), description: `Place ${arr[k]} at position ${k}.` })
        k++
      }
      while (i < left.length) { arr[k] = left[i++]; push({ swapping: [k], active: Array.from({ length: r - l + 1 }, (_, x) => l + x), description: `Take remaining ${arr[k]}.` }); k++ }
      while (j < right.length) { arr[k] = right[j++]; push({ swapping: [k], active: Array.from({ length: r - l + 1 }, (_, x) => l + x), description: `Take remaining ${arr[k]}.` }); k++ }
      setValues(mergeId, arr.slice(l, r + 1))
      setState(mergeId, 'done')
      setState(id, 'done')
      const doneAll = l === 0 && r === n - 1
      push({ sorted: doneAll ? Array.from({ length: n }, (_, i) => i) : [], active: Array.from({ length: r - l + 1 }, (_, i) => l + i), description: `Merged → [${arr.slice(l, r + 1).join(', ')}].` })
    }
    mergeSort(0, n - 1)
  } else if (algo === 'quick') {
    const finalSorted: number[] = []
    const pickPivot = (lo: number, hi: number) => {
      if (pivotMode === 'first') return lo
      if (pivotMode === 'middle') return Math.floor((lo + hi) / 2)
      if (pivotMode === 'custom') {
        const idx = Math.max(lo, Math.min(hi, customPivotIndex))
        return idx
      }
      return hi
    }
    const partition = (lo: number, hi: number): number => {
      let pIdx = pickPivot(lo, hi)
      const pVal = arr[pIdx]
      push({ pivot: pIdx, active: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), description: `Choose pivot ${pVal} at index ${pIdx}.` })
      if (pIdx !== hi) {
        ;[arr[pIdx], arr[hi]] = [arr[hi], arr[pIdx]]
        push({ swapping: [pIdx, hi], pivot: hi, description: `Move pivot ${pVal} to end (index ${hi}) for partitioning.` })
        pIdx = hi
      }
      const pivotVal = arr[hi]
      let i = lo
      for (let j = lo; j < hi; j++) {
        push({ pivot: hi, comparing: [j], active: [i], description: `Compare ${arr[j]} with pivot ${pivotVal}.` })
        if (arr[j] < pivotVal) {
          if (i !== j) { [arr[i], arr[j]] = [arr[j], arr[i]]; push({ pivot: hi, swapping: [i, j], description: `Swap ${arr[j]} and ${arr[i]} (move smaller left).` }) }
          i++
        }
      }
      if (i !== hi) { [arr[i], arr[hi]] = [arr[hi], arr[i]]; push({ swapping: [i, hi], description: `Place pivot ${arr[hi]} at final index ${i}.` }) }
      finalSorted.push(i)
      push({ sorted: clone(finalSorted), description: `Pivot ${arr[i]} fixed at index ${i}.` })
      return i
    }
    const qs = (lo: number, hi: number) => {
      if (lo > hi) return
      if (lo === hi) { if (!finalSorted.includes(lo)) { finalSorted.push(lo); push({ sorted: clone(finalSorted), description: `Element ${arr[lo]} at ${lo} is sorted.` }) } return }
      const p = partition(lo, hi)
      qs(lo, p - 1)
      qs(p + 1, hi)
    }
    qs(0, n - 1)
  }

  const last = steps[steps.length - 1]
  if (!last || last.sorted.length !== n) {
    push({ sorted: Array.from({ length: n }, (_, i) => i), description: 'Array fully sorted.' })
  }
  return steps
}

function BarView({ step, maxVal }: { step: Step; maxVal: number }) {
  const arr = step.array
  return (
    <div className="flex items-end justify-center gap-2 h-72 sm:h-80 px-4 pt-6 pb-2">
      {arr.map((v, i) => {
        let color = '#6366f1'
        if (step.sorted.includes(i)) color = '#22c55e'
        if (step.active.includes(i)) color = '#06b6d4'
        if (step.comparing.includes(i)) color = '#f59e0b'
        if (step.swapping.includes(i)) color = '#ec4899'
        if (step.pivot === i) color = '#a855f7'
        const h = Math.max(6, (v / maxVal) * 100)
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-14 h-full justify-end">
            <span className="text-[11px] text-slate-300 font-mono leading-none">{v}</span>
            <div className="w-full flex-1 flex items-end">
              <div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${h}%`, backgroundColor: color, boxShadow: `0 0 14px ${color}55` }} />
            </div>
            <span className="text-[10px] text-slate-500 leading-none">{i}</span>
          </div>
        )
      })}
    </div>
  )
}

function MergeTreeView({ step, input }: { step: Step; input: number[] }) {
  const mt = step.mergeTree
  if (!mt) return <div className="h-64 flex items-center justify-center text-slate-500">No merge tree data.</div>
  const n = input.length
  const maxDepth = Math.max(...mt.nodes.map(nd => nd.depth))
  const rowH = 72
  const boxW = Math.max(28, Math.min(44, 520 / Math.max(1, n)))
  const boxH = 28
  const totalW = Math.max(700, n * (boxW + 2) + 120)
  // y positions: divide top-down, merge bottom-up, leaves in middle
  const yFor = (nd: MergeNode) => {
    if (nd.role === 'divide') return 40 + nd.depth * rowH
    if (nd.role === 'leaf') return 40 + maxDepth * rowH
    // merge: mirror below leaves
    return 40 + maxDepth * rowH + (maxDepth - nd.depth) * rowH
  }
  // x positions: based on array range center
  // find range for each node by id pattern is hard; instead derive from values length and position in tree
  // Better: compute x by recursive layout from edges. Build children map.
  const childrenMap: Record<string, string[]> = {}
  const parentsMap: Record<string, string[]> = {}
  for (const e of mt.edges) {
    (childrenMap[e.from] ||= []).push(e.to)
    ;(parentsMap[e.to] ||= []).push(e.from)
  }
  // assign x for divide/leaf by inorder of divide tree
  const xPos: Record<string, number> = {}
  let leafOrder = 0
  const leafXStep = (totalW - 80) / Math.max(1, n)
  const assignDivideX = (id: string) => {
    const nd = mt.nodes.find(x => x.id === id)
    if (!nd) return
    const kids = (childrenMap[id] || []).filter(k => mt.nodes.find(x=>x.id===k)?.role !== 'merge')
    if (kids.length === 0) {
      xPos[id] = 40 + leafOrder * leafXStep + leafXStep / 2
      leafOrder++
    } else {
      kids.forEach(assignDivideX)
      xPos[id] = kids.reduce((s, k) => s + (xPos[k] || 0), 0) / kids.length
    }
  }
  const divideRoot = mt.nodes.find(x => x.role === 'divide' && x.depth === 0) || mt.nodes.find(x => x.depth === 0)
  if (divideRoot) assignDivideX(divideRoot.id)
  // merge nodes: center over their source children (edges coming in labeled merge)
  const mergeNodes = mt.nodes.filter(x => x.role === 'merge').sort((a,b) => b.depth - a.depth)
  for (const mn of mergeNodes) {
    const srcs = mt.edges.filter(e => e.to === mn.id && e.label === 'merge').map(e => e.from)
    if (srcs.length) xPos[mn.id] = srcs.reduce((s, k) => s + (xPos[k] || 0), 0) / srcs.length
  }

  const totalH = 40 + maxDepth * rowH * 2 + 60
  const nodeW = (nd: MergeNode) => nd.values.length * boxW

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full h-auto" style={{ minWidth: Math.min(totalW, 360) }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
          <marker id="arrowActive" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
          </marker>
        </defs>
        {mt.edges.map((e, i) => {
          const a = mt.nodes.find(x => x.id === e.from)
          const b = mt.nodes.find(x => x.id === e.to)
          if (!a || !b) return null
          const ax = xPos[a.id] || 0, ay = yFor(a) + boxH / 2
          const bx = xPos[b.id] || 0, by = yFor(b) - boxH / 2
          const active = a.state === 'active' || b.state === 'active'
          const done = a.state === 'done' && b.state === 'done'
          const stroke = active ? '#f59e0b' : done ? '#22c55e' : '#475569'
          const mx = (ax + bx) / 2, my = (ay + by) / 2
          return (
            <g key={i}>
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke={stroke} strokeWidth={active ? 2.2 : 1.6} markerEnd={active ? 'url(#arrowActive)' : 'url(#arrow)'} />
              <text x={mx + (bx < ax ? -14 : 14)} y={my} fill={active ? '#fbbf24' : '#94a3b8'} fontSize="10" textAnchor="middle" dominantBaseline="middle">{e.label}</text>
            </g>
          )
        })}
        {mt.nodes.map((nd) => {
          const x = (xPos[nd.id] || 0) - nodeW(nd) / 2
          const y = yFor(nd) - boxH / 2
          const active = nd.state === 'active'
          const done = nd.state === 'done'
          const stroke = active ? '#f59e0b' : done ? '#22c55e' : '#64748b'
          const fill = active ? '#3b2a12' : done ? '#14291c' : '#1e293b'
          const text = active ? '#fde68a' : done ? '#bbf7d0' : '#e2e8f0'
          return (
            <g key={nd.id}>
              <rect x={x} y={y} width={nodeW(nd)} height={boxH} rx={4} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1.5} />
              {nd.values.map((v, i) => (
                <g key={i}>
                  {i > 0 && <line x1={x + i * boxW} y1={y} x2={x + i * boxW} y2={y + boxH} stroke={stroke} strokeWidth="1" />}
                  <text x={x + i * boxW + boxW / 2} y={y + boxH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={text} fontSize="11" fontWeight="600">{v}</text>
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function SortingVisualizer() {
  const [algo, setAlgo] = useState<Algo>('merge')
  const [inputStr, setInputStr] = useState(PRESETS['Merge Example'].join(', '))
  const [array, setArray] = useState<number[]>(PRESETS['Merge Example'])
  const [pivotMode, setPivotMode] = useState<PivotMode>('last')
  const [customPivot, setCustomPivot] = useState('0')
  const [steps, setSteps] = useState<Step[]>(() => genSteps('merge', PRESETS['Merge Example']))
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const timerRef = useRef<number | null>(null)

  const maxVal = useMemo(() => Math.max(1, ...array), [array])
  const step = steps[stepIdx] || steps[0]

  const rebuild = (nextAlgo: Algo, nextArr: number[], pm: PivotMode = pivotMode, cp: string = customPivot) => {
    const cpIdx = Math.max(0, Math.min(nextArr.length - 1, Math.round(Number(cp) || 0)))
    const s = genSteps(nextAlgo, nextArr, pm, cpIdx)
    setSteps(s)
    setStepIdx(0)
    setPlaying(false)
  }

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

  const applyInput = () => {
    const nums = inputStr.split(/[\s,]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
    const trimmed = nums.slice(0, 12).map((n) => Math.max(1, Math.min(99, Math.round(n))))
    if (trimmed.length < 2) return
    setArray(trimmed)
    rebuild(algo, trimmed)
  }

  const loadPreset = (name: string) => {
    const arr = PRESETS[name]
    setInputStr(arr.join(', '))
    setArray(arr)
    rebuild(algo, arr)
  }

  const shuffle = () => {
    const arr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10)
    setInputStr(arr.join(', '))
    setArray(arr)
    rebuild(algo, arr)
  }

  const changeAlgo = (a: Algo) => {
    setAlgo(a)
    // For merge, prefer the merge example if current is default-ish small? keep current array
    if (a === 'merge' && array.length > 8) {
      const trimmed = array.slice(0, 8)
      setArray(trimmed)
      setInputStr(trimmed.join(', '))
      rebuild(a, trimmed)
    } else {
      rebuild(a, array)
    }
  }

  const onPivotModeChange = (pm: PivotMode) => {
    setPivotMode(pm)
    rebuild(algo, array, pm, customPivot)
  }
  const onCustomPivotChange = (v: string) => {
    setCustomPivot(v)
    if (pivotMode === 'custom') rebuild(algo, array, 'custom', v)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Sorting Visualizer</h1>
        <p className="text-slate-400 mt-1">Step through sorting algorithms. Merge Sort shows the divide-and-conquer tree; Quick Sort lets you choose the pivot.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {ALGOS.map((a) => (
          <button key={a.id} onClick={() => changeAlgo(a.id)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${algo === a.id ? 'bg-violet-500/20 text-violet-200 border-violet-500/40' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'}`}>
            {a.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_290px] gap-5">
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-sm text-slate-400">Step <span className="text-white font-semibold">{stepIdx + 1}</span> / {steps.length}</div>
              <div className="text-sm text-slate-300 mt-1 min-h-[40px]">{step.description}</div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{ALGOS.find(a => a.id === algo)?.name}</div>
          </div>

          <div className="bg-[#0c1324] border border-slate-800 rounded-lg p-2">
            {algo === 'merge' ? <MergeTreeView step={step} input={array} /> : <BarView step={step} maxVal={maxVal} />}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
            <button onClick={() => { setPlaying(false); setStepIdx(0) }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200" title="Reset"><RotateCcw size={18} /></button>
            <button onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(0, i - 1)) }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200" title="Previous"><StepBack size={18} /></button>
            <button onClick={() => { if (stepIdx >= steps.length - 1) setStepIdx(0); setPlaying((p) => !p) }} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center gap-2">
              {playing ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play</>}
            </button>
            <button onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(steps.length - 1, i + 1)) }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200" title="Next"><StepForward size={18} /></button>
            <div className="flex items-center gap-2 ml-auto text-sm text-slate-400">
              <span>Speed</span>
              <input type="range" min={100} max={1200} step={50} value={1300 - speed} onChange={(e) => setSpeed(1300 - Number(e.target.value))} className="w-28 accent-violet-500" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
            {algo === 'merge' ? (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-500" /> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> Done</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500" /> Unsorted</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-500" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Comparing</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-500" /> Swap/Write</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> Sorted</span>
                {algo === 'quick' && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500" /> Pivot</span>}
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5 space-y-4">
          {algo === 'quick' && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
              <label className="text-sm font-medium text-violet-200 block mb-2">Choose Pivot Element</label>
              <select value={pivotMode} onChange={(e) => onPivotModeChange(e.target.value as PivotMode)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 mb-2">
                <option value="last">Last element</option>
                <option value="first">First element</option>
                <option value="middle">Middle element</option>
                <option value="custom">Custom index</option>
              </select>
              {pivotMode === 'custom' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Pivot index (0-based, within current range)</label>
                  <input value={customPivot} onChange={(e) => onCustomPivotChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" />
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2">Quick Sort partitions around the selected pivot. The pivot choice affects the partitioning steps.</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Array (comma separated, 2-12 values)</label>
            <textarea value={inputStr} onChange={(e) => setInputStr(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
            <div className="flex gap-2 mt-2">
              <button onClick={applyInput} className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Apply</button>
              <button onClick={shuffle} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm flex items-center gap-1.5"><Shuffle size={14} /> Random</button>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-300 mb-2">Presets</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((p) => (
                <button key={p} onClick={() => loadPreset(p)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700">{p}</button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
            <div className="font-semibold text-slate-300 mb-1">About {ALGOS.find(a => a.id === algo)?.name}</div>
            {algo === 'bubble' && 'Repeatedly compares adjacent elements and swaps them if out of order. O(n²).'}
            {algo === 'selection' && 'Finds the minimum in the unsorted region and swaps it into position. O(n²).'}
            {algo === 'insertion' && 'Inserts each element into its correct place in the sorted prefix. O(n²) worst case.'}
            {algo === 'merge' && 'Divides the array into halves, recursively sorts, then merges sorted halves. Stable O(n log n). The tree view shows divide and merge phases.'}
            {algo === 'quick' && 'Partitions around a chosen pivot, then recursively sorts partitions. Average O(n log n). You can choose which element acts as pivot.'}
          </div>
        </div>
      </div>
    </div>
  )
}
