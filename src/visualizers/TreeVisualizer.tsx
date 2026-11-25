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
  StudioInput,
  StudioSelect,
} from "../components/ui/input-helpers";
import type { TopicId } from "../data/syllabus";

interface TreeNodeData {
  id: string;
  label: string;
  bf?: number;
  height?: number;
  left?: TreeNodeData | null;
  right?: TreeNodeData | null;
}

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  bf?: number;
  height?: number;
  parentId?: string;
}

function layoutBinaryTree(root: TreeNodeData | null, width = 680, yGap = 72) {
  const nodes: PositionedNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number; active?: boolean }[] = [];

  function walk(
    node: TreeNodeData | null | undefined,
    depth: number,
    minX: number,
    maxX: number,
    parent?: PositionedNode
  ) {
    if (!node) return;
    const x = ((minX + maxX) / 2) * width;
    const y = 38 + depth * yGap;
    const cur: PositionedNode = {
      id: node.id,
      label: node.label,
      x,
      y,
      bf: node.bf,
      height: node.height,
      parentId: parent?.id,
    };
    nodes.push(cur);
    if (parent) {
      edges.push({ x1: parent.x, y1: parent.y, x2: cur.x, y2: cur.y });
    }
    walk(node.left, depth + 1, minX, (minX + maxX) / 2, cur);
    walk(node.right, depth + 1, (minX + maxX) / 2, maxX, cur);
  }

  walk(root, 0, 0.04, 0.96);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.y), 60);
  return { nodes, edges, height: Math.max(260, maxDepth + 44) };
}

