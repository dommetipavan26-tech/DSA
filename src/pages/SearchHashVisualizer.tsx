import React, { useEffect, useMemo, useState } from "react";
import {
  ConceptNotesGrid,
  MorphingPillTabs,
  PlaybackDock,
  VisualizerWorkspace,
} from "../components/ui/primitives-21st";
import {
  InspectorBlock,
  PresetRow,
  StudioBtn,
  StudioInput,
  StudioSelect,
} from "../components/ui/input-helpers";
import type { TopicId } from "../data/syllabus";

/* =========================================================
   1. LINEAR & BINARY SEARCH
   ========================================================= */
interface SearchStep {
  arr: number[];
  lo: number;
  hi: number;
  mid: number;
  foundIdx: number;
  eliminated: number[];
  msg: string;
}

function SearchVisualizer({ mode }: { mode: "linear" | "binary" }) {
  const [arrInput, setArrInput] = useState(
    mode === "binary" ? "12, 33, 42, 51, 66, 73, 87, 99, 101" : "18, 42, 7, 66, 25, 91, 33, 12"
  );
  const [targetInput, setTargetInput] = useState(mode === "binary" ? "73" : "66");
  const [arr, setArr] = useState<number[]>(
    mode === "binary" ? [12, 33, 42, 51, 66, 73, 87, 99, 101] : [18, 42, 7, 66, 25, 91, 33, 12]
  );
  const [target, setTarget] = useState(mode === "binary" ? 73 : 66);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  useEffect(() => {
    const nextArr =
      mode === "binary" ? [12, 33, 42, 51, 66, 73, 87, 99, 101] : [18, 42, 7, 66, 25, 91, 33, 12];
    const nextT = mode === "binary" ? 73 : 66;
    setArr(nextArr);
    setArrInput(nextArr.join(", "));
    setTarget(nextT);
    setTargetInput(String(nextT));
    setStepIdx(0);
    setPlaying(false);
  }, [mode]);

  const steps = useMemo<SearchStep[]>(() => {
    const work = mode === "binary" ? [...arr].sort((a, b) => a - b) : [...arr];
    const out: SearchStep[] = [
      {
        arr: work,
        lo: 0,
        hi: work.length - 1,
        mid: -1,
        foundIdx: -1,
        eliminated: [],
        msg: `Ready to search for ${target}. Press Play or Step.`,
      },
    ];

    if (mode === "linear") {
      const checked: number[] = [];
      for (let i = 0; i < work.length; i++) {
        out.push({
          arr: work,
          lo: 0,
          hi: work.length - 1,
          mid: i,
          foundIdx: -1,
          eliminated: [...checked],
          msg: `Comparison ${i + 1}: check index ${i} (${work[i]}) == ${target}?`,
        });
        if (work[i] === target) {
          out.push({
            arr: work,
            lo: 0,
            hi: work.length - 1,
            mid: i,
            foundIdx: i,
            eliminated: [...checked],
            msg: `Found ${target} at index ${i} in ${i + 1} comparison(s)!`,
          });
          return out;
        }
        checked.push(i);
      }
      out.push({
        arr: work,
        lo: 0,
        hi: work.length - 1,
        mid: -1,
        foundIdx: -1,
        eliminated: [...checked],
        msg: `${target} not found after scanning all ${work.length} elements.`,
      });
    } else {
      let lo = 0;
      let hi = work.length - 1;
      let comps = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        comps++;
        const elim = work.map((_, idx) => idx).filter((idx) => idx < lo || idx > hi);
        out.push({
          arr: work,
          lo,
          hi,
          mid,
          foundIdx: -1,
          eliminated: elim,
          msg: `Step ${comps}: lo=${lo}, hi=${hi}, mid=${mid} -> compare arr[${mid}]=${work[mid]} with ${target}.`,
        });
        if (work[mid] === target) {
          out.push({
            arr: work,
            lo,
            hi,
            mid,
            foundIdx: mid,
            eliminated: work.map((_, idx) => idx).filter((idx) => idx !== mid),
            msg: `Found ${target} at index ${mid} in just ${comps} comparison(s)!`,
          });
          return out;
        }
        if (work[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      out.push({
        arr: work,
        lo,
        hi,
        mid: -1,
        foundIdx: -1,
        eliminated: work.map((_, idx) => idx),
        msg: `${target} not found in sorted array (${comps} comparisons).`,
      });
    }
    return out;
  }, [arr, target, mode]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStepIdx((p) => {
        if (p >= steps.length - 1) { setPlaying(false); return p; }
        return p + 1;
      });
    }, 1150 - speed * 95);
    return () => clearInterval(t);
  }, [playing, speed, steps.length]);

  const applyCustom = () => {
    const parsed = arrInput
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .slice(0, 14);
    const t = Number(targetInput);
    if (parsed.length) {
      const finalArr = mode === "binary" ? [...parsed].sort((a, b) => a - b) : parsed;
      setArr(finalArr);
      setArrInput(finalArr.join(", "));
    }
    if (!Number.isNaN(t)) setTarget(t);
    setStepIdx(0);
    setPlaying(true);
  };

  const cur = steps[Math.min(stepIdx, steps.length - 1)] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={mode === "linear" ? "Sequential O(n)" : "Binary O(log n)"}
      isPlaying={playing}
      stage={
        <div className="flex min-h-[240px] flex-wrap items-center justify-center gap-2.5 py-6">
          {cur.arr.map((v, i) => {
            const isFound = cur.foundIdx === i;
            const isMid = cur.mid === i;
            const isElim = cur.eliminated.includes(i);
            const isLo = mode === "binary" && cur.lo === i && cur.foundIdx === -1;
            const isHi = mode === "binary" && cur.hi === i && cur.foundIdx === -1;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-14 min-w-[50px] items-center justify-center rounded-xl border-2 px-3 font-mono text-sm font-bold transition-all ${
                    isFound
                      ? "border-emerald-400 bg-emerald-500/25 text-emerald-200 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                      : isMid
                      ? "border-violet-400 bg-violet-500/25 text-white scale-105 shadow-[0_0_18px_rgba(124,58,237,0.5)]"
                      : isElim
                      ? "border-white/[0.05] bg-[#0b0d14] text-slate-600 opacity-45"
                      : "border-white/[0.14] bg-[#141828] text-slate-200"
                  }`}
                >
                  {v}
                </div>
                <div className="h-4 font-mono text-[10px] font-bold">
                  {isFound ? (
                    <span className="text-emerald-400">FOUND</span>
                  ) : isMid ? (
                    <span className="text-violet-300">{mode === "binary" ? "MID" : "CUR"}</span>
                  ) : isLo ? (
                    <span className="text-amber-300">LOW</span>
                  ) : isHi ? (
                    <span className="text-sky-300">HIGH</span>
                  ) : (
                    <span className="text-slate-500">[{i}]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      }
      controls={
        <PlaybackDock
          isPlaying={playing}
          onTogglePlay={() => { if (stepIdx >= steps.length - 1) setStepIdx(0); setPlaying((p) => !p); }}
          onReset={() => { setPlaying(false); setStepIdx(0); }}
          onStepBack={() => { setPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
          onStepForward={() => { setPlaying(false); setStepIdx((s) => Math.min(steps.length - 1, s + 1)); }}
          canStepBack={stepIdx > 0}
          canStepForward={stepIdx < steps.length - 1}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Custom Array & Target"
            description={mode === "binary" ? "Array auto-sorts for Binary Search." : "Works on sorted or unsorted arrays."}
          >
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Array Values</label>
                <StudioInput value={arrInput} onChange={(e) => setArrInput(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">Target Value</label>
                <StudioInput type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} />
              </div>
              <StudioBtn variant="primary" className="w-full" onClick={applyCustom}>
                Run Search
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "lab", label: "Syllabus Lab Sequence" },
                { id: "miss", label: "Target Missing" },
              ]}
              onSelect={(id) => {
                if (id === "lab") {
                  const a = [12, 33, 42, 51, 66, 73, 87, 99, 101];
                  setArr(a);
                  setArrInput(a.join(", "));
                  setTarget(73);
                  setTargetInput("73");
                } else {
                  setTarget(55);
                  setTargetInput("55");
                }
                setStepIdx(0);
                setPlaying(true);
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition={
            mode === "linear"
              ? "Linear search checks items sequentially from index 0. Simple and works on unsorted arrays, taking O(n) worst case."
              : "Binary search repeatedly jumps to the middle of a sorted array, throwing away half the search space every comparison."
          }
          keyPoints={
            mode === "linear"
              ? ["Works on unsorted data & linked lists.", "Worst case checks all n elements."]
              : ["Requires sorted random-access array.", "Even 1 billion elements takes at most 30 comparisons!"]
          }
          complexities={[
            mode === "linear"
              ? { op: "Linear Search", best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" }
              : { op: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   2. HASHING & COLLISION RESOLUTION (Module 5 Complete!)
   ========================================================= */
type HashMode = "chaining" | "linear" | "quadratic" | "double" | "rehashing" | "extendible";
type HashFn = "division" | "midsquare" | "multiplication";

function computeHash(key: number, size: number, fn: HashFn): number {
  const k = Math.abs(key);
  if (fn === "midsquare") {
    const sq = String(k * k);
    const mid = sq.length >= 2 ? Number(sq.slice(Math.floor(sq.length / 2) - 1, Math.floor(sq.length / 2) + 1)) : Number(sq);
    return mid % size;
  }
  if (fn === "multiplication") {
    const A = 0.6180339887;
    return Math.floor(size * ((k * A) % 1));
  }
  return k % size;
}

function nextPrime(n: number) {
  let c = n;
  const isP = (x: number) => {
    for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
    return x > 1;
  };
  while (!isP(c)) c++;
  return c;
}

function HashingVisualizer() {
  const [mode, setMode] = useState<HashMode>("chaining");
  const [hashFn, setHashFn] = useState<HashFn>("division");
  const [tableSize, setTableSize] = useState(7);
  const [keys, setKeys] = useState<number[]>([23, 14, 9, 30, 16, 37]);
  const [bulkInput, setBulkInput] = useState("23, 14, 9, 30, 16, 37");
  const [singleKey, setSingleKey] = useState("44");
  const [status, setStatus] = useState("Visualizing collisions & resolution live. Try switching strategies above!");

  const { buckets, slots, probeLogs, rehashOccurred, finalSize } = useMemo(() => {
    let curSize = tableSize;
    let rehashMsg = false;

    const runOpenAddressing = (size: number, strategy: "linear" | "quadratic" | "double") => {
      const arr: (number | null)[] = Array(size).fill(null);
      const logs: string[] = [];
      const h2Prime = Math.max(2, size - 2);
      for (const k of keys) {
        const h1 = computeHash(k, size, hashFn);
        const h2 = 1 + (Math.abs(k) % h2Prime);
        let placed = false;
        const probes: number[] = [];
        for (let i = 0; i < size; i++) {
          const idx =
            strategy === "linear"
              ? (h1 + i) % size
              : strategy === "quadratic"
              ? (h1 + i * i) % size
              : (h1 + i * h2) % size;
          probes.push(idx);
          if (arr[idx] === null || arr[idx] === k) {
            arr[idx] = k;
            placed = true;
            logs.push(
              probes.length > 1
                ? `Key ${k}: h=${h1} collided -> probed [${probes.join(" -> ")}]`
                : `Key ${k}: placed at [${idx}]`
            );
            break;
          }
        }
        if (!placed) logs.push(`Key ${k}: table full after ${size} probes!`);
      }
      return { arr, logs };
    };

    if (mode === "chaining") {
      const b: number[][] = Array.from({ length: curSize }, () => []);
      const logs: string[] = [];
      for (const k of keys) {
        const idx = computeHash(k, curSize, hashFn);
        if (!b[idx].includes(k)) {
          const coll = b[idx].length > 0;
          b[idx].push(k);
          logs.push(coll ? `Key ${k}: h=${idx} COLLISION -> appended to chain` : `Key ${k}: placed in bucket [${idx}]`);
        }
      }
      return { buckets: b, slots: [], probeLogs: logs, rehashOccurred: false, finalSize: curSize };
    }

    if (mode === "rehashing") {
      // Load factor threshold > 0.7 triggers resize to nextPrime(2 * size)
      if (keys.length / curSize > 0.7) {
        curSize = nextPrime(curSize * 2);
        rehashMsg = true;
      }
      const res = runOpenAddressing(curSize, "linear");
      return { buckets: [], slots: res.arr, probeLogs: res.logs, rehashOccurred: rehashMsg, finalSize: curSize };
    }

    if (mode === "linear" || mode === "quadratic" || mode === "double") {
      const res = runOpenAddressing(curSize, mode);
      return { buckets: [], slots: res.arr, probeLogs: res.logs, rehashOccurred: false, finalSize: curSize };
    }

    return { buckets: [], slots: [], probeLogs: [], rehashOccurred: false, finalSize: curSize };
  }, [mode, hashFn, tableSize, keys]);

  // Extendible Hashing simulation (Directory with Global Depth & Local Depth buckets of size 2)
  const extendible = useMemo(() => {
    let globalDepth = 1;
    interface ExtBucket {
      id: string;
      localDepth: number;
      items: number[];
    }
    const b0: ExtBucket = { id: "B0", localDepth: 1, items: [] };
    const b1: ExtBucket = { id: "B1", localDepth: 1, items: [] };
    let dir: ExtBucket[] = [b0, b1];
    let bSeq = 2;

    for (const k of keys.slice(0, 10)) {
      let guard = 0;
      while (guard++ < 6) {
        const mask = (1 << globalDepth) - 1;
        const dirIdx = Math.abs(k) & mask;
        const target = dir[dirIdx];
        if (target.items.includes(k)) break;
        if (target.items.length < 2) {
          target.items.push(k);
          break;
        }
        // Bucket overflow -> Split!
        if (target.localDepth === globalDepth) {
          globalDepth++;
          dir = [...dir, ...dir];
        }
        const oldItems = [...target.items];
        const newLocal = target.localDepth + 1;
        const bitMask = 1 << (newLocal - 1);
        const splitA: ExtBucket = { id: `B${bSeq++}`, localDepth: newLocal, items: [] };
        const splitB: ExtBucket = { id: `B${bSeq++}`, localDepth: newLocal, items: [] };
        dir = dir.map((b, idx) => (b === target ? ((idx & bitMask) === 0 ? splitA : splitB) : b));
        oldItems.forEach((item) => {
          if ((Math.abs(item) & bitMask) === 0) splitA.items.push(item);
          else splitB.items.push(item);
        });
      }
    }
    const uniqueBuckets = Array.from(new Set(dir));
    return { globalDepth, dir, uniqueBuckets };
  }, [keys]);

  const insertSingle = () => {
    const k = Number(singleKey);
    if (Number.isNaN(k)) return;
    if (!keys.includes(k)) {
      const next = [...keys, k];
      setKeys(next);
      setBulkInput(next.join(", "));
      setStatus(`Inserted key ${k}.`);
    } else {
      setStatus(`Key ${k} already exists.`);
    }
  };

  const deleteSingle = () => {
    const k = Number(singleKey);
    if (!keys.includes(k)) return setStatus(`Key ${k} not found.`);
    const next = keys.filter((x) => x !== k);
    setKeys(next);
    setBulkInput(next.join(", "));
    setStatus(`Deleted key ${k}.`);
  };

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="hash-mode-tabs"
        value={mode}
        onChange={setMode}
        options={[
          { id: "chaining", label: "Separate Chaining" },
          { id: "linear", label: "Linear Probing" },
          { id: "quadratic", label: "Quadratic Probing" },
          { id: "double", label: "Double Hashing" },
          { id: "rehashing", label: "Rehashing" },
          { id: "extendible", label: "Extendible Hashing" },
        ]}
      />

      <VisualizerWorkspace
        badge={
          mode === "extendible"
            ? `GD = ${extendible.globalDepth}`
            : `Load: ${(keys.length / finalSize).toFixed(2)} (${keys.length}/${finalSize})`
        }
        statusText={
          rehashOccurred
            ? `Load factor > 0.70! Auto-rehashed table from size ${tableSize} to prime size ${finalSize}.`
            : status
        }
        stage={
          mode === "extendible" ? (
            <div className="space-y-4 py-2">
              <div className="text-center font-mono text-xs text-slate-400">
                Global Depth = <span className="font-bold text-violet-300">{extendible.globalDepth}</span> · Bucket Capacity = 2
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Directory (LSB suffix bits)</div>
                  {extendible.dir.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#121625] px-3 py-1.5 font-mono text-xs">
                      <span className="text-sky-300">
                        {idx.toString(2).padStart(extendible.globalDepth, "0")}
                      </span>
                      <span className="text-slate-500">-&gt;</span>
                      <span className="font-bold text-violet-300">{b.id}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Data Buckets</div>
                  {extendible.uniqueBuckets.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-[#101c1a] px-3 py-1.5 font-mono text-xs">
                      <span className="font-bold text-emerald-300">
                        {b.id} (LD={b.localDepth})
                      </span>
                      <span className="text-white">[{b.items.join(", ") || "empty"}]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : mode === "chaining" ? (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
                {buckets.map((bucket, idx) => (
                  <div key={idx} className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#121625]">
                    <div className="border-b border-white/[0.06] bg-[#171c2f] py-1 text-center font-mono text-[11px] font-bold text-slate-400">
                      [{idx}]
                    </div>
                    <div className="flex min-h-[58px] flex-col gap-1 p-1.5">
                      {bucket.map((k) => (
                        <div
                          key={k}
                          className={`rounded px-2 py-0.5 text-center font-mono text-xs font-bold ${
                            bucket.length > 1
                              ? "border border-rose-500/40 bg-rose-500/15 text-rose-200"
                              : "border border-violet-500/40 bg-violet-500/15 text-violet-200"
                          }`}
                        >
                          {k}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-white/[0.06] bg-[#0b0e17] p-2 font-mono text-[11px] text-slate-400">
                {probeLogs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {slots.map((val, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2 text-center font-mono ${
                      val !== null
                        ? "border-violet-500/50 bg-violet-500/15"
                        : "border-white/[0.07] bg-[#111524]"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500">[{idx}]</div>
                    <div className={`mt-1 text-sm font-bold ${val !== null ? "text-white" : "text-slate-600"}`}>
                      {val !== null ? val : "—"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-white/[0.06] bg-[#0b0e17] p-2 font-mono text-[11px] text-slate-400">
                {probeLogs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          )
        }
        inspector={
          <>
            <InspectorBlock highlight title="Custom Keys (Bulk Input)" description="Enter comma-separated keys to insert.">
              <div className="flex gap-2">
                <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const parsed = bulkInput
                      .split(/[,\s]+/)
                      .map(Number)
                      .filter((n) => !Number.isNaN(n))
                      .slice(0, 14);
                    setKeys(parsed);
                    setStatus(`Hashed ${parsed.length} custom keys.`);
                  }}
                >
                  Hash
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Insert / Search / Delete Key">
              <div className="flex gap-2">
                <StudioInput type="number" value={singleKey} onChange={(e) => setSingleKey(e.target.value)} />
                <StudioBtn variant="primary" onClick={insertSingle}>Insert</StudioBtn>
              </div>
              <div className="mt-2 flex gap-2">
                <StudioBtn
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    const k = Number(singleKey);
                    const h = computeHash(k, finalSize, hashFn);
                    setStatus(
                      keys.includes(k)
                        ? `Found ${k}! Primary hash h(${k}) = ${h}.`
                        : `${k} not in table (primary hash h=${h}).`
                    );
                  }}
                >
                  Search
                </StudioBtn>
                <StudioBtn variant="danger" className="flex-1" onClick={deleteSingle}>Delete</StudioBtn>
                <StudioBtn variant="secondary" onClick={() => setKeys([])}>Clear</StudioBtn>
              </div>
            </InspectorBlock>

            {mode !== "extendible" && (
              <InspectorBlock title="Hash Function & Table Size">
                <div className="space-y-2">
                  <StudioSelect value={hashFn} onChange={(e) => setHashFn(e.target.value as HashFn)}>
                    <option value="division">Division: k mod m</option>
                    <option value="midsquare">Mid-Square: middle(k^2) mod m</option>
                    <option value="multiplication">Multiplication: floor(m*(kA mod 1))</option>
                  </StudioSelect>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Initial Size (m)</span>
                    <StudioSelect
                      className="w-24"
                      value={tableSize}
                      onChange={(e) => setTableSize(Number(e.target.value))}
                    >
                      {[5, 7, 11, 13].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </StudioSelect>
                  </div>
                </div>
              </InspectorBlock>
            )}
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="Hashing maps arbitrary keys to array indices in O(1) expected time. When two keys map to the same slot (a collision), we resolve it via Chaining or Open Addressing."
            keyPoints={[
              "Separate Chaining: Each slot holds a linked list of colliding keys.",
              "Linear Probing: (h(k) + i) mod m — simple, but suffers primary clustering.",
              "Quadratic Probing: (h(k) + i^2) mod m — eliminates primary clustering.",
              "Double Hashing: (h1(k) + i * h2(k)) mod m — best open addressing distribution.",
              "Rehashing doubles table size (next prime) when Load Factor > 0.70.",
              "Extendible Hashing grows a directory dynamically via Global & Local Depth bits without full table rehash.",
            ]}
            complexities={[
              { op: "Insert / Search / Delete", best: "O(1)", avg: "O(1)", worst: "O(n) all collide" },
            ]}
          />
        }
      />
    </div>
  );
}

export function renderSearchHashTopic(topicId: TopicId) {
  if (topicId === "linear-search") return <SearchVisualizer mode="linear" />;
  if (topicId === "binary-search") return <SearchVisualizer mode="binary" />;
  return <HashingVisualizer />;
}
