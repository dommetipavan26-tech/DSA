import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
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
import type { TopicId } from "../data/syllabus";

const COMPLEXITIES = [
  { id: "o1", label: "O(1)", name: "Constant", color: "#4cc38a", fn: (_n: number) => 1 },
  { id: "ologn", label: "O(log n)", name: "Logarithmic", color: "#60a5fa", fn: (n: number) => Math.max(1, Math.log2(n)) },
  { id: "on", label: "O(n)", name: "Linear", color: "#ededed", fn: (n: number) => n },
  { id: "onlogn", label: "O(n log n)", name: "Linearithmic", color: "#f59e0b", fn: (n: number) => n * Math.max(1, Math.log2(n)) },
  { id: "on2", label: "O(n^2)", name: "Quadratic", color: "#e5484d", fn: (n: number) => n * n },
  { id: "o2n", label: "O(2^n)", name: "Exponential", color: "#fb923c", fn: (n: number) => Math.pow(2, Math.min(n, 20)) },
];

export function AsymptoticVisualizer() {
  const [nVal, setNVal] = useState(16);
  const [customNText, setCustomNText] = useState("16");
  const [notation, setNotation] = useState<"bigO" | "omega" | "theta" | "littleO">("bigO");
  const [activeIds, setActiveIds] = useState<string[]>(["o1", "ologn", "on", "onlogn", "on2"]);

  const toggleCurve = (id: string) => {
    setActiveIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const applyCustomN = () => {
    const parsed = parseInt(customNText, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(2, Math.min(64, parsed));
      setNVal(clamped);
      setCustomNText(String(clamped));
    }
  };

  const chartData = useMemo(() => {
    const W = 640;
    const H = 268;
    const padL = 56;
    const padR = 82;
    const padT = 18;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxY = Math.max(
      10,
      ...activeIds
        .map((id) => COMPLEXITIES.find((c) => c.id === id)!)
        .filter(Boolean)
        .map((c) => c.fn(nVal))
    );
    const cappedMaxY = Math.min(maxY, nVal * nVal * 1.1 + 10);

    const rawCurves = COMPLEXITIES.filter((c) => activeIds.includes(c.id)).map((c) => {
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
      const endY = padT + plotH - Math.min(1, c.fn(nVal) / cappedMaxY) * plotH;
      return {
        ...c,
        points: pts.join(" "),
        endX: padL + plotW,
        endY,
        labelY: endY,
        ops: c.fn(nVal),
      };
    });

    // Enforce vertical separation so curve labels never overlap
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

  const notationDetails = {
    bigO: {
      title: "Big-O: O(g(n)) — Upper Bound (Worst Case)",
      formula: "0 <= f(n) <= c * g(n) for all n >= n0",
      desc: "Guarantees the algorithm never grows faster than g(n) beyond threshold n0.",
    },
    omega: {
      title: "Big-Omega: Omega(g(n)) — Lower Bound (Best Case)",
      formula: "0 <= c * g(n) <= f(n) for all n >= n0",
      desc: "Guarantees the algorithm requires at least c * g(n) operations.",
    },
    theta: {
      title: "Big-Theta: Theta(g(n)) — Tight Bound (Exact Growth)",
      formula: "c1 * g(n) <= f(n) <= c2 * g(n) for all n >= n0",
      desc: "Sandwiches f(n) from both above and below for an exact asymptotic rate.",
    },
    littleO: {
      title: "Little-o: o(g(n)) — Strict Upper Bound",
      formula: "lim (n -> inf) f(n) / g(n) = 0",
      desc: "Strictly slower growth than g(n), e.g., n is o(n^2) but not o(n).",
    },
  }[notation];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="asymptotic-tabs"
        value={notation}
        onChange={setNotation}
        options={[
          { id: "bigO", label: "Big-O (Upper)" },
          { id: "omega", label: "Omega (Lower)" },
          { id: "theta", label: "Theta (Tight)" },
          { id: "littleO", label: "Little-o (Strict)" },
        ]}
      />

      <VisualizerWorkspace
        badge={`n = ${nVal}`}
        statusText={`${notationDetails.title}  ·  ${notationDetails.formula}`}
        stage={
          <div className="space-y-4">
            <svg viewBox={`0 0 ${chartData.W} ${chartData.H}`} className="w-full overflow-visible">
              {/* Muted Horizontal Grid Lines */}
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
                    fill="#85858b"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Y Axis */}
              <line
                x1={chartData.padL}
                y1={chartData.padT}
                x2={chartData.padL}
                y2={chartData.padT + chartData.plotH}
                stroke="rgba(237,237,237,0.16)"
                strokeWidth="1"
              />
              {/* X Axis Labels */}
              <text
                x={chartData.padL}
                y={chartData.H - 8}
                textAnchor="start"
                fill="#85858b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                n = 1
              </text>
              <text
                x={chartData.padL + chartData.plotW / 2}
                y={chartData.H - 8}
                textAnchor="middle"
                fill="#85858b"
                fontSize="11"
              >
                Input size
              </text>
              <text
                x={chartData.padL + chartData.plotW}
                y={chartData.H - 8}
                textAnchor="end"
                fill="#85858b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                n = {nVal}
              </text>

              {/* Curves + De-collided Labels */}
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
                  </text>
                </g>
              ))}
            </svg>

            {/* Operation count strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {COMPLEXITIES.filter((c) => activeIds.includes(c.id)).map((c) => {
                const ops = c.fn(nVal);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#ededed]/[0.08] bg-[#19191b] px-3 py-2 text-xs"
                  >
                    <span className="shrink-0 font-mono font-medium" style={{ color: c.color }}>
                      {c.label}
                    </span>
                    <span className="font-mono tabular-nums text-[#a1a1a6]">
                      {ops > 1e6 ? ops.toExponential(1) : Math.round(ops).toLocaleString()} ops
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        }
        inspector={
          <>
            <InspectorBlock
              highlight
              title="Custom input size (n)"
              description="Enter n from 2 to 64 or drag to inspect curve growth"
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
                        color: on ? c.color : "#85858b",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </InspectorBlock>

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
              "Worst Case (Big-O): Maximum steps guaranteed never to be exceeded — most important in exams and production.",
              "Rule of thumb: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n).",
            ]}
            complexities={[
              { op: "Array Index", best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
              { op: "Binary Search", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" },
              { op: "Merge / Quick", best: "O(n log n)", avg: "O(n log n)", worst: "O(n^2) Quick", space: "O(n) / O(log n)" },
            ]}
          />
        }
      />
    </div>
  );
}

/* Module 1 Lab: Recursion vs Iteration (Factorial & Matrix Transpose) */
interface RecStep {
  stack: { label: string; result?: string; active?: boolean }[];
  msg: string;
  output?: string;
}

export function RecursionVisualizer() {
  const [mode, setMode] = useState<"factorial" | "transpose">("factorial");
  const [factInput, setFactInput] = useState("5");
  const [matrixInput, setMatrixInput] = useState("1 2 3\n4 5 6");
  const [steps, setSteps] = useState<RecStep[]>(() => buildFactorialSteps(5));
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1150 - speed * 95);
    return () => clearInterval(t);
  }, [playing, speed, steps.length]);

  function buildFactorialSteps(n: number): RecStep[] {
    const out: RecStep[] = [];
    const frames: { label: string; result?: string }[] = [];
    out.push({ stack: [], msg: `Ready to trace fact(${n}) recursion call stack.` });
    for (let k = n; k >= 1; k--) {
      frames.push({ label: `fact(${k})` });
      out.push({
        stack: frames.map((f, i) => ({ ...f, active: i === frames.length - 1 })),
        msg:
          k === 1
            ? `Base case reached: fact(1) returns 1.`
            : `Call fact(${k}) -> pushes frame, calls ${k} * fact(${k - 1})`,
      });
    }
    let acc = 1;
    for (let idx = frames.length - 1; idx >= 0; idx--) {
      const k = n - idx;
      acc *= k;
      frames[idx].result = String(acc);
      out.push({
        stack: frames.slice(0, idx + 1).map((f, i) => ({ ...f, active: i === idx })),
        msg: `Unwinding frame fact(${k}) -> returns ${acc}`,
        output: idx === 0 ? `Result: ${n}! = ${acc}` : undefined,
      });
    }
    return out;
  }

  function buildTransposeSteps(raw: string): RecStep[] {
    const rows = raw
      .trim()
      .split("\n")
      .map((r) => r.trim().split(/[\s,]+/).filter(Boolean))
      .filter((r) => r.length > 0);
    if (!rows.length) return [{ stack: [], msg: "Enter at least one matrix row." }];
    const R = rows.length;
    const C = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => Array.from({ length: C }, (_, j) => r[j] ?? "0"));
    const T = Array.from({ length: C }, () => Array(R).fill("·"));
    const out: RecStep[] = [
      {
        stack: [
          { label: `Input ${R}x${C}: [${norm.map((r) => r.join(" ")).join(" | ")}]` },
          { label: `Output ${C}x${R}: initialized` },
        ],
        msg: `Transposing ${R}x${C} matrix to ${C}x${R} (Time: O(R*C)).`,
      },
    ];
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) {
        T[j][i] = norm[i][j];
        out.push({
          stack: [
            { label: `Reading A[${i}][${j}] = ${norm[i][j]}`, active: true },
            { label: `Writing T[${j}][${i}] = ${norm[i][j]}` },
            { label: `T Matrix: ${T.map((r) => `[${r.join(" ")}]`).join(" ")}` },
          ],
          msg: `Swap indices: T[${j}][${i}] <- A[${i}][${j}] (${norm[i][j]})`,
          output: i === R - 1 && j === C - 1 ? `Transpose Complete (${C}x${R})` : undefined,
        });
      }
    }
    return out;
  }

  const runCustom = (targetMode = mode) => {
    setPlaying(false);
    setStepIdx(0);
    if (targetMode === "factorial") {
      const n = Math.max(1, Math.min(8, parseInt(factInput, 10) || 5));
      setFactInput(String(n));
      setSteps(buildFactorialSteps(n));
    } else {
      setSteps(buildTransposeSteps(matrixInput));
    }
  };

  const cur = steps[stepIdx] ?? steps[0];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="rec-tabs"
        value={mode}
        onChange={(m) => {
          setMode(m);
          runCustom(m);
        }}
        options={[
          { id: "factorial", label: "Factorial Call Stack (O(n) Space)" },
          { id: "transpose", label: "Matrix Transpose (O(R*C))" },
        ]}
      />

      <VisualizerWorkspace
        step={stepIdx}
        totalSteps={Math.max(0, steps.length - 1)}
        statusText={cur.msg}
        badge={mode === "factorial" ? "Recursion Stack" : "Matrix Transpose"}
        isPlaying={playing}
        stage={
          <div className="mx-auto flex max-w-lg flex-col gap-2.5 py-2">
            {cur.stack.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#85858b]">
                Press Play or Step Forward to trace execution
              </div>
            ) : (
              cur.stack.map((frame, i) => (
                <motion.div
                  key={`${frame.label}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center justify-between rounded-lg border px-4 py-2.5 font-mono text-sm ${
                    frame.active
                      ? "border-amber-500/70 bg-amber-500/10 text-[#ededed]"
                      : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
                  }`}
                >
                  <span>{frame.label}</span>
                  {frame.result && (
                    <span className="rounded bg-[#4cc38a]/15 px-2 py-0.5 text-xs tabular-nums text-[#4cc38a]">
                      = {frame.result}
                    </span>
                  )}
                </motion.div>
              ))
            )}
            {cur.output && (
              <div className="mt-2 rounded-lg border border-[#4cc38a]/35 bg-[#4cc38a]/10 px-4 py-2 text-center font-mono text-sm font-medium tabular-nums text-[#4cc38a]">
                {cur.output}
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
          />
        }
        inspector={
          mode === "factorial" ? (
            <InspectorBlock highlight title="Factorial input (n)" description="Enter n from 1 to 8 to trace stack frames">
              <div className="flex gap-2">
                <StudioInput
                  type="number"
                  min={1}
                  max={8}
                  value={factInput}
                  onChange={(e) => setFactInput(e.target.value)}
                />
                <StudioBtn variant="primary" onClick={() => runCustom("factorial")}>
                  Trace
                </StudioBtn>
              </div>
            </InspectorBlock>
          ) : (
            <InspectorBlock
              highlight
              title="Custom matrix input"
              description="One row per line, space-separated values"
            >
              <StudioTextarea
                rows={4}
                value={matrixInput}
                onChange={(e) => setMatrixInput(e.target.value)}
              />
              <StudioBtn variant="primary" className="mt-2 w-full" onClick={() => runCustom("transpose")}>
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
              "Matrix Transpose (R x C): Visits every element once -> Time O(R * C), Space O(R * C) for a new matrix.",
            ]}
            complexities={[
              { op: "Recursive Factorial", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
              { op: "Iterative Factorial", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)" },
              { op: "Matrix Transpose", best: "O(R*C)", avg: "O(R*C)", worst: "O(R*C)", space: "O(R*C)" },
            ]}
            javaCode={`static long factRec(int n) {\n  if (n <= 1) return 1;\n  return n * factRec(n - 1);\n}\n\nstatic long factIter(int n) {\n  long ans = 1;\n  for (int i = 2; i <= n; i++) ans *= i;\n  return ans;\n}`}
          />
        }
      />
    </div>
  );
}

export function renderAnalysisTopic(topicId: TopicId) {
  if (topicId === "recursion") return <RecursionVisualizer />;
  return <AsymptoticVisualizer />;
}
