import { useEffect, useMemo, useState } from "react";
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
  StudioSelect,
  StudioTextarea,
} from "../components/ui/input-helpers";
import type { TopicId } from "../data/syllabus";

type SortAlgoId =
  | "selection-sort"
  | "insertion-sort"
  | "quick-sort"
  | "merge-sort"
  | "heap-sort";

type BarState = "unsorted" | "active" | "comparing" | "swap" | "sorted" | "pivot";

interface SortStep {
  arr: number[];
  states: BarState[];
  heapSize?: number;
  msg: string;
}

/* Merge Sort Divide-and-Conquer Tree Node matching Reference Image 1 */
interface MergeTreeNode {
  id: string;
  depth: number;
  vals: number[];
  kind: "divide" | "leaf" | "merge";
  x: number; // normalized 0..1
  parentIds: string[];
  edgeLabel: "divide" | "merge";
}

interface MergeTreeStep {
  nodeStates: Record<string, "pending" | "active" | "done">;
  nodeValues: Record<string, (number | null)[]>;
  msg: string;
}

function buildMergeTreeData(input: number[]) {
  const arr = input.slice(0, 8);
  const nodes: MergeTreeNode[] = [];
  const steps: MergeTreeStep[] = [];
  const initValues: Record<string, (number | null)[]> = {};
  const initStates: Record<string, "pending" | "active" | "done"> = {};
  let uid = 0;

  function buildDivide(
    lo: number,
    hi: number,
    depth: number,
    minX: number,
    maxX: number,
    parentId?: string
  ): { leafOrMergedId: string; maxDepth: number; sortedSlice: number[] } {
    const id = `d-${uid++}`;
    const slice = arr.slice(lo, hi + 1);
    initValues[id] = slice;
    initStates[id] = "pending";

    if (lo === hi) {
      nodes.push({
        id,
        depth,
        vals: slice,
        kind: "leaf",
        x: (minX + maxX) / 2,
        parentIds: parentId ? [parentId] : [],
        edgeLabel: "divide",
      });
      return { leafOrMergedId: id, maxDepth: depth, sortedSlice: slice };
    }

    nodes.push({
      id,
      depth,
      vals: slice,
      kind: "divide",
      x: (minX + maxX) / 2,
      parentIds: parentId ? [parentId] : [],
      edgeLabel: "divide",
    });

    const mid = Math.floor((lo + hi) / 2);
    const left = buildDivide(lo, mid, depth + 1, minX, (minX + maxX) / 2, id);
    const right = buildDivide(mid + 1, hi, depth + 1, (minX + maxX) / 2, maxX, id);

    const mergeId = `m-${uid++}`;
    const merged: number[] = [];
    let i = 0;
    let j = 0;
    while (i < left.sortedSlice.length && j < right.sortedSlice.length) {
      if (left.sortedSlice[i] <= right.sortedSlice[j]) merged.push(left.sortedSlice[i++]);
      else merged.push(right.sortedSlice[j++]);
    }
    while (i < left.sortedSlice.length) merged.push(left.sortedSlice[i++]);
    while (j < right.sortedSlice.length) merged.push(right.sortedSlice[j++]);

    const mergeDepth = Math.max(left.maxDepth, right.maxDepth) + 1;
    initValues[mergeId] = slice.map(() => null);
    initStates[mergeId] = "pending";
    nodes.push({
      id: mergeId,
      depth: mergeDepth,
      vals: merged,
      kind: "merge",
      x: (minX + maxX) / 2,
      parentIds: [left.leafOrMergedId, right.leafOrMergedId],
      edgeLabel: "merge",
    });

    return { leafOrMergedId: mergeId, maxDepth: mergeDepth, sortedSlice: merged };
  }

  buildDivide(0, arr.length - 1, 0, 0.05, 0.95);

  // Normalize depths so merge mirror is clean and symmetric
  const divideMax = Math.max(...nodes.filter((n) => n.kind !== "merge").map((n) => n.depth));
  nodes.forEach((n) => {
    if (n.kind === "merge") {
      // keep bottom-up symmetry
      n.depth = divideMax + (divideMax - (nodes.find((p) => p.id === n.parentIds[0])?.depth ?? divideMax)) + 1;
    }
  });
  // Re-normalize cleanly by topological level
  const levelMap: Record<string, number> = {};
  nodes.forEach((n) => {
    if (n.kind !== "merge") levelMap[n.id] = n.depth;
  });
  nodes
    .filter((n) => n.kind === "merge")
    .forEach((n) => {
      const pMax = Math.max(...n.parentIds.map((pid) => levelMap[pid] ?? divideMax));
      levelMap[n.id] = pMax + 1;
      n.depth = levelMap[n.id];
    });

  // Record step-by-step animation matching Reference Image 1
  const curStates = { ...initStates };
  const curValues = Object.fromEntries(Object.entries(initValues).map(([k, v]) => [k, [...v]]));
  steps.push({
    nodeStates: { ...curStates },
    nodeValues: Object.fromEntries(Object.entries(curValues).map(([k, v]) => [k, [...v]])),
    msg: "Initial array ready. Press Play or Step to start divide-and-conquer.",
  });

  function animateNode(divideNode: MergeTreeNode | undefined) {
    if (!divideNode) return;
    curStates[divideNode.id] = "active";
    steps.push({
      nodeStates: { ...curStates },
      nodeValues: Object.fromEntries(Object.entries(curValues).map(([k, v]) => [k, [...v]])),
      msg:
        divideNode.kind === "leaf"
          ? `Base case single element [${divideNode.vals[0]}] is trivially sorted.`
          : `Divide [${divideNode.vals.join(", ")}] into left and right halves.`,
    });

    if (divideNode.kind === "leaf") {
      curStates[divideNode.id] = "done";
      return;
    }

    const children = nodes.filter((n) => n.kind !== "merge" && n.parentIds.includes(divideNode.id));
    children.forEach((c) => animateNode(c));

    // Find corresponding merge node whose parentIds are the outputs of these children
    const mergeNode = nodes.find(
      (n) =>
        n.kind === "merge" &&
        children.every((c) => {
          // either c itself is a leaf parent of n, or c's sibling merge node is
          if (n.parentIds.includes(c.id)) return true;
          const grandChildren = nodes.filter((gc) => gc.parentIds.includes(c.id));
          return grandChildren.length > 0;
        }) &&
        Math.abs(n.x - divideNode.x) < 0.001 &&
        n.vals.length === divideNode.vals.length
    );

    if (mergeNode) {
      curStates[mergeNode.id] = "active";
      curValues[mergeNode.id] = mergeNode.vals.map(() => null);
      for (let k = 0; k < mergeNode.vals.length; k++) {
        curValues[mergeNode.id][k] = mergeNode.vals[k];
        steps.push({
          nodeStates: { ...curStates },
          nodeValues: Object.fromEntries(Object.entries(curValues).map(([k2, v2]) => [k2, [...v2]])),
          msg: `Place ${mergeNode.vals[k]} at position ${k}.`,
        });
      }
      curStates[mergeNode.id] = "done";
      curStates[divideNode.id] = "done";
      steps.push({
        nodeStates: { ...curStates },
        nodeValues: Object.fromEntries(Object.entries(curValues).map(([k2, v2]) => [k2, [...v2]])),
        msg: `Merged sorted subarray [${mergeNode.vals.join(", ")}].`,
      });
    }
  }

  animateNode(nodes[0]);
  return { nodes, steps };
}

