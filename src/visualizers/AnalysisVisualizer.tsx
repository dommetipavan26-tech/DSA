import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
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
  StudioTextarea,
} from "../components/ui/input-helpers";
import { usePlayback } from "../hooks/usePlayback";
import type { TopicId } from "../data/syllabus";

const COMPLEXITIES = [
  { id: "o1", label: "O(1)", name: "Constant", color: "#4cc38a", fn: (_n: number) => 1 },
  {
    id: "ologn",
    label: "O(log n)",
    name: "Logarithmic",
    color: "#60a5fa",
    fn: (n: number) => Math.max(1, Math.log2(n)),
  },
  { id: "on", label: "O(n)", name: "Linear", color: "#ededed", fn: (n: number) => n },
  {
    id: "onlogn",
    label: "O(n log n)",
    name: "Linearithmic",
    color: "#f59e0b",
    fn: (n: number) => n * Math.max(1, Math.log2(n)),
  },
  { id: "on2", label: "O(n^2)", name: "Quadratic", color: "#e5484d", fn: (n: number) => n * n },
  {
    id: "o2n",
    label: "O(2^n)",
    name: "Exponential",
    color: "#fb923c",
    fn: (n: number) => Math.pow(2, n),
  },
];

function formatOps(ops: number): string {
  if (!Number.isFinite(ops)) return "∞";
  if (ops >= 1e6) return ops.toExponential(2);
  return Math.round(ops).toLocaleString();
}

