import React, { useMemo, useState } from "react";
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
import { usePlayback } from "../hooks/usePlayback";
import { nextAvailableVertexId, parseEdgeListText } from "../lib/parsers";
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

const WEIGHTED_NETWORK_GRAPH: { vertices: GVertex[]; edges: GEdge[] } = {
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
          <path d="M0,0 L0,6 L7,3 z" fill="#7c7c85" />
        </marker>
        <marker
          id="g-arrow-active"
          markerWidth="8"
          markerHeight="8"
          refX="22"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#4cc38a" />
        </marker>
        <marker
          id="g-arrow-amber"
          markerWidth="8"
          markerHeight="8"
          refX="22"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#f59e0b" />
        </marker>
      </defs>

      {edges.map((e, idx) => {
        const va = vertices.find((v) => v.id === e.a);
        const vb = vertices.find((v) => v.id === e.b);
        if (!va || !vb) return null;
        const st =
          edgeStates[getEdgeKey(e.a, e.b)] ||
          (!directed && edgeStates[getEdgeKey(e.b, e.a)]) ||
          "default";
        const stroke =
          st === "mst"
            ? "#4cc38a"
            : st === "active"
            ? "#f59e0b"
            : st === "skip"
            ? "#e5484d"
            : "rgba(237,237,237,0.22)";
        const width = st === "mst" || st === "active" ? 2.8 : 1.8;
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
              markerEnd={
                directed
                  ? st === "mst"
                    ? "url(#g-arrow-active)"
                    : st === "active"
                    ? "url(#g-arrow-amber)"
                    : "url(#g-arrow)"
                  : undefined
              }
            />
            <rect
              x={mx - 12}
              y={my - 9}
              width={24}
              height={17}
              rx={4}
              fill="#0f0f10"
              stroke={
                st === "mst"
                  ? "#4cc38a"
                  : st === "active"
                  ? "#f59e0b"
                  : "rgba(237,237,237,0.12)"
              }
            />
            <text
              x={mx}
              y={my}
              textAnchor="middle"
              dominantBaseline="central"
              fill={st === "mst" ? "#4cc38a" : st === "active" ? "#f59e0b" : "#a1a1a6"}
              fontSize="11"
              fontWeight="500"
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
            ? "#2b200c"
            : st === "visited"
            ? "#11281d"
            : st === "queued"
            ? "#142338"
            : st === "start"
            ? "#142338"
            : "#19191b";
        const stroke =
          selectedId === v.id
            ? "#f59e0b"
            : st === "current"
            ? "#f59e0b"
            : st === "visited"
            ? "#4cc38a"
            : st === "queued"
            ? "#60a5fa"
            : st === "start"
            ? "#60a5fa"
            : "#48484f";

        return (
          <g
            key={v.id}
            role={onNodeClick ? "button" : undefined}
            tabIndex={onNodeClick ? 0 : undefined}
            aria-label={onNodeClick ? `Vertex ${v.id}` : undefined}
            className={onNodeClick ? "cursor-pointer outline-none" : undefined}
            onClick={(ev) => {
              if (!onNodeClick) return;
              ev.stopPropagation();
              onNodeClick(v);
            }}
            onKeyDown={(ev) => {
              if (onNodeClick && (ev.key === "Enter" || ev.key === " ")) {
                ev.preventDefault();
                onNodeClick(v);
              }
            }}
          >
            <circle
              cx={v.x}
              cy={v.y}
              r={19}
              fill={fill}
              stroke={stroke}
              strokeWidth={selectedId === v.id || st === "current" ? 2.5 : 1.8}
            />
            <text
              x={v.x}
              y={v.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ededed"
              fontSize="12"
              fontWeight="500"
              fontFamily="JetBrains Mono, monospace"
            >
              {v.id}
            </text>
            {distLabels[v.id] && (
              <text
                x={v.x}
                y={v.y + 28}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="11"
                fontWeight="500"
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
  const [status, setStatus] = useState(
    "Click two nodes to connect an edge, or type custom edges on the right."
  );

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
      badge={`${graph.vertices.length}V · ${graph.edges.length}E · ${directed ? "Directed" : "Undirected"}`}
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
              const nextChar = nextAvailableVertexId(graph.vertices.map((v) => v.id));
              if (!nextChar) {
                setStatus("Maximum 26 vertices (A–Z) reached.");
                return;
              }
              setGraph((prev) => ({
                ...prev,
                vertices: [...prev.vertices, { id: nextChar, x, y }],
              }));
              setStatus(`Added vertex ${nextChar}. Switch to Connect Edge to link it.`);
            }}
            onNodeClick={(v) => {
              if (clickMode !== "edge") return;
              if (!selectedV) {
                setSelectedV(v.id);
                setStatus(`Selected vertex ${v.id}. Click another vertex to add/update edge.`);
              } else if (selectedV !== v.id) {
                const parsedW = Number(edgeWeight);
                const w = Number.isFinite(parsedW) && edgeWeight.trim() !== "" ? parsedW : 1;
                const existingIdx = graph.edges.findIndex((e) =>
                  directed
                    ? e.a === selectedV && e.b === v.id
                    : (e.a === selectedV && e.b === v.id) || (e.a === v.id && e.b === selectedV)
                );
                let nextEdges: GEdge[];
                if (existingIdx >= 0) {
                  nextEdges = graph.edges.map((e, idx) =>
                    idx === existingIdx ? { a: selectedV, b: v.id, w } : e
                  );
                  setStatus(
                    `Updated edge ${selectedV} ${directed ? "->" : "--"} ${v.id} weight to ${w}.`
                  );
                } else {
                  nextEdges = [...graph.edges, { a: selectedV, b: v.id, w }];
                  setStatus(
                    `Connected ${selectedV} ${directed ? "->" : "--"} ${v.id} (weight ${w}).`
                  );
                }
                setGraph({ ...graph, edges: nextEdges });
                setEdgeText(edgesToText(nextEdges));
                setSelectedV(null);
              } else {
                setSelectedV(null);
              }
            }}
          />

          <div className="rounded-xl border border-[#ededed]/[0.08] bg-[#141415] p-3">
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
                <table className="w-full text-center font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="text-[#93939a]">
                      <th className="p-1.5"></th>
                      {ids.map((id) => (
                        <th key={id} className="p-1.5 font-medium">
                          {id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={ids[i]} className="border-t border-[#ededed]/[0.06]">
                        <th className="p-1.5 font-medium text-[#93939a]">{ids[i]}</th>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className={`p-1.5 ${
                              val ? "font-medium text-amber-400" : "text-[#93939a]/45"
                            }`}
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
              <div className="grid grid-cols-1 gap-1.5 font-mono text-xs sm:grid-cols-2">
                {ids.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-[#ededed]/[0.06] bg-[#19191b] px-3 py-1.5"
                  >
                    <span className="font-medium text-amber-400">{id}</span>
                    <span className="text-[#93939a]">-&gt;</span>
                    <span className="text-[#ededed]">
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
                <div className="mb-1.5 text-xs text-[#93939a]">
                  Header: ({ids.length} rows, {ids.length} cols, {sparseRows.length} non-zero
                  entries)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sparseRows.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded border border-[#ededed]/[0.08] bg-[#19191b] px-2 py-1 text-[#a1a1a6]"
                    >
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
            title="Custom edge list input"
            description="Format: A-B:4, A-D:2 — shared across BFS, DFS, MST, and Dijkstra (including Directed mode)."
          >
            <StudioTextarea
              rows={3}
              value={edgeText}
              onChange={(e) => setEdgeText(e.target.value)}
            />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const parsed = parseEdgeListText(edgeText, directed);
                if (!parsed) return setStatus("Invalid edge format — try A-B:4, B-C:5");
                setGraph({ vertices: parsed.vertices, edges: parsed.edges });
                setEdgeText(edgesToText(parsed.edges));
                setStatus(
                  `Built custom graph (${parsed.vertices.length} vertices, ${parsed.edges.length} edges).`
                );
              }}
            >
              Build Graph from Text
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Canvas interaction mode">
            <div className="grid grid-cols-2 gap-1.5">
              <StudioBtn
                variant={clickMode === "vertex" ? "primary" : "secondary"}
                onClick={() => {
                  setClickMode("vertex");
                  setSelectedV(null);
                }}
              >
                Add Vertex
              </StudioBtn>
              <StudioBtn
                variant={clickMode === "edge" ? "primary" : "secondary"}
                onClick={() => {
                  setClickMode("edge");
                  setSelectedV(null);
                }}
              >
                Connect Edge
              </StudioBtn>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Edge weight</label>
                <StudioInput
                  type="number"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                />
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
                { id: "net", label: "Weighted Network (8V)" },
                { id: "clear", label: "Clear" },
              ]}
              onSelect={(id) => {
                if (id === "clear") {
                  setGraph({ vertices: [], edges: [] });
                  setEdgeText("");
                  setStatus("Cleared graph.");
                } else if (id === "net") {
                  const g = JSON.parse(JSON.stringify(WEIGHTED_NETWORK_GRAPH));
                  setGraph(g);
                  setEdgeText(edgesToText(g.edges));
                  setStatus("Loaded 8-vertex weighted network graph (A..H).");
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
          javaCode={`Map<String, List<int[]>> adj = new HashMap<>();
// Directed edge u -> v with weight w
adj.computeIfAbsent("A", k -> new ArrayList<>()).add(new int[]{'B', 4});`}
        />
      }
    />
  );
}

/* =========================================================
   2. BFS & DFS (RESPECTS DIRECTED MODE!)
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
  directed,
  setDirected,
}: {
  mode: "bfs" | "dfs";
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
  directed: boolean;
  setDirected: (v: boolean) => void;
}) {
  const [startV, setStartV] = useState(() => graph.vertices[0]?.id || "A");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));

  const steps = useMemo<TraversalStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) {
      return [{ nodeStates: {}, frontier: [], order: [], msg: "Graph is empty." }];
    }
    const src = verts.includes(startV) ? startV : verts[0];
    const adj: Record<string, string[]> = {};
    verts.forEach((v) => (adj[v] = []));
    graph.edges.forEach((e) => {
      if (adj[e.a]) adj[e.a].push(e.b);
      if (!directed && adj[e.b]) adj[e.b].push(e.a);
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
        msg: `Start ${directed ? "directed " : ""}BFS at ${src}. Enqueue ${src}.`,
      });
      while (queue.length) {
        const u = queue.shift()!;
        nodeStates[u] = "current";
        order.push(u);
        out.push({
          nodeStates: { ...nodeStates },
          frontier: [...queue],
          order: [...order],
          msg: `Dequeue & visit ${u}. Outgoing neighbors: [${adj[u].join(", ") || "none"}].`,
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
        msg: `BFS complete — order [${order.join(" -> ")}], ${
          directed
            ? `${visited.size}/${verts.length} vertices reachable from ${src}`
            : `graph is ${connected ? "connected" : "disconnected"} (${visited.size}/${verts.length} reached)`
        }.`,
      });
    } else {
      const stack: string[] = [];
      out.push({
        nodeStates: {},
        frontier: [],
        order: [],
        msg: `Start ${directed ? "directed " : ""}DFS from ${src}.`,
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
          msg: `Push and visit ${u} (stack: [${stack.join(", ")}]).`,
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
        msg: `DFS complete — order [${order.join(" -> ")}] (${visited.size}/${verts.length} reached).`,
      });
    }
    return out;
  }, [graph, mode, startV, directed]);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${mode}-${startV}-${directed}-${edgesToText(graph.edges)}`,
  });

  const cur = steps[pb.stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={pb.stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={`${mode.toUpperCase()} · ${directed ? "Directed" : "Undirected"}`}
      isPlaying={pb.playing}
      stage={
        <div className="space-y-3">
          <GraphSvgStage
            vertices={graph.vertices}
            edges={graph.edges}
            directed={directed}
            nodeStates={cur.nodeStates}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2 font-mono text-xs">
              <span className="text-[#93939a]">
                {mode === "bfs" ? "Queue: " : "Call stack: "}
              </span>
              <span className="font-medium text-[#60a5fa]">
                [{cur.frontier.join(", ") || "empty"}]
              </span>
            </div>
            <div className="rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2 font-mono text-xs">
              <span className="text-[#93939a]">Traversal: </span>
              <span className="font-medium text-[#4cc38a]">{cur.order.join(" -> ") || "—"}</span>
            </div>
          </div>
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
            { label: mode === "bfs" ? "In queue" : "Active branch", colorClass: "bg-[#60a5fa]" },
            { label: "Current", colorClass: "bg-amber-500" },
            { label: "Visited", colorClass: "bg-[#4cc38a]" },
          ]}
        />
      }
      inspector={
        <>
          <InspectorBlock highlight title="Start Vertex & Edge Direction">
            <div className="space-y-2">
              <StudioSelect value={startV} onChange={(e) => setStartV(e.target.value)}>
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>
                    Start from {v.id}
                  </option>
                ))}
              </StudioSelect>
              <div className="grid grid-cols-2 gap-1.5">
                <StudioBtn
                  variant={!directed ? "primary" : "secondary"}
                  onClick={() => setDirected(false)}
                >
                  Undirected
                </StudioBtn>
                <StudioBtn
                  variant={directed ? "primary" : "secondary"}
                  onClick={() => setDirected(true)}
                >
                  Directed
                </StudioBtn>
              </div>
            </div>
          </InspectorBlock>

          <InspectorBlock
            title="Custom Edge List"
            description="Edit graph directly (e.g. A-B, B-C, A-D)."
          >
            <StudioTextarea
              rows={3}
              value={edgeText}
              onChange={(e) => setEdgeText(e.target.value)}
            />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const parsed = parseEdgeListText(edgeText, directed);
                if (parsed) {
                  setGraph({ vertices: parsed.vertices, edges: parsed.edges });
                  setEdgeText(edgesToText(parsed.edges));
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
                { id: "net", label: "Network (Start D)" },
              ]}
              onSelect={(id) => {
                const g = JSON.parse(
                  JSON.stringify(id === "net" ? WEIGHTED_NETWORK_GRAPH : DEFAULT_GRAPH)
                );
                setGraph(g);
                setEdgeText(edgesToText(g.edges));
                setStartV(id === "net" ? "D" : "A");
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition={
            mode === "bfs"
              ? "BFS explores layer by layer using a FIFO Queue — guaranteeing shortest path in unweighted graphs and checking reachability."
              : "DFS dives deep along each path using recursion/Stack before backtracking — ideal for cycle detection and topological sorting."
          }
          keyPoints={[
            "Time Complexity: O(V + E) with Adjacency List.",
            "Space Complexity: O(V) for visited set + queue/recursion stack.",
            "Toggle Directed vs Undirected to see how edge orientation restricts reachable vertices.",
          ]}
          complexities={[
            {
              op: `${mode.toUpperCase()} (Adj List)`,
              best: "O(V+E)",
              avg: "O(V+E)",
              worst: "O(V+E)",
              space: "O(V)",
            },
          ]}
          javaCode={
            mode === "bfs"
              ? `void bfs(Map<String, List<String>> adj, String start) {
  Set<String> vis = new HashSet<>();
  Queue<String> q = new ArrayDeque<>();
  vis.add(start); q.offer(start);
  while (!q.isEmpty()) {
    String u = q.poll();
    for (String v : adj.getOrDefault(u, List.of()))
      if (vis.add(v)) q.offer(v);
  }
}`
              : `void dfs(Map<String, List<String>> adj, String u, Set<String> vis) {
  vis.add(u);
  for (String v : adj.getOrDefault(u, List.of()))
    if (!vis.contains(v)) dfs(adj, v, vis);
}`
          }
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
  directed,
}: {
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
  directed: boolean;
}) {
  const [algo, setAlgo] = useState<"prim" | "kruskal">("prim");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));

  const steps = useMemo<MSTStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) {
      return [{ nodeStates: {}, edgeStates: {}, totalWeight: 0, msg: "Empty graph." }];
    }
    const out: MSTStep[] = [
      {
        nodeStates: {},
        edgeStates: {},
        totalWeight: 0,
        msg: `Ready to build MST via ${algo === "prim" ? "Prim's" : "Kruskal's"} Algorithm.`,
      },
    ];
    const edgeStates: Record<string, "default" | "active" | "mst" | "skip"> = {};
    const nodeStates: Record<string, "default" | "current" | "visited"> = {};
    let total = 0;
    let acceptedCount = 0;

    if (algo === "prim") {
      const inMST = new Set<string>([verts[0]]);
      nodeStates[verts[0]] = "visited";
      out.push({
        nodeStates: { ...nodeStates },
        edgeStates: {},
        totalWeight: 0,
        msg: `Prim's: Start tree at vertex ${verts[0]}.`,
      });
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
        acceptedCount++;
        out.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          totalWeight: total,
          msg: `Pick lightest frontier edge ${best.a}-${best.b} (w=${best.w}). Total = ${total}`,
        });
      }
      const isConnected = inMST.size === verts.length;
      out.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        totalWeight: total,
        msg: isConnected
          ? `MST complete — ${acceptedCount} edges, minimum total weight = ${total}.`
          : `Graph is disconnected — Prim's reached ${inMST.size}/${verts.length} vertices (partial weight = ${total}).`,
      });
    } else {
      const sorted = [...graph.edges].sort((a, b) => a.w - b.w);
      const parent: Record<string, string> = {};
      verts.forEach((v) => (parent[v] = v));
      const find = (x: string): string =>
        parent[x] === x ? x : (parent[x] = find(parent[x]));
      for (const e of sorted) {
        const ra = find(e.a);
        const rb = find(e.b);
        if (ra !== rb) {
          parent[ra] = rb;
          edgeStates[`${e.a}-${e.b}`] = "mst";
          nodeStates[e.a] = "visited";
          nodeStates[e.b] = "visited";
          total += e.w;
          acceptedCount++;
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            totalWeight: total,
            msg: `Accept ${e.a}-${e.b} (w=${e.w}) — merges two components. Total = ${total}`,
          });
        } else {
          edgeStates[`${e.a}-${e.b}`] = "skip";
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            totalWeight: total,
            msg: `Skip ${e.a}-${e.b} (w=${e.w}) — forms a cycle.`,
          });
        }
      }
      const isConnected = acceptedCount === verts.length - 1;
      out.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        totalWeight: total,
        msg: isConnected
          ? `MST complete — ${acceptedCount} edges, minimum total weight = ${total}.`
          : `Graph is disconnected — computed Minimum Spanning Forest (${acceptedCount}/${verts.length - 1} edges, weight = ${total}).`,
      });
    }
    return out;
  }, [graph, algo]);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${algo}-${edgesToText(graph.edges)}`,
  });

  const cur = steps[pb.stepIdx] ?? steps[0];

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
        step={pb.stepIdx}
        totalSteps={Math.max(0, steps.length - 1)}
        statusText={cur.msg}
        notice={
          directed
            ? "Note: Minimum Spanning Trees are defined for undirected graphs — edges are treated as undirected here."
            : undefined
        }
        badge={`MST Weight: ${cur.totalWeight}`}
        isPlaying={pb.playing}
        stage={
          <GraphSvgStage
            vertices={graph.vertices}
            edges={graph.edges}
            nodeStates={cur.nodeStates}
            edgeStates={cur.edgeStates}
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
              { label: "In MST", colorClass: "bg-[#4cc38a]" },
              { label: "Skipped (cycle)", colorClass: "bg-[#e5484d]" },
            ]}
          />
        }
        inspector={
          <>
            <InspectorBlock
              highlight
              title="Custom Weighted Edges"
              description="Format: A-B:4, B-C:5"
            >
              <StudioTextarea
                rows={3}
                value={edgeText}
                onChange={(e) => setEdgeText(e.target.value)}
              />
              <StudioBtn
                variant="primary"
                className="mt-2 w-full"
                onClick={() => {
                  const p = parseEdgeListText(edgeText, false);
                  if (p) {
                    setGraph({ vertices: p.vertices, edges: p.edges });
                    setEdgeText(edgesToText(p.edges));
                  }
                }}
              >
                Update Graph
              </StudioBtn>
            </InspectorBlock>
            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "def", label: "Default (6V)" },
                  { id: "net", label: "Weighted Network (8V)" },
                ]}
                onSelect={(id) => {
                  const g = JSON.parse(
                    JSON.stringify(id === "net" ? WEIGHTED_NETWORK_GRAPH : DEFAULT_GRAPH)
                  );
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
              "On disconnected graphs, Kruskal's produces a Minimum Spanning Forest across components.",
            ]}
            complexities={[
              { op: "Prim's (Binary Heap)", best: "O(E log V)", avg: "O(E log V)", worst: "O(E log V)" },
              { op: "Kruskal's (Union-Find)", best: "O(E log E)", avg: "O(E log E)", worst: "O(E log E)" },
            ]}
            javaCode={`// Kruskal's Union-Find step
edges.sort(Comparator.comparingInt(e -> e.w));
for (Edge e : edges) {
  if (find(e.u) != find(e.v)) {
    union(e.u, e.v);
    mstWeight += e.w;
  }
}`}
          />
        }
      />
    </div>
  );
}

/* =========================================================
   4. DIJKSTRA'S SHORTEST PATH (DIRECTED SUPPORT + NEGATIVE WEIGHT GUARD!)
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
  directed,
  setDirected,
}: {
  graph: { vertices: GVertex[]; edges: GEdge[] };
  setGraph: React.Dispatch<React.SetStateAction<{ vertices: GVertex[]; edges: GEdge[] }>>;
  directed: boolean;
  setDirected: (v: boolean) => void;
}) {
  const [source, setSource] = useState(() => graph.vertices[0]?.id || "A");
  const [edgeText, setEdgeText] = useState(() => edgesToText(graph.edges));
  const hasNegative = graph.edges.some((e) => e.w < 0);

  const steps = useMemo<DijkStep[]>(() => {
    const verts = graph.vertices.map((v) => v.id);
    if (!verts.length) {
      return [{ nodeStates: {}, edgeStates: {}, dist: {}, parent: {}, msg: "Empty graph." }];
    }
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
      {
        nodeStates: {},
        edgeStates: {},
        dist: { ...dist },
        parent: { ...parent },
        msg: `Initialize dist[${src}] = 0, all others = INF (${
          directed ? "directed" : "undirected"
        }).`,
      },
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
        msg: `Lock minimum unvisited vertex ${u} (dist = ${dist[u]}).`,
      });

      for (const e of graph.edges) {
        const nb = e.a === u ? e.b : !directed && e.b === u ? e.a : null;
        if (nb && unvisited.has(nb) && dist[u] + e.w < dist[nb]) {
          dist[nb] = dist[u] + e.w;
          parent[nb] = u;
          out.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...treeEdges, [`${e.a}-${e.b}`]: "active" },
            dist: { ...dist },
            parent: { ...parent },
            msg: `Relax ${u}->${nb}: ${dist[u]} + ${e.w} = ${dist[nb]} (improved)`,
          });
        }
      }
      nodeStates[u] = "visited";
    }

    const finalEdges: Record<string, "default" | "active" | "mst"> = {};
    Object.entries(parent).forEach(([c, p]) => {
      if (p) finalEdges[`${p}-${c}`] = "mst";
    });
    out.push({
      nodeStates: { ...nodeStates },
      edgeStates: finalEdges,
      dist: { ...dist },
      parent: { ...parent },
      msg: `Dijkstra complete from source ${src}.`,
    });
    return out;
  }, [graph, source, directed]);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${source}-${directed}-${edgesToText(graph.edges)}`,
  });

  const cur = steps[pb.stepIdx] ?? steps[0];
  const distLabels: Record<string, string> = {};
  Object.entries(cur.dist).forEach(([k, v]) => {
    distLabels[k] = v === Infinity ? "INF" : String(v);
  });

  return (
    <VisualizerWorkspace
      step={pb.stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      notice={
        hasNegative
          ? "Negative edge weight(s) detected — Dijkstra's greedy assumption requires non-negative weights (use Bellman-Ford or Floyd-Warshall for negative weights)."
          : undefined
      }
      badge={`Source: ${source} · ${directed ? "Directed" : "Undirected"}`}
      isPlaying={pb.playing}
      stage={
        <div className="space-y-3">
          <GraphSvgStage
            vertices={graph.vertices}
            edges={graph.edges}
            directed={directed}
            nodeStates={cur.nodeStates}
            edgeStates={cur.edgeStates}
            distLabels={distLabels}
          />
          <div className="overflow-x-auto rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] p-2">
            <table className="w-full text-center font-mono text-xs tabular-nums">
              <thead>
                <tr className="text-[#93939a]">
                  <th className="px-2 py-1 text-left font-medium">Vertex</th>
                  {graph.vertices.map((v) => (
                    <th key={v.id} className="px-2 py-1 font-medium">
                      {v.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#ededed]/[0.06]">
                  <td className="px-2 py-1.5 text-left text-[#93939a]">dist[]</td>
                  {graph.vertices.map((v) => (
                    <td key={v.id} className="px-2 py-1.5 font-medium text-amber-400">
                      {cur.dist[v.id] === Infinity ? "INF" : cur.dist[v.id]}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[#ededed]/[0.06]">
                  <td className="px-2 py-1.5 text-left text-[#93939a]">parent[]</td>
                  {graph.vertices.map((v) => (
                    <td key={v.id} className="px-2 py-1.5 text-[#60a5fa]">
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
            { label: "Current vertex", colorClass: "bg-amber-500" },
            { label: "Settled / Shortest path", colorClass: "bg-[#4cc38a]" },
          ]}
        />
      }
      inspector={
        <>
          <InspectorBlock highlight title="Source Vertex & Edge Direction">
            <div className="space-y-2">
              <StudioSelect value={source} onChange={(e) => setSource(e.target.value)}>
                {graph.vertices.map((v) => (
                  <option key={v.id} value={v.id}>
                    Source: {v.id}
                  </option>
                ))}
              </StudioSelect>
              <div className="grid grid-cols-2 gap-1.5">
                <StudioBtn
                  variant={!directed ? "primary" : "secondary"}
                  onClick={() => setDirected(false)}
                >
                  Undirected
                </StudioBtn>
                <StudioBtn
                  variant={directed ? "primary" : "secondary"}
                  onClick={() => setDirected(true)}
                >
                  Directed
                </StudioBtn>
              </div>
            </div>
          </InspectorBlock>
          <InspectorBlock title="Custom Weighted Edges">
            <StudioTextarea
              rows={3}
              value={edgeText}
              onChange={(e) => setEdgeText(e.target.value)}
            />
            <StudioBtn
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                const p = parseEdgeListText(edgeText, directed);
                if (p) {
                  setGraph({ vertices: p.vertices, edges: p.edges });
                  setEdgeText(edgesToText(p.edges));
                  setSource(p.vertices[0].id);
                }
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
            "Respects Directed vs Undirected edges just like BFS and DFS.",
          ]}
          complexities={[
            {
              op: "Dijkstra (Min-Heap)",
              best: "O((V+E)log V)",
              avg: "O((V+E)log V)",
              worst: "O((V+E)log V)",
            },
          ]}
          javaCode={`PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
dist[src] = 0; pq.offer(new int[]{src, 0});
while (!pq.isEmpty()) {
  int[] cur = pq.poll();
  int u = cur[0], d = cur[1];
  if (d > dist[u]) continue;
  for (int[] e : adj.get(u))
    if (d + e[1] < dist[e[0]]) {
      dist[e[0]] = d + e[1];
      pq.offer(new int[]{e[0], dist[e[0]]});
    }
}`}
        />
      }
    />
  );
}

/* =========================================================
   5. FLOYD-WARSHALL (TRUE INFINITY + NEGATIVE CYCLE DETECTION!)
   ========================================================= */
interface FWStep {
  mat: number[][];
  k: number;
  hi: number;
  hj: number;
  msg: string;
  hasNegCycle?: boolean;
}

function FloydWarshallVisualizer() {
  const [size, setSize] = useState(4);
  const [grid, setGrid] = useState<string[][]>([
    ["0", "3", "INF", "7"],
    ["8", "0", "2", "INF"],
    ["5", "INF", "0", "1"],
    ["2", "INF", "INF", "0"],
  ]);

  const labels = useMemo(() => ["A", "B", "C", "D", "E"].slice(0, size), [size]);

  const { steps, hasNegCycle } = useMemo(() => {
    const m = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => {
        if (i === j) return 0;
        const raw = (grid[i]?.[j] ?? "INF").trim().toUpperCase();
        if (!raw || raw === "INF" || raw === "∞") return Infinity;
        const num = Number(raw);
        return Number.isFinite(num) ? num : Infinity;
      })
    );
    const out: FWStep[] = [
      {
        mat: m.map((r) => [...r]),
        k: -1,
        hi: -1,
        hj: -1,
        msg: "Initial direct distance matrix. Click cells on the right to edit weights.",
      },
    ];
    for (let k = 0; k < size; k++) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (Number.isFinite(m[i][k]) && Number.isFinite(m[k][j]) && m[i][k] + m[k][j] < m[i][j]) {
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
    const negCycle = m.some((row, i) => row[i] < 0);
    if (negCycle) {
      out.push({
        mat: m.map((r) => [...r]),
        k: size - 1,
        hi: -1,
        hj: -1,
        hasNegCycle: true,
        msg: "Negative cycle detected (diagonal dist[i][i] < 0) — shortest paths are undefined.",
      });
    }
    return { steps: out, hasNegCycle: negCycle };
  }, [grid, size, labels]);

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${size}-${JSON.stringify(grid)}`,
  });

  const cur = steps[pb.stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={pb.stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      statusTone={cur.hasNegCycle ? "error" : "default"}
      notice={
        hasNegCycle
          ? "Negative-weight cycle detected in this weight matrix (diagonal entry drops below 0)."
          : undefined
      }
      badge={cur.k >= 0 ? `Pivot k = ${labels[cur.k]}` : "Initial Matrix"}
      isPlaying={pb.playing}
      stage={
        <div className="flex justify-center overflow-x-auto py-4">
          <table className="border-collapse font-mono text-sm tabular-nums">
            <thead>
              <tr>
                <th className="p-2 font-medium text-[#93939a]">i \ j</th>
                {labels.map((l, idx) => (
                  <th
                    key={l}
                    className={`p-2 font-medium ${cur.k === idx ? "text-amber-400" : "text-[#93939a]"}`}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.mat.map((row, i) => (
                <tr key={i}>
                  <th
                    className={`p-2 font-medium ${cur.k === i ? "text-amber-400" : "text-[#93939a]"}`}
                  >
                    {labels[i]}
                  </th>
                  {row.map((val, j) => {
                    const isUpdated = cur.hi === i && cur.hj === j;
                    const isNegDiag = i === j && val < 0;
                    const onPivot = cur.k === i || cur.k === j;
                    return (
                      <td
                        key={j}
                        className={`h-12 w-14 border border-[#ededed]/[0.08] text-center font-medium transition-colors duration-150 ${
                          isNegDiag
                            ? "bg-[#e5484d]/20 text-[#fca5a5] ring-1 ring-[#e5484d]"
                            : isUpdated
                            ? "bg-[#4cc38a]/20 text-[#4cc38a] ring-1 ring-[#4cc38a]"
                            : onPivot
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-[#19191b] text-[#ededed]"
                        }`}
                      >
                        {!Number.isFinite(val) ? "INF" : val}
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
          isPlaying={pb.playing}
          onTogglePlay={pb.togglePlay}
          onReset={pb.reset}
          onStepBack={pb.stepBack}
          onStepForward={pb.stepForward}
          canStepBack={pb.canStepBack}
          canStepForward={pb.canStepForward}
          speed={pb.speed}
          onSpeedChange={pb.setSpeed}
        />
      }
      inspector={
        <InspectorBlock
          highlight
          title="Edit adjacency weight matrix"
          description="Type weights (including negatives) or 'INF' directly into any cell"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-[#a1a1a6]">Vertices (N)</span>
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
                <span className="w-4 font-mono text-xs text-[#93939a]">{labels[i]}</span>
                {Array.from({ length: size }, (_, j) => (
                  <input
                    key={j}
                    disabled={i === j}
                    aria-label={`Distance from ${labels[i]} to ${labels[j]}`}
                    value={i === j ? "0" : grid[i]?.[j] ?? "INF"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGrid((prev) =>
                        prev.map((r, ri) =>
                          ri === i ? r.map((c, ci) => (ci === j ? val : c)) : r
                        )
                      );
                    }}
                    className="h-8 w-11 rounded border border-[#ededed]/[0.1] bg-[#0f0f10] text-center font-mono text-xs text-[#ededed] outline-none transition-colors duration-150 focus:border-amber-500/70 disabled:opacity-45"
                  />
                ))}
              </div>
            ))}
          </div>
        </InspectorBlock>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Floyd-Warshall tries every vertex k as a stepping stone between every pair (i, j): dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])."
          keyPoints={[
            "Works on negative edge weights and detects negative cycles via diagonal dist[i][i] < 0.",
            "Computes all-pairs shortest paths in O(V^3) time and O(V^2) space.",
          ]}
          complexities={[
            { op: "Floyd-Warshall", best: "O(V^3)", avg: "O(V^3)", worst: "O(V^3)", space: "O(V^2)" },
          ]}
          javaCode={`for (int k = 0; k < n; k++)
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
      if (d[i][k] < INF && d[k][j] < INF)
        d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);`}
        />
      }
    />
  );
}

/* =========================================================
   6. WARSHALL'S ALGORITHM (Editable Boolean Matrix)
   ========================================================= */
function WarshallVisualizer() {
  const [size, setSize] = useState(4);
  const [mat, setMat] = useState<number[][]>([
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [1, 0, 1, 0],
  ]);

  const labels = useMemo(() => ["1", "2", "3", "4", "5"].slice(0, size), [size]);

  const steps = useMemo(() => {
    const r = mat.slice(0, size).map((row) => row.slice(0, size));
    const out: { mat: number[][]; k: number; hi: number; hj: number; msg: string }[] = [
      {
        mat: r.map((x) => [...x]),
        k: -1,
        hi: -1,
        hj: -1,
        msg: "Initial Direct Reachability Matrix. Click cells on the right to toggle 0/1.",
      },
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
              msg: `Transitive path found: ${labels[i]} -> ${labels[k]} -> ${labels[j]} — set R[${labels[i]}][${labels[j]}] = 1`,
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

  const pb = usePlayback({
    totalSteps: Math.max(0, steps.length - 1),
    resetKey: `${size}-${JSON.stringify(mat)}`,
  });

  const cur = steps[pb.stepIdx] ?? steps[0];

  return (
    <VisualizerWorkspace
      step={pb.stepIdx}
      totalSteps={Math.max(0, steps.length - 1)}
      statusText={cur.msg}
      badge={cur.k >= 0 ? `Intermediate k = ${labels[cur.k]}` : "Direct Edges"}
      isPlaying={pb.playing}
      stage={
        <div className="flex justify-center overflow-x-auto py-4">
          <table className="border-collapse font-mono text-sm tabular-nums">
            <thead>
              <tr>
                <th className="p-2 font-medium text-[#93939a]">i \ j</th>
                {labels.map((l, idx) => (
                  <th
                    key={l}
                    className={`p-2 font-medium ${cur.k === idx ? "text-amber-400" : "text-[#93939a]"}`}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.mat.map((row, i) => (
                <tr key={i}>
                  <th
                    className={`p-2 font-medium ${cur.k === i ? "text-amber-400" : "text-[#93939a]"}`}
                  >
                    {labels[i]}
                  </th>
                  {row.map((val, j) => {
                    const isNew = cur.hi === i && cur.hj === j;
                    return (
                      <td
                        key={j}
                        className={`h-12 w-12 border border-[#ededed]/[0.08] text-center font-medium ${
                          isNew
                            ? "bg-[#4cc38a]/20 text-[#4cc38a] ring-1 ring-[#4cc38a]"
                            : val === 1
                            ? "bg-amber-500/12 text-amber-300"
                            : "bg-[#19191b] text-[#93939a]/60"
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
          isPlaying={pb.playing}
          onTogglePlay={pb.togglePlay}
          onReset={pb.reset}
          onStepBack={pb.stepBack}
          onStepForward={pb.stepForward}
          canStepBack={pb.canStepBack}
          canStepForward={pb.canStepForward}
          speed={pb.speed}
          onSpeedChange={pb.setSpeed}
        />
      }
      inspector={
        <InspectorBlock
          highlight
          title="Click cells to toggle 0 / 1"
          description="Define which direct edges i -> j exist in your graph"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-[#a1a1a6]">Matrix size</span>
            <StudioSelect
              className="w-24"
              value={size}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSize(n);
                setMat((prev) =>
                  Array.from({ length: n }, (_, i) =>
                    Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? 0)
                  )
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
                <span className="w-4 font-mono text-xs text-[#93939a]">{labels[i]}</span>
                {Array.from({ length: size }, (_, j) => {
                  const val = mat[i]?.[j] ?? 0;
                  return (
                    <button
                      key={j}
                      type="button"
                      aria-label={`Toggle edge ${labels[i]} to ${labels[j]}`}
                      onClick={() =>
                        setMat((prev) =>
                          prev.map((r, ri) =>
                            ri === i ? r.map((c, ci) => (ci === j ? (c ? 0 : 1) : c)) : r
                          )
                        )
                      }
                      className={`h-8 w-10 rounded border font-mono text-xs font-medium transition-colors duration-150 cursor-pointer ${
                        val
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                          : "border-[#ededed]/[0.08] bg-[#0f0f10] text-[#93939a]"
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
            {
              op: "Warshall's Closure",
              best: "O(V^3)",
              avg: "O(V^3)",
              worst: "O(V^3)",
              space: "O(V^2)",
            },
          ]}
          javaCode={`for (int k = 0; k < n; k++)
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
      reach[i][j] = reach[i][j] || (reach[i][k] && reach[k][j]);`}
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
      return (
        <GraphBasicsVisualizer
          graph={graph}
          setGraph={setGraph}
          directed={directed}
          setDirected={setDirected}
        />
      );
    case "bfs":
      return (
        <GraphTraversalVisualizer
          key="bfs"
          mode="bfs"
          graph={graph}
          setGraph={setGraph}
          directed={directed}
          setDirected={setDirected}
        />
      );
    case "dfs":
      return (
        <GraphTraversalVisualizer
          key="dfs"
          mode="dfs"
          graph={graph}
          setGraph={setGraph}
          directed={directed}
          setDirected={setDirected}
        />
      );
    case "mst":
      return <MSTVisualizer graph={graph} setGraph={setGraph} directed={directed} />;
    case "dijkstra":
      return (
        <DijkstraVisualizer
          graph={graph}
          setGraph={setGraph}
          directed={directed}
          setDirected={setDirected}
        />
      );
    case "floyd":
      return <FloydWarshallVisualizer />;
    case "warshall":
      return <WarshallVisualizer />;
    default:
      return (
        <GraphBasicsVisualizer
          graph={graph}
          setGraph={setGraph}
          directed={directed}
          setDirected={setDirected}
        />
      );
  }
}