function generateSortSteps(
  input: number[],
  algo: SortAlgoId,
  pivotMode: "last" | "first" | "middle" | "random",
  heapType: "max" | "min"
): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [
    {
      arr: [...a],
      states: a.map(() => "unsorted"),
      heapSize: n,
      msg: "Initial array. Press Play or Step to start.",
    },
  ];

  if (algo === "selection-sort") {
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (k < i ? "sorted" : k === minIdx ? "active" : k === j ? "comparing" : "unsorted")),
          msg: `Pass ${i + 1}: comparing arr[${j}]=${a[j]} with current min arr[${minIdx}]=${a[minIdx]}.`,
        });
        if (a[j] < a[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (k < i ? "sorted" : k === i || k === minIdx ? "swap" : "unsorted")),
          msg: `Swap minimum ${a[i]} into sorted position ${i}.`,
        });
      }
      steps.push({
        arr: [...a],
        states: a.map((_, k) => (k <= i ? "sorted" : "unsorted")),
        msg: `Position ${i} locked with value ${a[i]}.`,
      });
    }
  } else if (algo === "insertion-sort") {
    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      steps.push({
        arr: [...a],
        states: a.map((_, k) => (k < i ? "sorted" : k === i ? "active" : "unsorted")),
        msg: `Pick key = ${key} at index ${i} to insert into sorted prefix.`,
      });
      while (j >= 0 && a[j] > key) {
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (k === j || k === j + 1 ? "comparing" : k <= i ? "sorted" : "unsorted")),
          msg: `${a[j]} > ${key}, shift ${a[j]} right to index ${j + 1}.`,
        });
        a[j + 1] = a[j];
        a[j] = key;
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (k === j ? "swap" : k <= i ? "sorted" : "unsorted")),
          msg: `Moved ${key} left to index ${j}.`,
        });
        j--;
      }
    }
    steps.push({
      arr: [...a],
      states: a.map(() => "sorted"),
      msg: "Insertion Sort complete!",
    });
  } else if (algo === "quick-sort") {
    const sortedSet = new Set<number>();
    function qs(lo: number, hi: number) {
      if (lo > hi) return;
      if (lo === hi) {
        sortedSet.add(lo);
        return;
      }
      const pIdx =
        pivotMode === "first"
          ? lo
          : pivotMode === "middle"
          ? Math.floor((lo + hi) / 2)
          : pivotMode === "random"
          ? lo + ((lo * 7 + hi * 3) % (hi - lo + 1))
          : hi;
      if (pIdx !== hi) {
        [a[pIdx], a[hi]] = [a[hi], a[pIdx]];
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (sortedSet.has(k) ? "sorted" : k === hi ? "pivot" : k === pIdx ? "swap" : "unsorted")),
          msg: `Move chosen ${pivotMode} pivot (${a[hi]}) to end of range [${lo}..${hi}].`,
        });
      }
      const pivot = a[hi];
      let i = lo - 1;
      steps.push({
        arr: [...a],
        states: a.map((_, k) => (sortedSet.has(k) ? "sorted" : k === hi ? "pivot" : k >= lo && k < hi ? "active" : "unsorted")),
        msg: `Partition [${lo}..${hi}] around pivot = ${pivot}.`,
      });
      for (let j = lo; j < hi; j++) {
        steps.push({
          arr: [...a],
          states: a.map((_, k) => (sortedSet.has(k) ? "sorted" : k === hi ? "pivot" : k === j ? "comparing" : "unsorted")),
          msg: `Compare arr[${j}]=${a[j]} with pivot ${pivot}.`,
        });
        if (a[j] <= pivot) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            steps.push({
              arr: [...a],
              states: a.map((_, k) => (sortedSet.has(k) ? "sorted" : k === hi ? "pivot" : k === i || k === j ? "swap" : "unsorted")),
              msg: `${a[i]} <= ${pivot}: swap index ${i} and ${j}.`,
            });
          }
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      sortedSet.add(i + 1);
      steps.push({
        arr: [...a],
        states: a.map((_, k) => (sortedSet.has(k) ? "sorted" : "unsorted")),
        msg: `Pivot ${pivot} settled at final index ${i + 1}.`,
      });
      qs(lo, i);
      qs(i + 2, hi);
    }
    qs(0, n - 1);
    steps.push({
      arr: [...a],
      states: a.map(() => "sorted"),
      msg: "Quick Sort complete!",
    });
  } else if (algo === "merge-sort") {
    function ms(lo: number, hi: number) {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      steps.push({
        arr: [...a],
        states: a.map((_, k) => (k >= lo && k <= hi ? "active" : "unsorted")),
        msg: `Divide range [${lo}..${hi}] at mid=${mid}.`,
      });
      ms(lo, mid);
      ms(mid + 1, hi);
      const left = a.slice(lo, mid + 1);
      const right = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        a[k] = left[i] <= right[j] ? left[i++] : right[j++];
        steps.push({
          arr: [...a],
          states: a.map((_, x) => (x === k ? "swap" : x >= lo && x <= hi ? "comparing" : "unsorted")),
          msg: `Merge: write ${a[k]} into index ${k}.`,
        });
        k++;
      }
      while (i < left.length) {
        a[k] = left[i++];
        steps.push({
          arr: [...a],
          states: a.map((_, x) => (x === k ? "swap" : "unsorted")),
          msg: `Copy remaining ${a[k]} into index ${k}.`,
        });
        k++;
      }
      while (j < right.length) {
        a[k] = right[j++];
        steps.push({
          arr: [...a],
          states: a.map((_, x) => (x === k ? "swap" : "unsorted")),
          msg: `Copy remaining ${a[k]} into index ${k}.`,
        });
        k++;
      }
    }
    ms(0, n - 1);
    steps.push({ arr: [...a], states: a.map(() => "sorted"), msg: "Merge Sort complete!" });
  } else if (algo === "heap-sort") {
    const isBetter = (x: number, y: number) => (heapType === "max" ? x > y : x < y);
    const heapLabel = heapType === "max" ? "Max-Heap" : "Min-Heap";

    function heapify(size: number, i: number) {
      let best = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      steps.push({
        arr: [...a],
        heapSize: size,
        states: a.map((_, k) =>
          k >= size ? "sorted" : k === i || k === l || k === r ? "comparing" : "unsorted"
        ),
        msg: `Heapify at index ${i} (${a[i]}) within ${heapLabel} size ${size}.`,
      });
      if (l < size && isBetter(a[l], a[best])) best = l;
      if (r < size && isBetter(a[r], a[best])) best = r;
      if (best !== i) {
        [a[i], a[best]] = [a[best], a[i]];
        steps.push({
          arr: [...a],
          heapSize: size,
          states: a.map((_, k) => (k >= size ? "sorted" : k === i || k === best ? "swap" : "unsorted")),
          msg: `Swap parent arr[${i}] and child arr[${best}] to restore ${heapLabel} property.`,
        });
        heapify(size, best);
      }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
    steps.push({
      arr: [...a],
      heapSize: n,
      states: a.map((_, k) => (k === 0 ? "pivot" : "active")),
      msg: `${heapLabel} built! Root = ${a[0]} (${heapType === "max" ? "largest" : "smallest"}).`,
    });

    for (let end = n - 1; end > 0; end--) {
      [a[0], a[end]] = [a[end], a[0]];
      steps.push({
        arr: [...a],
        heapSize: end,
        states: a.map((_, k) => (k >= end ? "sorted" : k === 0 ? "swap" : "unsorted")),
        msg: `Extract root ${a[end]} -> place at index ${end} (${heapType === "max" ? "ascending" : "descending"} order).`,
      });
      heapify(end, 0);
    }
    steps.push({
      arr: [...a],
      heapSize: 0,
      states: a.map(() => "sorted"),
      msg: `Heap Sort (${heapLabel}) complete!`,
    });
  }

  return steps;
}

