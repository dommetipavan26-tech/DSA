import { useEffect, useRef, useState } from 'react'
import { Play, Pause, StepBack, StepForward, RotateCcw, Shuffle } from 'lucide-react'

type Algo = 'linear' | 'binary'
interface Step { arr: number[]; lo: number; hi: number; mid: number; i: number; found: number; discarded: number[]; description: string }

function genLinear(arr: number[], target: number): Step[] {
  const steps: Step[] = []
  const discarded: number[] = []
  for (let i = 0; i < arr.length; i++) {
    steps.push({ arr, lo: -1, hi: -1, mid: -1, i, found: -1, discarded: [...discarded], description: `Check index ${i}: ${arr[i]} ${arr[i]===target ? '== '+target : '!= '+target}.` })
    if (arr[i] === target) { steps.push({ arr, lo: -1, hi: -1, mid: -1, i, found: i, discarded: [...discarded], description: `Found ${target} at index ${i}!` }); return steps }
    discarded.push(i)
  }
  steps.push({ arr, lo: -1, hi: -1, mid: -1, i: -1, found: -1, discarded: [...discarded], description: `${target} not found in the array.` })
  return steps
}

function genBinary(sorted: number[], target: number): Step[] {
  const steps: Step[] = []
  let lo = 0, hi = sorted.length - 1
  const discarded: number[] = []
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    steps.push({ arr: sorted, lo, hi, mid, i: -1, found: -1, discarded: [...discarded], description: `lo=${lo}, hi=${hi}, mid=${mid}. Compare ${sorted[mid]} with ${target}.` })
    if (sorted[mid] === target) { steps.push({ arr: sorted, lo, hi, mid, i: -1, found: mid, discarded: [...discarded], description: `Found ${target} at index ${mid}!` }); return steps }
    if (sorted[mid] < target) { for (let k=lo;k<=mid;k++) discarded.push(k); steps.push({ arr: sorted, lo: mid+1, hi, mid, i: -1, found: -1, discarded: [...discarded], description: `${sorted[mid]} < ${target}, discard left half.` }); lo = mid + 1 }
    else { for (let k=mid;k<=hi;k++) discarded.push(k); steps.push({ arr: sorted, lo, hi: mid-1, mid, i: -1, found: -1, discarded: [...discarded], description: `${sorted[mid]} > ${target}, discard right half.` }); hi = mid - 1 }
  }
  steps.push({ arr: sorted, lo, hi, mid: -1, i: -1, found: -1, discarded: [...discarded], description: `${target} not found.` })
  return steps
}

