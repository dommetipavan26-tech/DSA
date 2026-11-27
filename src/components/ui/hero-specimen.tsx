import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { TopicId } from "../../data/syllabus";

type BarRole = "unsorted" | "comparing" | "swap" | "sorted" | "pivot";

interface SpecimenStep {
  arr: number[];
  roles: BarRole[];
  label: string;
}

const SPECIMEN_ARRAY = [6, 3, 9, 1, 5, 4, 7, 2];

function buildQuickSortSpecimen(initial: number[]): SpecimenStep[] {
  const a = [...initial];
  const n = a.length;
  const fixed = new Set<number>();
  const steps: SpecimenStep[] = [
    {
      arr: [...a],
      roles: a.map(() => "unsorted"),
      label: "Initial array [6, 3, 9, 1, 5, 4, 7, 2]",
    },
  ];

  const makeRoles = (cmp: number[] = [], swp: number[] = [], piv = -1): BarRole[] =>
    a.map((_, i) => {
      if (fixed.has(i)) return "sorted";
      if (swp.includes(i)) return "swap";
      if (i === piv) return "pivot";
      if (cmp.includes(i)) return "comparing";
      return "unsorted";
    });

  const partition = (lo: number, hi: number) => {
    const pVal = a[hi];
    let i = lo - 1;
    steps.push({
      arr: [...a],
      roles: makeRoles([], [], hi),
      label: `Pivot = ${pVal} at [${hi}]`,
    });

    for (let j = lo; j < hi; j++) {
      steps.push({
        arr: [...a],
        roles: makeRoles([j], [], hi),
        label: `Compare a[${j}] = ${a[j]} with pivot ${pVal}`,
      });
      if (a[j] <= pVal) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({
            arr: [...a],
            roles: makeRoles([], [i, j], hi),
            label: `Swap [${i}] and [${j}]`,
          });
        }
      }
    }

    const pIdx = i + 1;
    if (pIdx !== hi) {
      [a[pIdx], a[hi]] = [a[hi], a[pIdx]];
      steps.push({
        arr: [...a],
        roles: makeRoles([], [pIdx, hi]),
        label: `Place pivot ${pVal} at [${pIdx}]`,
      });
    }
    fixed.add(pIdx);
    steps.push({
      arr: [...a],
      roles: makeRoles(),
      label: `Index [${pIdx}] locked at ${a[pIdx]}`,
    });
    return pIdx;
  };

  const sort = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      fixed.add(lo);
      return;
    }
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  };

  sort(0, n - 1);
  steps.push({
    arr: [...a],
    roles: a.map(() => "sorted"),
    label: "All 8 elements partitioned and sorted",
  });
  return steps;
}

const ROLE_CLASS: Record<BarRole, string> = {
  unsorted: "bg-[#2e2e34] border-t border-[#ededed]/15",
  comparing: "bg-[#f59e0b] border-t border-amber-200/40",
  swap: "bg-[#e5484d] border-t border-rose-200/40",
  sorted: "bg-[#4cc38a] border-t border-emerald-200/40",
  pivot: "bg-[#ededed] border-t border-white",
};

export function HeroSpecimen({
  onOpenTopic,
}: {
  onOpenTopic: (id: TopicId) => void;
}) {
  const steps = useMemo(() => buildQuickSortSpecimen(SPECIMEN_ARRAY), []);
  const [stepIdx, setStepIdx] = useState(2);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 550);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  const cur = steps[stepIdx] ?? steps[0];
  const maxVal = 9;

  return (
    <div className="rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ededed]/[0.07] pb-3 sm:flex-nowrap sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-[#85858b]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Live trace</span>
            <span className="text-[#ededed]/25">·</span>
            <span className="font-mono tabular-nums text-[#ededed]">
              {String(stepIdx).padStart(2, "0")} / {String(steps.length - 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#ededed]">{cur.label}</p>
        </div>

        <button
          type="button"
          onClick={() => onOpenTopic("quick-sort")}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#ededed]/[0.1] bg-[#232325] px-3 py-1.5 text-xs font-medium text-[#ededed] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:bg-[#2b2b2e] cursor-pointer"
        >
          Open Quick Sort
          <ArrowRight className="h-3.5 w-3.5 text-[#a1a1a6]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Recessed Bar Stage */}
      <div className="mt-4 rounded-xl border border-[#ededed]/[0.07] bg-[#0f0f10] px-4 pt-6 pb-3">
        <div className="flex h-44 items-end justify-between gap-2.5">
          {cur.arr.map((val, i) => {
            const role = cur.roles[i] ?? "unsorted";
            const heightPx = Math.max(20, Math.round((val / maxVal) * 136));
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-xs font-medium tabular-nums text-[#a1a1a6]">
                  {val}
                </span>
                <div
                  style={{ height: `${heightPx}px` }}
                  className={`w-full rounded-t-md transition-[height,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${ROLE_CLASS[role]}`}
                />
                <span className="font-mono text-xs tabular-nums text-[#85858b]">[{i}]</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Specimen Transport & Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIdx(0);
            }}
            aria-label="Reset specimen"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            disabled={stepIdx <= 0}
            onClick={() => {
              setPlaying(false);
              setStepIdx((s) => Math.max(0, s - 1));
            }}
            aria-label="Step back"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepIdx >= steps.length - 1) setStepIdx(0);
              setPlaying((p) => !p);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#f59e0b] px-3 text-xs font-medium text-[#141415] transition-colors duration-150 hover:bg-[#fbbf24] cursor-pointer"
          >
            {playing ? (
              <>
                <Pause className="h-3.5 w-3.5" strokeWidth={1.75} />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} />
                Step Play
              </>
            )}
          </button>
          <button
            type="button"
            disabled={stepIdx >= steps.length - 1}
            onClick={() => {
              setPlaying(false);
              setStepIdx((s) => Math.min(steps.length - 1, s + 1));
            }}
            aria-label="Step forward"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#85858b]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#ededed]" />
            Pivot
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#f59e0b]" />
            Compare
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#e5484d]" />
            Swap
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-[#4cc38a]" />
            Locked
          </span>
        </div>
      </div>
    </div>
  );
}