function TreeSvgCanvas({
  root,
  activeIds = [],
  visitedIds = [],
  warnIds = [],
  showBF = false,
  onNodeClick,
  selectedId,
}: {
  root: TreeNodeData | null;
  activeIds?: string[];
  visitedIds?: string[];
  warnIds?: string[];
  showBF?: boolean;
  onNodeClick?: (node: PositionedNode) => void;
  selectedId?: string | null;
}) {
  const { nodes, edges, height } = useMemo(() => layoutBinaryTree(root), [root]);
  if (!root) {
    return (
      <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-500">
        Tree is empty. Enter values in the User Input &amp; Controls panel to construct a tree.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 680 ${height}`} className="w-full max-h-[370px] overflow-visible">
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#334155"
          strokeWidth="2"
        />
      ))}
      {nodes.map((n) => {
        const isWarn = warnIds.includes(n.id);
        const isActive = activeIds.includes(n.id);
        const isVisited = visitedIds.includes(n.id);
        const isSelected = selectedId === n.id;

        const fill = isWarn
          ? "#991b1b"
          : isActive
          ? "#7c3aed"
          : isVisited
          ? "#065f46"
          : "#151929";
        const stroke = isWarn
          ? "#f43f5e"
          : isActive
          ? "#a78bfa"
          : isVisited
          ? "#10b981"
          : isSelected
          ? "#38bdf8"
          : "#4f46e5";

        return (
          <g
            key={n.id}
            onClick={() => onNodeClick?.(n)}
            className={onNodeClick ? "cursor-pointer" : undefined}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={20}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive || isWarn || isSelected ? 3 : 2}
            />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#f8fafc"
              fontSize="12"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {n.label}
            </text>
            {showBF && typeof n.bf === "number" && (
              <text
                x={n.x + 24}
                y={n.y - 12}
                fill={Math.abs(n.bf) > 1 ? "#f43f5e" : n.bf === 0 ? "#10b981" : "#f59e0b"}
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                BF:{n.bf}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================
   1. TREE FUNDAMENTALS & TYPES (Full / Complete / Perfect)
   ========================================================= */
function TreeBasicsVisualizer() {
  const [arrayInput, setArrayInput] = useState("1, 2, 3, 4, 5, 6, 7");
  const [tokens, setTokens] = useState<(string | null)[]>(["1", "2", "3", "4", "5", "6", "7"]);
  const [selectedId, setSelectedId] = useState<string | null>("idx-0");

  const { root, analysis, nodeStats } = useMemo(() => {
    const builtNodes: (TreeNodeData | null)[] = tokens.map((tok, i) =>
      tok ? { id: `idx-${i}`, label: tok, left: null, right: null } : null
    );
    for (let i = 0; i < builtNodes.length; i++) {
      const node = builtNodes[i];
      if (!node) continue;
      const li = 2 * i + 1;
      const ri = 2 * i + 2;
      if (li < builtNodes.length) node.left = builtNodes[li];
      if (ri < builtNodes.length) node.right = builtNodes[ri];
    }
    const r = builtNodes[0] ?? null;

    let isFull = true;
    let isComplete = true;
    let sawNull = false;
    const leafDepths = new Set<number>();
    const stats: Record<string, { depth: number; degree: number; isLeaf: boolean; parent: string }> = {};

    // BFS for completeness & depth stats
    const q: { node: TreeNodeData | null; depth: number; parent: string }[] = r
      ? [{ node: r, depth: 0, parent: "None (Root)" }]
      : [];
    while (q.length) {
      const { node, depth, parent } = q.shift()!;
      if (!node) {
        sawNull = true;
        continue;
      }
      if (sawNull) isComplete = false;
      const hasL = Boolean(node.left);
      const hasR = Boolean(node.right);
      const degree = (hasL ? 1 : 0) + (hasR ? 1 : 0);
      if (degree === 1) isFull = false;
      if (degree === 0) leafDepths.add(depth);
      stats[node.id] = { depth, degree, isLeaf: degree === 0, parent };
      q.push({ node: node.left ?? null, depth: depth + 1, parent: node.label });
      q.push({ node: node.right ?? null, depth: depth + 1, parent: node.label });
    }

    const totalNodes = Object.keys(stats).length;
    const maxDepth = Math.max(0, ...Object.values(stats).map((s) => s.depth));
    const isPerfect = r !== null && isFull && leafDepths.size === 1;

    return {
      root: r,
      analysis: { totalNodes, height: r ? maxDepth : 0, isFull: r !== null && isFull, isComplete: r !== null && isComplete, isPerfect },
      nodeStats: stats,
    };
  }, [tokens]);

  const applyInput = (raw: string) => {
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 15)
      .map((s) => (s.toLowerCase() === "null" || s === "_" ? null : s));
    setTokens(parsed);
    setSelectedId("idx-0");
  };

  const selStat = selectedId ? nodeStats[selectedId] : undefined;

  return (
    <VisualizerWorkspace
      badge={`Nodes: ${analysis.totalNodes} · Height: ${analysis.height}`}
      statusText={`Full BT: ${analysis.isFull ? "Yes" : "No"}  |  Complete BT: ${analysis.isComplete ? "Yes" : "No"}  |  Perfect BT: ${analysis.isPerfect ? "Yes" : "No"}`}
      stage={
        <div className="space-y-4">
          <TreeSvgCanvas
            root={root}
            selectedId={selectedId}
            onNodeClick={(n) => setSelectedId(n.id)}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className={`rounded-lg border px-3 py-2 text-xs ${analysis.isFull ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/[0.08] bg-[#121625] text-slate-400"}`}>
              <div className="font-semibold">Full Binary Tree: {analysis.isFull ? "YES" : "NO"}</div>
              <div className="mt-0.5 text-[11px] opacity-80">Every node has 0 or 2 children.</div>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-xs ${analysis.isComplete ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/[0.08] bg-[#121625] text-slate-400"}`}>
              <div className="font-semibold">Complete Binary Tree: {analysis.isComplete ? "YES" : "NO"}</div>
              <div className="mt-0.5 text-[11px] opacity-80">Filled level-by-level from left to right.</div>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-xs ${analysis.isPerfect ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-white/[0.08] bg-[#121625] text-slate-400"}`}>
              <div className="font-semibold">Perfect Binary Tree: {analysis.isPerfect ? "YES" : "NO"}</div>
              <div className="mt-0.5 text-[11px] opacity-80">All internal have 2 children; all leaves at same depth.</div>
            </div>
          </div>
        </div>
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Custom Level-Order Tree"
            description="Comma-separated values in level-order. Use 'null' for missing children."
          >
            <StudioInput
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              placeholder="1, 2, 3, 4, 5, null, 7"
            />
            <StudioBtn variant="primary" className="mt-2 w-full" onClick={() => applyInput(arrayInput)}>
              Check & Visualize Tree
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "perfect", label: "Perfect BT" },
                { id: "complete", label: "Complete BT" },
                { id: "full", label: "Full (Not Complete)" },
                { id: "skew", label: "Neither (1 Child)" },
              ]}
              onSelect={(id) => {
                const map: Record<string, string> = {
                  perfect: "1, 2, 3, 4, 5, 6, 7",
                  complete: "1, 2, 3, 4, 5, 6",
                  full: "1, 2, 3, null, null, 6, 7",
                  skew: "1, 2, null, 4",
                };
                setArrayInput(map[id]);
                applyInput(map[id]);
              }}
            />
          </InspectorBlock>

          <InspectorBlock title="Node Inspector (Click any node)">
            {selStat ? (
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-slate-300">
                <div>Parent: <span className="text-sky-300">{selStat.parent}</span></div>
                <div>Depth: <span className="text-violet-300">{selStat.depth}</span></div>
                <div>Degree: <span className="text-amber-300">{selStat.degree}</span></div>
                <div>Type: <span className="text-emerald-300">{selStat.isLeaf ? "Leaf" : "Internal"}</span></div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click any node in the tree to inspect its properties.</p>
            )}
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Trees organize hierarchical data without cycles. Binary trees restrict each node to at most two children (left and right), unlocking array-based heaps and fast search trees."
          keyPoints={[
            "Full BT: 0 or 2 children per node (never 1 child).",
            "Complete BT: All levels full except possibly the last, packed left-to-right (used by Heaps!).",
            "Perfect BT: Both Full and Complete with 2^(h+1) - 1 total nodes.",
          ]}
        />
      }
    />
  );
}

/* =========================================================
   2. BINARY SEARCH TREE + IN-ORDER / PRE-ORDER / POST-ORDER
   ========================================================= */
interface BSTRec {
  val: number;
  left: BSTRec | null;
  right: BSTRec | null;
}

function cloneBST(n: BSTRec | null): BSTRec | null {
  return n ? { val: n.val, left: cloneBST(n.left), right: cloneBST(n.right) } : null;
}

function insertBST(root: BSTRec | null, val: number): BSTRec {
  if (!root) return { val, left: null, right: null };
  if (val < root.val) root.left = insertBST(root.left, val);
  else if (val > root.val) root.right = insertBST(root.right, val);
  return root;
}

function deleteBST(root: BSTRec | null, val: number): BSTRec | null {
  if (!root) return null;
  if (val < root.val) root.left = deleteBST(root.left, val);
  else if (val > root.val) root.right = deleteBST(root.right, val);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteBST(root.right, succ.val);
  }
  return root;
}

function bstToVisual(n: BSTRec | null): TreeNodeData | null {
  if (!n) return null;
  return {
    id: `bst-${n.val}`,
    label: String(n.val),
    left: bstToVisual(n.left),
    right: bstToVisual(n.right),
  };
}

interface TreeStep {
  root: BSTRec | null;
  active: string[];
  visited: string[];
  output: number[];
  msg: string;
}

function BinaryTreeVisualizer() {
  const [bulkText, setBulkText] = useState("50, 30, 70, 20, 40, 60, 80");
  const [singleVal, setSingleVal] = useState("45");
  const [traversalMode, setTraversalMode] = useState<"inorder" | "preorder" | "postorder">("inorder");
  const [bstRoot, setBstRoot] = useState<BSTRec | null>(() => {
    let r: BSTRec | null = null;
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => { r = insertBST(r, v); });
    return r;
  });

  const [steps, setSteps] = useState<TreeStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const rebuildTraversalSteps = (root: BSTRec | null, mode: "inorder" | "preorder" | "postorder") => {
    const out: TreeStep[] = [
      { root: cloneBST(root), active: [], visited: [], output: [], msg: `Ready for ${mode} traversal.` },
    ];
    const visited: string[] = [];
    const output: number[] = [];

    function walk(node: BSTRec | null) {
      if (!node) return;
      const id = `bst-${node.val}`;
      if (mode === "preorder") {
        visited.push(id);
        output.push(node.val);
        out.push({ root: cloneBST(root), active: [id], visited: [...visited], output: [...output], msg: `Visit Node ${node.val} (N -> L -> R)` });
      }
      walk(node.left);
      if (mode === "inorder") {
        visited.push(id);
        output.push(node.val);
        out.push({ root: cloneBST(root), active: [id], visited: [...visited], output: [...output], msg: `Visit Node ${node.val} (L -> N -> R)` });
      }
      walk(node.right);
      if (mode === "postorder") {
        visited.push(id);
        output.push(node.val);
        out.push({ root: cloneBST(root), active: [id], visited: [...visited], output: [...output], msg: `Visit Node ${node.val} (L -> R -> N)` });
      }
    }
    walk(root);
    out.push({
      root: cloneBST(root),
      active: [],
      visited: [...visited],
      output: [...output],
      msg: `${mode.toUpperCase()} Complete: [${output.join(", ")}]`,
    });
    setSteps(out);
    setStepIdx(0);
    setPlaying(false);
  };

  useEffect(() => {
    rebuildTraversalSteps(bstRoot, traversalMode);
  }, [bstRoot, traversalMode]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStepIdx((p) => {
        if (p >= steps.length - 1) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 1100 - speed * 90);
    return () => clearInterval(t);
  }, [playing, speed, steps.length]);

  const handleBulkBuild = () => {
    const nums = bulkText
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .slice(0, 15);
    let r: BSTRec | null = null;
    nums.forEach((v) => { r = insertBST(r, v); });
    setBstRoot(r);
  };

  const traceSingleOp = (op: "insert" | "delete" | "search") => {
    const val = Number(singleVal);
    if (Number.isNaN(val)) return;
    setPlaying(false);
    const trace: TreeStep[] = [];
    let cur = bstRoot;
    const path: string[] = [];

    while (cur) {
      const id = `bst-${cur.val}`;
      path.push(id);
      if (val === cur.val) {
        trace.push({
          root: cloneBST(bstRoot),
          active: [id],
          visited: [...path],
          output: [],
          msg: `Found ${val} at node ${cur.val}.`,
        });
        break;
      }
      trace.push({
        root: cloneBST(bstRoot),
        active: [id],
        visited: [...path],
        output: [],
        msg: `${val} ${val < cur.val ? "<" : ">"} ${cur.val} -> move ${val < cur.val ? "LEFT" : "RIGHT"}.`,
      });
      cur = val < cur.val ? cur.left : cur.right;
    }

    if (op === "insert") {
      const nextRoot = insertBST(cloneBST(bstRoot), val);
      setBstRoot(nextRoot);
    } else if (op === "delete") {
      const nextRoot = deleteBST(cloneBST(bstRoot), val);
      setBstRoot(nextRoot);
    } else {
      if (!cur) {
        trace.push({
          root: cloneBST(bstRoot),
          active: [],
          visited: path,
          output: [],
          msg: `Reached NULL — ${val} is not in the BST.`,
        });
      }
      setSteps(trace);
      setStepIdx(0);
      setPlaying(true);
    }
  };

  const cur = steps[stepIdx] ?? { root: bstRoot, active: [], visited: [], output: [], msg: "Ready" };

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="bst-trav-tabs"
        value={traversalMode}
        onChange={setTraversalMode}
        options={[
          { id: "inorder", label: "In-order (L-N-R)" },
          { id: "preorder", label: "Pre-order (N-L-R)" },
          { id: "postorder", label: "Post-order (L-R-N)" },
        ]}
      />

      <VisualizerWorkspace
        step={stepIdx}
        totalSteps={Math.max(0, steps.length - 1)}
        statusText={cur.msg}
        badge={traversalMode.toUpperCase()}
        isPlaying={playing}
        stage={
          <div className="space-y-3">
            <TreeSvgCanvas
              root={bstToVisual(cur.root)}
              activeIds={cur.active}
              visitedIds={cur.visited}
            />
            {cur.output.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#10131e] px-3 py-2">
                <span className="mr-1 text-xs font-medium text-slate-400">Output:</span>
                {cur.output.map((v, i) => (
                  <span key={`${v}-${i}`} className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        }
        controls={
          <PlaybackDock
            isPlaying={playing}
            onTogglePlay={() => {
              if (stepIdx >= steps.length - 1) setStepIdx(0);
              setPlaying((p) => !p);
            }}
            onReset={() => {
              setPlaying(false);
              setStepIdx(0);
            }}
            onStepBack={() => {
              setPlaying(false);
              setStepIdx((s) => Math.max(0, s - 1));
            }}
            onStepForward={() => {
              setPlaying(false);
              setStepIdx((s) => Math.min(steps.length - 1, s + 1));
            }}
            canStepBack={stepIdx > 0}
            canStepForward={stepIdx < steps.length - 1}
            speed={speed}
            onSpeedChange={setSpeed}
            legend={[
              { label: "Unvisited", colorClass: "bg-indigo-600" },
              { label: "Current Node", colorClass: "bg-violet-500" },
              { label: "Visited", colorClass: "bg-emerald-500" },
            ]}
          />
        }
        inspector={
          <>
            <InspectorBlock highlight title="Build Your Own BST" description="Enter comma-separated values to insert sequentially.">
              <div className="flex gap-2">
                <StudioInput value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="50, 30, 70..." />
                <StudioBtn variant="primary" onClick={handleBulkBuild}>Build</StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Insert / Delete / Search Node">
              <div className="flex gap-2">
                <StudioInput type="number" value={singleVal} onChange={(e) => setSingleVal(e.target.value)} />
                <StudioBtn variant="primary" onClick={() => traceSingleOp("insert")}>Insert</StudioBtn>
              </div>
              <div className="mt-2 flex gap-2">
                <StudioBtn variant="danger" className="flex-1" onClick={() => traceSingleOp("delete")}>Delete</StudioBtn>
                <StudioBtn variant="secondary" className="flex-1" onClick={() => traceSingleOp("search")}>Trace Search</StudioBtn>
                <StudioBtn variant="secondary" onClick={() => setBstRoot(null)}>Clear</StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "bal", label: "Balanced (7)" },
                  { id: "skew", label: "Skewed (Worst Case)" },
                  { id: "lab", label: "Syllabus Lab" },
                ]}
                onSelect={(id) => {
                  const map: Record<string, string> = {
                    bal: "50, 30, 70, 20, 40, 60, 80",
                    skew: "10, 20, 30, 40, 50",
                    lab: "25, 15, 50, 10, 22, 35, 70, 4, 12, 18, 24",
                  };
                  setBulkText(map[id]);
                  const nums = map[id].split(",").map(Number);
                  let r: BSTRec | null = null;
                  nums.forEach((v) => { r = insertBST(r, v); });
                  setBstRoot(r);
                }}
              />
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="In a BST, everything left of a node is smaller and everything right is larger. Notice how In-order traversal of a BST always yields sorted ascending output!"
            keyPoints={[
              "In-order (L-N-R): Gives sorted order in BST.",
              "Pre-order (N-L-R): Root first — great for serializing or copying a tree.",
              "Post-order (L-R-N): Children before parent — great for safe deletion or expression evaluation.",
            ]}
            complexities={[
              { op: "Search / Insert / Delete", best: "O(log n)", avg: "O(log n)", worst: "O(n) skewed" },
              { op: "Tree Traversals", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(h)" },
            ]}
          />
        }
      />
    </div>
  );
}

/* =========================================================
   3. AVL TREE (LL, RR, LR, RL STEP-BY-STEP!)
   ========================================================= */
interface AVLNode {
  val: number;
  height: number;
  left: AVLNode | null;
  right: AVLNode | null;
}

function avlH(n: AVLNode | null): number { return n ? n.height : 0; }
function avlBF(n: AVLNode | null): number { return n ? avlH(n.left) - avlH(n.right) : 0; }
function avlUpd(n: AVLNode) { n.height = 1 + Math.max(avlH(n.left), avlH(n.right)); }
function cloneAVL(n: AVLNode | null): AVLNode | null {
  return n ? { val: n.val, height: n.height, left: cloneAVL(n.left), right: cloneAVL(n.right) } : null;
}
function rotRight(y: AVLNode): AVLNode {
  const x = y.left!;
  const t2 = x.right;
  x.right = y;
  y.left = t2;
  avlUpd(y);
  avlUpd(x);
  return x;
}
function rotLeft(x: AVLNode): AVLNode {
  const y = x.right!;
  const t2 = y.left;
  y.left = x;
  x.right = t2;
  avlUpd(x);
  avlUpd(y);
  return y;
}

interface AVLStep {
  root: AVLNode | null;
  active: string[];
  warn: string[];
  msg: string;
}

function avlToVisual(n: AVLNode | null): TreeNodeData | null {
  if (!n) return null;
  return {
    id: `avl-${n.val}`,
    label: String(n.val),
    bf: avlBF(n),
    height: n.height,
    left: avlToVisual(n.left),
    right: avlToVisual(n.right),
  };
}

function AVLTreeVisualizer() {
  const [bulkInput, setBulkInput] = useState("3, 2, 1, 4, 5, 6, 7, 8, 9");
  const [singleVal, setSingleVal] = useState("10");
  const [steps, setSteps] = useState<AVLStep[]>(() => buildAVLSequence([3, 2, 1, 4, 5, 6, 7, 8, 9]));
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  function insertWithLog(node: AVLNode | null, val: number, rotEvents: string[]): AVLNode {
    if (!node) return { val, height: 1, left: null, right: null };
    if (val < node.val) node.left = insertWithLog(node.left, val, rotEvents);
    else if (val > node.val) node.right = insertWithLog(node.right, val, rotEvents);
    else return node;
    avlUpd(node);
    const bf = avlBF(node);
    if (bf > 1 && val < node.left!.val) {
      rotEvents.push(`LL imbalance at ${node.val} (BF=${bf}) -> Right Rotate`);
      return rotRight(node);
    }
    if (bf < -1 && val > node.right!.val) {
      rotEvents.push(`RR imbalance at ${node.val} (BF=${bf}) -> Left Rotate`);
      return rotLeft(node);
    }
    if (bf > 1 && val > node.left!.val) {
      rotEvents.push(`LR imbalance at ${node.val} (BF=${bf}) -> Left Rotate ${node.left!.val}, then Right Rotate ${node.val}`);
      node.left = rotLeft(node.left!);
      return rotRight(node);
    }
    if (bf < -1 && val < node.right!.val) {
      rotEvents.push(`RL imbalance at ${node.val} (BF=${bf}) -> Right Rotate ${node.right!.val}, then Left Rotate ${node.val}`);
      node.right = rotRight(node.right!);
      return rotLeft(node);
    }
    return node;
  }

  function deleteAVLNode(node: AVLNode | null, val: number, rotEvents: string[]): AVLNode | null {
    if (!node) return null;
    if (val < node.val) node.left = deleteAVLNode(node.left, val, rotEvents);
    else if (val > node.val) node.right = deleteAVLNode(node.right, val, rotEvents);
    else {
      if (!node.left || !node.right) return node.left || node.right;
      let min = node.right;
      while (min.left) min = min.left;
      node.val = min.val;
      node.right = deleteAVLNode(node.right, min.val, rotEvents);
    }
    avlUpd(node);
    const bf = avlBF(node);
    if (bf > 1 && avlBF(node.left) >= 0) {
      rotEvents.push(`Delete LL rebalance at ${node.val} -> Right Rotate`);
      return rotRight(node);
    }
    if (bf > 1 && avlBF(node.left) < 0) {
      rotEvents.push(`Delete LR rebalance at ${node.val} -> Left-Right Rotate`);
      node.left = rotLeft(node.left!);
      return rotRight(node);
    }
    if (bf < -1 && avlBF(node.right) <= 0) {
      rotEvents.push(`Delete RR rebalance at ${node.val} -> Left Rotate`);
      return rotLeft(node);
    }
    if (bf < -1 && avlBF(node.right) > 0) {
      rotEvents.push(`Delete RL rebalance at ${node.val} -> Right-Left Rotate`);
      node.right = rotRight(node.right!);
      return rotLeft(node);
    }
    return node;
  }

  function buildAVLSequence(vals: number[]): AVLStep[] {
    let root: AVLNode | null = null;
    const out: AVLStep[] = [{ root: null, active: [], warn: [], msg: `Ready to build AVL tree for [${vals.join(", ")}].` }];
    vals.forEach((v) => {
      const rots: string[] = [];
      root = insertWithLog(cloneAVL(root), v, rots);
      out.push({
        root: cloneAVL(root),
        active: [`avl-${v}`],
        warn: [],
        msg: rots.length ? `Insert ${v} -> ${rots.join(" | ")}` : `Inserted ${v} (Tree remains balanced).`,
      });
    });
    return out;
  }

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStepIdx((p) => {
        if (p >= steps.length - 1) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 1250 - speed * 95);
    return () => clearInterval(t);
  }, [playing, speed, steps.length]);

  const buildFromInput = (raw = bulkInput) => {
    const vals = raw
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .slice(0, 15);
    if (!vals.length) return;
    setSteps(buildAVLSequence(vals));
    setStepIdx(0);
    setPlaying(true);
  };

  const singleOp = (op: "insert" | "delete") => {
    const v = Number(singleVal);
    if (Number.isNaN(v)) return;
    const base = cloneAVL(steps[stepIdx]?.root ?? null);
    const rots: string[] = [];
    const next = op === "insert" ? insertWithLog(base, v, rots) : deleteAVLNode(base, v, rots);
    const nextStep: AVLStep = {
      root: cloneAVL(next),
      active: op === "insert" ? [`avl-${v}`] : [],
      warn: [],
      msg: rots.length
        ? `${op === "insert" ? "Insert" : "Delete"} ${v} -> ${rots.join(" | ")}`
        : `${op === "insert" ? "Inserted" : "Deleted"} ${v}. Balanced!`,
    };
    const nextList = [...steps.slice(0, stepIdx + 1), nextStep];
    setSteps(nextList);
    setStepIdx(nextList.length - 1);
    setPlaying(false);
  };

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge="AVL Self-Balancing"
      isPlaying={playing}
      stage={<TreeSvgCanvas root={avlToVisual(cur.root)} activeIds={cur.active} warnIds={cur.warn} showBF />}
      controls={
        <PlaybackDock
          isPlaying={playing}
          onTogglePlay={() => {
            if (stepIdx >= steps.length - 1) setStepIdx(0);
            setPlaying((p) => !p);
          }}
          onReset={() => { setPlaying(false); setStepIdx(0); }}
          onStepBack={() => { setPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
          onStepForward={() => { setPlaying(false); setStepIdx((s) => Math.min(steps.length - 1, s + 1)); }}
          canStepBack={stepIdx > 0}
          canStepForward={stepIdx < steps.length - 1}
          speed={speed}
          onSpeedChange={setSpeed}
          legend={[
            { label: "BF = 0 (Balanced)", colorClass: "bg-emerald-500" },
            { label: "BF = ±1 (Valid)", colorClass: "bg-amber-400" },
            { label: "Newly Inserted", colorClass: "bg-violet-500" },
          ]}
        />
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Custom Sequence (Auto-Rotations)"
            description="Watch LL, RR, LR, RL rotations trigger live as each value enters."
          >
            <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
            <StudioBtn variant="primary" className="mt-2 w-full" onClick={() => buildFromInput(bulkInput)}>
              Build & Animate AVL
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Insert / Delete Single Key">
            <div className="flex gap-2">
              <StudioInput type="number" value={singleVal} onChange={(e) => setSingleVal(e.target.value)} />
              <StudioBtn variant="primary" onClick={() => singleOp("insert")}>Insert</StudioBtn>
              <StudioBtn variant="danger" onClick={() => singleOp("delete")}>Delete</StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Rotation Presets">
            <PresetRow
              presets={[
                { id: "lab", label: "Syllabus (3,2,1,4,5,6,7,8,9)" },
                { id: "lr", label: "LR Case (30,10,20)" },
                { id: "rl", label: "RL Case (10,30,20)" },
                { id: "ll", label: "LL Case (30,20,10)" },
              ]}
              onSelect={(id) => {
                const map: Record<string, string> = {
                  lab: "3, 2, 1, 4, 5, 6, 7, 8, 9",
                  lr: "30, 10, 20",
                  rl: "10, 30, 20",
                  ll: "30, 20, 10",
                };
                setBulkInput(map[id]);
                buildFromInput(map[id]);
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="An AVL tree keeps |height(left) - height(right)| <= 1 at every node, guaranteeing O(log n) worst-case height even on sorted inputs like 1,2,3,4,5..."
          keyPoints={[
            "LL (Left-Left): Single Right Rotation.",
            "RR (Right-Right): Single Left Rotation.",
            "LR (Left-Right): Left Rotate child, then Right Rotate grandparent.",
            "RL (Right-Left): Right Rotate child, then Left Rotate grandparent.",
          ]}
          complexities={[
            { op: "Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
            { op: "Insert (+ Rotations)", best: "O(log n)", avg: "O(log n)", worst: "O(log n)" },
            { op: "Delete (+ Rotations)", best: "O(log n)", avg: "O(log n)", worst: "O(log n)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   4. EXPRESSION TREE & RECONSTRUCTION FROM IN/PRE/POST
   ========================================================= */
function buildFromPostfix(tokens: string[]): TreeNodeData | null {
  const stack: TreeNodeData[] = [];
  let seq = 0;
  for (const t of tokens) {
    if (["+", "-", "*", "/", "^"].includes(t)) {
      const r = stack.pop();
      const l = stack.pop();
      if (!l || !r) return null;
      stack.push({ id: `ex-${seq++}`, label: t, left: l, right: r });
    } else {
      stack.push({ id: `ex-${seq++}`, label: t, left: null, right: null });
    }
  }
  return stack.length === 1 ? stack[0] : null;
}

function buildFromPrefix(tokens: string[]): TreeNodeData | null {
  const stack: TreeNodeData[] = [];
  let seq = 0;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (["+", "-", "*", "/", "^"].includes(t)) {
      const l = stack.pop();
      const r = stack.pop();
      if (!l || !r) return null;
      stack.push({ id: `ex-${seq++}`, label: t, left: l, right: r });
    } else {
      stack.push({ id: `ex-${seq++}`, label: t, left: null, right: null });
    }
  }
  return stack.length === 1 ? stack[0] : null;
}

function infixToPostfixTokens(expr: string): string[] {
  const tokens = expr.replace(/\s+/g, "").match(/[A-Za-z0-9]+|[+\-*/^()]/g) ?? [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };
  const out: string[] = [];
  const ops: string[] = [];
  for (const t of tokens) {
    if (/^[A-Za-z0-9]+$/.test(t)) out.push(t);
    else if (t === "(") ops.push(t);
    else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()!);
      ops.pop();
    } else {
      while (ops.length && ops[ops.length - 1] !== "(" && (prec[ops[ops.length - 1]] ?? 0) >= (prec[t] ?? 0)) {
        out.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) out.push(ops.pop()!);
  return out;
}

function reconstructTree(inArr: string[], otherArr: string[], mode: "pre" | "post"): { root: TreeNodeData | null; error?: string } {
  if (!inArr.length || inArr.length !== otherArr.length) {
    return { root: null, error: "In-order and Pre/Post-order must have equal non-empty token counts." };
  }
  let seq = 0;
  function build(ino: string[], oth: string[]): TreeNodeData | null {
    if (!ino.length) return null;
    const rootVal = mode === "pre" ? oth[0] : oth[oth.length - 1];
    const idx = ino.indexOf(rootVal);
    if (idx === -1) throw new Error(`Token "${rootVal}" missing in In-order slice.`);
    const leftIn = ino.slice(0, idx);
    const rightIn = ino.slice(idx + 1);
    const leftOth = mode === "pre" ? oth.slice(1, 1 + leftIn.length) : oth.slice(0, leftIn.length);
    const rightOth = mode === "pre" ? oth.slice(1 + leftIn.length) : oth.slice(leftIn.length, oth.length - 1);
    return {
      id: `rec-${seq++}-${rootVal}`,
      label: rootVal,
      left: build(leftIn, leftOth),
      right: build(rightIn, rightOth),
    };
  }
  try {
    return { root: build(inArr, otherArr) };
  } catch (e) {
    return { root: null, error: e instanceof Error ? e.message : "Invalid traversals." };
  }
}

function getReadings(n: TreeNodeData | null) {
  const pre: string[] = [];
  const ino: string[] = [];
  const post: string[] = [];
  function walk(node: TreeNodeData | null | undefined) {
    if (!node) return;
    pre.push(node.label);
    const needParen = node.left || node.right;
    if (needParen) ino.push("(");
    walk(node.left);
    ino.push(node.label);
    walk(node.right);
    if (needParen) ino.push(")");
    post.push(node.label);
  }
  walk(n);
  return {
    infix: ino.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")"),
    prefix: pre.join(" "),
    postfix: post.join(" "),
  };
}

function ExpressionTreeVisualizer() {
  const [mode, setMode] = useState<"expr" | "reconstruct">("expr");
  const [exprFormat, setExprFormat] = useState<"infix" | "postfix" | "prefix">("infix");
  const [exprText, setExprText] = useState("(A + B) * (C - D)");

  const [inOrderStr, setInOrderStr] = useState("D B E A F C");
  const [otherType, setOtherType] = useState<"pre" | "post">("pre");
  const [otherStr, setOtherStr] = useState("A B D E C F");

  const { tree, errorMsg } = useMemo(() => {
    if (mode === "expr") {
      if (exprFormat === "infix") {
        const pf = infixToPostfixTokens(exprText);
        const r = buildFromPostfix(pf);
        return { tree: r, errorMsg: r ? "" : "Invalid infix expression. Check parentheses and operators." };
      }
      const toks = exprText.trim().split(/\s+/).filter(Boolean);
      const r = exprFormat === "postfix" ? buildFromPostfix(toks) : buildFromPrefix(toks);
      return {
        tree: r,
        errorMsg: r ? "" : `Invalid ${exprFormat} expression. Separate tokens by spaces (e.g. A B + C *).`,
      };
    } else {
      const inToks = inOrderStr.trim().split(/[\s,]+/).filter(Boolean);
      const othToks = otherStr.trim().split(/[\s,]+/).filter(Boolean);
      const res = reconstructTree(inToks, othToks, otherType);
      return { tree: res.root, errorMsg: res.error ?? "" };
    }
  }, [mode, exprFormat, exprText, inOrderStr, otherStr, otherType]);

  const readings = useMemo(() => getReadings(tree), [tree]);

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="expr-mode-tabs"
        value={mode}
        onChange={setMode}
        options={[
          { id: "expr", label: "Build from Infix / Prefix / Postfix" },
          { id: "reconstruct", label: "Create from In-order + Pre/Post-order" },
        ]}
      />

      <VisualizerWorkspace
        badge={mode === "expr" ? exprFormat.toUpperCase() : `In + ${otherType.toUpperCase()}`}
        statusText={
          errorMsg
            ? errorMsg
            : mode === "expr"
            ? "Operators sit at internal nodes; operands sit at leaves."
            : "Picked root from Pre/Post-order and split In-order into Left & Right subtrees."
        }
        stage={
          <div className="space-y-4">
            <TreeSvgCanvas root={tree} />
            {tree && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2">
                  <div className="text-[11px] font-semibold text-sky-300">In-order (Infix)</div>
                  <div className="mt-1 font-mono text-xs text-white">{readings.infix}</div>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <div className="text-[11px] font-semibold text-amber-300">Pre-order (Prefix)</div>
                  <div className="mt-1 font-mono text-xs text-white">{readings.prefix}</div>
                </div>
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                  <div className="text-[11px] font-semibold text-violet-300">Post-order (Postfix)</div>
                  <div className="mt-1 font-mono text-xs text-white">{readings.postfix}</div>
                </div>
              </div>
            )}
          </div>
        }
        inspector={
          mode === "expr" ? (
            <>
              <InspectorBlock highlight title="Input Expression" description="Choose format and type your own mathematical expression.">
                <div className="mb-2">
                  <StudioSelect
                    value={exprFormat}
                    onChange={(e) => {
                      const f = e.target.value as "infix" | "postfix" | "prefix";
                      setExprFormat(f);
                      setExprText(
                        f === "infix" ? "(A + B) * (C - D)" : f === "postfix" ? "A B + C D - *" : "* + A B - C D"
                      );
                    }}
                  >
                    <option value="infix">Infix (e.g. (A + B) * C)</option>
                    <option value="postfix">Postfix (space-separated: A B + C *)</option>
                    <option value="prefix">Prefix (space-separated: * + A B C)</option>
                  </StudioSelect>
                </div>
                <StudioInput value={exprText} onChange={(e) => setExprText(e.target.value)} />
              </InspectorBlock>

              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "e1", label: "(A+B)*(C-D)" },
                    { id: "e2", label: "A+B*C" },
                    { id: "e3", label: "(5+3)*2" },
                  ]}
                  onSelect={(id) => {
                    setExprFormat("infix");
                    setExprText(id === "e1" ? "(A + B) * (C - D)" : id === "e2" ? "A + B * C" : "(5 + 3) * 2");
                  }}
                />
              </InspectorBlock>
            </>
          ) : (
            <>
              <InspectorBlock
                highlight
                title="Reconstruct from Traversals"
                description="Space-separated unique node labels."
              >
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-400">In-order Traversal</label>
                    <StudioInput value={inOrderStr} onChange={(e) => setInOrderStr(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-400">Pair With</label>
                    <StudioSelect
                      value={otherType}
                      onChange={(e) => {
                        const t = e.target.value as "pre" | "post";
                        setOtherType(t);
                        setOtherStr(t === "pre" ? "A B D E C F" : "D E B F C A");
                      }}
                    >
                      <option value="pre">Pre-order Traversal</option>
                      <option value="post">Post-order Traversal</option>
                    </StudioSelect>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-400">
                      {otherType === "pre" ? "Pre-order" : "Post-order"} Traversal
                    </label>
                    <StudioInput value={otherStr} onChange={(e) => setOtherStr(e.target.value)} />
                  </div>
                </div>
              </InspectorBlock>

              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "letters", label: "Letters (A..F)" },
                    { id: "expr", label: "Expr (* + A B C)" },
                  ]}
                  onSelect={(id) => {
                    if (id === "letters") {
                      setInOrderStr("D B E A F C");
                      setOtherType("pre");
                      setOtherStr("A B D E C F");
                    } else {
                      setInOrderStr("A + B * C");
                      setOtherType("pre");
                      setOtherStr("+ A * B C");
                    }
                  }}
                />
              </InspectorBlock>
            </>
          )
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="An Expression Tree encodes operator precedence without needing parentheses. In-order + Pre-order (or Post-order) uniquely determines any binary tree with distinct nodes."
            keyPoints={[
              "Postfix -> Tree: Scan left-to-right, push operands, pop two when seeing an operator.",
              "In-order + Pre-order: First item of Pre-order is always Root; split In-order around Root into Left & Right subtrees.",
              "In-order + Post-order: Last item of Post-order is always Root.",
            ]}
          />
        }
      />
    </div>
  );
}

export function renderTreeTopic(topicId: TopicId) {
  switch (topicId) {
    case "tree-basics":
      return <TreeBasicsVisualizer />;
    case "binary-tree":
      return <BinaryTreeVisualizer />;
    case "avl":
      return <AVLTreeVisualizer />;
    case "expression-tree":
      return <ExpressionTreeVisualizer />;
    default:
      return <TreeBasicsVisualizer />;
  }
}
