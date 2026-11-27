import { useMemo, useState } from "react";
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
import { usePlayback } from "../hooks/usePlayback";
import { parseNumberList } from "../lib/parsers";
import type { TopicId } from "../data/syllabus";

/* =========================================================
   1. LINEAR & BINARY SEARCH
   ========================================================= */
interface SearchItem {
  display: string;
  sub?: string;
  key: string;
}

interface SearchStep {
  items: SearchItem[];
  lo: number;
  hi: number;
  mid: number;
  foundIdx: number;
  eliminated: number[];
  msg: string;
}

const DEFAULT_RECORDS = [
  { id: "104", name: "Maya" },
  { id: "208", name: "Arjun" },
  { id: "119", name: "Elena" },
  { id: "342", name: "Kenji" },
  { id: "275", name: "Priya" },
  { id: "412", name: "Lucas" },
];

function SearchVisualizer({ mode }: { mode: "linear" | "binary" }) {
  const [dataKind, setDataKind] = useState<"numbers" | "records">("numbers");
  const [arrInput, setArrInput] = useState(
    mode === "binary" ? "12, 33, 42, 51, 66, 73, 87, 99, 101" : "18, 42, 7, 66, 25, 91, 33, 12"
  );
  const [targetInput, setTargetInput] = useState(mode === "binary" ? "73" : "66");
  const [arr, setArr] = useState<number[]>(
    mode === "binary" ? [12, 33, 42, 51, 66, 73, 87, 99, 101] : [18, 42, 7, 66, 25, 91, 33, 12]
  );
  const [target, setTarget] = useState(mode === "binary" ? 73 : 66);
  const [recordTarget, setRecordTarget] = useState("Kenji");
  const [inputNotice, setInputNotice] = useState<string | undefined>(undefined);

  const isRecordLinear = mode === "linear" && dataKind === "records";

  const steps = useMemo<SearchStep[]>(() => {
    if (isRecordLinear) {
      const items: SearchItem[] = DEFAULT_RECORDS.map((r) => ({
        display: r.name,
        sub: `ID ${r.id}`,
        key: `${r.name.toLowerCase()} ${r.id}`,
      }));
      const q = recordTarget.trim().toLowerCase();
      const out: SearchStep[] = [
        {
          items,
          lo: 0,
          hi: items.length - 1,
          mid: -1,
          foundIdx: -1,
          eliminated: [],
          msg: `Ready to scan ${items.length} student records for "${recordTarget.trim()}".`,
        },
      ];
      const checked: number[] = [];
      for (let i = 0; i < items.length; i++) {
        const rec = DEFAULT_RECORDS[i];
        const match =
          q.length > 0 && (rec.name.toLowerCase() === q || rec.id === recordTarget.trim());
        out.push({
          items,
          lo: 0,
          hi: items.length - 1,
          mid: i,
          foundIdx: -1,
          eliminated: [...checked],
          msg: `Comparison ${i + 1}: check record [${i}] ${rec.name} (ID ${rec.id}).`,
        });
        if (match) {
          out.push({
            items,
            lo: 0,
            hi: items.length - 1,
            mid: i,
            foundIdx: i,
            eliminated: [...checked],
            msg: `Matched ${rec.name} (ID ${rec.id}) at index ${i} in ${i + 1} comparison(s).`,
          });
          return out;
        }
        checked.push(i);
      }
      out.push({
        items,
        lo: 0,
        hi: items.length - 1,
        mid: -1,
        foundIdx: -1,
        eliminated: [...checked],
        msg: `"${recordTarget.trim()}" not found after checking all ${items.length} records.`,
      });
      return out;
    }

    const work = mode === "binary" ? [...arr].sort((a, b) => a - b) : [...arr];
    const items: SearchItem[] = work.map((n) => ({ display: String(n), key: String(n) }));

    const out: SearchStep[] = [
      {
        items,
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
          items,
          lo: 0,
          hi: work.length - 1,
          mid: i,
          foundIdx: -1,
          eliminated: [...checked],
          msg: `Comparison ${i + 1}: check index ${i} (${work[i]}) == ${target}?`,
        });
        if (work[i] === target) {
          out.push({
            items,
            lo: 0,
            hi: work.length - 1,
            mid: i,
            foundIdx: i,
            eliminated: [...checked],
            msg: `Found ${target} at index ${i} in ${i + 1} comparison(s).`,
          });
          return out;
        }
        checked.push(i);
      }
      out.push({
        items,
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
          items,
          lo,
          hi,
          mid,
          foundIdx: -1,
          eliminated: elim,
          msg: `Step ${comps}: lo=${lo}, hi=${hi}, mid=${mid} -> compare arr[${mid}]=${work[mid]} with ${target}`,
        });
        if (work[mid] === target) {
          out.push({
            items,
            lo,
            hi,
            mid,
            foundIdx: mid,
            eliminated: work.map((_, idx) => idx).filter((idx) => idx !== mid),
            msg: `Found ${target} at index ${mid} in ${comps} comparison(s).`,
          });
          return out;
        }
        if (work[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      out.push({
        items,
        lo,
        hi,
        mid: -1,
        foundIdx: -1,
        eliminated: work.map((_, idx) => idx),
        msg: `${target} not found in sorted array (${comps} comparisons).`,
      });
    }
    return out;
  }, [arr, target, mode, isRecordLinear, recordTarget]);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${mode}-${dataKind}-${arr.join(",")}-${target}-${recordTarget}`,
  });

  const applyCustom = () => {
    const parsed = parseNumberList(arrInput, { maxCount: 14 });
    const t = Number(targetInput);
    if (!parsed.values.length) {
      setInputNotice("Enter at least one valid number separated by commas or spaces.");
      return;
    }
    const wasUnsorted =
      mode === "binary" &&
      parsed.values.some((v, idx) => idx > 0 && v < parsed.values[idx - 1]);
    const finalArr =
      mode === "binary" ? [...parsed.values].sort((a, b) => a - b) : parsed.values;
    setArr(finalArr);
    setArrInput(finalArr.join(", "));
    setInputNotice(
      wasUnsorted
        ? "Input array was automatically sorted ascending because Binary Search requires sorted data."
        : undefined
    );
    if (Number.isFinite(t) && targetInput.trim() !== "") setTarget(t);
    pb.jumpTo(0, true);
  };

  const cur = steps[pb.stepIdx] ?? steps[0];

  return (
    <div className="space-y-4">
      {mode === "linear" && (
        <MorphingPillTabs
          layoutId="linear-search-mode"
          value={dataKind}
          onChange={(v) => {
            setDataKind(v);
            setInputNotice(undefined);
          }}
          options={[
            { id: "numbers", label: "Number Array" },
            { id: "records", label: "Student Records" },
          ]}
        />
      )}

      <VisualizerWorkspace
        step={pb.stepIdx}
        totalSteps={Math.max(0, steps.length - 1)}
        statusText={cur.msg}
        notice={inputNotice}
        badge={mode === "linear" ? "Sequential O(n)" : "Binary O(log n)"}
        isPlaying={pb.playing}
        stage={
          <div className="flex min-h-[240px] flex-wrap items-center justify-center gap-2.5 py-6">
            {cur.items.map((item, i) => {
              const isFound = cur.foundIdx === i;
              const isMid = cur.mid === i;
              const isElim = cur.eliminated.includes(i);
              const isLo = mode === "binary" && cur.lo === i && cur.foundIdx === -1;
              const isHi = mode === "binary" && cur.hi === i && cur.foundIdx === -1;

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex min-h-14 min-w-[56px] flex-col items-center justify-center rounded-xl border-2 px-3 py-1.5 font-mono text-sm font-medium tabular-nums transition-colors duration-150 ${
                      isFound
                        ? "border-[#4cc38a] bg-[#4cc38a]/15 text-[#4cc38a] shadow-[0_0_16px_rgba(76,195,138,0.28)]"
                        : isMid
                        ? "border-amber-400 bg-amber-500/15 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.28)]"
                        : isElim
                        ? "border-[#ededed]/[0.06] bg-[#141415] text-[#93939a] opacity-40"
                        : "border-[#ededed]/[0.16] bg-[#19191b] text-[#ededed]"
                    }`}
                  >
                    <span>{item.display}</span>
                    {item.sub && (
                      <span className="text-[10px] font-normal text-[#93939a]">{item.sub}</span>
                    )}
                  </div>
                  <div className="h-4 font-mono text-xs font-medium tabular-nums">
                    {isFound ? (
                      <span className="text-[#4cc38a]">FOUND</span>
                    ) : isMid ? (
                      <span className="text-amber-400">{mode === "binary" ? "MID" : "CUR"}</span>
                    ) : isLo ? (
                      <span className="text-[#60a5fa]">LOW</span>
                    ) : isHi ? (
                      <span className="text-[#60a5fa]">HIGH</span>
                    ) : (
                      <span className="text-[#93939a]">[{i}]</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        }
        controls={
          <PlaybackDock
            isPlaying={pb.playing}
            onTogglePlay={pb.togglePlay}
            onReset={pb.reset}
            onStepBack={pb.stepBack}
            onStepForward={pb.stepForward}
            canStepBack={pb.canStepBack}
            canStepForward={pb.canStepForward}
            speed={pb.speed}
            onSpeedChange={pb.setSpeed}
            legend={
              mode === "binary"
                ? [
                    { label: "Active range", colorClass: "bg-[#48484f]" },
                    { label: "MID check", colorClass: "bg-amber-500" },
                    { label: "LOW / HIGH bounds", colorClass: "bg-[#60a5fa]" },
                    { label: "Found", colorClass: "bg-[#4cc38a]" },
                  ]
                : [
                    { label: "Checking", colorClass: "bg-amber-500" },
                    { label: "Found", colorClass: "bg-[#4cc38a]" },
                  ]
            }
          />
        }
        inspector={
          isRecordLinear ? (
            <>
              <InspectorBlock
                highlight
                title="Search Student Records"
                description="Enter a student name (e.g. Kenji) or ID (e.g. 275)."
              >
                <div className="space-y-2">
                  <StudioInput
                    value={recordTarget}
                    onChange={(e) => setRecordTarget(e.target.value)}
                    placeholder="Kenji or 275"
                  />
                  <StudioBtn
                    variant="primary"
                    className="w-full"
                    onClick={() => pb.jumpTo(0, true)}
                  >
                    Scan Records
                  </StudioBtn>
                </div>
              </InspectorBlock>
              <InspectorBlock title="Quick Picks">
                <PresetRow
                  presets={[
                    { id: "Kenji", label: "Kenji" },
                    { id: "275", label: "ID 275" },
                    { id: "Zoe", label: "Missing (Zoe)" },
                  ]}
                  onSelect={(id) => {
                    setRecordTarget(id);
                    pb.jumpTo(0, true);
                  }}
                />
              </InspectorBlock>
            </>
          ) : (
            <>
              <InspectorBlock
                highlight
                title="Custom array & target"
                description={
                  mode === "binary"
                    ? "Array auto-sorts for binary search"
                    : "Works on sorted or unsorted arrays"
                }
              >
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#a1a1a6]">Array values</label>
                    <StudioInput value={arrInput} onChange={(e) => setArrInput(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#a1a1a6]">Target value</label>
                    <StudioInput
                      type="number"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                    />
                  </div>
                  <StudioBtn variant="primary" className="w-full" onClick={applyCustom}>
                    Run Search
                  </StudioBtn>
                </div>
              </InspectorBlock>

              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "lab", label: "Sorted Sequence" },
                    { id: "miss", label: "Target Missing" },
                  ]}
                  onSelect={(id) => {
                    setInputNotice(undefined);
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
                    pb.jumpTo(0, true);
                  }}
                />
              </InspectorBlock>
            </>
          )
        }
        footerNotes={
          <ConceptNotesGrid
            intuition={
              mode === "linear"
                ? "Linear search checks items sequentially from index 0. Simple and works on unsorted arrays or records, taking O(n) worst case."
                : "Binary search repeatedly jumps to the middle of a sorted array, throwing away half the search space every comparison."
            }
            keyPoints={
              mode === "linear"
                ? ["Works on unsorted arrays, linked lists, and object records.", "Worst case checks all n elements."]
                : [
                    "Requires a sorted random-access array.",
                    "Even 1 billion elements takes at most 30 comparisons.",
                  ]
            }
            complexities={[
              mode === "linear"
                ? { op: "Linear Search", best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" }
                : {
                    op: "Binary Search",
                    best: "O(1)",
                    avg: "O(log n)",
                    worst: "O(log n)",
                    space: "O(1)",
                  },
            ]}
            javaCode={
              mode === "linear"
                ? `static int linearSearch(int[] a, int target) {
  for (int i = 0; i < a.length; i++)
    if (a[i] == target) return i;
  return -1;
}`
                : `static int binarySearch(int[] a, int target) {
  int lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`
            }
          />
        }
      />
    </div>
  );
}