export default function SearchingVisualizer() {
  const [algo, setAlgo] = useState<Algo>('binary')
  const [arrStr, setArrStr] = useState('5, 12, 18, 23, 34, 45, 56, 67, 78, 89')
  const [targetStr, setTargetStr] = useState('45')
  const [steps, setSteps] = useState<Step[]>(() => genBinary([5,12,18,23,34,45,56,67,78,89], 45))
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const timer = useRef<number | null>(null)
  const step = steps[stepIdx]

  useEffect(() => { if (!playing) return; timer.current = window.setInterval(() => setStepIdx(i => { if (i>=steps.length-1){setPlaying(false);return i} return i+1 }), speed); return ()=>{ if(timer.current) window.clearInterval(timer.current) } }, [playing, speed, steps.length])

  const run = () => {
    const arr = arrStr.split(/[\s,]+/).map(Number).filter(Number.isFinite).map(n=>Math.round(n)).slice(0,15)
    const t = Math.round(Number(targetStr))
    if (!arr.length || !Number.isFinite(t)) return
    const s = algo === 'linear' ? genLinear(arr, t) : genBinary([...arr].sort((a,b)=>a-b), t)
    setSteps(s); setStepIdx(0); setPlaying(true)
  }
  const shuffle = () => {
    const a = Array.from({length:10},()=>Math.floor(Math.random()*90)+5)
    setArrStr((algo==='binary'?[...a].sort((x,y)=>x-y):a).join(', '))
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-white">Searching Visualizer</h1><p className="text-slate-400 mt-1">Compare Linear and Binary Search step by step.</p></div>
      <div className="flex gap-2 mb-5">
        {(['linear','binary'] as Algo[]).map(a => (
          <button key={a} onClick={()=>setAlgo(a)} className={`px-4 py-2 rounded-full text-sm font-medium border ${algo===a?'bg-violet-500/20 text-violet-200 border-violet-500/40':'bg-slate-800/60 text-slate-300 border-slate-700'}`}>{a==='linear'?'Linear Search':'Binary Search'}</button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end mb-5">
          <div className="flex-1 min-w-[220px]"><label className="text-xs text-slate-400 block mb-1">Array {algo==='binary'&&'(will be sorted)'}</label><input value={arrStr} onChange={e=>setArrStr(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <div><label className="text-xs text-slate-400 block mb-1">Target</label><input value={targetStr} onChange={e=>setTargetStr(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200" /></div>
          <button onClick={run} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">Run</button>
          <button onClick={shuffle} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm flex items-center gap-1"><Shuffle size={14}/> Random</button>
        </div>

        <div className="text-sm text-slate-300 mb-4">{step?.description}</div>
        <div className="flex flex-wrap gap-2 justify-center py-6">
          {step.arr.map((v, idx) => {
            let cls = 'bg-slate-800 border-slate-700 text-slate-200'
            if (step.found === idx) cls = 'bg-emerald-900/60 border-emerald-400 text-emerald-200 scale-110'
            else if (step.mid === idx) cls = 'bg-amber-900/60 border-amber-400 text-amber-200'
            else if (step.i === idx) cls = 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
            else if (step.discarded.includes(idx)) cls = 'bg-slate-900/50 border-slate-800 text-slate-600'
            else if (algo==='binary' && idx >= step.lo && idx <= step.hi && step.lo>=0) cls = 'bg-indigo-900/40 border-indigo-500 text-indigo-200'
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center font-semibold transition-all ${cls}`}>{v}</div>
                <span className="text-[10px] text-slate-500">{idx}</span>
                <div className="h-4 text-[10px] text-slate-400">
                  {step.lo===idx && algo==='binary' ? 'lo' : step.hi===idx && algo==='binary' ? 'hi' : step.mid===idx ? 'mid' : step.i===idx ? 'i' : ''}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <button onClick={()=>{setPlaying(false);setStepIdx(0)}} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><RotateCcw size={18}/></button>
          <button onClick={()=>setStepIdx(i=>Math.max(0,i-1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepBack size={18}/></button>
          <button onClick={()=>{ if(stepIdx>=steps.length-1) setStepIdx(0); setPlaying(p=>!p)}} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium flex items-center gap-2">{playing?<><Pause size={18}/>Pause</>:<><Play size={18}/>Play</>}</button>
          <button onClick={()=>setStepIdx(i=>Math.min(steps.length-1,i+1))} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"><StepForward size={18}/></button>
          <span className="text-sm text-slate-400 ml-2">Step {stepIdx+1}/{steps.length}</span>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-400"><span>Speed</span><input type="range" min={100} max={1200} step={50} value={1300-speed} onChange={e=>setSpeed(1300-Number(e.target.value))} className="w-28 accent-violet-500"/></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><h3 className="text-white font-semibold mb-2">Linear Search</h3><p className="text-slate-400">Scans each element one by one. Works on unsorted arrays. Time: O(n), Space: O(1).</p></div>
        <div className="rounded-xl border border-slate-800 bg-[#121a2f]/80 p-4"><h3 className="text-white font-semibold mb-2">Binary Search</h3><p className="text-slate-400">Halves the search space each step. Requires a sorted array. Time: O(log n), Space: O(1).</p></div>
      </div>
    </div>
  )
}