const SORT_INFO: Record<
  SortAlgoId,
  {
    name: string;
    about: string;
    intuition: string;
    points: string[];
    complexities: { op: string; best: string; avg: string; worst: string; space: string }[];
  }
> = {
  "selection-sort": {
    name: "Selection Sort",
    about: "Scans the unsorted slice to find the minimum element and swaps it into place.",
    intuition: "Like organizing test papers by scanning the pile for the lowest score each round.",
    points: ["Performs at most O(n) swaps — useful when writes are expensive.", "Always makes O(n^2) comparisons regardless of input order.", "Not stable by default."],
    complexities: [{ op: "Selection Sort", best: "O(n^2)", avg: "O(n^2)", worst: "O(n^2)", space: "O(1)" }],
  },
  "insertion-sort": {
    name: "Insertion Sort",
    about: "Inserts each element into its proper spot within the already-sorted left subarray.",
    intuition: "How most people sort a hand of playing cards one card at a time.",
    points: ["Adaptive: runs in O(n) on already-sorted or nearly-sorted arrays.", "Stable sort and in-place O(1) memory."],
    complexities: [{ op: "Insertion Sort", best: "O(n)", avg: "O(n^2)", worst: "O(n^2)", space: "O(1)" }],
  },
  "quick-sort": {
    name: "Quick Sort",
    about: "Partitions around a chosen pivot, then recursively sorts left and right partitions. You can choose which element acts as pivot.",
    intuition: "Pick a pivot; smaller items move left, larger items move right, then recurse on each half.",
    points: ["Pivot choice dramatically affects performance on sorted inputs.", "In-place partitioning with O(log n) average recursion stack."],
    complexities: [{ op: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n^2)", space: "O(log n)" }],
  },
  "merge-sort": {
    name: "Merge Sort",
    about: "Divides the array into halves, recursively sorts, then merges sorted halves. Stable O(n log n). The tree view shows divide and merge phases.",
    intuition: "Split down to 1-element sorted arrays, then zip pairs together in sorted order.",
    points: ["Guaranteed O(n log n) worst-case time.", "Stable sort; needs O(n) temporary merge buffer."],
    complexities: [{ op: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" }],
  },
  "heap-sort": {
    name: "Heap Sort",
    about: "Builds a Binary Heap (Max-Heap for ascending, Min-Heap for descending) and repeatedly extracts the root.",
    intuition: "Turn the array into a tournament tree so the extreme element always floats to index 0.",
    points: ["Max-Heap produces ascending order; Min-Heap produces descending order.", "Guaranteed O(n log n) time AND O(1) auxiliary space."],
    complexities: [{ op: "Heap Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" }],
  },
};

export function SortingVisualizer({
  topicId,
  onSelectTopic,
}: {
  topicId: TopicId;
  onSelectTopic: (id: TopicId) => void;
}) {
  const algo: SortAlgoId =
    topicId === "selection-sort" ||
    topicId === "insertion-sort" ||
    topicId === "quick-sort" ||
    topicId === "merge-sort" ||
    topicId === "heap-sort"
      ? topicId
      : "quick-sort";

  const [arrText, setArrText] = useState("6, 3, 9, 1, 5, 4, 7, 2");
  const [arr, setArr] = useState<number[]>([6, 3, 9, 1, 5, 4, 7, 2]);
  const [pivotMode, setPivotMode] = useState<"last" | "first" | "middle" | "random">("last");
  const [heapType, setHeapType] = useState<"max" | "min">("max");
  const [mergeView, setMergeView] = useState<"tree" | "bars">("tree");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const barSteps = useMemo(
    () => generateSortSteps(arr, algo, pivotMode, heapType),
    [arr, algo, pivotMode, heapType]
  );
  const mergeTreeData = useMemo(() => buildMergeTreeData(arr), [arr]);

  const isMergeTree = algo === "merge-sort" && mergeView === "tree";
  const totalSteps = isMergeTree ? Math.max(0, mergeTreeData.steps.length - 1) : Math.max(0, barSteps.length - 1);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [arr, algo, pivotMode, heapType, mergeView]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStepIdx((p) => {
        if (p >= totalSteps) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 1050 - speed * 90);
    return () => clearInterval(t);
  }, [playing, speed, totalSteps]);

  const applyInput = (raw = arrText) => {
    const parsed = raw
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 0)
      .slice(0, 12);
    if (parsed.length >= 2) {
      setArr(parsed);
      setArrText(parsed.join(", "));
    }
  };

  const info = SORT_INFO[algo];
  const curBarStep = barSteps[Math.min(stepIdx, barSteps.length - 1)] ?? barSteps[0];
  const curMergeStep = mergeTreeData.steps[Math.min(stepIdx, mergeTreeData.steps.length - 1)] ?? mergeTreeData.steps[0];
  const statusMsg = isMergeTree ? curMergeStep.msg : curBarStep.msg;

  const maxBarVal = Math.max(1, ...curBarStep.arr);
  const barColors: Record<BarState, string> = {
    unsorted: "from-indigo-600 to-violet-500 shadow-[0_0_20px_-4px_rgba(99,102,241,0.45)]",
    active: "from-cyan-600 to-sky-400 shadow-[0_0_20px_-4px_rgba(6,182,212,0.55)]",
    comparing: "from-amber-600 to-amber-400 shadow-[0_0_20px_-4px_rgba(245,158,11,0.55)]",
    swap: "from-rose-600 to-pink-500 shadow-[0_0_20px_-4px_rgba(236,72,153,0.6)]",
    sorted: "from-emerald-600 to-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]",
    pivot: "from-purple-700 to-fuchsia-500 shadow-[0_0_22px_-4px_rgba(168,85,247,0.7)]",
  };

  // For Merge Tree SVG layout
  const mergeMaxDepth = Math.max(1, ...mergeTreeData.nodes.map((n) => n.depth));

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="sort-algo-tabs"
        value={algo}
        onChange={(id) => onSelectTopic(id)}
        options={[
          { id: "selection-sort", label: "Selection Sort" },
          { id: "insertion-sort", label: "Insertion Sort" },
          { id: "quick-sort", label: "Quick Sort" },
          { id: "merge-sort", label: "Merge Sort" },
          { id: "heap-sort", label: "Heap Sort" },
        ]}
      />

      <VisualizerWorkspace
        step={stepIdx}
        totalSteps={totalSteps}
        statusText={statusMsg}
        badge={info.name}
        isPlaying={playing}
        stage={
          isMergeTree ? (
            /* Divide-and-Conquer Tree Diagram matching Reference Image 1 */
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 740 ${Math.max(360, (mergeMaxDepth + 1) * 58 + 20)}`} className="w-full min-w-[540px]">
                <defs>
                  <marker id="m-arr-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
                  </marker>
                  <marker id="m-arr-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
                  </marker>
                </defs>

                {/* Edges */}
                {mergeTreeData.nodes.map((node) =>
                  node.parentIds.map((pid) => {
                    const parent = mergeTreeData.nodes.find((p) => p.id === pid);
                    if (!parent) return null;
                    const x1 = parent.x * 740;
                    const y1 = 28 + parent.depth * 56 + 14;
                    const x2 = node.x * 740;
                    const y2 = 28 + node.depth * 56 - 14;
                    const isActive =
                      curMergeStep.nodeStates[node.id] === "active" ||
                      curMergeStep.nodeStates[parent.id] === "active";
                    return (
                      <g key={`${pid}-${node.id}`}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={isActive ? "#f59e0b" : "#334155"}
                          strokeWidth={isActive ? 2 : 1.3}
                          markerEnd={isActive ? "url(#m-arr-amber)" : "url(#m-arr-slate)"}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2}
                          textAnchor="middle"
                          fill={isActive ? "#fbbf24" : "#64748b"}
                          fontSize="9"
                        >
                          {node.edgeLabel}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Box Nodes */}
                {mergeTreeData.nodes.map((node) => {
                  const vals = curMergeStep.nodeValues[node.id] ?? node.vals;
                  const state = curMergeStep.nodeStates[node.id] ?? "pending";
                  const cellW = 26;
                  const totalW = vals.length * cellW;
                  const x0 = node.x * 740 - totalW / 2;
                  const y0 = 28 + node.depth * 56 - 13;
                  const stroke =
                    state === "active" ? "#f59e0b" : state === "done" ? "#10b981" : "#334155";
                  const fill =
                    state === "active" ? "#1e160a" : state === "done" ? "#071f17" : "#121623";

                  return (
                    <g key={node.id}>
                      <rect
                        x={x0}
                        y={y0}
                        width={totalW}
                        height={26}
                        rx={5}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={state === "pending" ? 1.2 : 2}
                      />
                      {vals.map((v, idx) => (
                        <g key={idx}>
                          {idx > 0 && (
                            <line
                              x1={x0 + idx * cellW}
                              y1={y0}
                              x2={x0 + idx * cellW}
                              y2={y0 + 26}
                              stroke={stroke}
                              strokeOpacity={0.5}
                            />
                          )}
                          <text
                            x={x0 + idx * cellW + cellW / 2}
                            y={y0 + 13}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={v === null ? "#475569" : "#f1f5f9"}
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {v === null ? "·" : v}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {/* For Heap Sort: show live Binary Heap Tree right above the bars! */}
              {algo === "heap-sort" && (curBarStep.heapSize ?? 0) > 0 && (() => {
                const hs = curBarStep.heapSize ?? 0;
                const maxLevel = Math.floor(Math.log2(hs));
                const svgH = Math.max(120, 26 + maxLevel * 44 + 26);
                return (
                <div className="border-b border-white/[0.06] pb-3">
                  <div className="mb-1 text-center font-mono text-[11px] text-slate-400">
                    Active {heapType === "max" ? "Max-Heap" : "Min-Heap"} Tree (size {hs})
                  </div>
                  <svg viewBox={`0 0 640 ${svgH}`} className="mx-auto w-full max-w-xl">
                    {curBarStep.arr.slice(0, hs).map((_, i) => {
                      const level = Math.floor(Math.log2(i + 1));
                      const posInLevel = i - (Math.pow(2, level) - 1);
                      const countInLevel = Math.pow(2, level);
                      const x = ((posInLevel + 0.5) / countInLevel) * 640;
                      const y = 24 + level * 44;
                      const li = 2 * i + 1;
                      const ri = 2 * i + 2;

                      const childCoords = (ci: number) => {
                        const cl = Math.floor(Math.log2(ci + 1));
                        const cp = ci - (Math.pow(2, cl) - 1);
                        const cc = Math.pow(2, cl);
                        return { x: ((cp + 0.5) / cc) * 640, y: 24 + cl * 44 };
                      };

                      return (
                        <g key={`e-${i}`}>
                          {li < hs && (
                            <line
                              x1={x}
                              y1={y}
                              x2={childCoords(li).x}
                              y2={childCoords(li).y}
                              stroke="#334155"
                              strokeWidth="1.5"
                            />
                          )}
                          {ri < hs && (
                            <line
                              x1={x}
                              y1={y}
                              x2={childCoords(ri).x}
                              y2={childCoords(ri).y}
                              stroke="#334155"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      );
                    })}
                    {curBarStep.arr.slice(0, hs).map((val, i) => {
                      const level = Math.floor(Math.log2(i + 1));
                      const posInLevel = i - (Math.pow(2, level) - 1);
                      const countInLevel = Math.pow(2, level);
                      const x = ((posInLevel + 0.5) / countInLevel) * 640;
                      const y = 24 + level * 44;
                      const st = curBarStep.states[i];
                      const fill =
                        st === "swap" ? "#9f1239" : st === "comparing" ? "#92400e" : st === "pivot" ? "#6b21a8" : "#171c2e";
                      const stroke =
                        st === "swap" ? "#f43f5e" : st === "comparing" ? "#f59e0b" : st === "pivot" ? "#c084fc" : "#6366f1";
                      return (
                        <g key={`n-${i}`}>
                          <circle cx={x} cy={y} r={16} fill={fill} stroke={stroke} strokeWidth="2" />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fff"
                            fontSize="11"
                            fontWeight="700"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                );
              })()}

              {/* Bar Chart matching Reference Image 2 */}
              <div className="flex h-[240px] items-end justify-center gap-2.5 px-2 pt-7 pb-1">
                {curBarStep.arr.map((val, i) => {
                  const st = curBarStep.states[i] ?? "unsorted";
                  const hPx = Math.max(18, Math.round((val / maxBarVal) * 182));
                  return (
                    <div key={i} className="flex flex-1 max-w-[66px] flex-col items-center justify-end gap-1.5 h-full">
                      <span className="font-mono text-xs font-semibold text-slate-300">{val}</span>
                      <div
                        style={{ height: `${hPx}px` }}
                        className={`w-full rounded-t-md bg-gradient-to-t transition-all duration-150 ${barColors[st]}`}
                      />
                      <span className="font-mono text-[11px] text-slate-500">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        }
        controls={
          <PlaybackDock
            isPlaying={playing}
            onTogglePlay={() => {
              if (stepIdx >= totalSteps) setStepIdx(0);
              setPlaying((p) => !p);
            }}
            onReset={() => { setPlaying(false); setStepIdx(0); }}
            onStepBack={() => { setPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
            onStepForward={() => { setPlaying(false); setStepIdx((s) => Math.min(totalSteps, s + 1)); }}
            canStepBack={stepIdx > 0}
            canStepForward={stepIdx < totalSteps}
            speed={speed}
            onSpeedChange={setSpeed}
            legend={
              isMergeTree
                ? [
                    { label: "Pending", colorClass: "bg-slate-600" },
                    { label: "Active", colorClass: "bg-amber-500" },
                    { label: "Done", colorClass: "bg-emerald-500" },
                  ]
                : [
                    { label: "Unsorted", colorClass: "bg-indigo-500" },
                    { label: "Active", colorClass: "bg-cyan-500" },
                    { label: "Comparing", colorClass: "bg-amber-500" },
                    { label: "Swap / Write", colorClass: "bg-pink-500" },
                    { label: "Sorted", colorClass: "bg-emerald-500" },
                    { label: "Pivot", colorClass: "bg-purple-500" },
                  ]
            }
          />
        }
        inspector={
          <>
            {algo === "quick-sort" && (
              <InspectorBlock
                highlight
                title="Choose Pivot Element"
                description="Quick Sort partitions around the selected pivot. The pivot choice affects partitioning steps."
              >
                <StudioSelect
                  value={pivotMode}
                  onChange={(e) => setPivotMode(e.target.value as "last" | "first" | "middle" | "random")}
                >
                  <option value="last">Last element</option>
                  <option value="first">First element</option>
                  <option value="middle">Middle element</option>
                  <option value="random">Random element</option>
                </StudioSelect>
              </InspectorBlock>
            )}

            {algo === "merge-sort" && (
              <InspectorBlock highlight title="Merge Sort Visualization View">
                <div className="grid grid-cols-2 gap-1.5">
                  <StudioBtn
                    variant={mergeView === "tree" ? "primary" : "secondary"}
                    onClick={() => setMergeView("tree")}
                  >
                    Divide Tree
                  </StudioBtn>
                  <StudioBtn
                    variant={mergeView === "bars" ? "primary" : "secondary"}
                    onClick={() => setMergeView("bars")}
                  >
                    Bar Chart
                  </StudioBtn>
                </div>
              </InspectorBlock>
            )}

            {algo === "heap-sort" && (
              <InspectorBlock
                highlight
                title="Heap Type"
                description="Max-Heap sorts ascending; Min-Heap extracts minimums for descending order."
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <StudioBtn
                    variant={heapType === "max" ? "primary" : "secondary"}
                    onClick={() => setHeapType("max")}
                  >
                    Max-Heap (Asc)
                  </StudioBtn>
                  <StudioBtn
                    variant={heapType === "min" ? "primary" : "secondary"}
                    onClick={() => setHeapType("min")}
                  >
                    Min-Heap (Desc)
                  </StudioBtn>
                </div>
              </InspectorBlock>
            )}

            <InspectorBlock highlight={algo === "selection-sort" || algo === "insertion-sort"} title="Array (comma separated, 2-12 values)">
              <StudioTextarea
                rows={2}
                value={arrText}
                onChange={(e) => setArrText(e.target.value)}
                placeholder="6, 3, 9, 1, 5, 4, 7, 2"
              />
              <div className="mt-2 flex gap-2">
                <StudioBtn variant="primary" className="flex-1" onClick={() => applyInput()}>
                  Apply
                </StudioBtn>
                <StudioBtn
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    const rand = Array.from({ length: 8 }, () => Math.floor(Math.random() * 18) + 1);
                    setArr(rand);
                    setArrText(rand.join(", "));
                  }}
                >
                  Random
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "def", label: "Default" },
                  { id: "near", label: "Nearly Sorted" },
                  { id: "rev", label: "Reversed" },
                  { id: "merge", label: "Merge Example" },
                ]}
                onSelect={(id) => {
                  const map: Record<string, number[]> = {
                    def: [6, 3, 9, 1, 5, 4, 7, 2],
                    near: [1, 2, 4, 3, 5, 7, 6, 8],
                    rev: [9, 8, 7, 6, 5, 4, 3, 2],
                    merge: [38, 27, 43, 3, 9, 82, 10],
                  };
                  const chosen = map[id];
                  setArr(chosen);
                  setArrText(chosen.join(", "));
                }}
              />
            </InspectorBlock>

            <InspectorBlock title={`About ${info.name}`}>
              <p className="text-xs leading-relaxed text-slate-300">{info.about}</p>
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition={info.intuition}
            keyPoints={info.points}
            complexities={info.complexities}
          />
        }
      />
    </div>
  );
}
