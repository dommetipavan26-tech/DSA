import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import {
  ConceptNotesGrid,
  MorphingPillTabs,
  VisualizerWorkspace,
} from "../components/ui/primitives-21st";
import {
  InspectorBlock,
  PresetRow,
  StudioBtn,
  StudioInput,
} from "../components/ui/input-helpers";
import type { TopicId } from "../data/syllabus";

function parseNums(text: string): number[] {
  return text
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && Number.isFinite(n))
    .slice(0, 12);
}

/* =========================================================
   1. ARRAY / LIST
   ========================================================= */
function ArrayVisualizer() {
  const [items, setItems] = useState<number[]>([12, 27, 45, 63, 19]);
  const [bulkInput, setBulkInput] = useState("12, 27, 45, 63, 19");
  const [valInput, setValInput] = useState("99");
  const [idxInput, setIdxInput] = useState("2");
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [status, setStatus] = useState("Loaded 5 elements. Try inserting, deleting, or entering your own list.");

  const applyBulk = () => {
    const next = parseNums(bulkInput);
    if (!next.length) return setStatus("Enter comma-separated numbers (e.g. 10, 20, 30).");
    setItems(next);
    setHighlightIdx(null);
    setStatus(`Initialized array with ${next.length} elements.`);
  };

  const insertAt = () => {
    const val = Number(valInput);
    const idx = Math.max(0, Math.min(items.length, Number(idxInput) || 0));
    if (Number.isNaN(val)) return;
    const next = [...items];
    next.splice(idx, 0, val);
    setItems(next);
    setHighlightIdx(idx);
    setStatus(`Inserted ${val} at index ${idx}. Shifted ${items.length - idx} element(s) right.`);
  };

  const deleteAt = () => {
    const idx = Number(idxInput);
    if (Number.isNaN(idx) || idx < 0 || idx >= items.length) {
      return setStatus(`Index ${idxInput} is out of bounds [0..${items.length - 1}].`);
    }
    const removed = items[idx];
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    setHighlightIdx(null);
    setStatus(`Deleted ${removed} from index ${idx}. Shifted ${items.length - idx - 1} element(s) left.`);
  };

  const searchVal = () => {
    const val = Number(valInput);
    const idx = items.indexOf(val);
    setHighlightIdx(idx >= 0 ? idx : null);
    setStatus(idx >= 0 ? `Found ${val} at index [${idx}].` : `${val} is not present in the array.`);
  };

  return (
    <VisualizerWorkspace
      badge={`Length: ${items.length}`}
      statusText={status}
      stage={
        <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3 py-6">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <div className="text-sm text-[#85858b]">Array is empty — add elements from Input &amp; controls</div>
            ) : (
              items.map((v, i) => (
                <motion.div
                  key={`${i}-${v}`}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`flex h-14 min-w-[54px] items-center justify-center rounded-xl border-2 px-3 font-mono text-base font-medium tabular-nums transition-colors duration-150 ${
                      highlightIdx === i
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                        : "border-violet-500/55 bg-[#19191b] text-[#ededed] shadow-[0_0_14px_rgba(139,92,246,0.2)]"
                    }`}
                  >
                    {v}
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#85858b]">[{i}]</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      }
      inspector={
        <>
          <InspectorBlock highlight title="Your Custom Array" description="Enter comma-separated numbers (max 12).">
            <div className="flex gap-2">
              <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="10, 20, 30" />
              <StudioBtn variant="primary" onClick={applyBulk}>Apply</StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Insert / Delete / Search">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Value</label>
                <StudioInput type="number" value={valInput} onChange={(e) => setValInput(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Index</label>
                <StudioInput type="number" value={idxInput} onChange={(e) => setIdxInput(e.target.value)} />
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <StudioBtn variant="primary" onClick={insertAt}>
                <Plus className="h-3.5 w-3.5" /> Insert
              </StudioBtn>
              <StudioBtn variant="danger" onClick={deleteAt}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </StudioBtn>
              <StudioBtn variant="secondary" onClick={searchVal}>
                <Search className="h-3.5 w-3.5" /> Search
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "def", label: "Default" },
                { id: "rand", label: "Random" },
                { id: "clear", label: "Clear" },
              ]}
              onSelect={(id) => {
                if (id === "clear") {
                  setItems([]);
                  setStatus("Cleared array.");
                } else if (id === "rand") {
                  const arr = Array.from({ length: 6 }, () => Math.floor(Math.random() * 89) + 10);
                  setItems(arr);
                  setBulkInput(arr.join(", "));
                  setStatus("Generated random array.");
                } else {
                  const arr = [12, 27, 45, 63, 19];
                  setItems(arr);
                  setBulkInput(arr.join(", "));
                  setStatus("Restored default array.");
                }
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition="Arrays store elements side-by-side in contiguous RAM. Calculating base + index * size gives instant O(1) random access, while inserting in the middle must shift neighbors."
          keyPoints={[
            "Direct access arr[i] is O(1).",
            "Insertion/deletion at index i shifts (n - i) elements -> O(n).",
            "Dynamic lists (ArrayList / Python list) double capacity when full -> O(1) amortized append.",
          ]}
          complexities={[
            { op: "Access arr[i]", best: "O(1)", avg: "O(1)", worst: "O(1)" },
            { op: "Insert at end", best: "O(1)", avg: "O(1)", worst: "O(n)" },
            { op: "Insert / Delete middle", best: "O(1)", avg: "O(n)", worst: "O(n)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   2. LINKED LISTS (Singly, Doubly, Circular)
   ========================================================= */
function LinkedListVisualizer({ kind }: { kind: "singly" | "doubly" | "circular" }) {
  const [nodes, setNodes] = useState<number[]>([10, 25, 40, 55]);
  const [bulkInput, setBulkInput] = useState("10, 25, 40, 55");
  const [valInput, setValInput] = useState("70");
  const [idxInput, setIdxInput] = useState("1");
  const [hlIdx, setHlIdx] = useState<number | null>(null);
  const [status, setStatus] = useState(`Interactive ${kind} linked list ready. Enter custom values or perform operations.`);

  const applyBulk = () => {
    const next = parseNums(bulkInput);
    if (!next.length) return setStatus("Enter comma-separated numbers.");
    setNodes(next);
    setHlIdx(null);
    setStatus(`Built ${kind} list with ${next.length} nodes.`);
  };

  const insertHead = () => {
    const v = Number(valInput);
    if (Number.isNaN(v)) return;
    setNodes((prev) => [v, ...prev]);
    setHlIdx(0);
    setStatus(`Inserted ${v} at HEAD (new head -> old head).`);
  };

  const insertTail = () => {
    const v = Number(valInput);
    if (Number.isNaN(v)) return;
    setNodes((prev) => {
      setHlIdx(prev.length);
      return [...prev, v];
    });
    setStatus(`Inserted ${v} at TAIL.`);
  };

  const insertAt = () => {
    const v = Number(valInput);
    const idx = Math.max(0, Math.min(nodes.length, Number(idxInput) || 0));
    if (Number.isNaN(v)) return;
    const next = [...nodes];
    next.splice(idx, 0, v);
    setNodes(next);
    setHlIdx(idx);
    setStatus(`Inserted ${v} at position ${idx} by rewiring pointers.`);
  };

  const deleteHead = () => {
    if (!nodes.length) return setStatus("List is already empty.");
    const removed = nodes[0];
    setNodes((prev) => prev.slice(1));
    setHlIdx(null);
    setStatus(`Deleted HEAD node (${removed}).`);
  };

  const deleteTail = () => {
    if (!nodes.length) return setStatus("List is already empty.");
    const removed = nodes[nodes.length - 1];
    setNodes((prev) => prev.slice(0, -1));
    setHlIdx(null);
    setStatus(`Deleted TAIL node (${removed}).`);
  };

  const deleteVal = () => {
    const v = Number(valInput);
    const idx = nodes.indexOf(v);
    if (idx < 0) return setStatus(`Value ${v} not found in list.`);
    setNodes((prev) => prev.filter((_, i) => i !== idx));
    setHlIdx(null);
    setStatus(`Unlinked node with value ${v} (was at position ${idx}).`);
  };

  const searchNode = () => {
    const v = Number(valInput);
    const idx = nodes.indexOf(v);
    setHlIdx(idx >= 0 ? idx : null);
    setStatus(idx >= 0 ? `Traversed ${idx + 1} step(s) and found ${v} at node ${idx}.` : `Reached end — ${v} not found.`);
  };

  const titleLabel =
    kind === "singly" ? "Singly Linked List" : kind === "doubly" ? "Doubly Linked List" : "Circular Linked List";

  return (
    <VisualizerWorkspace
      badge={`${nodes.length} Nodes`}
      statusText={status}
      stage={
        <div className="flex min-h-[240px] w-full min-w-0 flex-col items-center justify-center gap-4 py-4">
          {nodes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#ededed]/15 px-4 py-3 font-mono text-xs text-[#85858b]">
              HEAD -&gt; NULL
            </div>
          ) : kind === "circular" ? (
            <div className="flex w-full min-w-0 flex-col items-center gap-4">
              <div className="w-full min-w-0 overflow-x-auto pb-1">
                <div className="mx-auto flex w-max min-w-full flex-nowrap items-center justify-center gap-1.5 px-1 pt-7">
                  {nodes.map((val, i) => (
                    <React.Fragment key={`${i}-${val}`}>
                      <motion.div
                        layout
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex shrink-0 flex-col items-center"
                      >
                        {i === 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-xs font-medium text-violet-300">
                            HEAD
                          </span>
                        )}
                        {i === nodes.length - 1 && i !== 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-xs font-medium text-amber-300">
                            TAIL
                          </span>
                        )}
                        <div
                          className={`flex overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
                            hlIdx === i
                              ? "border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                              : "border-sky-400/60 shadow-[0_0_14px_rgba(56,189,248,0.2)]"
                          }`}
                        >
                          <div className="bg-[#19191b] px-3 py-1.5 font-mono text-sm font-medium tabular-nums text-[#ededed]">
                            {val}
                          </div>
                          <div className="flex items-center border-l border-[#ededed]/[0.08] bg-[#141415] px-1.5 font-mono text-xs text-[#85858b]">
                            {i === nodes.length - 1 ? "head" : "next"}
                          </div>
                        </div>
                      </motion.div>
                      {i < nodes.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-sky-400" strokeWidth={1.5} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-300">
                <span>Circular return link: TAIL ({nodes[nodes.length - 1]}) -&gt; HEAD ({nodes[0]})</span>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto pb-1">
              <div
                className={`mx-auto flex w-max min-w-full flex-nowrap items-center justify-center pt-7 ${
                  kind === "doubly" ? "gap-0.5" : "gap-1.5 px-1"
                }`}
              >
                {kind === "doubly" && (
                  <>
                    <span className="shrink-0 rounded-md border border-dashed border-[#ededed]/20 px-1.5 py-1.5 font-mono text-[11px] text-[#a1a1a6]">
                      NULL
                    </span>
                    <ArrowLeftRight className="h-3 w-3 shrink-0 text-[#85858b]" strokeWidth={1.5} />
                  </>
                )}
                <AnimatePresence mode="popLayout">
                  {nodes.map((val, i) => (
                    <React.Fragment key={`${i}-${val}`}>
                      <motion.div
                        layout
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex shrink-0 flex-col items-center"
                      >
                        {(i === 0 || i === nodes.length - 1) && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-medium text-violet-300">
                            {i === 0 ? "HEAD" : "TAIL"}
                          </span>
                        )}
                        <div
                          className={`flex overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
                            hlIdx === i
                              ? "border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                              : "border-violet-500/55 shadow-[0_0_14px_rgba(139,92,246,0.22)]"
                          }`}
                        >
                          {kind === "doubly" && (
                            <div className="flex items-center border-r border-[#ededed]/[0.08] bg-[#141415] px-1 font-mono text-[11px] text-[#85858b]">
                              prev
                            </div>
                          )}
                          <div
                            className={`bg-[#19191b] py-1.5 font-mono font-medium tabular-nums text-[#ededed] ${
                              kind === "doubly" ? "px-1.5 text-[13px]" : "px-3 text-sm"
                            }`}
                          >
                            {val}
                          </div>
                          <div
                            className={`flex items-center border-l border-[#ededed]/[0.08] bg-[#141415] font-mono text-[#85858b] ${
                              kind === "doubly" ? "px-1 text-[11px]" : "px-1.5 text-xs"
                            }`}
                          >
                            next
                          </div>
                        </div>
                      </motion.div>
                      {i < nodes.length - 1 &&
                        (kind === "doubly" ? (
                          <ArrowLeftRight className="h-3 w-3 shrink-0 text-sky-400" strokeWidth={1.5} />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-sky-400" strokeWidth={1.5} />
                        ))}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
                <ArrowRight
                  className={`shrink-0 text-[#85858b] ${kind === "doubly" ? "h-3 w-3" : "h-3.5 w-3.5"}`}
                  strokeWidth={1.5}
                />
                <span
                  className={`shrink-0 rounded-md border border-dashed border-[#ededed]/20 py-1.5 font-mono text-[#a1a1a6] ${
                    kind === "doubly" ? "px-1.5 text-[11px]" : "px-2 text-xs"
                  }`}
                >
                  NULL
                </span>
              </div>
            </div>
          )}
        </div>
      }
      inspector={
        <>
          <InspectorBlock highlight title="Build Custom List" description="Initialize list from comma-separated values.">
            <div className="flex gap-2">
              <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="10, 25, 40, 55" />
              <StudioBtn variant="primary" onClick={applyBulk}>Build</StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Node Operations">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Value</label>
                <StudioInput type="number" value={valInput} onChange={(e) => setValInput(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Index</label>
                <StudioInput type="number" value={idxInput} onChange={(e) => setIdxInput(e.target.value)} />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              <StudioBtn variant="primary" onClick={insertHead}>Insert Head</StudioBtn>
              <StudioBtn variant="secondary" onClick={insertTail}>Insert Tail</StudioBtn>
              <StudioBtn variant="secondary" onClick={insertAt}>Insert @ Index</StudioBtn>
              <StudioBtn variant="secondary" onClick={searchNode}>Search Value</StudioBtn>
              <StudioBtn variant="danger" onClick={deleteHead}>Delete Head</StudioBtn>
              <StudioBtn variant="danger" onClick={deleteTail}>Delete Tail</StudioBtn>
            </div>
            <StudioBtn variant="danger" className="mt-1.5 w-full" onClick={deleteVal}>
              Delete Value ({valInput})
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "sample", label: "Default" },
                { id: "train", label: "Train Lab (1..6)" },
                { id: "clear", label: "Clear" },
              ]}
              onSelect={(id) => {
                if (id === "clear") {
                  setNodes([]);
                  setStatus("List cleared.");
                } else if (id === "train") {
                  const arr = [1, 2, 3, 4, 5, 6];
                  setNodes(arr);
                  setBulkInput(arr.join(", "));
                  setStatus("Loaded sequential compartments.");
                } else {
                  const arr = [10, 25, 40, 55];
                  setNodes(arr);
                  setBulkInput(arr.join(", "));
                  setStatus("Loaded default list.");
                }
              }}
            />
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition={`${titleLabel} connects nodes dynamically via references instead of contiguous memory, eliminating element-shifting during insertions.`}
          keyPoints={[
            kind === "singly"
              ? "Each node holds (data, next). Tail points to NULL."
              : kind === "doubly"
              ? "Each node holds (prev, data, next), allowing O(1) removal if you hold the node pointer and two-way traversal."
              : "Tail's next points directly back to Head — ideal for round-robin CPU scheduling & cyclic buffers.",
            "Head insertion is always O(1).",
            "Accessing index k requires O(k) pointer hops starting from Head.",
          ]}
          complexities={[
            { op: "Insert at Head", best: "O(1)", avg: "O(1)", worst: "O(1)" },
            { op: "Insert / Delete Middle", best: "O(1)", avg: "O(n)", worst: "O(n)" },
            { op: "Search by Value", best: "O(1)", avg: "O(n)", worst: "O(n)" },
          ]}
        />
      }
    />
  );
}

/* =========================================================
   3. STACK & POSTFIX EVALUATION (Module 2 Lab!)
   ========================================================= */
interface PostfixStep {
  stack: number[];
  tokenIdx: number;
  tokens: string[];
  msg: string;
}

function StackVisualizer() {
  const [tab, setTab] = useState<"ops" | "postfix">("ops");
  const [stack, setStack] = useState<number[]>([15, 30, 45]);
  const [valInput, setValInput] = useState("60");
  const [bulkInput, setBulkInput] = useState("15, 30, 45");
  const [status, setStatus] = useState("Stack ready (LIFO). Top is 45.");

  // Postfix Eval state
  const [exprInput, setExprInput] = useState("5 6 2 + * 12 4 / -");
  const [pfSteps, setPfSteps] = useState<PostfixStep[]>(() => buildPostfixSteps("5 6 2 + * 12 4 / -"));
  const [pfIdx, setPfIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  React.useEffect(() => {
    if (!playing || tab !== "postfix") return;
    const t = setInterval(() => {
      setPfIdx((prev) => {
        if (prev >= pfSteps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1150 - speed * 95);
    return () => clearInterval(t);
  }, [playing, speed, pfSteps.length, tab]);

  function buildPostfixSteps(expr: string): PostfixStep[] {
    const tokens = expr.trim().split(/\s+/).filter(Boolean);
    const s: number[] = [];
    const steps: PostfixStep[] = [
      { stack: [], tokenIdx: -1, tokens, msg: `Ready to evaluate postfix: "${tokens.join(" ")}"` },
    ];
    tokens.forEach((tok, idx) => {
      if (["+", "-", "*", "/"].includes(tok)) {
        if (s.length < 2) {
          steps.push({ stack: [...s], tokenIdx: idx, tokens, msg: `Error: Not enough operands for '${tok}'.` });
          return;
        }
        const b = s.pop()!;
        const a = s.pop()!;
        const res = tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : Math.trunc(a / (b || 1));
        s.push(res);
        steps.push({
          stack: [...s],
          tokenIdx: idx,
          tokens,
          msg: `Operator '${tok}': pop ${b} and ${a} -> push (${a} ${tok} ${b}) = ${res}`,
        });
      } else {
        const num = Number(tok);
        if (!Number.isNaN(num)) {
          s.push(num);
          steps.push({
            stack: [...s],
            tokenIdx: idx,
            tokens,
            msg: `Operand ${num}: push onto stack.`,
          });
        }
      }
    });
    if (s.length === 1) {
      steps.push({
        stack: [...s],
        tokenIdx: tokens.length,
        tokens,
        msg: `Evaluation complete — final answer = ${s[0]}`,
      });
    }
    return steps;
  }

  const pushVal = () => {
    const v = Number(valInput);
    if (Number.isNaN(v)) return;
    setStack((p) => [...p, v]);
    setStatus(`Pushed ${v} onto TOP of stack`);
  };

  const popVal = () => {
    if (!stack.length) return setStatus("Stack underflow — cannot pop from an empty stack");
    const top = stack[stack.length - 1];
    setStack((p) => p.slice(0, -1));
    setStatus(`Popped ${top} from TOP`);
  };

  const curPf = pfSteps[pfIdx] ?? pfSteps[0];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="stack-mode-tabs"
        value={tab}
        onChange={(v) => {
          setPlaying(false);
          setTab(v);
        }}
        options={[
          { id: "ops", label: "Stack Push / Pop (LIFO)" },
          { id: "postfix", label: "Postfix Expression Evaluator (Lab)" },
        ]}
      />

      {tab === "ops" ? (
        <VisualizerWorkspace
          badge={`Size: ${stack.length}`}
          statusText={status}
          stage={
            <div className="flex min-h-[260px] flex-col items-center justify-center py-4">
              <div className="mb-2 font-mono text-xs font-medium text-amber-400">
                Top of stack
              </div>
              <div className="flex min-h-[200px] w-52 flex-col-reverse justify-start gap-2 rounded-b-xl border-x border-b border-[#ededed]/[0.14] bg-[#141415] p-3">
                <AnimatePresence>
                  {stack.map((item, i) => {
                    const isTop = i === stack.length - 1;
                    return (
                      <motion.div
                        key={`${i}-${item}`}
                        initial={{ y: -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-center justify-between rounded-lg border-2 px-4 py-2 font-mono text-sm font-medium tabular-nums ${
                          isTop
                            ? "border-violet-400 bg-violet-500/20 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                            : "border-[#ededed]/[0.1] bg-[#19191b] text-[#a1a1a6]"
                        }`}
                      >
                        <span>{item}</span>
                        {isTop && <span className="text-xs text-violet-300">TOP</span>}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          }
          inspector={
            <>
              <InspectorBlock highlight title="Build Custom Stack" description="Push comma-separated values bottom-to-top.">
                <div className="flex gap-2">
                  <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
                  <StudioBtn
                    variant="primary"
                    onClick={() => {
                      const next = parseNums(bulkInput);
                      setStack(next);
                      setStatus(`Loaded ${next.length} items onto stack.`);
                    }}
                  >
                    Load
                  </StudioBtn>
                </div>
              </InspectorBlock>

              <InspectorBlock title="Push / Pop / Peek">
                <div className="flex gap-2">
                  <StudioInput type="number" value={valInput} onChange={(e) => setValInput(e.target.value)} />
                  <StudioBtn variant="primary" onClick={pushVal}>Push</StudioBtn>
                </div>
                <div className="mt-2 flex gap-2">
                  <StudioBtn variant="danger" className="flex-1" onClick={popVal}>Pop</StudioBtn>
                  <StudioBtn
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      setStatus(stack.length ? `Peek TOP = ${stack[stack.length - 1]}` : "Stack is empty.")
                    }
                  >
                    Peek
                  </StudioBtn>
                  <StudioBtn
                    variant="secondary"
                    onClick={() => {
                      setStack([]);
                      setStatus("Cleared stack.");
                    }}
                  >
                    Clear
                  </StudioBtn>
                </div>
              </InspectorBlock>
            </>
          }
          footerNotes={
            <ConceptNotesGrid
              intuition="Last In, First Out (LIFO). Think of browser back history, Ctrl+Z undo, and function call stacks."
              keyPoints={[
                "Push, Pop, and Peek all run in strictly O(1) time.",
                "Overflows on fixed arrays if size exceeds capacity; dynamic linked lists avoid fixed overflow.",
                "Essential for Postfix evaluation, Infix-to-Postfix conversion, and DFS.",
              ]}
              complexities={[
                { op: "Push", best: "O(1)", avg: "O(1)", worst: "O(1)" },
                { op: "Pop", best: "O(1)", avg: "O(1)", worst: "O(1)" },
                { op: "Peek / Top", best: "O(1)", avg: "O(1)", worst: "O(1)" },
              ]}
            />
          }
        />
      ) : (
        <VisualizerWorkspace
          step={pfIdx}
          totalSteps={Math.max(0, pfSteps.length - 1)}
          statusText={curPf.msg}
          badge="Postfix Stack"
          isPlaying={playing}
          stage={
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Token Tape */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {curPf.tokens.map((tok, i) => (
                  <div
                    key={`${tok}-${i}`}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-sm font-medium transition-colors duration-150 ${
                      i === curPf.tokenIdx
                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                        : i < curPf.tokenIdx
                        ? "border-[#4cc38a]/35 bg-[#4cc38a]/10 text-[#4cc38a]"
                        : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
                    }`}
                  >
                    {tok}
                  </div>
                ))}
              </div>
              {/* Stack */}
              <div className="flex min-h-[170px] w-48 flex-col-reverse gap-2 rounded-b-xl border-x border-b border-[#ededed]/[0.14] bg-[#141415] p-3">
                {curPf.stack.map((v, i) => (
                  <motion.div
                    key={`${i}-${v}`}
                    layout
                    className={`rounded-lg border-2 px-3 py-2 text-center font-mono text-sm font-medium tabular-nums ${
                      i === curPf.stack.length - 1
                        ? "border-violet-400 bg-violet-500/20 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                        : "border-[#ededed]/[0.1] bg-[#19191b] text-[#a1a1a6]"
                    }`}
                  >
                    {v}
                  </motion.div>
                ))}
              </div>
            </div>
          }
          controls={
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <StudioBtn variant="secondary" onClick={() => { setPlaying(false); setPfIdx(0); }}>Reset</StudioBtn>
                  <StudioBtn variant="secondary" disabled={pfIdx <= 0} onClick={() => { setPlaying(false); setPfIdx((i) => Math.max(0, i - 1)); }}>Back</StudioBtn>
                  <StudioBtn variant="primary" onClick={() => { if (pfIdx >= pfSteps.length - 1) setPfIdx(0); setPlaying((p) => !p); }}>
                    {playing ? "Pause" : "Play"}
                  </StudioBtn>
                  <StudioBtn variant="secondary" disabled={pfIdx >= pfSteps.length - 1} onClick={() => { setPlaying(false); setPfIdx((i) => Math.min(pfSteps.length - 1, i + 1)); }}>Step</StudioBtn>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#a1a1a6]">
                  <span>Speed</span>
                  <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Postfix evaluation speed" className="w-24 accent-amber-500" />
                </div>
              </div>
            </div>
          }
          inspector={
            <>
              <InspectorBlock highlight title="Your Postfix Expression" description="Space-separated numbers & operators (+, -, *, /).">
                <StudioInput value={exprInput} onChange={(e) => setExprInput(e.target.value)} />
                <StudioBtn
                  variant="primary"
                  className="mt-2 w-full"
                  onClick={() => {
                    setPlaying(false);
                    setPfIdx(0);
                    setPfSteps(buildPostfixSteps(exprInput));
                  }}
                >
                  Evaluate Postfix
                </StudioBtn>
              </InspectorBlock>
              <InspectorBlock title="Presets">
                <PresetRow
                  presets={[
                    { id: "p1", label: "5 6 2 + * 12 4 / -" },
                    { id: "p2", label: "2 3 1 * + 9 -" },
                    { id: "p3", label: "10 2 8 * + 3 -" },
                  ]}
                  onSelect={(id) => {
                    const map: Record<string, string> = {
                      p1: "5 6 2 + * 12 4 / -",
                      p2: "2 3 1 * + 9 -",
                      p3: "10 2 8 * + 3 -",
                    };
                    setExprInput(map[id]);
                    setPlaying(false);
                    setPfIdx(0);
                    setPfSteps(buildPostfixSteps(map[id]));
                  }}
                />
              </InspectorBlock>
            </>
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   4. QUEUE, DEQUE & PRIORITY QUEUE
   ========================================================= */
function QueueFamilyVisualizer({ kind }: { kind: "queue" | "deque" | "pqueue" }) {
  const [items, setItems] = useState<number[]>([14, 28, 35, 52]);
  const [bulkInput, setBulkInput] = useState("14, 28, 35, 52");
  const [valInput, setValInput] = useState("64");
  const [pqItems, setPqItems] = useState<{ label: string; pri: number }[]>([
    { label: "CPU Interrupt", pri: 1 },
    { label: "Render Frame", pri: 3 },
    { label: "Disk Sync", pri: 5 },
    { label: "Log Flush", pri: 8 },
  ]);
  const [pqMode, setPqMode] = useState<"min" | "max">("min");
  const [pqName, setPqName] = useState("Network IO");
  const [pqPri, setPqPri] = useState("2");
  const [pqBulk, setPqBulk] = useState("TaskA:3, TaskB:1, TaskC:5, TaskD:2");
  const [status, setStatus] = useState("Ready — enter custom values on the right.");

  if (kind === "pqueue") {
    const sorted = [...pqItems].sort((a, b) => (pqMode === "min" ? a.pri - b.pri : b.pri - a.pri));

    return (
      <VisualizerWorkspace
        badge={`${pqMode === "min" ? "Min" : "Max"}-Priority`}
        statusText={status}
        stage={
          <div className="mx-auto flex max-w-md flex-col gap-2 py-4">
            {sorted.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#85858b]">Priority queue is empty</div>
            ) : (
              sorted.map((it, idx) => (
                <motion.div
                  key={`${it.label}-${it.pri}-${idx}`}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-2.5 ${
                    idx === 0
                      ? "border-violet-400 bg-violet-500/15 text-white shadow-[0_0_16px_rgba(124,58,237,0.3)]"
                      : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {idx === 0 && (
                      <span className="rounded bg-[#4cc38a]/15 px-1.5 py-0.5 font-mono text-xs font-medium text-[#4cc38a]">
                        NEXT
                      </span>
                    )}
                    <span className="text-sm font-medium">{it.label}</span>
                  </div>
                  <span className="rounded-md border border-[#ededed]/[0.08] bg-[#232325] px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-amber-300">
                    P = {it.pri}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        }
        inspector={
          <>
            <InspectorBlock title="Priority Mode">
              <div className="flex gap-2">
                <StudioBtn variant={pqMode === "min" ? "primary" : "secondary"} className="flex-1" onClick={() => setPqMode("min")}>
                  Min-Priority
                </StudioBtn>
                <StudioBtn variant={pqMode === "max" ? "primary" : "secondary"} className="flex-1" onClick={() => setPqMode("max")}>
                  Max-Priority
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock highlight title="Custom Batch Input" description="Format: Label:Priority separated by commas.">
              <StudioInput value={pqBulk} onChange={(e) => setPqBulk(e.target.value)} />
              <StudioBtn
                variant="primary"
                className="mt-2 w-full"
                onClick={() => {
                  const parsed = pqBulk
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((pair) => {
                      const [lbl, p] = pair.split(":");
                      return { label: lbl.trim(), pri: Number(p) || 1 };
                    });
                  if (parsed.length) {
                    setPqItems(parsed);
                    setStatus(`Loaded ${parsed.length} prioritized items.`);
                  }
                }}
              >
                Load Items
              </StudioBtn>
            </InspectorBlock>

            <InspectorBlock title="Insert / Extract">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-[#a1a1a6]">Item</label>
                  <StudioInput value={pqName} onChange={(e) => setPqName(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#a1a1a6]">Priority</label>
                  <StudioInput type="number" value={pqPri} onChange={(e) => setPqPri(e.target.value)} />
                </div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <StudioBtn
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    if (!pqName.trim()) return;
                    setPqItems((prev) => [...prev, { label: pqName.trim(), pri: Number(pqPri) || 1 }]);
                    setStatus(`Inserted "${pqName}" with priority ${pqPri}`);
                  }}
                >
                  Insert
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    if (!sorted.length) return setStatus("Priority queue is empty");
                    const top = sorted[0];
                    setPqItems((prev) => {
                      const i = prev.findIndex((x) => x.label === top.label && x.pri === top.pri);
                      return i >= 0 ? [...prev.slice(0, i), ...prev.slice(i + 1)] : prev;
                    });
                    setStatus(`Extracted "${top.label}" (Priority ${top.pri})`);
                  }}
                >
                  Extract {pqMode === "min" ? "Min" : "Max"}
                </StudioBtn>
              </div>
            </InspectorBlock>
          </>
        }
        footerNotes={
          <ConceptNotesGrid
            intuition="Elements are served strictly by priority key, typically backed by a Binary Heap so insertion and extraction both take O(log n)."
            keyPoints={[
              "Min-Priority serves lowest numerical priority first (used in Dijkstra's & Prim's).",
              "Max-Priority serves highest value first (used in scheduling & Heap Sort).",
              "Peek top element in O(1); insert/extract in O(log n).",
            ]}
            complexities={[
              { op: "Insert (Heap)", best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
              { op: "Extract Min/Max", best: "O(log n)", avg: "O(log n)", worst: "O(log n)" },
              { op: "Peek", best: "O(1)", avg: "O(1)", worst: "O(1)" },
            ]}
          />
        }
      />
    );
  }

  return (
    <VisualizerWorkspace
      badge={kind === "queue" ? "FIFO Queue" : "Double-Ended Queue"}
      statusText={status}
      stage={
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 py-6">
          <div className="flex w-full max-w-xl items-center justify-between font-mono text-xs font-medium">
            <span className="text-[#4cc38a]">FRONT {kind === "deque" ? "(Add / Remove)" : "(Dequeue)"}</span>
            <span className="text-amber-400">REAR {kind === "deque" ? "(Add / Remove)" : "(Enqueue)"}</span>
          </div>
          <div className="flex min-h-[84px] w-full max-w-xl flex-wrap items-center justify-center gap-2 rounded-xl border border-[#ededed]/[0.1] bg-[#141415] p-3">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <span className="text-sm text-[#85858b]">Empty</span>
              ) : (
                items.map((v, i) => {
                  const isF = i === 0;
                  const isR = i === items.length - 1;
                  return (
                    <motion.div
                      key={`${i}-${v}`}
                      layout
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.92, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex flex-col items-center rounded-lg border-2 px-4 py-2 font-mono text-sm font-medium tabular-nums ${
                        isF
                          ? "border-emerald-400 bg-emerald-500/15 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.3)]"
                          : isR
                          ? "border-amber-400 bg-amber-500/15 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.3)]"
                          : "border-violet-500/40 bg-[#19191b] text-[#ededed]"
                      }`}
                    >
                      <span>{v}</span>
                      {(isF || isR) && (
                        <span className="mt-0.5 text-xs text-[#a1a1a6]">
                          {isF && isR ? "F & R" : isF ? "Front" : "Rear"}
                        </span>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      }
      inspector={
        <>
          <InspectorBlock highlight title="Custom Sequence" description="Enter comma-separated values.">
            <div className="flex gap-2">
              <StudioInput value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
              <StudioBtn
                variant="primary"
                onClick={() => {
                  const next = parseNums(bulkInput);
                  setItems(next);
                  setStatus(`Loaded ${next.length} items.`);
                }}
              >
                Load
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title={kind === "queue" ? "Enqueue / Dequeue" : "Front & Rear Operations"}>
            <div className="flex gap-2">
              <StudioInput type="number" value={valInput} onChange={(e) => setValInput(e.target.value)} />
              {kind === "queue" && (
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (Number.isNaN(v)) return;
                    setItems((p) => [...p, v]);
                    setStatus(`Enqueued ${v} at REAR.`);
                  }}
                >
                  Enqueue
                </StudioBtn>
              )}
            </div>
            {kind === "queue" ? (
              <div className="mt-2 flex gap-2">
                <StudioBtn
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    if (!items.length) return setStatus("Queue underflow");
                    const f = items[0];
                    setItems((p) => p.slice(1));
                    setStatus(`Dequeued ${f} from FRONT`);
                  }}
                >
                  Dequeue
                </StudioBtn>
                <StudioBtn variant="secondary" onClick={() => setItems([])}>Clear</StudioBtn>
              </div>
            ) : (
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (!Number.isNaN(v)) {
                      setItems((p) => [v, ...p]);
                      setStatus(`Added ${v} at FRONT`);
                    }
                  }}
                >
                  Add Front
                </StudioBtn>
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (!Number.isNaN(v)) {
                      setItems((p) => [...p, v]);
                      setStatus(`Added ${v} at REAR`);
                    }
                  }}
                >
                  Add Rear
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  onClick={() => {
                    if (!items.length) return setStatus("Deque is empty");
                    setStatus(`Removed ${items[0]} from FRONT`);
                    setItems((p) => p.slice(1));
                  }}
                >
                  Remove Front
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  onClick={() => {
                    if (!items.length) return setStatus("Deque is empty");
                    setStatus(`Removed ${items[items.length - 1]} from REAR`);
                    setItems((p) => p.slice(0, -1));
                  }}
                >
                  Remove Rear
                </StudioBtn>
              </div>
            )}
          </InspectorBlock>
        </>
      }
      footerNotes={
        <ConceptNotesGrid
          intuition={
            kind === "queue"
              ? "First In, First Out (FIFO). Enqueue appends to Rear; Dequeue removes from Front — used in BFS and printer/OS job queues."
              : "A Double-Ended Queue (Deque) lets you insert and delete from BOTH front and rear in O(1) — powering sliding window maximum algorithms."
          }
          keyPoints={[
            "Circular array implementation prevents wasted front slots after dequeues.",
            "Linked-list implementation avoids fixed capacity limits.",
            "All end operations run in O(1) time.",
          ]}
          complexities={[
            { op: "Insert Front/Rear", best: "O(1)", avg: "O(1)", worst: "O(1)" },
            { op: "Delete Front/Rear", best: "O(1)", avg: "O(1)", worst: "O(1)" },
            { op: "Search", best: "O(1)", avg: "O(n)", worst: "O(n)" },
          ]}
        />
      }
    />
  );
}

export function renderLinearTopic(topicId: TopicId) {
  switch (topicId) {
    case "list":
      return <ArrayVisualizer />;
    case "singly":
      return <LinkedListVisualizer kind="singly" />;
    case "doubly":
      return <LinkedListVisualizer kind="doubly" />;
    case "circular":
      return <LinkedListVisualizer kind="circular" />;
    case "stack":
      return <StackVisualizer />;
    case "queue":
      return <QueueFamilyVisualizer kind="queue" />;
    case "deque":
      return <QueueFamilyVisualizer kind="deque" />;
    case "pqueue":
      return <QueueFamilyVisualizer kind="pqueue" />;
    default:
      return <ArrayVisualizer />;
  }
}