function AsymptoticVisualizer() {
  const [nVal, setNVal] = useState(16);
  const [customNText, setCustomNText] = useState("16");
  const [notation, setNotation] = useState<"bigO" | "omega" | "theta" | "littleO">("bigO");
  const [chartMode, setChartMode] = useState<"curves" | "bound">("curves");
  const [activeIds, setActiveIds] = useState<string[]>(["o1", "ologn", "on", "onlogn", "on2"]);

  const toggleCurve = (id: string) => {
    setActiveIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const applyCustomN = () => {
    const parsed = parseInt(customNText, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(2, Math.min(64, parsed));
      setNVal(clamped);
      setCustomNText(String(clamped));
    }
  };

  const chartData = useMemo(() => {
    const W = 640;
    const H = 268;
    const padL = 56;
    const padR = 92;
    const padT = 18;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const selectedCurves = COMPLEXITIES.filter((c) => activeIds.includes(c.id));
    const maxNonExp = Math.max(
      10,
      ...selectedCurves.filter((c) => c.id !== "o2n").map((c) => c.fn(nVal))
    );
    const rawMax = Math.max(10, ...selectedCurves.map((c) => c.fn(nVal)));
    // Keep polynomial curves readable when exponential explodes off-scale
    const cappedMaxY = Math.min(rawMax, Math.max(maxNonExp * 1.15, nVal * nVal * 1.1 + 10));

    const rawCurves = selectedCurves.map((c) => {
      const pts: string[] = [];
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const xVal = 1 + (s / steps) * (nVal - 1);
        const rawY = c.fn(xVal);
        const x = padL + (s / steps) * plotW;
        const normY = Math.min(1, rawY / cappedMaxY);
        const y = padT + plotH - normY * plotH;
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const ops = c.fn(nVal);
      const offScale = ops > cappedMaxY * 1.02;
      const endY = padT + plotH - Math.min(1, ops / cappedMaxY) * plotH;
      return {
        ...c,
        points: pts.join(" "),
        endX: padL + plotW,
        endY,
        labelY: endY,
        ops,
        offScale,
      };
    });

    const sorted = [...rawCurves].sort((a, b) => a.endY - b.endY);
    const minGap = 16;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].labelY - sorted[i - 1].labelY < minGap) {
        sorted[i].labelY = sorted[i - 1].labelY + minGap;
      }
    }
    const maxLabelY = padT + plotH - 2;
    if (sorted.length && sorted[sorted.length - 1].labelY > maxLabelY) {
      sorted[sorted.length - 1].labelY = maxLabelY;
      for (let i = sorted.length - 2; i >= 0; i--) {
        if (sorted[i + 1].labelY - sorted[i].labelY < minGap) {
          sorted[i].labelY = Math.max(padT + 6, sorted[i + 1].labelY - minGap);
        }
      }
    }

    const yTicks = [0, 0.5, 1].map((frac) => {
      const val = Math.round(frac * cappedMaxY);
      return {
        y: padT + plotH - frac * plotH,
        label: val > 999 ? `${(val / 1000).toFixed(1)}k` : String(val),
      };
    });

    return { W, H, padL, padT, plotW, plotH, curves: sorted, yTicks };
  }, [nVal, activeIds]);

  // Formal bound diagram showing concrete f(n) = n^2 + 6n + 12 vs bounding curve(s)
  const boundData = useMemo(() => {
    const W = 640;
    const H = 268;
    const padL = 56;
    const padR = 112;
    const padT = 22;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxN = Math.max(12, nVal);

    const fFn = (x: number) => x * x + 6 * x + 12;
    const upperFn =
      notation === "littleO"
        ? (x: number) => 0.18 * x * x * x
        : (x: number) => 2 * x * x;
    const lowerFn = (x: number) => 0.65 * x * x;

    const n0 = notation === "bigO" ? 8 : notation === "omega" ? 1 : notation === "theta" ? 8 : 10;

    const maxY = Math.max(
      fFn(maxN),
      notation === "omega" ? fFn(maxN) * 1.15 : upperFn(maxN)
    );

    const toX = (x: number) => padL + ((x - 1) / (maxN - 1)) * plotW;
    const toY = (y: number) => padT + plotH - Math.min(1, y / maxY) * plotH;

    const samples = 40;
    const fPts: string[] = [];
    const uPts: string[] = [];
    const lPts: string[] = [];
    const regionPts: string[] = [];

    for (let s = 0; s <= samples; s++) {
      const x = 1 + (s / samples) * (maxN - 1);
      fPts.push(`${toX(x).toFixed(1)},${toY(fFn(x)).toFixed(1)}`);
      uPts.push(`${toX(x).toFixed(1)},${toY(upperFn(x)).toFixed(1)}`);
      lPts.push(`${toX(x).toFixed(1)},${toY(lowerFn(x)).toFixed(1)}`);
    }

    // Build shaded polygon for x >= n0
    if (maxN > n0) {
      const topEdge: string[] = [];
      const botEdge: string[] = [];
      for (let s = 0; s <= 24; s++) {
        const x = n0 + (s / 24) * (maxN - n0);
        const px = toX(x).toFixed(1);
        if (notation === "bigO" || notation === "littleO") {
          topEdge.push(`${px},${toY(upperFn(x)).toFixed(1)}`);
          botEdge.unshift(`${px},${toY(fFn(x)).toFixed(1)}`);
        } else if (notation === "omega") {
          topEdge.push(`${px},${toY(fFn(x)).toFixed(1)}`);
          botEdge.unshift(`${px},${toY(lowerFn(x)).toFixed(1)}`);
        } else {
          topEdge.push(`${px},${toY(upperFn(x)).toFixed(1)}`);
          botEdge.unshift(`${px},${toY(lowerFn(x)).toFixed(1)}`);
        }
      }
      regionPts.push(...topEdge, ...botEdge);
    }

    return {
      W,
      H,
      padL,
      padT,
      plotW,
      plotH,
      maxN,
      n0,
      n0X: toX(Math.min(n0, maxN)),
      fPts: fPts.join(" "),
      uPts: uPts.join(" "),
      lPts: lPts.join(" "),
      regionPolygon: regionPts.join(" "),
      fEndY: toY(fFn(maxN)),
      uEndY: toY(upperFn(maxN)),
      lEndY: toY(lowerFn(maxN)),
      ratio: (fFn(maxN) / upperFn(maxN)).toFixed(3),
    };
  }, [nVal, notation]);

  const notationDetails = {
    bigO: {
      title: "Big-O: O(g(n)) — Upper Bound (Worst Case)",
      formula: "0 <= f(n) <= c * g(n) for all n >= n0",
      desc: "Guarantees f(n) never grows faster than c * g(n) once n crosses threshold n0.",
      example: "f(n) = n^2 + 6n + 12 <= 2n^2 for all n >= 8",
    },
    omega: {
      title: "Big-Omega: Omega(g(n)) — Lower Bound (Best Case)",
      formula: "0 <= c * g(n) <= f(n) for all n >= n0",
      desc: "Guarantees the algorithm requires at least c * g(n) operations beyond n0.",
      example: "f(n) = n^2 + 6n + 12 >= 0.65n^2 for all n >= 1",
    },
    theta: {
      title: "Big-Theta: Theta(g(n)) — Tight Bound (Exact Growth)",
      formula: "c1 * g(n) <= f(n) <= c2 * g(n) for all n >= n0",
      desc: "Sandwiches f(n) between a lower and upper constant multiple of g(n).",
      example: "0.65n^2 <= n^2 + 6n + 12 <= 2n^2 for all n >= 8",
    },
    littleO: {
      title: "Little-o: o(g(n)) — Strict Upper Bound",
      formula: "lim (n -> inf) f(n) / g(n) = 0",
      desc: "Strictly slower growth than g(n): n^2 is o(n^3) because f(n)/g(n) shrinks to 0.",
      example: "f(n) = n^2 + 6n + 12 is o(n^3); ratio f(n)/(0.18n^3) -> 0",
    },
  }[notation];

  const anyOffScale = chartMode === "curves" && chartData.curves.some((c) => c.offScale);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MorphingPillTabs
          layoutId="asymptotic-tabs"
          value={notation}
          onChange={(next) => {
            setNotation(next);
            setChartMode("bound");
          }}
          options={[
            { id: "bigO", label: "Big-O (Upper)" },
            { id: "omega", label: "Omega (Lower)" },
            { id: "theta", label: "Theta (Tight)" },
            { id: "littleO", label: "Little-o (Strict)" },
          ]}
        />

        <MorphingPillTabs
          layoutId="asymptotic-view-mode"
          value={chartMode}
          onChange={setChartMode}
          options={[
            { id: "curves", label: "Growth Curves" },
            { id: "bound", label: "Formal Bound" },
          ]}
        />
      </div>

      <VisualizerWorkspace
        badge={`n = ${nVal}`}
        statusText={`${notationDetails.title}  ·  ${notationDetails.formula}`}
        notice={
          anyOffScale
            ? `O(2^n) reaches ${formatOps(Math.pow(2, nVal))} ops at n = ${nVal} — clipped at the chart ceiling so polynomial curves remain readable.`
            : undefined
        }
        stage={
          chartMode === "curves" ? (
            <div className="space-y-4">
              <svg viewBox={`0 0 ${chartData.W} ${chartData.H}`} className="w-full overflow-visible">
                {chartData.yTicks.map((t, idx) => (
                  <g key={idx}>
                    <line
                      x1={chartData.padL}
                      y1={t.y}
                      x2={chartData.padL + chartData.plotW}
                      y2={t.y}
                      stroke="rgba(237,237,237,0.07)"
                      strokeDasharray={idx === 0 ? undefined : "3 4"}
                      strokeWidth="1"
                    />
                    <text
                      x={chartData.padL - 8}
                      y={t.y}
                      textAnchor="end"
                      dominantBaseline="central"
                      fill="#93939a"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}

                <line
                  x1={chartData.padL}
                  y1={chartData.padT}
                  x2={chartData.padL}
                  y2={chartData.padT + chartData.plotH}
                  stroke="rgba(237,237,237,0.16)"
                  strokeWidth="1"
                />
                <text
                  x={chartData.padL}
                  y={chartData.H - 8}
                  textAnchor="start"
                  fill="#93939a"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  n = 1
                </text>
                <text
                  x={chartData.padL + chartData.plotW / 2}
                  y={chartData.H - 8}
                  textAnchor="middle"
                  fill="#93939a"
                  fontSize="11"
                >
                  Input size
                </text>
                <text
                  x={chartData.padL + chartData.plotW}
                  y={chartData.H - 8}
                  textAnchor="end"
                  fill="#93939a"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  n = {nVal}
                </text>

                {chartData.curves.map((c) => (
                  <g key={c.id}>
                    <polyline
                      fill="none"
                      stroke={c.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      points={c.points}
                    />
                    <circle cx={c.endX} cy={c.endY} r="3.5" fill={c.color} />
                    <line
                      x1={c.endX + 4}
                      y1={c.endY}
                      x2={c.endX + 10}
                      y2={c.labelY}
                      stroke={c.color}
                      strokeOpacity="0.45"
                      strokeWidth="1"
                    />
                    <text
                      x={c.endX + 13}
                      y={c.labelY}
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={c.color}
                      fontSize="11"
                      fontWeight="500"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {c.label}
                      {c.offScale ? " ↑" : ""}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {COMPLEXITIES.filter((c) => activeIds.includes(c.id)).map((c) => {
                  const ops = c.fn(nVal);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2 text-xs"
                    >
                      <span className="shrink-0 font-mono font-medium" style={{ color: c.color }}>
                        {c.label}
                      </span>
                      <span className="truncate font-mono tabular-nums text-[#a1a1a6]">
                        {formatOps(ops)} ops
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <svg viewBox={`0 0 ${boundData.W} ${boundData.H}`} className="w-full overflow-visible">
                {/* Axes */}
                <line
                  x1={boundData.padL}
                  y1={boundData.padT}
                  x2={boundData.padL}
                  y2={boundData.padT + boundData.plotH}
                  stroke="rgba(237,237,237,0.16)"
                />
                <line
                  x1={boundData.padL}
                  y1={boundData.padT + boundData.plotH}
                  x2={boundData.padL + boundData.plotW}
                  y2={boundData.padT + boundData.plotH}
                  stroke="rgba(237,237,237,0.16)"
                />

                {/* Valid asymptotic region for n >= n0 */}
                {boundData.regionPolygon && (
                  <polygon
                    points={boundData.regionPolygon}
                    fill="rgba(245, 158, 11, 0.12)"
                  />
                )}

                {/* Threshold n0 vertical line */}
                <line
                  x1={boundData.n0X}
                  y1={boundData.padT}
                  x2={boundData.n0X}
                  y2={boundData.padT + boundData.plotH}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x={boundData.n0X + 5}
                  y={boundData.padT + 10}
                  fill="#f59e0b"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  n0 = {boundData.n0}
                </text>

                {/* Upper bound curve */}
                {(notation === "bigO" || notation === "theta" || notation === "littleO") && (
                  <g>
                    <polyline
                      fill="none"
                      stroke="#e5484d"
                      strokeWidth="2"
                      strokeDasharray={notation === "littleO" ? "6 3" : undefined}
                      points={boundData.uPts}
                    />
                    <text
                      x={boundData.padL + boundData.plotW + 8}
                      y={Math.max(boundData.padT + 8, boundData.uEndY)}
                      dominantBaseline="central"
                      fill="#e5484d"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {notation === "littleO" ? "0.18n^3" : "c2·g(n)"}
                    </text>
                  </g>
                )}

                {/* Lower bound curve */}
                {(notation === "omega" || notation === "theta") && (
                  <g>
                    <polyline
                      fill="none"
                      stroke="#4cc38a"
                      strokeWidth="2"
                      points={boundData.lPts}
                    />
                    <text
                      x={boundData.padL + boundData.plotW + 8}
                      y={Math.min(boundData.padT + boundData.plotH - 6, boundData.lEndY)}
                      dominantBaseline="central"
                      fill="#4cc38a"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      c1·g(n)
                    </text>
                  </g>
                )}

                {/* Sample algorithm f(n) */}
                <polyline
                  fill="none"
                  stroke="#ededed"
                  strokeWidth="2.4"
                  points={boundData.fPts}
                />
                <text
                  x={boundData.padL + boundData.plotW + 8}
                  y={boundData.fEndY}
                  dominantBaseline="central"
                  fill="#ededed"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  f(n)
                </text>

                <text
                  x={boundData.padL}
                  y={boundData.H - 8}
                  fill="#93939a"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  n = 1
                </text>
                <text
                  x={boundData.padL + boundData.plotW}
                  y={boundData.H - 8}
                  textAnchor="end"
                  fill="#93939a"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  n = {boundData.maxN}
                </text>
              </svg>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2 font-mono text-xs text-[#a1a1a6]">
                <span>{notationDetails.example}</span>
                {notation === "littleO" && (
                  <span className="text-amber-400">
                    f({boundData.maxN}) / g({boundData.maxN}) = {boundData.ratio}
                  </span>
                )}
              </div>
            </div>
          )
        }
        inspector={
          <>
            <InspectorBlock
              highlight
              title="Custom input size (n)"
              description="Enter n from 2 to 64 or drag to inspect curve growth and bounds"
            >
              <div className="flex gap-2">
                <StudioInput
                  type="number"
                  min={2}
                  max={64}
                  value={customNText}
                  onChange={(e) => setCustomNText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustomN()}
                />
                <StudioBtn variant="primary" onClick={applyCustomN}>
                  Apply
                </StudioBtn>
              </div>
              <input
                type="range"
                min={2}
                max={64}
                value={nVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setNVal(v);
                  setCustomNText(String(v));
                }}
                aria-label="Input size n"
                className="mt-3 h-1.5 w-full cursor-pointer accent-amber-500"
              />
            </InspectorBlock>

            {chartMode === "curves" && (
              <InspectorBlock title="Toggle complexity curves">
                <div className="flex flex-wrap gap-1.5">
                  {COMPLEXITIES.map((c) => {
                    const on = activeIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCurve(c.id)}
                        className="rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition-colors duration-150 cursor-pointer"
                        style={{
                          borderColor: on ? c.color : "rgba(237,237,237,0.08)",
                          backgroundColor: on ? `${c.color}1c` : "#232325",
                          color: on ? c.color : "#93939a",
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </InspectorBlock>
            )}

            <InspectorBlock title="Presets">
              <PresetRow
                presets={[
                  { id: "small", label: "n = 8" },
                  { id: "med", label: "n = 20" },
                  { id: "large", label: "n = 48" },
                ]}
                onSelect={(id) => {
                  const v = id === "small" ? 8 : id === "med" ? 20 : 48;
                  setNVal(v);
                  setCustomNText(String(v));
                }}
              />
            </InspectorBlock>

            <InspectorBlock title="Selected notation">
              <p className="text-xs leading-relaxed text-[#a1a1a6]">{notationDetails.desc}</p>
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="Asymptotic analysis ignores hardware speed and constant factors so we can compare how an algorithm scales as input n grows large."
            keyPoints={[
              "Best Case (Omega): Minimum steps needed (e.g., element found at index 0 in Linear Search -> O(1)).",
              "Average Case (Theta): Expected cost across typical random inputs.",
              "Worst Case (Big-O): Maximum steps guaranteed never to be exceeded.",
              "Rule of thumb: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n).",
            ]}
            complexities={[
              { op: "Array Index", best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
              { op: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
              { op: "Merge / Quick", best: "O(n log n)", avg: "O(n log n)", worst: "O(n^2) Quick", space: "O(n) / O(log n)" },
            ]}
            javaCode={`// O(1) constant
int first(int[] a) { return a[0]; }

// O(log n) logarithmic
int halves(int n) {
  int steps = 0;
  for (int x = n; x > 1; x /= 2) steps++;
  return steps;
}

// O(n^2) quadratic
int pairs(int n) {
  int count = 0;
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) count++;
  return count;
}`}
          />
        }
      />
    </div>
  );
}

interface FactorialStep {
  stack: { label: string; result?: string; active?: boolean }[];
  iterState: { i: number | string; acc: number; note: string };
  msg: string;
  output?: string;
}

interface TransposeStep {
  src: string[][];
  dst: string[][];
  activeR: number;
  activeC: number;
  msg: string;
  done?: boolean;
}

function buildFactorialSteps(n: number): FactorialStep[] {
  const out: FactorialStep[] = [
    {
      stack: [],
      iterState: { i: "—", acc: 1, note: "Ready: acc = 1 (O(1) memory)" },
      msg: `Ready to trace fact(${n}): compare O(n) recursive stack vs O(1) iterative loop.`,
    },
  ];

  if (n === 0) {
    out.push({
      stack: [{ label: "fact(0)", result: "1", active: true }],
      iterState: { i: "skip", acc: 1, note: "Loop 2..0 does not run -> returns 1" },
      msg: "Base case: fact(0) = 1 immediately in both recursion and iteration.",
      output: "Result: 0! = 1",
    });
    return out;
  }

  const frames: { label: string; result?: string }[] = [];
  for (let k = n; k >= 1; k--) {
    frames.push({ label: `fact(${k})` });
    out.push({
      stack: frames.map((f, i) => ({ ...f, active: i === frames.length - 1 })),
      iterState: {
        i: 1,
        acc: 1,
        note: "Recursion is still pushing frames; iterative loop awaits multiplication.",
      },
      msg:
        k === 1
          ? "Base case reached: fact(1) returns 1."
          : `Call fact(${k}) -> push stack frame, recurse on fact(${k - 1}).`,
    });
  }

  let acc = 1;
  for (let idx = frames.length - 1; idx >= 0; idx--) {
    const k = n - idx;
    acc *= k;
    frames[idx].result = String(acc);
    out.push({
      stack: frames.slice(0, idx + 1).map((f, i) => ({ ...f, active: i === idx })),
      iterState: {
        i: k,
        acc,
        note: k === 1 ? "acc = 1 * 1 = 1" : `Loop i = ${k}: acc = ${acc / k} * ${k} = ${acc}`,
      },
      msg: `Unwind fact(${k}) = ${acc}  |  Iterative i=${k} -> acc=${acc}`,
      output: idx === 0 ? `Result: ${n}! = ${acc}` : undefined,
    });
  }

  return out;
}

function buildTransposeSteps(raw: string): TransposeStep[] {
  const rows = raw
    .trim()
    .split("\n")
    .map((r) => r.trim().split(/[\s,]+/).filter(Boolean))
    .filter((r) => r.length > 0)
    .slice(0, 6);

  if (!rows.length) {
    return [
      {
        src: [],
        dst: [],
        activeR: -1,
        activeC: -1,
        msg: "Enter at least one matrix row (space-separated values).",
      },
    ];
  }

  const R = rows.length;
  const C = Math.min(6, Math.max(...rows.map((r) => r.length)));
  const norm = rows.map((r) => Array.from({ length: C }, (_, j) => r[j] ?? "0"));
  const T = Array.from({ length: C }, () => Array<string>(R).fill("·"));

  const out: TransposeStep[] = [
    {
      src: norm,
      dst: T.map((r) => [...r]),
      activeR: -1,
      activeC: -1,
      msg: `Ready to transpose ${R}x${C} matrix A into ${C}x${R} matrix T (Time: O(R*C)).`,
    },
  ];

  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      T[j][i] = norm[i][j];
      out.push({
        src: norm,
        dst: T.map((r) => [...r]),
        activeR: i,
        activeC: j,
        msg: `Copy A[${i}][${j}] = ${norm[i][j]} -> T[${j}][${i}]`,
        done: i === R - 1 && j === C - 1,
      });
    }
  }
  return out;
}

function RecursionVisualizer() {
  const [mode, setMode] = useState<"factorial" | "transpose">("factorial");
  const [factInput, setFactInput] = useState("5");
  const [factN, setFactN] = useState(5);
  const [matrixInput, setMatrixInput] = useState("1 2 3\n4 5 6");
  const [matrixCommitted, setMatrixCommitted] = useState("1 2 3\n4 5 6");

  const factSteps = useMemo(() => buildFactorialSteps(factN), [factN]);
  const transSteps = useMemo(() => buildTransposeSteps(matrixCommitted), [matrixCommitted]);

  const totalSteps =
    mode === "factorial"
      ? Math.max(0, factSteps.length - 1)
      : Math.max(0, transSteps.length - 1);

  const pb = usePlayback({
    totalSteps,
    resetKey: `${mode}-${factN}-${matrixCommitted}`,
  });

  const runCustom = (targetMode = mode) => {
    if (targetMode === "factorial") {
      const parsed = parseInt(factInput, 10);
      const n = Number.isNaN(parsed) ? 5 : Math.max(0, Math.min(8, parsed));
      setFactInput(String(n));
      setFactN(n);
    } else {
      setMatrixCommitted(matrixInput);
    }
    pb.reset();
  };

  const curFact = factSteps[pb.stepIdx] ?? factSteps[0];
  const curTrans = transSteps[pb.stepIdx] ?? transSteps[0];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="rec-tabs"
        value={mode}
        onChange={(m) => setMode(m)}
        options={[
          { id: "factorial", label: "Factorial: Recursion vs Iteration" },
          { id: "transpose", label: "Matrix Transpose (2D Grid)" },
        ]}
      />

      <VisualizerWorkspace
        step={pb.stepIdx}
        totalSteps={totalSteps}
        statusText={mode === "factorial" ? curFact.msg : curTrans.msg}
        badge={mode === "factorial" ? `n = ${factN}` : "Matrix Transpose"}
        isPlaying={pb.playing}
        stage={
          mode === "factorial" ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Left: Recursive Call Stack (grows upward like a real stack) */}
                <div className="flex flex-col rounded-xl border border-[#ededed]/[0.08] bg-[#141415] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#ededed]">Recursive Call Stack</span>
                    <span className="rounded bg-amber-500/12 px-2 py-0.5 font-mono text-amber-300">
                      Space: O({curFact.stack.length || "n"})
                    </span>
                  </div>
                  <div className="flex min-h-[190px] flex-col-reverse justify-start gap-2 rounded-lg border border-[#ededed]/[0.06] bg-[#0f0f10] p-3">
                    {curFact.stack.length === 0 ? (
                      <div className="my-auto text-center text-xs text-[#93939a]">
                        Press Play or Step Forward to push stack frames
                      </div>
                    ) : (
                      curFact.stack.map((frame, i) => (
                        <motion.div
                          key={`${frame.label}-${i}`}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs ${
                            frame.active
                              ? "border-amber-500/70 bg-amber-500/12 text-[#ededed]"
                              : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
                          }`}
                        >
                          <span>{frame.label}</span>
                          {frame.result && (
                            <span className="rounded bg-[#4cc38a]/15 px-1.5 py-0.5 tabular-nums text-[#4cc38a]">
                              returns {frame.result}
                            </span>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Iterative Loop O(1) registers */}
                <div className="flex flex-col rounded-xl border border-[#ededed]/[0.08] bg-[#141415] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#ededed]">Iterative Loop State</span>
                    <span className="rounded bg-[#4cc38a]/15 px-2 py-0.5 font-mono text-[#4cc38a]">
                      Space: O(1)
                    </span>
                  </div>
                  <div className="flex min-h-[190px] flex-col justify-center gap-3 rounded-lg border border-[#ededed]/[0.06] bg-[#0f0f10] p-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] p-3 text-center">
                        <div className="font-mono text-[11px] text-[#93939a]">loop index i</div>
                        <div className="mt-1 font-mono text-lg font-medium tabular-nums text-amber-400">
                          {curFact.iterState.i}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] p-3 text-center">
                        <div className="font-mono text-[11px] text-[#93939a]">accumulator</div>
                        <div className="mt-1 font-mono text-lg font-medium tabular-nums text-[#4cc38a]">
                          {curFact.iterState.acc}
                        </div>
                      </div>
                    </div>
                    <p className="rounded-lg border border-[#ededed]/[0.06] bg-[#19191b] px-3 py-2 font-mono text-xs text-[#a1a1a6]">
                      {curFact.iterState.note}
                    </p>
                  </div>
                </div>
              </div>

              {curFact.output && (
                <div className="rounded-lg border border-[#4cc38a]/35 bg-[#4cc38a]/10 px-4 py-2 text-center font-mono text-sm font-medium tabular-nums text-[#4cc38a]">
                  {curFact.output}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-5 py-4 sm:flex-row">
              {curTrans.src.length === 0 ? (
                <div className="text-sm text-[#93939a]">Enter matrix rows in Input &amp; controls</div>
              ) : (
                <>
                  <div className="space-y-2 text-center">
                    <div className="font-mono text-xs text-[#a1a1a6]">
                      Source Matrix A ({curTrans.src.length} × {curTrans.src[0]?.length ?? 0})
                    </div>
                    <table className="mx-auto border-collapse font-mono text-sm tabular-nums">
                      <tbody>
                        {curTrans.src.map((row, r) => (
                          <tr key={r}>
                            {row.map((val, c) => {
                              const active = curTrans.activeR === r && curTrans.activeC === c;
                              return (
                                <td
                                  key={c}
                                  className={`h-11 w-11 border text-center font-medium transition-colors duration-150 ${
                                    active
                                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                                      : "border-[#ededed]/[0.1] bg-[#19191b] text-[#ededed]"
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

                  <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-[#93939a] sm:rotate-0" strokeWidth={1.5} />

                  <div className="space-y-2 text-center">
                    <div className="font-mono text-xs text-[#a1a1a6]">
                      Transposed T ({curTrans.dst.length} × {curTrans.dst[0]?.length ?? 0})
                    </div>
                    <table className="mx-auto border-collapse font-mono text-sm tabular-nums">
                      <tbody>
                        {curTrans.dst.map((row, r) => (
                          <tr key={r}>
                            {row.map((val, c) => {
                              const active = curTrans.activeC === r && curTrans.activeR === c;
                              const filled = val !== "·";
                              return (
                                <td
                                  key={c}
                                  className={`h-11 w-11 border text-center font-medium transition-colors duration-150 ${
                                    active
                                      ? "border-[#4cc38a] bg-[#4cc38a]/20 text-[#4cc38a]"
                                      : filled
                                      ? "border-[#ededed]/[0.12] bg-[#232325] text-[#ededed]"
                                      : "border-[#ededed]/[0.07] bg-[#141415] text-[#93939a]/50"
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
                </>
              )}
            </div>
          )
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
              mode === "factorial"
                ? [
                    { label: "Active stack frame", colorClass: "bg-amber-500" },
                    { label: "Returned value / O(1) accumulator", colorClass: "bg-[#4cc38a]" },
                  ]
                : [
                    { label: "Reading A[i][j]", colorClass: "bg-amber-500" },
                    { label: "Writing T[j][i]", colorClass: "bg-[#4cc38a]" },
                  ]
            }
          />
        }
        inspector={
          mode === "factorial" ? (
            <>
              <InspectorBlock
                highlight
                title="Factorial input (n)"
                description="Enter n from 0 to 8 to compare call stack vs loop state"
              >
                <div className="flex gap-2">
                  <StudioInput
                    type="number"
                    min={0}
                    max={8}
                    value={factInput}
                    onChange={(e) => setFactInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runCustom("factorial")}
                  />
                  <StudioBtn variant="primary" onClick={() => runCustom("factorial")}>
                    Trace
                  </StudioBtn>
                </div>
              </InspectorBlock>
              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "0", label: "0! (Base)" },
                    { id: "4", label: "4!" },
                    { id: "6", label: "6!" },
                  ]}
                  onSelect={(id) => {
                    const n = Number(id);
                    setFactInput(id);
                    setFactN(n);
                  }}
                />
              </InspectorBlock>
            </>
          ) : (
            <InspectorBlock
              highlight
              title="Custom matrix input"
              description="One row per line, space-separated values (up to 6x6)"
            >
              <StudioTextarea
                rows={4}
                value={matrixInput}
                onChange={(e) => setMatrixInput(e.target.value)}
              />
              <StudioBtn
                variant="primary"
                className="mt-2 w-full"
                onClick={() => runCustom("transpose")}
              >
                Transpose Matrix
              </StudioBtn>
            </InspectorBlock>
          )
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="Recursion delegates a smaller subproblem onto the call stack (O(n) extra stack memory), while iteration loops in O(1) extra space."
            keyPoints={[
              "Recursive Factorial: Time O(n), Space O(n) due to n pending stack frames.",
              "Iterative Factorial: Time O(n), Space O(1) using one accumulator variable.",
              "Matrix Transpose (R x C): Visits every cell once -> Time O(R * C), Space O(R * C) for a new matrix.",
            ]}
            complexities={[
              { op: "Recursive Factorial", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
              { op: "Iterative Factorial", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)" },
              { op: "Matrix Transpose", best: "O(R*C)", avg: "O(R*C)", worst: "O(R*C)", space: "O(R*C)" },
            ]}
            javaCode={`static long factRec(int n) {
  if (n <= 1) return 1;
  return n * factRec(n - 1);
}

static long factIter(int n) {
  long ans = 1;
  for (int i = 2; i <= n; i++) ans *= i;
  return ans;
}`}
          />
        }
      />
    </div>
  );
}

export function AnalysisSectionRouter({ topicId }: { topicId: TopicId }) {
  if (topicId === "recursion") return <RecursionVisualizer />;
  return <AsymptoticVisualizer />;
}
