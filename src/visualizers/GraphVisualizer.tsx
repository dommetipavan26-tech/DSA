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
  StudioTextarea,
} from "../components/ui/input-helpers";
import type { TopicId } from "../data/syllabus";

export interface GVertex {
  id: string;
  x: number;
  y: number;
}
export interface GEdge {
  a: string;
  b: string;
  w: number;
}

const DEFAULT_GRAPH: { vertices: GVertex[]; edges: GEdge[] } = {
  vertices: [
    { id: "A", x: 110, y: 150 },
    { id: "B", x: 250, y: 58 },
    { id: "C", x: 410, y: 145 },
    { id: "D", x: 190, y: 245 },
    { id: "E", x: 370, y: 248 },
    { id: "F", x: 525, y: 78 },
  ],
  edges: [
    { a: "A", b: "B", w: 4 },
    { a: "A", b: "D", w: 2 },
    { a: "B", b: "C", w: 5 },
    { a: "B", b: "D", w: 3 },
    { a: "C", b: "E", w: 1 },
    { a: "C", b: "F", w: 7 },
    { a: "D", b: "E", w: 6 },
    { a: "E", b: "F", w: 3 },
  ],
};

// Syllabus Module 6 Lab Graph (A..H weighted graph)
const SYLLABUS_GRAPH: { vertices: GVertex[]; edges: GEdge[] } = {
  vertices: [
    { id: "A", x: 120, y: 80 },
    { id: "B", x: 260, y: 55 },
    { id: "C", x: 415, y: 65 },
    { id: "D", x: 110, y: 225 },
    { id: "E", x: 265, y: 245 },
    { id: "F", x: 525, y: 140 },
    { id: "G", x: 405, y: 240 },
    { id: "H", x: 295, y: 150 },
  ],
  edges: [
    { a: "A", b: "B", w: 7 },
    { a: "A", b: "D", w: 4 },
    { a: "A", b: "H", w: 8 },
    { a: "B", b: "C", w: 10 },
    { a: "B", b: "H", w: 3 },
    { a: "C", b: "F", w: 2 },
    { a: "C", b: "H", w: 4 },
    { a: "D", b: "E", w: 9 },
    { a: "D", b: "H", w: 18 },
    { a: "E", b: "G", w: 7 },
    { a: "E", b: "H", w: 25 },
    { a: "F", b: "G", w: 3 },
    { a: "G", b: "H", w: 10 },
  ],
};

function edgesToText(edges: GEdge[]) {
  return edges.map((e) => `${e.a}-${e.b}:${e.w}`).join(", ");
}

function parseEdgeListText(text: string): { vertices: GVertex[]; edges: GEdge[] } | null {
  const parts = text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const vertSet = new Set<string>();
  const edges: GEdge[] = [];
  for (const p of parts) {
    const m = p.match(/^([A-Za-z0-9]+)\s*[-–>]\s*([A-Za-z0-9]+)(?:\s*[:=]\s*(-?\d+))?$/);
    if (!m) continue;
    const a = m[1].toUpperCase();
    const b = m[2].toUpperCase();
    const w = m[3] ? Number(m[3]) : 1;
    vertSet.add(a);
    vertSet.add(b);
    edges.push({ a, b, w });
  }
  if (!vertSet.size) return null;
  const ids = Array.from(vertSet).sort();
  const cx = 315;
  const cy = 152;
  const rx = 215;
  const ry = 108;
  const vertices: GVertex[] = ids.map((id, i) => {
    const ang = (2 * Math.PI * i) / ids.length - Math.PI / 2;
    return {
      id,
      x: Math.round(cx + rx * Math.cos(ang)),
      y: Math.round(cy + ry * Math.sin(ang)),
    };
  });
  return { vertices, edges };
}

