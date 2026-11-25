import { PageHeader } from '../components/ui/page-header'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw, Plus, Trash2 } from 'lucide-react'

type HeapType = 'min' | 'max'

interface Step {
  heap: number[]
  comparing: number[]
  swapping: number[]
  active: number[]
  description: string
  extracted?: number
}

function clone(a: number[]) { return a.slice() }

function heapCmp(type: HeapType, a: number, b: number) {
  return type === 'min' ? a < b : a > b
}

function genInsertSteps(type: HeapType, heap: number[], value: number): Step[] {
  const h = clone(heap)
  const steps: Step[] = []
  const push = (s: Partial<Step> & { description: string }) => {
    steps.push({ heap: clone(h), comparing: s.comparing || [], swapping: s.swapping || [], active: s.active || [], description: s.description, extracted: s.extracted })
  }
  h.push(value)
  let i = h.length - 1
  push({ active: [i], description: `Insert ${value} at index ${i} (end of heap).` })
  while (i > 0) {
    const p = Math.floor((i - 1) / 2)
    push({ comparing: [i, p], description: `Compare ${h[i]} with parent ${h[p]}.` })
    if (heapCmp(type, h[i], h[p])) {
      [h[i], h[p]] = [h[p], h[i]]
      push({ swapping: [i, p], description: `Swap ${h[p]} and ${h[i]}. Bubble up.` })
      i = p
    } else {
      push({ active: [i], description: `${h[i]} is in correct position relative to parent.` })
      break
    }
  }
  if (i === 0) push({ active: [0], description: `${h[0]} is at the root. Heap property restored.` })
  return steps
}

function genExtractSteps(type: HeapType, heap: number[]): Step[] {
  const h = clone(heap)
  const steps: Step[] = []
  const push = (s: Partial<Step> & { description: string }) => {
    steps.push({ heap: clone(h), comparing: s.comparing || [], swapping: s.swapping || [], active: s.active || [], description: s.description, extracted: s.extracted })
  }
  if (h.length === 0) { push({ description: 'Heap is empty.' }); return steps }
  const root = h[0]
  push({ active: [0], description: `Extract root ${root}.` })
  const last = h.pop()!
  if (h.length === 0) {
    push({ description: `Removed ${root}. Heap is now empty.`, extracted: root })
    return steps
  }
  h[0] = last
  push({ active: [0], description: `Move last element ${last} to root.` })
  let i = 0
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2
    let target = i
    if (l < h.length) {
      push({ comparing: [target, l], description: `Compare ${h[target]} with left child ${h[l]}.` })
      if (heapCmp(type, h[l], h[target])) target = l
    }
    if (r < h.length) {
      push({ comparing: [target, r], description: `Compare ${h[target]} with right child ${h[r]}.` })
      if (heapCmp(type, h[r], h[target])) target = r
    }
    if (target !== i) {
      [h[i], h[target]] = [h[target], h[i]]
      push({ swapping: [i, target], description: `Swap ${h[target]} and ${h[i]}. Bubble down.` })
      i = target
    } else {
      push({ active: [i], description: `Heap property restored.` })
      break
    }
  }
  push({ description: `Extracted ${root}.`, extracted: root })
  return steps
}

function buildHeap(type: HeapType, values: number[]): number[] {
  const h = clone(values)
  const cmp = (a: number, b: number) => heapCmp(type, a, b)
  for (let i = Math.floor(h.length / 2) - 1; i >= 0; i--) {
    let j = i
    while (true) {
      const l = 2 * j + 1, r = 2 * j + 2
      let t = j
      if (l < h.length && cmp(h[l], h[t])) t = l
      if (r < h.length && cmp(h[r], h[t])) t = r
      if (t !== j) { [h[j], h[t]] = [h[t], h[j]]; j = t } else break
    }
  }
  return h
}

