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
import {
  buildExprTreeFromPostfix,
  buildExprTreeFromPrefix,
  evaluateExprTree,
  infixToPostfixChecked,
  parseNumberList,
  reconstructBinaryTree,
} from "../lib/parsers";
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

/**
 * In-order x-slot binary tree layout: guarantees minimum horizontal spacing so
 * deep or skewed trees never overlap regardless of depth.
 */
function layoutBinaryTree(root: TreeNodeData | null, showBF = false, yGap = 68) {
  const nodes: PositionedNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (!root) return { nodes, edges, width: 680, height: 260 };

  let totalCount = 0;
  function countNodes(n: TreeNodeData | null | undefined) {
    if (!n) return;
    totalCount++;
    countNodes(n.left);
    countNodes(n.right);
  }
  countNodes(root);

  const minSlotW = showBF ? 76 : 56;
  const padX = 48;
  const width = Math.max(680, totalCount * minSlotW + padX * 2);
  const slotStep = totalCount > 1 ? (width - padX * 2) / (totalCount - 1) : 0;

  let slotCursor = 0;
  const coordMap = new Map<string, PositionedNode>();

  function assign(node: TreeNodeData | null | undefined, depth: number, parentId?: string) {
    if (!node) return;
    assign(node.left, depth + 1, node.id);
    const x = totalCount === 1 ? width / 2 : padX + slotCursor * slotStep;
    const y = 36 + depth * yGap;
    slotCursor++;
    const positioned: PositionedNode = {
      id: node.id,
      label: node.label,
      x,
      y,
      bf: node.bf,
      height: node.height,
      parentId,
    };
    coordMap.set(node.id, positioned);
    nodes.push(positioned);
    assign(node.right, depth + 1, node.id);
  }

  assign(root, 0);

  for (const n of nodes) {
    if (n.parentId) {
      const parent = coordMap.get(n.parentId);
      if (parent) {
        edges.push({ x1: parent.x, y1: parent.y, x2: n.x, y2: n.y });
      }
    }
  }

  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 60);
  return { nodes, edges, width, height: Math.max(250, maxY + 42) };
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
  const { nodes, edges, width, height } = useMemo(
    () => layoutBinaryTree(root, showBF),
    [root, showBF]
  );

  if (!root) {
    return (
      <div className="flex h-[250px] items-center justify-center text-center text-sm text-[#93939a]">
        Tree is empty — enter values in Input &amp; controls to build a tree
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto w-full max-h-[380px] overflow-visible"
        style={{ minWidth: width > 720 ? `${Math.min(width, 980)}px` : undefined }}
      >
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="rgba(237,237,237,0.18)"
            strokeWidth="1.8"
          />
        ))}
        {nodes.map((n) => {
          const isWarn = warnIds.includes(n.id);
          const isActive = activeIds.includes(n.id);
          const isVisited = visitedIds.includes(n.id);
          const isSelected = selectedId === n.id;

          const fill = isWarn
            ? "#3a1517"
            : isActive
            ? "#2b200c"
            : isVisited
            ? "#11281d"
            : isSelected
            ? "#142338"
            : "#19191b";
          const stroke = isWarn
            ? "#e5484d"
            : isActive
            ? "#f59e0b"
            : isVisited
            ? "#4cc38a"
            : isSelected
            ? "#60a5fa"
            : "#48484f";

          return (
            <g
              key={n.id}
              role={onNodeClick ? "button" : undefined}
              tabIndex={onNodeClick ? 0 : undefined}
              aria-label={onNodeClick ? `Inspect node ${n.label}` : undefined}
              onClick={() => onNodeClick?.(n)}
              onKeyDown={(ev) => {
                if (onNodeClick && (ev.key === "Enter" || ev.key === " ")) {
                  ev.preventDefault();
                  onNodeClick(n);
                }
              }}
              className={onNodeClick ? "cursor-pointer outline-none" : undefined}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={19}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive || isWarn || isSelected ? 2.4 : 1.8}
              />
              <text
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ededed"
                fontSize="12"
                fontWeight="500"
                fontFamily="JetBrains Mono, monospace"
              >
                {n.label}
              </text>
              {showBF && typeof n.bf === "number" && (
                <text
                  x={n.x + 23}
                  y={n.y - 12}
                  fill={Math.abs(n.bf) > 1 ? "#e5484d" : n.bf === 0 ? "#4cc38a" : "#f59e0b"}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  BF:{n.bf > 0 ? `+${n.bf}` : n.bf}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
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
    const stats: Record<
      string,
      { depth: number; degree: number; isLeaf: boolean; parent: string }
    > = {};

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
      analysis: {
        totalNodes,
        height: r ? String(maxDepth) : "—",
        isFull: r !== null && isFull,
        isComplete: r !== null && isComplete,
        isPerfect,
      },
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
    setSelectedId(parsed[0] ? "idx-0" : null);
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
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                analysis.isFull
                  ? "border-[#4cc38a]/40 bg-[#4cc38a]/10 text-[#ededed]"
                  : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
              }`}
            >
              <div className="font-medium">Full binary tree: {analysis.isFull ? "Yes" : "No"}</div>
              <div className="mt-1 text-xs text-[#93939a]">Every node has 0 or 2 children</div>
            </div>
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                analysis.isComplete
                  ? "border-[#4cc38a]/40 bg-[#4cc38a]/10 text-[#ededed]"
                  : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
              }`}
            >
              <div className="font-medium">
                Complete binary tree: {analysis.isComplete ? "Yes" : "No"}
              </div>
              <div className="mt-1 text-xs text-[#93939a]">
                Filled level by level from left to right
              </div>
            </div>
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                analysis.isPerfect
                  ? "border-[#4cc38a]/40 bg-[#4cc38a]/10 text-[#ededed]"
                  : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
              }`}
            >
              <div className="font-medium">
                Perfect binary tree: {analysis.isPerfect ? "Yes" : "No"}
              </div>
              <div className="mt-1 text-xs text-[#93939a]">
                Internal nodes have 2 children; leaves align
              </div>
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
              onKeyDown={(e) => e.key === "Enter" && applyInput(arrayInput)}
              placeholder="1, 2, 3, 4, 5, null, 7"
            />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => applyInput(arrayInput)}
            >
              Check &amp; Visualize Tree
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

          <InspectorBlock title="Node inspector (click or focus a node)">
            {selStat ? (
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-[#a1a1a6]">
                <div>
                  Parent: <span className="text-[#60a5fa]">{selStat.parent}</span>
                </div>
                <div>
                  Depth: <span className="text-amber-400">{selStat.depth}</span>
                </div>
                <div>
                  Degree: <span className="text-[#ededed]">{selStat.degree}</span>
                </div>
                <div>
                  Type:{" "}
                  <span className="text-[#4cc38a]">{selStat.isLeaf ? "Leaf" : "Internal"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#93939a]">
                Click any node in the tree to inspect its properties
              </p>
            )}
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Trees organize hierarchical data without cycles. Binary trees restrict each node to at most two children (left and right), unlocking array-based heaps and fast search trees."
          keyPoints={[
            "Full BT: 0 or 2 children per node (never 1 child).",
            "Complete BT: All levels full except possibly the last, packed left-to-right (used by Heaps).",
            "Perfect BT: Both Full and Complete with 2^(h+1) - 1 total nodes.",
          ]}
          javaCode={`static boolean isFull(TreeNode n) {
  if (n == null) return true;
  if ((n.left == null) != (n.right == null)) return false;
  return isFull(n.left) && isFull(n.right);
}`}
        />
      }
    />
  );
}

/* =========================================================
   2. BINARY SEARCH TREE + ANIMATED INSERT / DELETE / TRAVERSALS
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
  warn?: string[];
  output: number[];
  msg: string;
}

function buildBSTTraversalSteps(
  root: BSTRec | null,
  mode: "inorder" | "preorder" | "postorder"
): TreeStep[] {
  const out: TreeStep[] = [
    {
      root: cloneBST(root),
      active: [],
      visited: [],
      output: [],
      msg: `Ready for ${mode} traversal.`,
    },
  ];
  const visited: string[] = [];
  const output: number[] = [];

  function walk(node: BSTRec | null) {
    if (!node) return;
    const id = `bst-${node.val}`;
    if (mode === "preorder") {
      visited.push(id);
      output.push(node.val);
      out.push({
        root: cloneBST(root),
        active: [id],
        visited: [...visited],
        output: [...output],
        msg: `Visit Node ${node.val} (N -> L -> R)`,
      });
    }
    walk(node.left);
    if (mode === "inorder") {
      visited.push(id);
      output.push(node.val);
      out.push({
        root: cloneBST(root),
        active: [id],
        visited: [...visited],
        output: [...output],
        msg: `Visit Node ${node.val} (L -> N -> R)`,
      });
    }
    walk(node.right);
    if (mode === "postorder") {
      visited.push(id);
      output.push(node.val);
      out.push({
        root: cloneBST(root),
        active: [id],
        visited: [...visited],
        output: [...output],
        msg: `Visit Node ${node.val} (L -> R -> N)`,
      });
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
  return out;
}

function BinaryTreeVisualizer() {
  const [bulkText, setBulkText] = useState("50, 30, 70, 20, 40, 60, 80");
  const [singleVal, setSingleVal] = useState("45");
  const [traversalMode, setTraversalMode] = useState<"inorder" | "preorder" | "postorder">(
    "inorder"
  );
  const [bstRoot, setBstRoot] = useState<BSTRec | null>(() => {
    let r: BSTRec | null = null;
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => {
      r = insertBST(r, v);
    });
    return r;
  });

  const [customTrace, setCustomTrace] = useState<{
    badge: string;
    key: number;
    steps: TreeStep[];
  } | null>(null);

  const traversalSteps = useMemo(
    () => buildBSTTraversalSteps(bstRoot, traversalMode),
    [bstRoot, traversalMode]
  );

  const activeSteps = customTrace ? customTrace.steps : traversalSteps;
  const activeBadge = customTrace ? customTrace.badge : traversalMode.toUpperCase();
  const traceKey = customTrace
    ? `custom-${customTrace.key}`
    : `trav-${traversalMode}-${JSON.stringify(bstRoot)}`;

  const pb = usePlayback({
    totalSteps: Math.max(0, activeSteps.length - 1),
    resetKey: traceKey,
    baseDelayMs: 1100,
    stepDelayMs: 90,
  });

  const handleBulkBuild = () => {
    const parsed = parseNumberList(bulkText, { unique: true, maxCount: 15 });
    let r: BSTRec | null = null;
    parsed.values.forEach((v) => {
      r = insertBST(r, v);
    });
    setBulkText(parsed.values.join(", "));
    setCustomTrace(null);
    setBstRoot(r);
  };

  const traceSingleOp = (op: "insert" | "delete" | "search") => {
    const val = Number(singleVal);
    if (!Number.isFinite(val) || singleVal.trim() === "") return;

    const beforeSnapshot = cloneBST(bstRoot);
    const trace: TreeStep[] = [];
    let cur = beforeSnapshot;
    const path: string[] = [];
    let foundNode: BSTRec | null = null;

    if (!cur) {
      if (op === "insert") {
        const nextRoot = insertBST(null, val);
        setBstRoot(nextRoot);
        trace.push({
          root: cloneBST(nextRoot),
          active: [`bst-${val}`],
          visited: [`bst-${val}`],
          output: [],
          msg: `Tree was empty — inserted ${val} as root.`,
        });
        setCustomTrace({ badge: "INSERT", key: Date.now(), steps: trace });
        pb.jumpTo(0, false);
        return;
      }
      trace.push({
        root: null,
        active: [],
        visited: [],
        output: [],
        msg: `BST is empty — ${val} not found.`,
      });
      setCustomTrace({ badge: op.toUpperCase(), key: Date.now(), steps: trace });
      pb.jumpTo(0, false);
      return;
    }

    while (cur) {
      const id = `bst-${cur.val}`;
      path.push(id);
      if (val === cur.val) {
        foundNode = cur;
        trace.push({
          root: cloneBST(beforeSnapshot),
          active: [id],
          visited: [...path],
          output: [],
          msg: `Found ${val} at node ${cur.val}.`,
        });
        break;
      }
      trace.push({
        root: cloneBST(beforeSnapshot),
        active: [id],
        visited: [...path],
        output: [],
        msg: `${val} ${val < cur.val ? "<" : ">"} ${cur.val} -> move ${
          val < cur.val ? "LEFT" : "RIGHT"
        }.`,
      });
      cur = val < cur.val ? cur.left : cur.right;
    }

    if (op === "insert") {
      if (foundNode) {
        trace.push({
          root: cloneBST(beforeSnapshot),
          active: [],
          visited: path,
          warn: [`bst-${val}`],
          output: [],
          msg: `Duplicate key ${val} already exists in BST — skipped.`,
        });
      } else {
        const nextRoot = insertBST(cloneBST(beforeSnapshot), val);
        setBstRoot(nextRoot);
        trace.push({
          root: cloneBST(nextRoot),
          active: [],
          visited: [...path, `bst-${val}`],
          output: [],
          msg: `Inserted ${val} as new leaf node.`,
        });
      }
      setCustomTrace({ badge: "INSERT", key: Date.now(), steps: trace });
      pb.jumpTo(0, true);
    } else if (op === "delete") {
      if (!foundNode) {
        trace.push({
          root: cloneBST(beforeSnapshot),
          active: [],
          visited: path,
          output: [],
          msg: `Reached NULL — ${val} is not in the BST (nothing deleted).`,
        });
      } else {
        const hasTwo = Boolean(foundNode.left && foundNode.right);
        let succVal: number | null = null;
        if (hasTwo) {
          let succ = foundNode.right!;
          while (succ.left) succ = succ.left;
          succVal = succ.val;
          trace.push({
            root: cloneBST(beforeSnapshot),
            active: [`bst-${succVal}`],
            visited: path,
            warn: [`bst-${val}`],
            output: [],
            msg: `Node ${val} has 2 children — replace with in-order successor ${succVal}.`,
          });
        }
        const nextRoot = deleteBST(cloneBST(beforeSnapshot), val);
        setBstRoot(nextRoot);
        trace.push({
          root: cloneBST(nextRoot),
          active: succVal !== null ? [`bst-${succVal}`] : [],
          visited: [],
          output: [],
          msg: hasTwo
            ? `Deleted ${val} and promoted successor ${succVal}.`
            : `Deleted node ${val} from BST.`,
        });
      }
      setCustomTrace({ badge: "DELETE", key: Date.now(), steps: trace });
      pb.jumpTo(0, true);
    } else {
      if (!foundNode) {
        trace.push({
          root: cloneBST(beforeSnapshot),
          active: [],
          visited: path,
          output: [],
          msg: `Reached NULL — ${val} is not in the BST.`,
        });
      }
      setCustomTrace({ badge: "SEARCH", key: Date.now(), steps: trace });
      pb.jumpTo(0, true);
    }
  };

  const cur = activeSteps[pb.stepIdx] ?? activeSteps[0] ?? {
    root: bstRoot,
    active: [],
    visited: [],
    output: [],
    msg: "Ready",
  };

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="bst-trav-tabs"
        value={traversalMode}
        onChange={(m) => {
          setTraversalMode(m);
          setCustomTrace(null);
        }}
        options={[
          { id: "inorder", label: "In-order (L-N-R)" },
          { id: "preorder", label: "Pre-order (N-L-R)" },
          { id: "postorder", label: "Post-order (L-R-N)" },
        ]}
      />

      <VisualizerWorkspace
        step={pb.stepIdx}
        totalSteps={Math.max(0, activeSteps.length - 1)}
        statusText={cur.msg}
        badge={activeBadge}
        isPlaying={pb.playing}
        stage={
          <div className="space-y-3">
            <TreeSvgCanvas
              root={bstToVisual(cur.root)}
              activeIds={cur.active}
              visitedIds={cur.visited}
              warnIds={cur.warn}
            />
            {cur.output.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2">
                <span className="mr-1 text-xs font-medium text-[#a1a1a6]">Output:</span>
                {cur.output.map((v, i) => (
                  <span
                    key={`${v}-${i}`}
                    className="rounded bg-[#4cc38a]/15 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-[#4cc38a]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
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
            legend={[
              { label: "Unvisited", colorClass: "bg-[#48484f]" },
              { label: "Current / Compare", colorClass: "bg-amber-500" },
              { label: "Visited / Inserted", colorClass: "bg-[#4cc38a]" },
              { label: "Target / Duplicate", colorClass: "bg-[#e5484d]" },
            ]}
          />
        }
        inspector={
          <>
            <InspectorBlock
              highlight
              title="Build Your Own BST"
              description="Enter comma-separated values to insert sequentially (max 15)."
            >
              <div className="flex gap-2">
                <StudioInput
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBulkBuild()}
                  placeholder="50, 30, 70..."
                />
                <StudioBtn variant="primary" onClick={handleBulkBuild}>
                  Build
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Trace Insert / Delete / Search">
              <div className="flex gap-2">
                <StudioInput
                  type="number"
                  value={singleVal}
                  onChange={(e) => setSingleVal(e.target.value)}
                />
                <StudioBtn variant="primary" onClick={() => traceSingleOp("insert")}>
                  Insert
                </StudioBtn>
              </div>
              <div className="mt-2 flex gap-2">
                <StudioBtn
                  variant="danger"
                  className="flex-1"
                  onClick={() => traceSingleOp("delete")}
                >
                  Delete
                </StudioBtn>
                <StudioBtn
                  variant="secondary"
                  className="flex-1"
                  onClick={() => traceSingleOp("search")}
                >
                  Search
                </StudioBtn>
                <StudioBtn
                  variant="secondary"
                  onClick={() => {
                    setCustomTrace(null);
                    setBstRoot(null);
                  }}
                >
                  Clear
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "bal", label: "Balanced (7)" },
                  { id: "skew", label: "Skewed (Worst Case)" },
                  { id: "deep", label: "11-Node BST" },
                ]}
                onSelect={(id) => {
                  const map: Record<string, string> = {
                    bal: "50, 30, 70, 20, 40, 60, 80",
                    skew: "10, 20, 30, 40, 50, 60",
                    deep: "25, 15, 50, 10, 22, 35, 70, 4, 12, 18, 24",
                  };
                  setBulkText(map[id]);
                  const nums = parseNumberList(map[id]).values;
                  let r: BSTRec | null = null;
                  nums.forEach((v) => {
                    r = insertBST(r, v);
                  });
                  setCustomTrace(null);
                  setBstRoot(r);
                }}
              />
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="In a BST, everything left of a node is smaller and everything right is larger, so an in-order traversal always yields sorted ascending output."
            keyPoints={[
              "In-order (L-N-R): Gives sorted order in BST.",
              "Pre-order (N-L-R): Root first — great for serializing or copying a tree.",
              "Post-order (L-R-N): Children before parent — great for safe deletion or expression evaluation.",
              "Deleting a 2-child node copies its in-order successor (minimum of right subtree).",
            ]}
            complexities={[
              { op: "Search / Insert / Delete", best: "O(log n)", avg: "O(log n)", worst: "O(n) skewed" },
              { op: "Tree Traversals", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(h)" },
            ]}
            javaCode={`TreeNode insert(TreeNode root, int val) {
  if (root == null) return new TreeNode(val);
  if (val < root.val) root.left = insert(root.left, val);
  else if (val > root.val) root.right = insert(root.right, val);
  return root;
}`}
          />
        }
      />
    </div>
  );
}

/* =========================================================
   3. AVL TREE (SHOWS PRE-ROTATION IMBALANCE + INTERMEDIATE DOUBLE ROTATIONS!)
   ========================================================= */
interface AVLNode {
  val: number;
  height: number;
  left: AVLNode | null;
  right: AVLNode | null;
}

function avlH(n: AVLNode | null): number {
  return n ? n.height : 0;
}
function avlBF(n: AVLNode | null): number {
  return n ? avlH(n.left) - avlH(n.right) : 0;
}
function avlUpd(n: AVLNode) {
  n.height = 1 + Math.max(avlH(n.left), avlH(n.right));
}
function cloneAVL(n: AVLNode | null): AVLNode | null {
  return n
    ? { val: n.val, height: n.height, left: cloneAVL(n.left), right: cloneAVL(n.right) }
    : null;
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

function containsAVL(n: AVLNode | null, val: number): boolean {
  if (!n) return false;
  if (n.val === val) return true;
  return val < n.val ? containsAVL(n.left, val) : containsAVL(n.right, val);
}

function insertRawNoBalance(n: AVLNode | null, val: number): AVLNode {
  if (!n) return { val, height: 1, left: null, right: null };
  if (val < n.val) n.left = insertRawNoBalance(n.left, val);
  else if (val > n.val) n.right = insertRawNoBalance(n.right, val);
  avlUpd(n);
  return n;
}

function deleteRawNoBalance(n: AVLNode | null, val: number): AVLNode | null {
  if (!n) return null;
  if (val < n.val) n.left = deleteRawNoBalance(n.left, val);
  else if (val > n.val) n.right = deleteRawNoBalance(n.right, val);
  else {
    if (!n.left || !n.right) return n.left || n.right;
    let min = n.right;
    while (min.left) min = min.left;
    n.val = min.val;
    n.right = deleteRawNoBalance(n.right, min.val);
  }
  avlUpd(n);
  return n;
}

/** Find deepest unbalanced node (|BF| > 1) */
function findDeepestUnbalanced(n: AVLNode | null): AVLNode | null {
  if (!n) return null;
  const leftU = findDeepestUnbalanced(n.left);
  if (leftU) return leftU;
  const rightU = findDeepestUnbalanced(n.right);
  if (rightU) return rightU;
  return Math.abs(avlBF(n)) > 1 ? n : null;
}

/** Replace node with val === targetVal using transformer and recompute ancestor heights */
function transformNode(
  n: AVLNode | null,
  targetVal: number,
  fn: (target: AVLNode) => AVLNode
): AVLNode | null {
  if (!n) return null;
  if (n.val === targetVal) return fn(n);
  if (targetVal < n.val) n.left = transformNode(n.left, targetVal, fn);
  else n.right = transformNode(n.right, targetVal, fn);
  avlUpd(n);
  return n;
}

interface AVLStep {
  root: AVLNode | null;
  active: string[];
  visited: string[];
  warn: string[];
  msg: string;
}

function rebalanceWithSteps(rawRoot: AVLNode | null, actionLabel: string): {
  finalRoot: AVLNode | null;
  steps: AVLStep[];
} {
  let cur = cloneAVL(rawRoot);
  const steps: AVLStep[] = [];
  let guard = 0;

  while (guard++ < 10) {
    const unbalanced = findDeepestUnbalanced(cur);
    if (!unbalanced) break;

    const uVal = unbalanced.val;
    const bf = avlBF(unbalanced);

    // 1. Show imbalanced state BEFORE rotating
    steps.push({
      root: cloneAVL(cur),
      active: [],
      visited: [],
      warn: [`avl-${uVal}`],
      msg: `${actionLabel} caused imbalance at node ${uVal} (BF = ${bf > 0 ? `+${bf}` : bf}).`,
    });

    if (bf > 1 && avlBF(unbalanced.left) >= 0) {
      // LL -> single Right Rotation
      cur = transformNode(cur, uVal, (t) => rotRight(t));
      steps.push({
        root: cloneAVL(cur),
        active: [],
        visited: [`avl-${uVal}`],
        warn: [],
        msg: `LL case at ${uVal} -> Right Rotate to restore balance.`,
      });
    } else if (bf < -1 && avlBF(unbalanced.right) <= 0) {
      // RR -> single Left Rotation
      cur = transformNode(cur, uVal, (t) => rotLeft(t));
      steps.push({
        root: cloneAVL(cur),
        active: [],
        visited: [`avl-${uVal}`],
        warn: [],
        msg: `RR case at ${uVal} -> Left Rotate to restore balance.`,
      });
    } else if (bf > 1 && avlBF(unbalanced.left) < 0) {
      // LR -> Left Rotate left child, THEN Right Rotate node
      const childVal = unbalanced.left!.val;
      cur = transformNode(cur, uVal, (t) => {
        t.left = rotLeft(t.left!);
        avlUpd(t);
        return t;
      });
      steps.push({
        root: cloneAVL(cur),
        active: [`avl-${childVal}`],
        visited: [],
        warn: [`avl-${uVal}`],
        msg: `LR step 1/2: Left Rotate child ${childVal} (converting LR -> LL).`,
      });
      cur = transformNode(cur, uVal, (t) => rotRight(t));
      steps.push({
        root: cloneAVL(cur),
        active: [],
        visited: [`avl-${uVal}`],
        warn: [],
        msg: `LR step 2/2: Right Rotate ${uVal} to restore balance.`,
      });
    } else if (bf < -1 && avlBF(unbalanced.right) > 0) {
      // RL -> Right Rotate right child, THEN Left Rotate node
      const childVal = unbalanced.right!.val;
      cur = transformNode(cur, uVal, (t) => {
        t.right = rotRight(t.right!);
        avlUpd(t);
        return t;
      });
      steps.push({
        root: cloneAVL(cur),
        active: [`avl-${childVal}`],
        visited: [],
        warn: [`avl-${uVal}`],
        msg: `RL step 1/2: Right Rotate child ${childVal} (converting RL -> RR).`,
      });
      cur = transformNode(cur, uVal, (t) => rotLeft(t));
      steps.push({
        root: cloneAVL(cur),
        active: [],
        visited: [`avl-${uVal}`],
        warn: [],
        msg: `RL step 2/2: Left Rotate ${uVal} to restore balance.`,
      });
    }
  }

  return { finalRoot: cur, steps };
}

function buildAVLSequence(vals: number[]): AVLStep[] {
  let root: AVLNode | null = null;
  const out: AVLStep[] = [
    {
      root: null,
      active: [],
      visited: [],
      warn: [],
      msg: `Ready to build AVL tree for [${vals.join(", ")}].`,
    },
  ];
  for (const v of vals) {
    if (containsAVL(root, v)) continue;
    const raw = insertRawNoBalance(cloneAVL(root), v);
    const { finalRoot, steps: rotSteps } = rebalanceWithSteps(raw, `Inserting ${v}`);
    if (rotSteps.length === 0) {
      out.push({
        root: cloneAVL(raw),
        active: [`avl-${v}`],
        visited: [],
        warn: [],
        msg: `Inserted ${v} — all balance factors remain within [-1, +1].`,
      });
    } else {
      out.push(...rotSteps);
    }
    root = finalRoot;
  }
  return out;
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
  const [steps, setSteps] = useState<AVLStep[]>(() =>
    buildAVLSequence([3, 2, 1, 4, 5, 6, 7, 8, 9])
  );
  const [seqVersion, setSeqVersion] = useState(0);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: seqVersion,
    initialSpeed: 4,
    baseDelayMs: 1250,
    stepDelayMs: 95,
  });

  const buildFromInput = (raw = bulkInput) => {
    const parsed = parseNumberList(raw, { unique: true, maxCount: 15 });
    if (!parsed.values.length) return;
    setBulkInput(parsed.values.join(", "));
    setSteps(buildAVLSequence(parsed.values));
    setSeqVersion((v) => v + 1);
    pb.jumpTo(0, true);
  };

  const singleOp = (op: "insert" | "delete") => {
    const v = Number(singleVal);
    if (!Number.isFinite(v) || singleVal.trim() === "") return;
    const base = cloneAVL(steps[pb.stepIdx]?.root ?? null);
    const prefix = steps.slice(0, pb.stepIdx + 1);

    if (op === "insert") {
      if (containsAVL(base, v)) {
        const nextList: AVLStep[] = [
          ...prefix,
          {
            root: base,
            active: [],
            visited: [],
            warn: [`avl-${v}`],
            msg: `Key ${v} already exists in AVL tree — duplicate ignored.`,
          },
        ];
        setSteps(nextList);
        pb.jumpTo(nextList.length - 1, false);
        return;
      }
      const raw = insertRawNoBalance(base, v);
      const { steps: rotSteps } = rebalanceWithSteps(raw, `Inserting ${v}`);
      const appended: AVLStep[] =
        rotSteps.length > 0
          ? rotSteps
          : [
              {
                root: cloneAVL(raw),
                active: [`avl-${v}`],
                visited: [],
                warn: [],
                msg: `Inserted ${v} (tree remains balanced).`,
              },
            ];
      const nextList = [...prefix, ...appended];
      setSteps(nextList);
      pb.jumpTo(prefix.length, appended.length > 1);
    } else {
      if (!containsAVL(base, v)) {
        const nextList: AVLStep[] = [
          ...prefix,
          {
            root: base,
            active: [],
            visited: [],
            warn: [],
            msg: `Key ${v} is not in the AVL tree — nothing deleted.`,
          },
        ];
        setSteps(nextList);
        pb.jumpTo(nextList.length - 1, false);
        return;
      }
      const raw = deleteRawNoBalance(base, v);
      const { steps: rotSteps } = rebalanceWithSteps(raw, `Deleting ${v}`);
      const appended: AVLStep[] =
        rotSteps.length > 0
          ? rotSteps
          : [
              {
                root: cloneAVL(raw),
                active: [],
                visited: [],
                warn: [],
                msg: `Deleted ${v} (tree remains balanced).`,
              },
            ];
      const nextList = [...prefix, ...appended];
      setSteps(nextList);
      pb.jumpTo(prefix.length, appended.length > 1);
    }
  };

  const cur = steps[pb.stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={pb.stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge="AVL Self-Balancing"
      isPlaying={pb.playing}
      stage={
        <TreeSvgCanvas
          root={avlToVisual(cur.root)}
          activeIds={cur.active}
          visitedIds={cur.visited}
          warnIds={cur.warn}
          showBF
        />
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
          legend={[
            { label: "Newly inserted / pivot", colorClass: "bg-amber-500" },
            { label: "Imbalanced (|BF| > 1)", colorClass: "bg-[#e5484d]" },
            { label: "Rebalanced", colorClass: "bg-[#4cc38a]" },
          ]}
        />
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Custom Sequence (Auto-Rotations)"
            description="Watch imbalances (|BF| = 2) appear first, then LL, RR, LR, RL rotations restore balance."
          >
            <StudioInput
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buildFromInput(bulkInput)}
            />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => buildFromInput(bulkInput)}
            >
              Build &amp; Animate AVL
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Insert / Delete Single Key">
            <div className="flex gap-2">
              <StudioInput
                type="number"
                value={singleVal}
                onChange={(e) => setSingleVal(e.target.value)}
              />
              <StudioBtn variant="primary" onClick={() => singleOp("insert")}>
                Insert
              </StudioBtn>
              <StudioBtn variant="danger" onClick={() => singleOp("delete")}>
                Delete
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Rotation Presets">
            <PresetRow
              presets={[
                { id: "seq", label: "3,2,1,4,5,6,7,8,9" },
                { id: "lr", label: "LR Case (30,10,20)" },
                { id: "rl", label: "RL Case (10,30,20)" },
                { id: "ll", label: "LL Case (30,20,10)" },
              ]}
              onSelect={(id) => {
                const map: Record<string, string> = {
                  seq: "3, 2, 1, 4, 5, 6, 7, 8, 9",
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
          javaCode={`AVLNode rotateRight(AVLNode y) {
  AVLNode x = y.left, t2 = x.right;
  x.right = y; y.left = t2;
  updateHeight(y); updateHeight(x);
  return x;
}`}
        />
      }
    />
  );
}

/* =========================================================
   4. EXPRESSION TREE (WITH EVALUATION!) & RECONSTRUCTION
   ========================================================= */
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
        const checked = infixToPostfixChecked(exprText);
        if (checked.error) return { tree: null, errorMsg: checked.error };
        const r = buildExprTreeFromPostfix(checked.tokens);
        return {
          tree: r,
          errorMsg: r ? "" : "Invalid infix expression. Check operator/operand placement.",
        };
      }
      const toks = exprText.trim().split(/\s+/).filter(Boolean);
      const r =
        exprFormat === "postfix"
          ? buildExprTreeFromPostfix(toks)
          : buildExprTreeFromPrefix(toks);
      return {
        tree: r,
        errorMsg: r
          ? ""
          : `Invalid ${exprFormat} expression. Separate tokens by spaces (e.g. A B + C *).`,
      };
    }
    const inToks = inOrderStr.trim().split(/[\s,]+/).filter(Boolean);
    const othToks = otherStr.trim().split(/[\s,]+/).filter(Boolean);
    const res = reconstructBinaryTree(inToks, othToks, otherType);
    return { tree: res.root, errorMsg: res.error ?? "" };
  }, [mode, exprFormat, exprText, inOrderStr, otherStr, otherType]);

  const readings = useMemo(() => getReadings(tree), [tree]);
  const evaluation = useMemo(
    () => (mode === "expr" ? evaluateExprTree(tree) : { value: null, steps: [] }),
    [mode, tree]
  );

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="expr-mode-tabs"
        value={mode}
        onChange={setMode}
        options={[
          { id: "expr", label: "Build & Evaluate Expression Tree" },
          { id: "reconstruct", label: "Create from In-order + Pre/Post-order" },
        ]}
      />

      <VisualizerWorkspace
        badge={
          evaluation.value !== null
            ? `Result = ${evaluation.value}`
            : mode === "expr"
            ? exprFormat.toUpperCase()
            : `In + ${otherType.toUpperCase()}`
        }
        statusText={
          errorMsg
            ? errorMsg
            : evaluation.error
            ? `Evaluation error: ${evaluation.error}`
            : mode === "expr"
            ? evaluation.value !== null
              ? `Evaluated expression tree bottom-up -> result = ${evaluation.value}.`
              : "Operators sit at internal nodes; operands sit at leaves. Use numbers to evaluate."
            : "Picked root from Pre/Post-order and split In-order into Left & Right subtrees."
        }
        statusTone={errorMsg || evaluation.error ? "error" : "default"}
        stage={
          <div className="space-y-4">
            <TreeSvgCanvas root={tree} />

            {evaluation.value !== null && evaluation.steps.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#4cc38a]/35 bg-[#4cc38a]/10 px-3 py-2 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[#a1a1a6]">
                  <span className="font-medium text-[#4cc38a]">Post-order eval:</span>
                  {evaluation.steps.map((st, idx) => (
                    <span
                      key={idx}
                      className="rounded border border-[#ededed]/[0.08] bg-[#141415] px-2 py-0.5 text-[#ededed]"
                    >
                      {st}
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-[#4cc38a]">= {evaluation.value}</span>
              </div>
            )}

            {tree && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[#60a5fa]/35 bg-[#60a5fa]/10 px-3 py-2">
                  <div className="text-xs font-medium text-[#60a5fa]">In-order (Infix)</div>
                  <div className="mt-1 font-mono text-xs text-[#ededed]">{readings.infix}</div>
                </div>
                <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2">
                  <div className="text-xs font-medium text-amber-400">Pre-order (Prefix)</div>
                  <div className="mt-1 font-mono text-xs text-[#ededed]">{readings.prefix}</div>
                </div>
                <div className="rounded-lg border border-[#4cc38a]/35 bg-[#4cc38a]/10 px-3 py-2">
                  <div className="text-xs font-medium text-[#4cc38a]">Post-order (Postfix)</div>
                  <div className="mt-1 font-mono text-xs text-[#ededed]">{readings.postfix}</div>
                </div>
              </div>
            )}
          </div>
        }
        inspector={
          mode === "expr" ? (
            <>
              <InspectorBlock
                highlight
                title="Input Expression"
                description="Supports +, -, *, /, ^ (right-associative). Enter numbers to evaluate automatically."
              >
                <div className="mb-2">
                  <StudioSelect
                    value={exprFormat}
                    onChange={(e) => {
                      const f = e.target.value as "infix" | "postfix" | "prefix";
                      setExprFormat(f);
                      setExprText(
                        f === "infix"
                          ? "(A + B) * (C - D)"
                          : f === "postfix"
                          ? "A B + C D - *"
                          : "* + A B - C D"
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
                    { id: "e2", label: "2^3^2 (Right-Assoc)" },
                    { id: "e3", label: "(5+3)*2 (=16)" },
                  ]}
                  onSelect={(id) => {
                    setExprFormat("infix");
                    setExprText(
                      id === "e1"
                        ? "(A + B) * (C - D)"
                        : id === "e2"
                        ? "2 ^ 3 ^ 2"
                        : "(5 + 3) * 2"
                    );
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
                    <label className="mb-1 block text-xs text-[#a1a1a6]">In-order traversal</label>
                    <StudioInput
                      value={inOrderStr}
                      onChange={(e) => setInOrderStr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#a1a1a6]">Pair with</label>
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
                    <label className="mb-1 block text-xs text-[#a1a1a6]">
                      {otherType === "pre" ? "Pre-order" : "Post-order"} traversal
                    </label>
                    <StudioInput value={otherStr} onChange={(e) => setOtherStr(e.target.value)} />
                  </div>
                </div>
              </InspectorBlock>

              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "letters", label: "Letters (A..F)" },
                    { id: "expr1", label: "Expr (* + A B C)" },
                    { id: "expr2", label: "Expr (+ A * B C)" },
                  ]}
                  onSelect={(id) => {
                    if (id === "letters") {
                      setInOrderStr("D B E A F C");
                      setOtherType("pre");
                      setOtherStr("A B D E C F");
                    } else if (id === "expr1") {
                      setInOrderStr("A + B * C");
                      setOtherType("pre");
                      setOtherStr("* + A B C");
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
              "Exponentiation (^) is right-associative: 2 ^ 3 ^ 2 evaluates as 2 ^ (3 ^ 2) = 512.",
              "In-order + Pre-order: First item of Pre-order is always Root; split In-order around Root.",
            ]}
            javaCode={`static double eval(ExprNode n) {
  if (n.left == null && n.right == null) return Double.parseDouble(n.val);
  double l = eval(n.left), r = eval(n.right);
  return switch (n.val) {
    case "+" -> l + r; case "-" -> l - r;
    case "*" -> l * r; case "/" -> l / r;
    default -> Math.pow(l, r);
  };
}`}
          />
        }
      />
    </div>
  );
}

export function TreeSectionRouter({ topicId }: { topicId: TopicId }) {
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