function GraphSvgStage({
  vertices,
  edges,
  directed = false,
  nodeStates = {},
  edgeStates = {},
  distLabels = {},
  onSvgClick,
  onNodeClick,
  selectedId,
}: {
  vertices: GVertex[];
  edges: GEdge[];
  directed?: boolean;
  nodeStates?: Record<string, "default" | "current" | "queued" | "visited" | "start">;
  edgeStates?: Record<string, "default" | "active" | "mst" | "skip">;
  distLabels?: Record<string, string>;
  onSvgClick?: (x: number, y: number) => void;
  onNodeClick?: (v: GVertex) => void;
  selectedId?: string | null;
}) {
  const getEdgeKey = (a: string, b: string) => `${a}-${b}`;

  return (
    <svg
      viewBox="0 0 640 305"
      className="w-full max-h-[340px] select-none rounded-lg"
      onClick={(e) => {
        if (!onSvgClick) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 640;
        const y = ((e.clientY - rect.top) / rect.height) * 305;
        onSvgClick(Math.round(x), Math.round(y));
      }}
    >
      <defs>
        <marker id="g-arrow" markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#64748b" />
        </marker>
        <marker id="g-arrow-active" markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#10b981" />
        </marker>
      </defs>

      {edges.map((e, idx) => {
        const va = vertices.find((v) => v.id === e.a);
        const vb = vertices.find((v) => v.id === e.b);
        if (!va || !vb) return null;
        const st = edgeStates[getEdgeKey(e.a, e.b)] || (!directed && edgeStates[getEdgeKey(e.b, e.a)]) || "default";
        const stroke =
          st === "mst" ? "#10b981" : st === "active" ? "#f59e0b" : st === "skip" ? "#f43f5e" : "#334155";
        const width = st === "mst" || st === "active" ? 3 : 2;
        const mx = (va.x + vb.x) / 2;
        const my = (va.y + vb.y) / 2;

        return (
          <g key={`${e.a}-${e.b}-${idx}`}>
            <line
              x1={va.x}
              y1={va.y}
              x2={vb.x}
              y2={vb.y}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={st === "skip" ? "5 4" : undefined}
              markerEnd={directed ? (st === "mst" || st === "active" ? "url(#g-arrow-active)" : "url(#g-arrow)") : undefined}
            />
            <rect
              x={mx - 10}
              y={my - 9}
              width={20}
              height={16}
              rx={4}
              fill="#080a10"
              stroke={st === "mst" ? "#10b981" : "rgba(255,255,255,0.08)"}
            />
            <text
              x={mx}
              y={my}
              textAnchor="middle"
              dominantBaseline="central"
              fill={st === "mst" ? "#34d399" : st === "active" ? "#fbbf24" : "#94a3b8"}
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {e.w}
            </text>
          </g>
        );
      })}

      {vertices.map((v) => {
        const st = nodeStates[v.id] ?? "default";
        const fill =
          st === "current"
            ? "#7c3aed"
            : st === "visited"
            ? "#065f46"
            : st === "queued"
            ? "#92400e"
            : st === "start"
            ? "#1d4ed8"
            : "#161a29";
        const stroke =
          selectedId === v.id
            ? "#f59e0b"
            : st === "current"
            ? "#c4b5fd"
            : st === "visited"
            ? "#10b981"
            : st === "queued"
            ? "#f59e0b"
            : st === "start"
            ? "#60a5fa"
            : "#6366f1";

        return (
          <g
            key={v.id}
            className={onNodeClick ? "cursor-pointer" : undefined}
            onClick={(ev) => {
              if (!onNodeClick) return;
              ev.stopPropagation();
              onNodeClick(v);
            }}
          >
            <circle cx={v.x} cy={v.y} r={19} fill={fill} stroke={stroke} strokeWidth={selectedId === v.id ? 3 : 2.2} />
            <text
              x={v.x}
              y={v.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#f8fafc"
              fontSize="13"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {v.id}
            </text>
            {distLabels[v.id] && (
              <text
                x={v.x}
                y={v.y + 28}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                d={distLabels[v.id]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================
   1. GRAPH FUNDAMENTALS & REPRESENTATIONS (Matrix, List, Sparse)
   ========================================================= */
function GraphBasicsVisualizer({
  graph,
  setGraph,
  directed,
  setDirected,
}: {
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
  directed: boolean;
  setDirected: (v: boolean) => void;
}) {
  const [clickMode, setClickMode] = useState<"vertex" | "edge">("edge");
  const [selectedV, setSelectedV] = useState<string | null>(null);
  const [edgeWeight, setEdgeWeight] = useState("5");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));
  const [repTab, setRepTab] = useState<"matrix" | "list" | "sparse">("matrix");
  const [status, setStatus] = useState("Click two nodes to connect an edge, or type custom edges on the right.");

  const ids = graph.vertices.map((v) => v.id);

  const matrix = useMemo(() => {
    const n = ids.length;
    const mat = Array.from({ length: n }, () => Array(n).fill(0));
    graph.edges.forEach((e) => {
      const i = ids.indexOf(e.a);
      const j = ids.indexOf(e.b);
      if (i >= 0 && j >= 0) {
        mat[i][j] = e.w;
        if (!directed) mat[j][i] = e.w;
      }
    });
    return mat;
  }, [graph, ids, directed]);

  const adjList = useMemo(() => {
    const map: Record<string, { to: string; w: number }[]> = {};
    ids.forEach((id) => (map[id] = []));
    graph.edges.forEach((e) => {
      if (map[e.a]) map[e.a].push({ to: e.b, w: e.w });
      if (!directed && map[e.b]) map[e.b].push({ to: e.a, w: e.w });
    });
    return map;
  }, [graph, ids, directed]);

  const sparseRows = useMemo(() => {
    const rows: { r: string; c: string; w: number }[] = [];
    matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        if (val !== 0) rows.push({ r: ids[i], c: ids[j], w: val });
      });
    });
    return rows;
  }, [matrix, ids]);

  return (
    <VisualizerWorkspace
      badge={`${graph.vertices.length}V · ${graph.edges.length}E`}
      statusText={status}
      stage={
        <div className="space-y-4">
          <GraphSvgStage
            vertices={graph.vertices}
            edges={graph.edges}
            directed={directed}
            selectedId={selectedV}
            onSvgClick={(x, y) => {
              if (clickMode !== "vertex") return;
              const nextChar = String.fromCharCode(65 + graph.vertices.length);
              if (graph.vertices.some((v) => v.id === nextChar)) return;
              const next = { ...graph, vertices: [...graph.vertices, { id: nextChar, x, y }] };
              setGraph(next);
              setStatus(`Added vertex ${nextChar}. Switch to Edge Mode to connect it.`);
            }}
            onNodeClick={(v) => {
              if (clickMode !== "edge") return;
              if (!selectedV) {
                setSelectedV(v.id);
                setStatus(`Selected vertex ${v.id}. Click another vertex to add edge.`);
              } else if (selectedV !== v.id) {
                const w = Number(edgeWeight) || 1;
                const nextEdges = [...graph.edges, { a: selectedV, b: v.id, w }];
                setGraph({ ...graph, edges: nextEdges });
                setEdgeText(edgesToText(nextEdges));
                setStatus(`Connected ${selectedV} ${directed ? "->" : "--"} ${v.id} (weight ${w}).`);
                setSelectedV(null);
              } else {
                setSelectedV(null);
              }
            }}
          />

          {/* Representations: Matrix / Adj List / Sparse Matrix (CSE2001 Module 6!) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0e111b] p-3">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <MorphingPillTabs
                layoutId="rep-tabs"
                value={repTab}
                onChange={setRepTab}
                options={[
                  { id: "matrix", label: "Adjacency Matrix" },
                  { id: "list", label: "Adjacency List" },
                  { id: "sparse", label: "Sparse Matrix (Triplets)" },
                ]}
              />
            </div>

            {repTab === "matrix" && (
              <div className="overflow-x-auto">
                <table className="w-full text-center font-mono text-xs">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="p-1.5"></th>
                      {ids.map((id) => (
                        <th key={id} className="p-1.5">{id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={ids[i]} className="border-t border-white/[0.05]">
                        <th className="p-1.5 text-slate-400">{ids[i]}</th>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className={`p-1.5 ${val ? "font-bold text-violet-300" : "text-slate-600"}`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {repTab === "list" && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 font-mono text-xs">
                {ids.map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-lg bg-[#141827] px-3 py-1.5">
                    <span className="font-bold text-violet-300">{id}</span>
                    <span className="text-slate-500">-&gt;</span>
                    <span className="text-slate-300">
                      {adjList[id]?.length
                        ? adjList[id].map((n) => `${n.to}(${n.w})`).join(", ")
                        : "NULL"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {repTab === "sparse" && (
              <div className="max-h-44 overflow-y-auto font-mono text-xs">
                <div className="mb-1 text-[11px] text-slate-400">
                  Header: ({ids.length} rows, {ids.length} cols, {sparseRows.length} non-zero entries)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sparseRows.map((t, idx) => (
                    <span key={idx} className="rounded border border-white/[0.08] bg-[#141827] px-2 py-1 text-sky-300">
                      ({t.r}, {t.c}, {t.w})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Custom Edge List Input"
            description="Format: A-B:4, A-D:2 (Node1-Node2:Weight). Applies to BFS, DFS, MST & Dijkstra!"
          >
            <StudioTextarea rows={3} value={edgeText} onChange={(e) => setEdgeText(e.target.value)} />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const parsed = parseEdgeListText(edgeText);
                if (!parsed) return setStatus("Invalid edge format. Try: A-B:4, B-C:5");
                setGraph(parsed);
                setStatus(`Built custom graph (${parsed.vertices.length} vertices, ${parsed.edges.length} edges).`);
              }}
            >
              Build Graph from Text
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Canvas Interaction Mode">
            <div className="grid grid-cols-2 gap-1.5">
              <StudioBtn
                variant={clickMode === "vertex" ? "primary" : "secondary"}
                onClick={() => { setClickMode("vertex"); setSelectedV(null); }}
              >
                Add Vertex
              </StudioBtn>
              <StudioBtn
                variant={clickMode === "edge" ? "primary" : "secondary"}
                onClick={() => { setClickMode("edge"); setSelectedV(null); }}
              >
                Connect Edge
              </StudioBtn>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">New Edge Weight</label>
                <StudioInput type="number" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} />
              </div>
              <div className="flex items-end">
                <StudioBtn
                  variant={directed ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => setDirected(!directed)}
                >
                  {directed ? "Directed" : "Undirected"}
                </StudioBtn>
              </div>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "def", label: "Default (6V)" },
                { id: "lab", label: "Syllabus Lab (A..H)" },
                { id: "clear", label: "Clear" },
              ]}
              onSelect={(id) => {
                if (id === "clear") {
                  setGraph({ vertices: [], edges: [] });
                  setEdgeText("");
                  setStatus("Cleared graph.");
                } else if (id === "lab") {
                  const g = JSON.parse(JSON.stringify(SYLLABUS_GRAPH));
                  setGraph(g);
                  setEdgeText(edgesToText(g.edges));
                  setStatus("Loaded CSE2001 Syllabus weighted graph (A..H).");
                } else {
                  const g = JSON.parse(JSON.stringify(DEFAULT_GRAPH));
                  setGraph(g);
                  setEdgeText(edgesToText(g.edges));
                  setStatus("Loaded default graph.");
                }
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Graphs model networks (roads, friendships, internet routing). Sparse graphs use Adjacency Lists or Sparse Triplets; dense graphs benefit from Adjacency Matrices."
          keyPoints={[
            "Adjacency Matrix: O(V^2) space, O(1) edge check.",
            "Adjacency List: O(V + E) space, fast neighbor iteration.",
            "Sparse Matrix representation stores only non-zero (row, col, weight) entries.",
          ]}
        />
      }
    />
  );
}

/* =========================================================
   2. BFS & DFS (with Connectivity + Custom Graph/Start)
   ========================================================= */
interface TraversalStep {
  nodeStates: Record<string, "default" | "current" | "queued" | "visited" | "start">;
  frontier: string[];
  order: string[];
  msg: string;
}

function GraphTraversalVisualizer({
  mode,
  graph,
  setGraph,
}: {
  mode: "bfs" | "dfs";
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
}) {
  const [startV, setStartV] = useState(() => graph.vertices[0]?.id || "A");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));
  const [speed, setSpeed] = useState(5);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo<TraversalStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) return [{ nodeStates: {}, frontier: [], order: [], msg: "Graph is empty." }];
    const src = verts.includes(startV) ? startV : verts[0];
    const adj: Record<string, string[]> = {};
    verts.forEach((v) => (adj[v] = []));
    graph.edges.forEach((e) => {
      if (adj[e.a]) adj[e.a].push(e.b);
      if (adj[e.b]) adj[e.b].push(e.a);
    });
    verts.forEach((v) => (adj[v] = Array.from(new Set(adj[v])).sort()));

    const out: TraversalStep[] = [];
    const nodeStates: Record<string, "default" | "current" | "queued" | "visited" | "start"> = {};
    const visited = new Set<string>();
    const order: string[] = [];

    if (mode === "bfs") {
      const queue = [src];
      visited.add(src);
      nodeStates[src] = "queued";
      out.push({
        nodeStates: { ...nodeStates },
        frontier: [...queue],
        order: [],
        msg: `Start BFS at ${src}. Enqueue ${src}.`,
      });
      while (queue.length) {
        const u = queue.shift()!;
        nodeStates[u] = "current";
        order.push(u);
        out.push({
          nodeStates: { ...nodeStates },
          frontier: [...queue],
          order: [...order],
          msg: `Dequeue & visit ${u}. Check neighbors [${adj[u].join(", ")}].`,
        });
        for (const nb of adj[u]) {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push(nb);
            nodeStates[nb] = "queued";
            out.push({
              nodeStates: { ...nodeStates },
              frontier: [...queue],
              order: [...order],
              msg: `Discovered ${nb} from ${u} -> Enqueue ${nb}.`,
            });
          }
        }
        nodeStates[u] = "visited";
      }
      const connected = visited.size === verts.length;
      out.push({
        nodeStates: { ...nodeStates },
        frontier: [],
        order: [...order],
        msg: `BFS Complete! Order: [${order.join(" -> ")}] | Graph is ${connected ? "CONNECTED" : "DISCONNECTED"} (${visited.size}/${verts.length} reached).`,
      });
    } else {
      const stack: string[] = [];
      out.push({
        nodeStates: {},
        frontier: [],
        order: [],
        msg: `Start DFS from ${src}.`,
      });
      function dfs(u: string) {
        visited.add(u);
        stack.push(u);
        nodeStates[u] = "current";
        order.push(u);
        out.push({
          nodeStates: { ...nodeStates },
          frontier: [...stack],
          order: [...order],
          msg: `Push & Visit ${u} (Stack: [${stack.join(", ")}]).`,
        });
        for (const nb of adj[u]) {
          if (!visited.has(nb)) {
            nodeStates[u] = "queued";
            dfs(nb);
            nodeStates[u] = "current";
            out.push({
              nodeStates: { ...nodeStates },
              frontier: [...stack],
              order: [...order],
              msg: `Backtrack to ${u}.`,
            });
          }
        }
        stack.pop();
        nodeStates[u] = "visited";
      }
      dfs(src);
      out.push({
        nodeStates: { ...nodeStates },
        frontier: [],
        order: [...order],
        msg: `DFS Complete! Order: [${order.join(" -> ")}]`,
      });
    }
    return out;
  }, [graph, mode, startV]);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [graph, mode, startV]);

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
    }, 1150 - speed * 95);
    return () => clearInterval(t);
  }, [playing, speed, steps.length]);

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={mode.toUpperCase()}
      isPlaying={playing}
      stage={
        <div className="space-y-3">
          <GraphSvgStage vertices={graph.vertices} edges={graph.edges} nodeStates={cur.nodeStates} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.08] bg-[#10131e] px-3 py-2 font-mono text-xs">
              <span className="text-slate-400">{mode === "bfs" ? "Queue: " : "Call Stack: "}</span>
              <span className="font-bold text-amber-300">[{cur.frontier.join(", ") || "empty"}]</span>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-[#10131e] px-3 py-2 font-mono text-xs">
              <span className="text-slate-400">Traversal: </span>
              <span className="font-bold text-emerald-300">{cur.order.join(" -> ") || "—"}</span>
            </div>
          </div>
        </div>
      }
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
            { label: "Unvisited", colorClass: "bg-indigo-600" },
            { label: mode === "bfs" ? "In Queue" : "Active Branch", colorClass: "bg-amber-500" },
            { label: "Current", colorClass: "bg-violet-500" },
            { label: "Visited", colorClass: "bg-emerald-500" },
          ]}
        />
      }
      inspector={
        <>
          <InspectorBlock highlight title="Start Vertex">
            <StudioSelect value={startV} onChange={(e) => setStartV(e.target.value)}>
              {graph.vertices.map((v) => (
                <option key={v.id} value={v.id}>Start from {v.id}</option>
              ))}
            </StudioSelect>
          </InspectorBlock>

          <InspectorBlock title="Custom Edge List" description="Edit graph directly (e.g. A-B, B-C, A-D).">
            <StudioTextarea rows={3} value={edgeText} onChange={(e) => setEdgeText(e.target.value)} />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const parsed = parseEdgeListText(edgeText);
                if (parsed) {
                  setGraph(parsed);
                  setStartV(parsed.vertices[0].id);
                }
              }}
            >
              Apply Custom Graph
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "def", label: "Default" },
                { id: "lab", label: "Syllabus Lab (Start D)" },
              ]}
              onSelect={(id) => {
                const g = JSON.parse(JSON.stringify(id === "lab" ? SYLLABUS_GRAPH : DEFAULT_GRAPH));
                setGraph(g);
                setEdgeText(edgesToText(g.edges));
                setStartV(id === "lab" ? "D" : "A");
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition={
            mode === "bfs"
              ? "BFS explores layer by layer using a FIFO Queue — guaranteeing shortest path in unweighted graphs and checking graph connectivity."
              : "DFS dives deep along each path using recursion/Stack before backtracking — ideal for cycle detection and topological sorting."
          }
          keyPoints={[
            "Time Complexity: O(V + E) with Adjacency List.",
            "Space Complexity: O(V) for visited set + queue/recursion stack.",
          ]}
          complexities={[
            { op: `${mode.toUpperCase()} (Adj List)`, best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   3. MST (PRIM'S & KRUSKAL'S)
   ========================================================= */
interface MSTStep {
  nodeStates: Record<string, "default" | "current" | "visited">;
  edgeStates: Record<string, "default" | "active" | "mst" | "skip">;
  totalWeight: number;
  msg: string;
}

function MSTVisualizer({
  graph,
  setGraph,
}: {
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
}) {
  const [algo, setAlgo] = useState<"prim" | "kruskal">("prim");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const steps = useMemo<MSTStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) return [{ nodeStates: {}, edgeStates: {}, totalWeight: 0, msg: "Empty graph." }];
    const out: MSTStep[] = [
      { nodeStates: {}, edgeStates: {}, totalWeight: 0, msg: `Ready to build MST via ${algo === "prim" ? "Prim's" : "Kruskal's"} Algorithm.` },
    ];
    const edgeStates: Record<string, "default" | "active" | "mst" | "skip"> = {};
    const nodeStates: Record<string, "default" | "current" | "visited"> = {};
    let total = 0;

    if (algo === "prim") {
      const inMST = new Set<string>([verts[0]]);
      nodeStates[verts[0]] = "visited";
      out.push({ nodeStates: { ...nodeStates }, edgeStates: {}, totalWeight: 0, msg: `Prim's: Start tree at vertex ${verts[0]}.` });
      while (inMST.size < verts.length) {
        let best: GEdge | null = null;
        for (const e of graph.edges) {
          const aIn = inMST.has(e.a);
          const bIn = inMST.has(e.b);
          if (aIn !== bIn && (!best || e.w < best.w)) best = e;
        }
        if (!best) break;
        edgeStates[`${best.a}-${best.b}`] = "mst";
        inMST.add(best.a);
        inMST.add(best.b);
        nodeStates[best.a] = "visited";
        nodeStates[best.b] = "visited";
        total += best.w;
        out.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          totalWeight: total,
          msg: `Pick lightest frontier edge ${best.a}-${best.b} (w=${best.w}). Total = ${total}`,
        });
      }
    } else {
      const sorted = [...graph.edges].sort((a, b) => a.w - b.w);
      const parent: Record<string, string> = {};
      verts.forEach((v) => (parent[v] = v));
      const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      for (const e of sorted) {
        const ra = find(e.a);
        const rb = find(e.b);
        if (ra !== rb) {
          parent[ra] = rb;
          edgeStates[`${e.a}-${e.b}`] = "mst";
          nodeStates[e.a] = "visited";
          nodeStates[e.b] = "visited";
          total += e.w;
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            totalWeight: total,
            msg: `Accept ${e.a}-${e.b} (w=${e.w}) — connects two components. Total = ${total}`,
          });
        } else {
          edgeStates[`${e.a}-${e.b}`] = "skip";
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            totalWeight: total,
            msg: `Skip ${e.a}-${e.b} (w=${e.w}) — forms a cycle!`,
          });
        }
      }
    }
    out.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      totalWeight: total,
      msg: `MST Complete! Minimum Total Weight = ${total}`,
    });
    return out;
  }, [graph, algo]);

  useEffect(() => { setStepIdx(0); setPlaying(false); }, [graph, algo]);
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

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="mst-tabs"
        value={algo}
        onChange={setAlgo}
        options={[
          { id: "prim", label: "Prim's Algorithm" },
          { id: "kruskal", label: "Kruskal's Algorithm" },
        ]}
      />

      <VisualizerWorkspace
        step={stepIdx}
        totalSteps={Math.max(0, steps.length - 1)}
        statusText={cur.msg}
        badge={`MST Weight: ${cur.totalWeight}`}
        isPlaying={playing}
        stage={<GraphSvgStage vertices={graph.vertices} edges={graph.edges} nodeStates={cur.nodeStates} edgeStates={cur.edgeStates} />}
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
            legend={[
              { label: "In MST", colorClass: "bg-emerald-500" },
              { label: "Skipped (Cycle)", colorClass: "bg-rose-500" },
            ]}
          />
        }
        inspector={
          <>
            <InspectorBlock highlight title="Custom Weighted Edges" description="Format: A-B:4, B-C:5">
              <StudioTextarea rows={3} value={edgeText} onChange={(e) => setEdgeText(e.target.value)} />
              <StudioBtn
                variant="primary"
                className="mt-2 w-full"
                onClick={() => {
                  const p = parseEdgeListText(edgeText);
                  if (p) setGraph(p);
                }}
              >
                Update Graph
              </StudioBtn>
            </InspectorBlock>
            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "def", label: "Default (6V)" },
                  { id: "lab", label: "Syllabus Lab Graph" },
                ]}
                onSelect={(id) => {
                  const g = JSON.parse(JSON.stringify(id === "lab" ? SYLLABUS_GRAPH : DEFAULT_GRAPH));
                  setGraph(g);
                  setEdgeText(edgesToText(g.edges));
                }}
              />
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="A Minimum Spanning Tree connects all V vertices using exactly V - 1 edges with minimum total weight and no cycles."
            keyPoints={[
              "Prim's grows one connected tree outward from a start vertex by picking the cheapest crossing edge.",
              "Kruskal's sorts all edges globally and greedily merges components using Union-Find if no cycle is formed.",
            ]}
            complexities={[
              { op: "Prim's (Binary Heap)", best: "O(E log V)", avg: "O(E log V)", worst: "O(E log V)" },
              { op: "Kruskal's (Union-Find)", best: "O(E log E)", avg: "O(E log E)", worst: "O(E log E)" },
            ]}
          />
        }
      />
    </div>
  );
}