function HeapTree({ heap, comparing, swapping, active }: { heap: number[]; comparing: number[]; swapping: number[]; active: number[] }) {
  if (heap.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">Heap is empty.</div>
  const levels: number[][] = []
  let i = 0, l = 0
  while (i < heap.length) {
    const c = Math.pow(2, l)
    const row: number[] = []
    for (let k = 0; k < c && i < heap.length; k++, i++) row.push(i)
    levels.push(row)
    l++
  }
  const W = 800, LH = 95, H = Math.max(240, levels.length * LH + 50)
  const pos: Record<number, { x: number; y: number }> = {}
  levels.forEach((row, li) => {
    const y = 45 + li * LH
    const gap = W / (row.length + 1)
    row.forEach((idx, k) => { pos[idx] = { x: gap * (k + 1), y } })
  })
  const color = (idx: number) => {
    if (swapping.includes(idx)) return { f: '#831843', s: '#ec4899', t: '#fbcfe8' }
    if (comparing.includes(idx)) return { f: '#78350f', s: '#f59e0b', t: '#fde68a' }
    if (active.includes(idx)) return { f: '#164e63', s: '#22d3ee', t: '#a5f3fc' }
    if (idx === 0) return { f: '#3f2a00', s: '#f59e0b', t: '#fde68a' }
    return { f: '#1e293b', s: '#6366f1', t: '#c7d2fe' }
  }
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-4xl mx-auto h-auto" style={{ minWidth: 340 }}>
        {heap.map((_, idx) => [2*idx+1,2*idx+2].filter(c=>c<heap.length).map(c => (
          <line key={`${idx}-${c}`} x1={pos[idx].x} y1={pos[idx].y} x2={pos[c].x} y2={pos[c].y} stroke="#475569" strokeWidth="2" />
        )))}
        {heap.map((v, idx) => {
          const p = pos[idx], c = color(idx)
          return (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="24" fill={c.f} stroke={c.s} strokeWidth="2.5" />
              <text x={p.x} y={p.y+1} textAnchor="middle" dominantBaseline="middle" fill={c.t} fontSize="14" fontWeight="700">{v}</text>
              <text x={p.x} y={p.y+35} textAnchor="middle" fill="#64748b" fontSize="10">[{idx}]</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function HeapVisualizer() {
  const [type, setType] = useState<HeapType>('min')
  const [heap, setHeap] = useState<number[]>(() => buildHeap('min', [45,20,75,10,60,35,90,25]))
  const [input, setInput] = useState('42')
  const [steps, setSteps] = useState<Step[]>([{ heap: buildHeap('min', [45,20,75,10,60,35,90,25]), comparing: [], swapping: [], active: [], description: 'Initial Min Heap built.' }])
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const timerRef = useRef<number | null>(null)
  const step = steps[stepIdx]

  useEffect(() => {
    if (!playing) return
    timerRef.current = window.setInterval(() => {
      setStepIdx(i => { if (i >= steps.length - 1) { setPlaying(false); return i } return i + 1 })
    }, speed)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [playing, speed, steps.length])

  useEffect(() => {
    if (steps.length && stepIdx === steps.length - 1) setHeap(clone(steps[steps.length - 1].heap))
  }, [stepIdx, steps])

  const reset = (nextType: HeapType) => {
    const arr = [45,20,75,10,60,35,90,25]
    const h = buildHeap(nextType, arr)
    setType(nextType)
    setHeap(h)
    setSteps([{ heap: clone(h), comparing: [], swapping: [], active: [], description: `Initial ${nextType === 'min' ? 'Min' : 'Max'} Heap built.` }])
    setStepIdx(0)
    setPlaying(false)
  }

  const run = (s: Step[]) => { setSteps(s); setStepIdx(0); setPlaying(true) }

  const onInsert = () => {
    const v = Math.round(Number(input))
    if (!Number.isFinite(v)) return
    const s = genInsertSteps(type, heap, v)
    setHeap(clone(s[s.length-1].heap))
    run(s)
  }
  const onExtract = () => { const s = genExtractSteps(type, heap); setHeap(clone(s[s.length-1].heap)); run(s) }
  const onClear = () => {
    setHeap([])
    setSteps([{ heap: [], comparing: [], swapping: [], active: [], description: 'Heap cleared.' }])
    setStepIdx(0); setPlaying(false)
  }

  const displayHeap = step?.heap ?? heap

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <PageHeader title="Binary Heap Visualizer" description="Explore Min/Max heaps with insert and extract-root animations." />

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => reset('max')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${type==='max' ? 'bg-amber-500/20 text-amber-200 border-amber-500/40' : 'bg-slate-800/60 text-slate-300 border-slate-700'}`}>Max Heap (Max at Root)</button>
        <button onClick={() => reset('min')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${type==='min' ? 'bg-violet-500/20 text-violet-200 border-violet-500/40' : 'bg-slate-800/60 text-slate-300 border-slate-700'}`}>Min Heap (Min at Root)</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input value={input} onChange={e => setInput(e.target.value)} className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" placeholder="Value" />
            <button onClick={onInsert} className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm flex items-center gap-1.5"><Plus size={16}/> Insert</button>
            <button onClick={onExtract} className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm flex items-center gap-1.5"><Trash2 size={16}/> Extract Root ({type==='min'?'Min':'Max'})</button>
            <button onClick={onClear} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">Clear</button>
          </div>

          <div className="text-sm text-slate-300 mb-3">{step?.description}</div>
          <div className="border border-slate-800 rounded-lg bg-[#0c1324] p-2 mb-4">
            <HeapTree heap={displayHeap} comparing={step?.comparing||[]} swapping={step?.swapping||[]} active={step?.active||[]} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setPlaying(false); setStepIdx(0) }} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><RotateCcw size={18}/></button>
            <button onClick={() => setStepIdx(i=>Math.max(0,i-1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepBack size={18}/></button>
            <button onClick={() => { if (stepIdx >= steps.length-1) setStepIdx(0); setPlaying(p=>!p) }} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center gap-2">
              {playing ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Play</>}
            </button>
            <button onClick={() => setStepIdx(i=>Math.min(steps.length-1,i+1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepForward size={18}/></button>
            <div className="ml-auto flex items-center gap-2 text-sm text-slate-400"><span>Speed</span><input type="range" min={100} max={1200} step={50} value={1300-speed} onChange={e=>setSpeed(1300-Number(e.target.value))} className="w-28 accent-violet-500" /></div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Root/Active</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-700" /> Comparing</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-500" /> Swapping</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500" /> Node</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5">
            <h3 className="text-white font-semibold mb-3">Array View</h3>
            <div className="flex flex-wrap gap-2">
              {displayHeap.map((v, i) => {
                let cls = 'bg-slate-800 border-slate-700 text-slate-200'
                if ((step?.swapping||[]).includes(i)) cls = 'bg-pink-900/50 border-pink-500 text-pink-200'
                else if ((step?.comparing||[]).includes(i)) cls = 'bg-amber-900/50 border-amber-500 text-amber-200'
                else if ((step?.active||[]).includes(i)) cls = 'bg-cyan-900/50 border-cyan-500 text-cyan-200'
                else if (i === 0) cls = 'bg-amber-900/30 border-amber-600 text-amber-200'
                return (
                  <div key={i} className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center ${cls}`}>
                    <span className="text-sm font-semibold">{v}</span>
                    <span className="text-[10px] text-slate-500">{i}</span>
                  </div>
                )
              })}
              {displayHeap.length === 0 && <span className="text-slate-500 text-sm">Empty</span>}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#121a2f]/70 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_-30px_rgba(0,0,0,0.65)] p-4 sm:p-5 text-sm text-slate-400 space-y-2">
            <h3 className="text-white font-semibold">Heap Properties</h3>
            <p><span className="text-slate-300">Type:</span> {type === 'min' ? 'Min Heap — parent ≤ children' : 'Max Heap — parent ≥ children'}</p>
            <p><span className="text-slate-300">Root:</span> {type === 'min' ? 'Minimum element' : 'Maximum element'}</p>
            <p><span className="text-slate-300">Insert:</span> O(log n) — add at end, bubble up</p>
            <p><span className="text-slate-300">Extract:</span> O(log n) — remove root, move last to root, bubble down</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