/* =========================================================
   2. HASHING & COLLISION RESOLUTION
   ========================================================= */
type HashMode = "chaining" | "linear" | "quadratic" | "double" | "rehashing" | "extendible";
type HashFn = "division" | "midsquare" | "multiplication";

function computeHash(key: number, size: number, fn: HashFn): number {
  const k = Math.abs(key);
  if (fn === "midsquare") {
    const sq = String(k * k);
    const mid =
      sq.length >= 2
        ? Number(sq.slice(Math.floor(sq.length / 2) - 1, Math.floor(sq.length / 2) + 1))
        : Number(sq);
    return mid % size;
  }
  if (fn === "multiplication") {
    const A = 0.6180339887;
    return Math.floor(size * ((k * A) % 1));
  }
  return k % size;
}

function nextPrime(n: number) {
  let c = Math.max(2, n);
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
  const [probedSlots, setProbedSlots] = useState<number[]>([]);
  const [foundSlot, setFoundSlot] = useState<number | null>(null);
  const [status, setStatus] = useState("Inspect collisions and probing strategies live.");

  const { buckets, slots, probeLogs, rehashSteps, finalSize, unplacedKeys } = useMemo(() => {
    let curSize = tableSize;
    const resizeHistory: number[] = [];

    const runOpenAddressing = (size: number, strategy: "linear" | "quadratic" | "double") => {
      const arr: (number | null)[] = Array(size).fill(null);
      const logs: string[] = [];
      const failed: number[] = [];
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
        if (!placed) {
          failed.push(k);
          const hasEmpty = arr.some((x) => x === null);
          logs.push(
            strategy === "quadratic" && hasEmpty
              ? `Key ${k}: quadratic probe cycle exhausted (${probes.join(" -> ")}) despite empty slots`
              : `Key ${k}: table full after ${size} probes`
          );
        }
      }
      return { arr, logs, failed };
    };

    if (mode === "chaining") {
      const b: number[][] = Array.from({ length: curSize }, () => []);
      const logs: string[] = [];
      for (const k of keys) {
        const idx = computeHash(k, curSize, hashFn);
        if (!b[idx].includes(k)) {
          const coll = b[idx].length > 0;
          b[idx].push(k);
          logs.push(
            coll
              ? `Key ${k}: h=${idx} COLLISION -> appended to chain`
              : `Key ${k}: placed in bucket [${idx}]`
          );
        }
      }
      return {
        buckets: b,
        slots: [],
        probeLogs: logs,
        rehashSteps: resizeHistory,
        finalSize: curSize,
        unplacedKeys: [],
      };
    }

    if (mode === "rehashing") {
      while (keys.length / curSize > 0.7 && curSize < 101) {
        curSize = nextPrime(curSize * 2);
        resizeHistory.push(curSize);
      }
      const res = runOpenAddressing(curSize, "linear");
      return {
        buckets: [],
        slots: res.arr,
        probeLogs: res.logs,
        rehashSteps: resizeHistory,
        finalSize: curSize,
        unplacedKeys: res.failed,
      };
    }

    if (mode === "linear" || mode === "quadratic" || mode === "double") {
      const res = runOpenAddressing(curSize, mode);
      return {
        buckets: [],
        slots: res.arr,
        probeLogs: res.logs,
        rehashSteps: resizeHistory,
        finalSize: curSize,
        unplacedKeys: res.failed,
      };
    }

    return {
      buckets: [],
      slots: [],
      probeLogs: [],
      rehashSteps: resizeHistory,
      finalSize: curSize,
      unplacedKeys: [],
    };
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
    const dropped: number[] = [];

    for (const k of keys) {
      let placed = false;
      let guard = 0;
      while (guard++ < 6) {
        const mask = (1 << globalDepth) - 1;
        const dirIdx = Math.abs(k) & mask;
        const target = dir[dirIdx];
        if (target.items.includes(k)) {
          placed = true;
          break;
        }
        if (target.items.length < 2) {
          target.items.push(k);
          placed = true;
          break;
        }
        if (target.localDepth === globalDepth) {
          if (globalDepth >= 6) break;
          globalDepth++;
          dir = [...dir, ...dir];
        }
        const oldItems = [...target.items];
        const newLocal = target.localDepth + 1;
        const bitMask = 1 << (newLocal - 1);
        const splitA: ExtBucket = { id: `B${bSeq++}`, localDepth: newLocal, items: [] };
        const splitB: ExtBucket = { id: `B${bSeq++}`, localDepth: newLocal, items: [] };
        dir = dir.map((b, idx) =>
          b === target ? ((idx & bitMask) === 0 ? splitA : splitB) : b
        );
        oldItems.forEach((item) => {
          if ((Math.abs(item) & bitMask) === 0) splitA.items.push(item);
          else splitB.items.push(item);
        });
      }
      if (!placed) dropped.push(k);
    }
    const uniqueBuckets = Array.from(new Set(dir));
    return { globalDepth, dir, uniqueBuckets, dropped };
  }, [keys]);

  const clearHighlight = () => {
    setProbedSlots([]);
    setFoundSlot(null);
  };

  const insertSingle = () => {
    const k = Number(singleKey);
    if (!Number.isFinite(k) || singleKey.trim() === "") return;
    clearHighlight();
    if (!keys.includes(k)) {
      const next = [...keys, k].slice(0, 14);
      setKeys(next);
      setBulkInput(next.join(", "));
      setStatus(`Inserted key ${k}.`);
    } else {
      setStatus(`Key ${k} already exists.`);
    }
  };

  const deleteSingle = () => {
    const k = Number(singleKey);
    clearHighlight();
    if (!keys.includes(k)) return setStatus(`Key ${singleKey} not found.`);
    const next = keys.filter((x) => x !== k);
    setKeys(next);
    setBulkInput(next.join(", "));
    setStatus(`Deleted key ${k}.`);
  };

  const searchActualTable = () => {
    const k = Number(singleKey);
    if (!Number.isFinite(k) || singleKey.trim() === "") {
      return setStatus("Enter a valid numeric key to search.");
    }

    if (mode === "extendible") {
      const mask = (1 << extendible.globalDepth) - 1;
      const dirIdx = Math.abs(k) & mask;
      const bucket = extendible.dir[dirIdx];
      const bits = dirIdx.toString(2).padStart(extendible.globalDepth, "0");
      setProbedSlots([dirIdx]);
      if (bucket && bucket.items.includes(k)) {
        setFoundSlot(dirIdx);
        setStatus(`Found ${k} via LSB suffix ${bits} -> bucket ${bucket.id}.`);
      } else {
        setFoundSlot(null);
        setStatus(`Key ${k} not stored in bucket ${bucket?.id ?? "?"} (LSB suffix ${bits}).`);
      }
      return;
    }

    if (mode === "chaining") {
      const idx = computeHash(k, finalSize, hashFn);
      const chainPos = buckets[idx]?.indexOf(k) ?? -1;
      setProbedSlots([idx]);
      if (chainPos >= 0) {
        setFoundSlot(idx);
        setStatus(`Found ${k} in bucket [${idx}] at chain step ${chainPos + 1}.`);
      } else {
        setFoundSlot(null);
        setStatus(`${k} not found in bucket [${idx}] (checked ${buckets[idx]?.length ?? 0} node(s)).`);
      }
      return;
    }

    // Actual open-addressing probe search
    const strategy = mode === "rehashing" ? "linear" : mode;
    const h1 = computeHash(k, finalSize, hashFn);
    const h2 = 1 + (Math.abs(k) % Math.max(2, finalSize - 2));
    const visited: number[] = [];
    for (let i = 0; i < finalSize; i++) {
      const idx =
        strategy === "linear"
          ? (h1 + i) % finalSize
          : strategy === "quadratic"
          ? (h1 + i * i) % finalSize
          : (h1 + i * h2) % finalSize;
      visited.push(idx);
      if (slots[idx] === k) {
        setProbedSlots(visited);
        setFoundSlot(idx);
        setStatus(
          `Found ${k} at slot [${idx}] in ${visited.length} probe(s): [${visited.join(" -> ")}].`
        );
        return;
      }
      if (slots[idx] === null) {
        setProbedSlots(visited);
        setFoundSlot(null);
        setStatus(
          `${k} not found — hit empty slot [${idx}] after probing [${visited.join(" -> ")}].`
        );
        return;
      }
    }
    setProbedSlots(visited);
    setFoundSlot(null);
    setStatus(`${k} not found after ${visited.length} probes: [${visited.join(" -> ")}].`);
  };

  const noticeMsg =
    mode === "rehashing" && rehashSteps.length > 0
      ? `Load factor exceeded 0.70 — auto-rehashed table: ${tableSize} -> ${rehashSteps.join(" -> ")}.`
      : mode === "extendible" && extendible.dropped.length > 0
      ? `Max directory depth (6) reached — keys [${extendible.dropped.join(", ")}] share 6 LSBs and could not be placed.`
      : unplacedKeys.length > 0
      ? `Could not place key(s) [${unplacedKeys.join(", ")}] — increase table size or switch to Rehashing/Chaining.`
      : undefined;

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="hash-mode-tabs"
        value={mode}
        onChange={(m) => {
          setMode(m);
          clearHighlight();
        }}
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
        statusText={status}
        notice={noticeMsg}
        stage={
          mode === "extendible" ? (
            <div className="space-y-4 py-2">
              <div className="text-center font-mono text-xs text-[#a1a1a6]">
                Global Depth ={" "}
                <span className="font-medium text-amber-400">{extendible.globalDepth}</span> ·
                Bucket Capacity = 2
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-[#a1a1a6]">
                    Directory (LSB suffix bits)
                  </div>
                  {extendible.dir.map((b, idx) => {
                    const isFound = foundSlot === idx;
                    const isProbed = probedSlots.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-xs ${
                          isFound
                            ? "border-[#4cc38a] bg-[#4cc38a]/15"
                            : isProbed
                            ? "border-amber-500 bg-amber-500/12"
                            : "border-[#ededed]/[0.08] bg-[#19191b]"
                        }`}
                      >
                        <span className="text-[#60a5fa]">
                          {idx.toString(2).padStart(extendible.globalDepth, "0")}
                        </span>
                        <span className="text-[#93939a]">-&gt;</span>
                        <span className="font-medium text-amber-300">{b.id}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-[#a1a1a6]">Data Buckets</div>
                  {extendible.uniqueBuckets.map((b) => {
                    const pointedFound =
                      foundSlot !== null && extendible.dir[foundSlot]?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-xs ${
                          pointedFound
                            ? "border-[#4cc38a] bg-[#4cc38a]/20"
                            : "border-[#4cc38a]/35 bg-[#4cc38a]/10"
                        }`}
                      >
                        <span className="font-medium text-[#4cc38a]">
                          {b.id} (LD={b.localDepth})
                        </span>
                        <span className="text-[#ededed]">[{b.items.join(", ") || "empty"}]</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : mode === "chaining" ? (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
                {buckets.map((bucket, idx) => {
                  const isFound = foundSlot === idx;
                  const isProbed = probedSlots.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-xl border bg-[#19191b] transition-colors duration-150 ${
                        isFound
                          ? "border-[#4cc38a]"
                          : isProbed
                          ? "border-amber-500"
                          : "border-[#ededed]/[0.08]"
                      }`}
                    >
                      <div className="border-b border-[#ededed]/[0.06] bg-[#232325] py-1 text-center font-mono text-xs font-medium text-[#a1a1a6]">
                        [{idx}]
                      </div>
                      <div className="flex min-h-[60px] flex-col gap-1 p-1.5">
                        {bucket.map((k) => (
                          <div
                            key={k}
                            className={`rounded px-2 py-0.5 text-center font-mono text-xs font-medium tabular-nums ${
                              bucket.length > 1
                                ? "border border-[#e5484d]/40 bg-[#e5484d]/15 text-[#fca5a5]"
                                : "border border-amber-500/40 bg-amber-500/12 text-amber-200"
                            }`}
                          >
                            {k}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-[#ededed]/[0.06] bg-[#141415] p-2.5 font-mono text-xs text-[#a1a1a6]">
                {probeLogs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {slots.map((val, idx) => {
                  const isFound = foundSlot === idx;
                  const isProbed = probedSlots.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-2 text-center font-mono transition-colors duration-150 ${
                        isFound
                          ? "border-[#4cc38a] bg-[#4cc38a]/15"
                          : isProbed
                          ? "border-amber-500 bg-amber-500/15"
                          : val !== null
                          ? "border-[#ededed]/[0.18] bg-[#232325]"
                          : "border-[#ededed]/[0.07] bg-[#19191b]"
                      }`}
                    >
                      <div className="text-xs text-[#93939a]">[{idx}]</div>
                      <div
                        className={`mt-1 text-sm font-medium tabular-nums ${
                          isFound
                            ? "text-[#4cc38a]"
                            : val !== null
                            ? "text-[#ededed]"
                            : "text-[#93939a]/55"
                        }`}
                      >
                        {val !== null ? val : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="max-h-24 overflow-y-auto rounded-lg border border-[#ededed]/[0.06] bg-[#141415] p-2.5 font-mono text-xs text-[#a1a1a6]">
                {probeLogs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          )
        }
        inspector={
          <>
            <InspectorBlock
              highlight
              title="Custom Keys (Bulk Input)"
              description="Enter comma-separated keys to insert (deduplicated, max 14)."
            >
              <div className="flex gap-2">
                <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    clearHighlight();
                    const parsed = parseNumberList(bulkInput, { unique: true, maxCount: 14 });
                    setKeys(parsed.values);
                    setBulkInput(parsed.values.join(", "));
                    setStatus(`Hashed ${parsed.values.length} unique key(s).`);
                  }}
                >
                  Hash
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Insert / Search / Delete Key">
              <div className="flex gap-2">
                <StudioInput
                  type="number"
                  value={singleKey}
                  onChange={(e) => setSingleKey(e.target.value)}
                />
                <StudioBtn variant="primary" onClick={insertSingle}>
                  Insert
                </StudioBtn>
              </div>
              <div className="mt-2 flex gap-2">
                <StudioBtn variant="secondary" className="flex-1" onClick={searchActualTable}>
                  Search
                </StudioBtn>
                <StudioBtn variant="danger" className="flex-1" onClick={deleteSingle}>
                  Delete
                </StudioBtn>
                <StudioBtn
                  variant="secondary"
                  onClick={() => {
                    clearHighlight();
                    setKeys([]);
                    setStatus("Cleared hash table.");
                  }}
                >
                  Clear
                </StudioBtn>
              </div>
            </InspectorBlock>

            {mode !== "extendible" && (
              <InspectorBlock title="Hash function & table size">
                <div className="space-y-2">
                  <StudioSelect
                    value={hashFn}
                    onChange={(e) => {
                      clearHighlight();
                      setHashFn(e.target.value as HashFn);
                    }}
                  >
                    <option value="division">Division: k mod m</option>
                    <option value="midsquare">Mid-Square: middle(k^2) mod m</option>
                    <option value="multiplication">Multiplication: floor(m*(kA mod 1))</option>
                  </StudioSelect>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#a1a1a6]">Initial size (m)</span>
                    <StudioSelect
                      className="w-24"
                      value={tableSize}
                      onChange={(e) => {
                        clearHighlight();
                        setTableSize(Number(e.target.value));
                      }}
                    >
                      {[5, 7, 11, 13].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
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
              "Rehashing doubles table size (next prime) repeatedly until Load Factor <= 0.70.",
              "Extendible Hashing grows a directory dynamically via Global & Local Depth bits without full table rehash.",
            ]}
            complexities={[
              { op: "Insert / Search / Delete", best: "O(1)", avg: "O(1)", worst: "O(n) all collide" },
            ]}
            javaCode={`// Open addressing (linear probing) lookup
int search(Integer[] table, int key) {
  int m = table.length, h = Math.abs(key) % m;
  for (int i = 0; i < m; i++) {
    int idx = (h + i) % m;
    if (table[idx] == null) return -1;
    if (table[idx] == key) return idx;
  }
  return -1;
}`}
          />
        }
      />
    </div>
  );
}

export function SearchHashSectionRouter({ topicId }: { topicId: TopicId }) {
  if (topicId === "linear-search") return <SearchVisualizer key="linear" mode="linear" />;
  if (topicId === "binary-search") return <SearchVisualizer key="binary" mode="binary" />;
  return <HashingVisualizer />;
}