/* =========================================================
   4. DIJKSTRA'S SHORTEST PATH
   ========================================================= */
interface DijkStep {
  nodeStates: Record<string, "default" | "current" | "visited">;
  edgeStates: Record<string, "default" | "active" | "mst">;
  dist: Record<string, number>;
  parent: Record<string, string | null>;
  msg: string;
}

function DijkstraVisualizer({
  graph,
  setGraph,
}: {
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
}) {
  const [source, setSource] = useState(() => graph.vertices[0]?.id || "A");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const steps = useMemo<DijkStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) return [{ nodeStates: {}, edgeStates: {}, dist: {}, parent: {}, msg: "Empty graph." }];
    const src = verts.includes(source) ? source : verts[0];
    const dist: Record<string, number> = {};
    const parent: Record<string, string | null> = {};
    verts.forEach((v) => {
      dist[v] = v === src ? 0 : Infinity;
      parent[v] = null;
    });
    const unvisited = new Set(verts);
    const nodeStates: Record<string, "default" | "current" | "visited"> = {};
    const out: DijkStep[] = [
      { nodeStates: {}, edgeStates: {}, dist: { ...dist }, parent: { ...parent }, msg: `Initialize dist[${src}] = 0, all others = INF.` },
    ];

    while (unvisited.size) {
      let u: string | null = null;
      for (const v of unvisited) {
        if (u === null || dist[v] < dist[u]) u = v;
      }
      if (!u || dist[u] === Infinity) break;
      unvisited.delete(u);
      nodeStates[u] = "current";

      const treeEdges: Record<string, "default" | "active" | "mst"> = {};
      Object.entries(parent).forEach(([child, p]) => {
        if (p) treeEdges[`${p}-${child}`] = "mst";
      });

      out.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...treeEdges },
        dist: { ...dist },
        parent: { ...parent },
        msg: `Select minimum unvisited vertex ${u} (dist = ${dist[u]}).`,
      });

      for (const e of graph.edges) {
        const nb = e.a === u ? e.b : e.b === u ? e.a : null;
        if (nb && unvisited.has(nb) && dist[u] + e.w < dist[nb]) {
          dist[nb] = dist[u] + e.w;
          parent[nb] = u;
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...treeEdges, [`${e.a}-${e.b}`]: "active" },
            dist: { ...dist },
            parent: { ...parent },
            msg: `Relax ${u}->${nb}: ${dist[u]} + ${e.w} = ${dist[nb]} (improved!).`,
          });
        }
      }
      nodeStates[u] = "visited";
    }

    const finalEdges: Record<string, "default" | "active" | "mst"> = {};
    Object.entries(parent).forEach(([c, p]) => { if (p) finalEdges[`${p}-${c}`] = "mst"; });
    out.push({
      nodeStates: { ...nodeStates },
      edgeStates: finalEdges,
      dist: { ...dist },
      parent: { ...parent },
      msg: `Dijkstra complete from source ${src}!`,
    });
    return out;
  }, [graph, source]);

  useEffect(() => { setStepIdx(0); setPlaying(false); }, [graph, source]);
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

  const cur = steps[stepIdx] ?? steps[0];
  const distLabels: Record<string, string> = {};
  Object.entries(cur.dist).forEach(([k, v]) => {
    distLabels[k] = v === Infinity ? "INF" : String(v);
  });

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={`Source: ${source}`}
      isPlaying={playing}
      stage={
        <div className="space-y-3">
          <GraphSvgStage
            vertices={graph.vertices}
            edges={graph.edges}
            nodeStates={cur.nodeStates}
            edgeStates={cur.edgeStates}
            distLabels={distLabels}
          />
          <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#10131e] p-2">
            <table className="w-full text-center font-mono text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-1 text-left">Vertex</th>
                  {graph.vertices.map((v) => <th key={v.id} className="px-2 py-1">{v.id}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/[0.06]">
                  <td className="px-2 py-1 text-left text-slate-400">dist[]</td>
                  {graph.vertices.map((v) => (
                    <td key={v.id} className="px-2 py-1 font-bold text-amber-300">
                      {cur.dist[v.id] === Infinity ? "INF" : cur.dist[v.id]}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-white/[0.06]">
                  <td className="px-2 py-1 text-left text-slate-400">parent[]</td>
                  {graph.vertices.map((v) => (
                    <td key={v.id} className="px-2 py-1 text-sky-300">
                      {cur.parent[v.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
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
          <InspectorBlock highlight title="Source Vertex">
            <StudioSelect value={source} onChange={(e) => setSource(e.target.value)}>
              {graph.vertices.map((v) => <option key={v.id} value={v.id}>Source: {v.id}</option>)}
            </StudioSelect>
          </InspectorBlock>
          <InspectorBlock title="Custom Weighted Edges">
            <StudioTextarea rows={3} value={edgeText} onChange={(e) => setEdgeText(e.target.value)} />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const p = parseEdgeListText(edgeText);
                if (p) { setGraph(p); setSource(p.vertices[0].id); }
              }}
            >
              Update Graph
            </StudioBtn>
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Dijkstra greedily locks in the closest unvisited node and relaxes its outgoing edges. Requires non-negative edge weights."
          keyPoints={[
            "Edge Relaxation: if dist[u] + w(u,v) < dist[v], update dist[v] and parent[v].",
            "Time: O((V + E) log V) with a min-priority queue, or O(V^2) with an array.",
          ]}
          complexities={[
            { op: "Dijkstra (Min-Heap)", best: "O((V+E)log V)", avg: "O((V+E)log V)", worst: "O((V+E)log V)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   5. FLOYD-WARSHALL (Editable Matrix!)
   ========================================================= */
interface FWStep {
  mat: number[][];
  k: number;
  hi: number;
  hj: number;
  msg: string;
}

const INF = 9999;

function FloydWarshallVisualizer() {
  const [size, setSize] = useState(4);
  const [grid, setGrid] = useState<string[][]>([
    ["0", "3", "INF", "7"],
    ["8", "0", "2", "INF"],
    ["5", "INF", "0", "1"],
    ["2", "INF", "INF", "0"],
  ]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const labels = useMemo(() => ["A", "B", "C", "D", "E"].slice(0, size), [size]);

  const steps = useMemo<FWStep[]>(() => {
    const m = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => {
        if (i === j) return 0;
        const raw = (grid[i]?.[j] ?? "INF").trim().toUpperCase();
        if (!raw || raw === "INF" || raw === "∞") return INF;
        const num = Number(raw);
        return Number.isNaN(num) ? INF : num;
      })
    );
    const out: FWStep[] = [
      { mat: m.map((r) => [...r]), k: -1, hi: -1, hj: -1, msg: "Initial direct distance matrix. Click cells on the right to edit weights." },
    ];
    for (let k = 0; k < size; k++) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (m[i][k] < INF && m[k][j] < INF && m[i][k] + m[k][j] < m[i][j]) {
            m[i][j] = m[i][k] + m[k][j];
            out.push({
              mat: m.map((r) => [...r]),
              k,
              hi: i,
              hj: j,
              msg: `Via k=${labels[k]}: dist[${labels[i]}][${labels[j]}] updated to ${m[i][k]} + ${m[k][j]} = ${m[i][j]}`,
            });
          }
        }
      }
      out.push({
        mat: m.map((r) => [...r]),
        k,
        hi: -1,
        hj: -1,
        msg: `Completed phase k = ${labels[k]}.`,
      });
    }
    return out;
  }, [grid, size, labels]);

  useEffect(() => { setStepIdx(0); setPlaying(false); }, [grid, size]);
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

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={cur.k >= 0 ? `Pivot k = ${labels[cur.k]}` : "Initial Matrix"}
      isPlaying={playing}
      stage={
        <div className="flex justify-center overflow-x-auto py-4">
          <table className="border-collapse font-mono text-sm">
            <thead>
              <tr>
                <th className="p-2 text-slate-500">i \ j</th>
                {labels.map((l, idx) => (
                  <th
                    key={l}
                    className={`p-2 ${cur.k === idx ? "text-amber-300" : "text-slate-400"}`}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.mat.map((row, i) => (
                <tr key={i}>
                  <th className={`p-2 ${cur.k === i ? "text-amber-300" : "text-slate-400"}`}>{labels[i]}</th>
                  {row.map((val, j) => {
                    const isUpdated = cur.hi === i && cur.hj === j;
                    const onPivot = cur.k === i || cur.k === j;
                    return (
                      <td
                        key={j}
                        className={`h-12 w-14 border border-white/[0.08] text-center font-bold transition-colors ${
                          isUpdated
                            ? "bg-emerald-500/25 text-emerald-200 ring-2 ring-emerald-400"
                            : onPivot
                            ? "bg-amber-500/10 text-amber-200"
                            : "bg-[#121625] text-slate-200"
                        }`}
                      >
                        {val >= INF ? "INF" : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
          <InspectorBlock highlight title="Edit Adjacency Weight Matrix" description="Type weights or 'INF' directly into any cell.">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Vertices (N)</span>
              <StudioSelect
                className="w-24"
                value={size}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setSize(n);
                  setGrid((prev) =>
                    Array.from({ length: n }, (_, i) =>
                      Array.from({ length: n }, (_, j) => (i === j ? "0" : prev[i]?.[j] ?? "INF"))
                    )
                  );
                }}
              >
                <option value={3}>3 x 3</option>
                <option value={4}>4 x 4</option>
                <option value={5}>5 x 5</option>
              </StudioSelect>
            </div>
            <div className="space-y-1 overflow-x-auto">
              {Array.from({ length: size }, (_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-4 font-mono text-[11px] text-slate-400">{labels[i]}</span>
                  {Array.from({ length: size }, (_, j) => (
                    <input
                      key={j}
                      disabled={i === j}
                      value={i === j ? "0" : grid[i]?.[j] ?? "INF"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGrid((prev) =>
                          prev.map((r, ri) =>
                            ri === i ? r.map((c, ci) => (ci === j ? val : c)) : r
                          )
                        );
                      }}
                      className="h-8 w-11 rounded border border-white/[0.1] bg-[#0b0d14] text-center font-mono text-[11px] text-slate-100 outline-none focus:border-violet-500 disabled:opacity-45"
                    />
                  ))}
                </div>
              ))}
            </div>
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Floyd-Warshall tries every vertex k as a stepping stone between every pair (i, j): dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])."
          keyPoints={[
            "Works on negative edge weights as long as there are no negative cycles.",
            "Computes all-pairs shortest paths in O(V^3) time and O(V^2) space.",
          ]}
          complexities={[
            { op: "Floyd-Warshall", best: "O(V^3)", avg: "O(V^3)", worst: "O(V^3)", space: "O(V^2)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   6. WARSHALL'S ALGORITHM (Editable Boolean Matrix!)
   ========================================================= */
function WarshallVisualizer() {
  const [size, setSize] = useState(4);
  const [mat, setMat] = useState<number[][]>([
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [1, 0, 1, 0],
  ]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const labels = useMemo(() => ["1", "2", "3", "4", "5"].slice(0, size), [size]);

  const steps = useMemo(() => {
    const r = mat.slice(0, size).map((row) => row.slice(0, size));
    const out: { mat: number[][]; k: number; hi: number; hj: number; msg: string }[] = [
      { mat: r.map((x) => [...x]), k: -1, hi: -1, hj: -1, msg: "Initial Direct Reachability Matrix. Click cells on the right to toggle 0/1." },
    ];
    for (let k = 0; k < size; k++) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (!r[i][j] && r[i][k] && r[k][j]) {
            r[i][j] = 1;
            out.push({
              mat: r.map((x) => [...x]),
              k,
              hi: i,
              hj: j,
              msg: `Transitive path found: ${labels[i]} -> ${labels[k]} -> ${labels[j]}! Set R[${labels[i]}][${labels[j]}] = 1.`,
            });
          }
        }
      }
      out.push({
        mat: r.map((x) => [...x]),
        k,
        hi: -1,
        hj: -1,
        msg: `Finished checking intermediate vertex ${labels[k]}.`,
      });
    }
    return out;
  }, [mat, size, labels]);

  useEffect(() => { setStepIdx(0); setPlaying(false); }, [mat, size]);
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

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={cur.k >= 0 ? `Intermediate k = ${labels[cur.k]}` : "Direct Edges"}
      isPlaying={playing}
      stage={
        <div className="flex justify-center overflow-x-auto py-4">
          <table className="border-collapse font-mono text-sm">
            <thead>
              <tr>
                <th className="p-2 text-slate-500">i \ j</th>
                {labels.map((l, idx) => (
                  <th key={l} className={`p-2 ${cur.k === idx ? "text-amber-300" : "text-slate-400"}`}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.mat.map((row, i) => (
                <tr key={i}>
                  <th className={`p-2 ${cur.k === i ? "text-amber-300" : "text-slate-400"}`}>{labels[i]}</th>
                  {row.map((val, j) => {
                    const isNew = cur.hi === i && cur.hj === j;
                    return (
                      <td
                        key={j}
                        className={`h-12 w-12 border border-white/[0.08] text-center font-bold ${
                          isNew
                            ? "bg-emerald-500/30 text-emerald-200 ring-2 ring-emerald-400"
                            : val === 1
                            ? "bg-violet-500/15 text-violet-300"
                            : "bg-[#121625] text-slate-600"
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
        <InspectorBlock highlight title="Click Cells to Toggle 0 / 1" description="Define which direct edges i -> j exist in your graph.">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Matrix Size</span>
            <StudioSelect
              className="w-24"
              value={size}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSize(n);
                setMat((prev) =>
                  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? 0))
                );
              }}
            >
              <option value={3}>3 x 3</option>
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
            </StudioSelect>
          </div>
          <div className="space-y-1">
            {Array.from({ length: size }, (_, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-4 font-mono text-[11px] text-slate-400">{labels[i]}</span>
                {Array.from({ length: size }, (_, j) => {
                  const val = mat[i]?.[j] ?? 0;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() =>
                        setMat((prev) =>
                          prev.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === j ? (c ? 0 : 1) : c)) : r))
                        )
                      }
                      className={`h-8 w-10 rounded border font-mono text-xs font-bold transition cursor-pointer ${
                        val
                          ? "border-violet-400/60 bg-violet-500/20 text-violet-200"
                          : "border-white/[0.08] bg-[#0b0d14] text-slate-500"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </InspectorBlock>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Warshall's computes the Transitive Closure: R[i][j] becomes 1 whenever any directed path from i to j exists through intermediate nodes."
          keyPoints={[
            "Boolean update rule: R[i][j] = R[i][j] || (R[i][k] && R[k][j]).",
            "Identical loop structure to Floyd-Warshall — O(V^3) time.",
          ]}
          complexities={[
            { op: "Warshall's Closure", best: "O(V^3)", avg: "O(V^3)", worst: "O(V^3)", space: "O(V^2)" },
          ]}
        />
      }
    />
  );
}

export function GraphSectionRouter({ topicId }: { topicId: TopicId }) {
  const [graph, setGraph] = useState<{ vertices: GVertex[]; edges: GEdge[] }>(() =>
    JSON.parse(JSON.stringify(DEFAULT_GRAPH))
  );
  const [directed, setDirected] = useState(false);

  switch (topicId) {
    case "graph-basics":
      return <GraphBasicsVisualizer graph={graph} setGraph={setGraph} directed={directed} setDirected={setDirected} />;
    case "bfs":
      return <GraphTraversalVisualizer mode="bfs" graph={graph} setGraph={setGraph} />;
    case "dfs":
      return <GraphTraversalVisualizer mode="dfs" graph={graph} setGraph={setGraph} />;
    case "mst":
      return <MSTVisualizer graph={graph} setGraph={setGraph} />;
    case "dijkstra":
      return <DijkstraVisualizer graph={graph} setGraph={setGraph} />;
    case "floyd":
      return <FloydWarshallVisualizer />;
    case "warshall":
      return <WarshallVisualizer />;
    default:
      return <GraphBasicsVisualizer graph={graph} setGraph={setGraph} directed={directed} setDirected={setDirected} />;
  }
}
