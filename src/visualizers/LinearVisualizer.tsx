import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, ArrowRight, Plus, Search, Trash2 } from "lucide-react";
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
} from "../components/ui/input-helpers";
import { usePlayback } from "../hooks/usePlayback";
import {
  buildPostfixEvalSteps,
  parseNumberList,
  parsePriorityBatch,
} from "../lib/parsers";
import type { TopicId } from "../data/syllabus";

interface KeyedNum {
  id: number;
  val: number;
}

function makeKeyed(nums: number[], nextIdRef: React.MutableRefObject<number>): KeyedNum[] {
  return nums.map((val) => ({ id: nextIdRef.current++, val }));
}

/* =========================================================
   1. ARRAY / LIST
   ========================================================= */
function ArrayVisualizer() {
  const idRef = useRef(10);
  const [items, setItems] = useState<KeyedNum[]>(() =>
    [12, 27, 45, 63, 19].map((val, i) => ({ id: i + 1, val }))
  );

  const [bulkInput, setBulkInput] = useState("12, 27, 45, 63, 19");
  const [valInput, setValInput] = useState("99");
  const [idxInput, setIdxInput] = useState("2");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [status, setStatus] = useState(
    "Loaded 5 elements. Try inserting, deleting, or entering your own list."
  );

  const applyBulk = () => {
    const parsed = parseNumberList(bulkInput, { maxCount: 12 });
    if (!parsed.values.length) {
      return setStatus("Enter valid comma-separated numbers (e.g. 10, 20, 30).");
    }
    setItems(makeKeyed(parsed.values, idRef));
    setBulkInput(parsed.values.join(", "));
    setHighlightId(null);
    const extra = parsed.truncated ? ` (capped at 12)` : "";
    setStatus(`Initialized array with ${parsed.values.length} elements${extra}.`);
  };

  const insertAt = () => {
    if (items.length >= 12) {
      return setStatus("Array reached display cap of 12 elements — delete an element first.");
    }
    const val = Number(valInput);
    const rawIdx = Number(idxInput);
    if (!Number.isFinite(val) || valInput.trim() === "") {
      return setStatus("Enter a valid numeric value.");
    }
    const idx = Math.max(
      0,
      Math.min(items.length, Number.isFinite(rawIdx) ? Math.trunc(rawIdx) : 0)
    );
    const entry: KeyedNum = { id: idRef.current++, val };
    const next = [...items];
    next.splice(idx, 0, entry);
    setItems(next);
    setHighlightId(entry.id);
    setStatus(`Inserted ${val} at index ${idx}. Shifted ${items.length - idx} element(s) right.`);
  };

  const deleteAt = () => {
    if (!items.length) return setStatus("Array is empty — nothing to delete.");
    const idx = Number(idxInput);
    if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) {
      return setStatus(`Index ${idxInput} is out of bounds [0..${items.length - 1}].`);
    }
    const removed = items[idx].val;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setHighlightId(null);
    setStatus(
      `Deleted ${removed} from index ${idx}. Shifted ${items.length - idx - 1} element(s) left.`
    );
  };

  const searchVal = () => {
    const val = Number(valInput);
    if (!Number.isFinite(val) || valInput.trim() === "") {
      return setStatus("Enter a valid number to search.");
    }
    const idx = items.findIndex((it) => it.val === val);
    setHighlightId(idx >= 0 ? items[idx].id : null);
    setStatus(
      idx >= 0 ? `Found ${val} at index [${idx}].` : `${val} is not present in the array.`
    );
  };

  return (
    <VisualizerWorkspace
      badge={`Length: ${items.length} / 12`}
      statusText={status}
      stage={
        <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-3 py-6">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <div className="text-sm text-[#93939a]">
                Array is empty — add elements from Input &amp; controls
              </div>
            ) : (
              items.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`flex h-14 min-w-[54px] items-center justify-center rounded-xl border-2 px-3 font-mono text-base font-medium tabular-nums transition-colors duration-150 ${
                      highlightId === item.id
                        ? "border-amber-400 bg-amber-500/15 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.28)]"
                        : "border-[#ededed]/[0.16] bg-[#19191b] text-[#ededed]"
                    }`}
                  >
                    {item.val}
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#93939a]">[{i}]</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      }
      inspector={
        <>
          <InspectorBlock
            highlight
            title="Your Custom Array"
            description="Enter comma-separated numbers (max 12)."
          >
            <div className="flex gap-2">
              <StudioInput
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyBulk()}
                placeholder="10, 20, 30"
              />
              <StudioBtn variant="primary" onClick={applyBulk}>
                Apply
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Insert / Delete / Search">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Value</label>
                <StudioInput
                  type="number"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Index</label>
                <StudioInput
                  type="number"
                  value={idxInput}
                  onChange={(e) => setIdxInput(e.target.value)}
                />
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
                setHighlightId(null);
                if (id === "clear") {
                  setItems([]);
                  setStatus("Cleared array.");
                } else if (id === "rand") {
                  const arr = Array.from({ length: 6 }, () => Math.floor(Math.random() * 89) + 10);
                  setItems(makeKeyed(arr, idRef));
                  setBulkInput(arr.join(", "));
                  setStatus("Generated random array.");
                } else {
                  const arr = [12, 27, 45, 63, 19];
                  setItems(makeKeyed(arr, idRef));
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
          javaCode={`static int[] insertAt(int[] a, int idx, int val) {
  int[] res = new int[a.length + 1];
  for (int i = 0; i < idx; i++) res[i] = a[i];
  res[idx] = val;
  for (int i = idx; i < a.length; i++) res[i + 1] = a[i];
  return res;
}`}
        />
      }
    />
  );
}

/* =========================================================
   2. LINKED LISTS (Singly, Doubly, Circular)
   ========================================================= */
function LinkedListVisualizer({ kind }: { kind: "singly" | "doubly" | "circular" }) {
  const idRef = useRef(10);
  const [nodes, setNodes] = useState<KeyedNum[]>(() =>
    [10, 25, 40, 55].map((val, i) => ({ id: i + 1, val }))
  );

  const [bulkInput, setBulkInput] = useState("10, 25, 40, 55");
  const [valInput, setValInput] = useState("70");
  const [idxInput, setIdxInput] = useState("1");
  const [hlId, setHlId] = useState<number | null>(null);
  const [status, setStatus] = useState(
    `Interactive ${kind} linked list ready. Enter custom values or perform operations.`
  );

  const applyBulk = () => {
    const parsed = parseNumberList(bulkInput, { maxCount: 12 });
    if (!parsed.values.length) return setStatus("Enter valid comma-separated numbers.");
    setNodes(makeKeyed(parsed.values, idRef));
    setBulkInput(parsed.values.join(", "));
    setHlId(null);
    setStatus(`Built ${kind} list with ${parsed.values.length} nodes.`);
  };

  const insertHead = () => {
    if (nodes.length >= 12) return setStatus("List reached display cap of 12 nodes.");
    const v = Number(valInput);
    if (!Number.isFinite(v) || valInput.trim() === "") return;
    const entry: KeyedNum = { id: idRef.current++, val: v };
    setNodes((prev) => [entry, ...prev]);
    setHlId(entry.id);
    setStatus(`Inserted ${v} at HEAD (new head -> old head).`);
  };

  const insertTail = () => {
    if (nodes.length >= 12) return setStatus("List reached display cap of 12 nodes.");
    const v = Number(valInput);
    if (!Number.isFinite(v) || valInput.trim() === "") return;
    const entry: KeyedNum = { id: idRef.current++, val: v };
    setNodes((prev) => [...prev, entry]);
    setHlId(entry.id);
    setStatus(`Inserted ${v} at TAIL.`);
  };

  const insertAt = () => {
    if (nodes.length >= 12) return setStatus("List reached display cap of 12 nodes.");
    const v = Number(valInput);
    const rawIdx = Number(idxInput);
    if (!Number.isFinite(v) || valInput.trim() === "") return;
    const idx = Math.max(
      0,
      Math.min(nodes.length, Number.isFinite(rawIdx) ? Math.trunc(rawIdx) : 0)
    );
    const entry: KeyedNum = { id: idRef.current++, val: v };
    const next = [...nodes];
    next.splice(idx, 0, entry);
    setNodes(next);
    setHlId(entry.id);
    setStatus(`Inserted ${v} at position ${idx} by rewiring pointers.`);
  };

  const deleteHead = () => {
    if (!nodes.length) return setStatus("List is already empty.");
    const removed = nodes[0].val;
    setNodes((prev) => prev.slice(1));
    setHlId(null);
    setStatus(`Deleted HEAD node (${removed}).`);
  };

  const deleteTail = () => {
    if (!nodes.length) return setStatus("List is already empty.");
    const removed = nodes[nodes.length - 1].val;
    setNodes((prev) => prev.slice(0, -1));
    setHlId(null);
    setStatus(`Deleted TAIL node (${removed}).`);
  };

  const deleteVal = () => {
    const v = Number(valInput);
    const idx = nodes.findIndex((n) => n.val === v);
    if (idx < 0) return setStatus(`Value ${valInput} not found in list.`);
    setNodes((prev) => prev.filter((_, i) => i !== idx));
    setHlId(null);
    setStatus(`Unlinked node with value ${v} (was at position ${idx}).`);
  };

  const searchNode = () => {
    const v = Number(valInput);
    const idx = nodes.findIndex((n) => n.val === v);
    setHlId(idx >= 0 ? nodes[idx].id : null);
    setStatus(
      idx >= 0
        ? `Traversed ${idx + 1} step(s) and found ${v} at node ${idx}.`
        : `Reached end — ${valInput} not found.`
    );
  };

  const titleLabel =
    kind === "singly"
      ? "Singly Linked List"
      : kind === "doubly"
      ? "Doubly Linked List"
      : "Circular Linked List";

  return (
    <VisualizerWorkspace
      badge={`${nodes.length} Nodes`}
      statusText={status}
      stage={
        <div className="flex min-h-[240px] w-full min-w-0 flex-col items-center justify-center gap-4 py-4">
          {nodes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#ededed]/15 px-4 py-3 font-mono text-xs text-[#93939a]">
              HEAD -&gt; NULL
            </div>
          ) : kind === "circular" ? (
            <div className="flex w-full min-w-0 flex-col items-center gap-4">
              <div className="w-full min-w-0 overflow-x-auto pb-1">
                <div className="mx-auto flex w-max min-w-full flex-nowrap items-center justify-center gap-1.5 px-1 pt-7">
                  <AnimatePresence mode="popLayout">
                    {nodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <motion.div
                          layout
                          initial={{ scale: 0.92, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.92, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="relative flex shrink-0 flex-col items-center"
                        >
                          {i === 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#4cc38a]/15 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#4cc38a]">
                              HEAD
                            </span>
                          )}
                          {i === nodes.length - 1 && i !== 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-medium text-amber-300">
                              TAIL
                            </span>
                          )}
                          <div
                            className={`flex overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
                              hlId === node.id
                                ? "border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.3)]"
                                : "border-[#ededed]/[0.18]"
                            }`}
                          >
                            <div className="bg-[#19191b] px-3 py-1.5 font-mono text-sm font-medium tabular-nums text-[#ededed]">
                              {node.val}
                            </div>
                            <div className="flex items-center border-l border-[#ededed]/[0.08] bg-[#141415] px-1.5 font-mono text-xs text-[#93939a]">
                              {i === nodes.length - 1 ? "head" : "next"}
                            </div>
                          </div>
                        </motion.div>
                        {i < nodes.length - 1 && (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#60a5fa]" strokeWidth={1.5} />
                        )}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-300">
                <span>
                  Circular return link: TAIL ({nodes[nodes.length - 1].val}) -&gt; HEAD ({nodes[0].val})
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto pb-1">
              <div
                className={`mx-auto flex w-max min-w-full flex-nowrap items-center justify-center pt-7 ${
                  kind === "doubly" ? "gap-1" : "gap-1.5 px-1"
                }`}
              >
                {kind === "doubly" && (
                  <>
                    <span className="shrink-0 rounded-md border border-dashed border-[#ededed]/20 px-1.5 py-1.5 font-mono text-[11px] text-[#a1a1a6]">
                      NULL
                    </span>
                    <ArrowLeftRight className="h-3 w-3 shrink-0 text-[#93939a]" strokeWidth={1.5} />
                  </>
                )}
                <AnimatePresence mode="popLayout">
                  {nodes.map((node, i) => (
                    <React.Fragment key={node.id}>
                      <motion.div
                        layout
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex shrink-0 flex-col items-center"
                      >
                        {(i === 0 || i === nodes.length - 1) && (
                          <span
                            className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium ${
                              i === 0 ? "text-[#4cc38a]" : "text-amber-400"
                            }`}
                          >
                            {i === 0 && i === nodes.length - 1
                              ? "HEAD / TAIL"
                              : i === 0
                              ? "HEAD"
                              : "TAIL"}
                          </span>
                        )}
                        <div
                          className={`flex overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
                            hlId === node.id
                              ? "border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.3)]"
                              : "border-[#ededed]/[0.18]"
                          }`}
                        >
                          {kind === "doubly" && (
                            <div className="flex items-center border-r border-[#ededed]/[0.08] bg-[#141415] px-1 font-mono text-[11px] text-[#93939a]">
                              prev
                            </div>
                          )}
                          <div
                            className={`bg-[#19191b] py-1.5 font-mono font-medium tabular-nums text-[#ededed] ${
                              kind === "doubly" ? "px-2 text-[13px]" : "px-3 text-sm"
                            }`}
                          >
                            {node.val}
                          </div>
                          <div
                            className={`flex items-center border-l border-[#ededed]/[0.08] bg-[#141415] font-mono text-[#93939a] ${
                              kind === "doubly" ? "px-1 text-[11px]" : "px-1.5 text-xs"
                            }`}
                          >
                            next
                          </div>
                        </div>
                      </motion.div>
                      {i < nodes.length - 1 &&
                        (kind === "doubly" ? (
                          <ArrowLeftRight className="h-3 w-3 shrink-0 text-[#60a5fa]" strokeWidth={1.5} />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#60a5fa]" strokeWidth={1.5} />
                        ))}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
                <ArrowRight
                  className={`shrink-0 text-[#93939a] ${kind === "doubly" ? "h-3 w-3" : "h-3.5 w-3.5"}`}
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
          <InspectorBlock
            highlight
            title="Build Custom List"
            description="Initialize list from comma-separated values (max 12)."
          >
            <div className="flex gap-2">
              <StudioInput
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyBulk()}
                placeholder="10, 25, 40, 55"
              />
              <StudioBtn variant="primary" onClick={applyBulk}>
                Build
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title="Node Operations">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Value</label>
                <StudioInput
                  type="number"
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#a1a1a6]">Index</label>
                <StudioInput
                  type="number"
                  value={idxInput}
                  onChange={(e) => setIdxInput(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              <StudioBtn variant="primary" onClick={insertHead}>
                Insert Head
              </StudioBtn>
              <StudioBtn variant="secondary" onClick={insertTail}>
                Insert Tail
              </StudioBtn>
              <StudioBtn variant="secondary" onClick={insertAt}>
                Insert @ Index
              </StudioBtn>
              <StudioBtn variant="secondary" onClick={searchNode}>
                Search Value
              </StudioBtn>
              <StudioBtn variant="danger" onClick={deleteHead}>
                Delete Head
              </StudioBtn>
              <StudioBtn variant="danger" onClick={deleteTail}>
                Delete Tail
              </StudioBtn>
            </div>
            <StudioBtn variant="danger" className="mt-1.5 w-full" onClick={deleteVal}>
              Delete Value ({valInput})
            </StudioBtn>
          </InspectorBlock>

          <InspectorBlock title="Presets">
            <PresetRow
              presets={[
                { id: "sample", label: "Default" },
                { id: "seq", label: "Sequential (1..6)" },
                { id: "clear", label: "Clear" },
              ]}
              onSelect={(id) => {
                setHlId(null);
                if (id === "clear") {
                  setNodes([]);
                  setStatus("List cleared.");
                } else if (id === "seq") {
                  const arr = [1, 2, 3, 4, 5, 6];
                  setNodes(makeKeyed(arr, idRef));
                  setBulkInput(arr.join(", "));
                  setStatus("Loaded sequential nodes.");
                } else {
                  const arr = [10, 25, 40, 55];
                  setNodes(makeKeyed(arr, idRef));
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
          javaCode={
            kind === "doubly"
              ? `class DNode {
  int val;
  DNode prev, next;
  DNode(int v) { val = v; }
}
// Insert at head in O(1)
DNode insertHead(DNode head, int val) {
  DNode n = new DNode(val);
  n.next = head;
  if (head != null) head.prev = n;
  return n;
}`
              : `class Node {
  int val;
  Node next;
  Node(int v, Node n) { val = v; next = n; }
}
// Insert at head in O(1)
Node insertHead(Node head, int val) {
  return new Node(val, head);
}`
          }
        />
      }
    />
  );
}

/* =========================================================
   3. STACK & POSTFIX EVALUATION
   ========================================================= */
function StackVisualizer() {
  const idRef = useRef(10);
  const [tab, setTab] = useState<"ops" | "postfix">("ops");
  const [stack, setStack] = useState<KeyedNum[]>(() =>
    [15, 30, 45].map((val, i) => ({ id: i + 1, val }))
  );

  const [valInput, setValInput] = useState("60");
  const [bulkInput, setBulkInput] = useState("15, 30, 45");
  const [status, setStatus] = useState("Stack ready (LIFO). Top is 45.");

  const [exprInput, setExprInput] = useState("5 6 2 + * 12 4 / -");
  const [committedExpr, setCommittedExpr] = useState("5 6 2 + * 12 4 / -");

  const pfSteps = useMemo(() => buildPostfixEvalSteps(committedExpr), [committedExpr]);
  const pb = usePlayback({
    totalSteps: Math.max(0, pfSteps.length - 1),
    resetKey: `${tab}-${committedExpr}`,
    enableKeyboard: tab === "postfix",
  });

  const pushVal = () => {
    if (stack.length >= 12) return setStatus("Stack display cap reached (12 items).");
    const v = Number(valInput);
    if (!Number.isFinite(v) || valInput.trim() === "") return;
    setStack((p) => [...p, { id: idRef.current++, val: v }]);
    setStatus(`Pushed ${v} onto TOP of stack.`);
  };

  const popVal = () => {
    if (!stack.length) return setStatus("Stack underflow — cannot pop from an empty stack.");
    const top = stack[stack.length - 1].val;
    setStack((p) => p.slice(0, -1));
    setStatus(`Popped ${top} from TOP.`);
  };

  const curPf = pfSteps[pb.stepIdx] ?? pfSteps[0];

  return (
    <div className="space-y-4">
      <MorphingPillTabs
        layoutId="stack-mode-tabs"
        value={tab}
        onChange={(v) => setTab(v)}
        options={[
          { id: "ops", label: "Stack Push / Pop (LIFO)" },
          { id: "postfix", label: "Postfix Expression Evaluator" },
        ]}
      />

      {tab === "ops" ? (
        <VisualizerWorkspace
          badge={`Size: ${stack.length}`}
          statusText={status}
          stage={
            <div className="flex min-h-[260px] flex-col items-center justify-center py-4">
              <div className="mb-2 font-mono text-xs font-medium text-amber-400">Top of stack</div>
              <div className="flex min-h-[200px] w-52 flex-col-reverse justify-start gap-2 rounded-b-xl border-x border-b border-[#ededed]/[0.14] bg-[#141415] p-3">
                <AnimatePresence>
                  {stack.map((item, i) => {
                    const isTop = i === stack.length - 1;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ y: -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-center justify-between rounded-lg border-2 px-4 py-2 font-mono text-sm font-medium tabular-nums ${
                          isTop
                            ? "border-amber-400 bg-amber-500/15 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)]"
                            : "border-[#ededed]/[0.12] bg-[#19191b] text-[#a1a1a6]"
                        }`}
                      >
                        <span>{item.val}</span>
                        {isTop && <span className="text-xs text-amber-400">TOP</span>}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          }
          inspector={
            <>
              <InspectorBlock
                highlight
                title="Build Custom Stack"
                description="Push comma-separated values bottom-to-top."
              >
                <div className="flex gap-2">
                  <StudioInput
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <StudioBtn
                    variant="primary"
                    onClick={() => {
                      const parsed = parseNumberList(bulkInput, { maxCount: 12 });
                      setStack(makeKeyed(parsed.values, idRef));
                      setBulkInput(parsed.values.join(", "));
                      setStatus(`Loaded ${parsed.values.length} items onto stack.`);
                    }}
                  >
                    Load
                  </StudioBtn>
                </div>
              </InspectorBlock>

              <InspectorBlock title="Push / Pop / Peek">
                <div className="flex gap-2">
                  <StudioInput
                    type="number"
                    value={valInput}
                    onChange={(e) => setValInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && pushVal()}
                  />
                  <StudioBtn variant="primary" onClick={pushVal}>
                    Push
                  </StudioBtn>
                </div>
                <div className="mt-2 flex gap-2">
                  <StudioBtn variant="danger" className="flex-1" onClick={popVal}>
                    Pop
                  </StudioBtn>
                  <StudioBtn
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      setStatus(
                        stack.length
                          ? `Peek TOP = ${stack[stack.length - 1].val}`
                          : "Stack is empty."
                      )
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
              javaCode={`Deque<Integer> stack = new ArrayDeque<>();
stack.push(15);   // O(1)
int top = stack.peek(); // O(1)
int popped = stack.pop(); // O(1)`}
            />
          }
        />
      ) : (
        <VisualizerWorkspace
          step={pb.stepIdx}
          totalSteps={Math.max(0, pfSteps.length - 1)}
          statusText={curPf.msg}
          statusTone={curPf.isError ? "error" : "default"}
          badge="Postfix Stack"
          isPlaying={pb.playing}
          stage={
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {curPf.tokens.map((tok, i) => (
                  <div
                    key={`${tok}-${i}`}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-sm font-medium transition-colors duration-150 ${
                      i === curPf.tokenIdx
                        ? curPf.isError
                          ? "border-[#e5484d] bg-[#e5484d]/15 text-[#fca5a5]"
                          : "border-amber-500 bg-amber-500/15 text-amber-300"
                        : i < curPf.tokenIdx
                        ? "border-[#4cc38a]/35 bg-[#4cc38a]/10 text-[#4cc38a]"
                        : "border-[#ededed]/[0.08] bg-[#19191b] text-[#a1a1a6]"
                    }`}
                  >
                    {tok}
                  </div>
                ))}
              </div>
              <div className="flex min-h-[170px] w-48 flex-col-reverse gap-2 rounded-b-xl border-x border-b border-[#ededed]/[0.14] bg-[#141415] p-3">
                {curPf.stack.map((v, i) => (
                  <motion.div
                    key={`${i}-${v}`}
                    layout
                    className={`rounded-lg border-2 px-3 py-2 text-center font-mono text-sm font-medium tabular-nums ${
                      i === curPf.stack.length - 1
                        ? "border-amber-400 bg-amber-500/15 text-amber-200"
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
                { label: "Current token", colorClass: "bg-amber-500" },
                { label: "Processed", colorClass: "bg-[#4cc38a]" },
                { label: "Error", colorClass: "bg-[#e5484d]" },
              ]}
            />
          }
          inspector={
            <>
              <InspectorBlock
                highlight
                title="Your Postfix Expression"
                description="Space-separated numbers & operators (+, -, *, /, ^)."
              >
                <StudioInput
                  value={exprInput}
                  onChange={(e) => setExprInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setCommittedExpr(exprInput)}
                />
                <StudioBtn
                  variant="primary"
                  className="mt-2 w-full"
                  onClick={() => setCommittedExpr(exprInput)}
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
                    { id: "p4", label: "2 3 ^ 4 +" },
                  ]}
                  onSelect={(id) => {
                    const map: Record<string, string> = {
                      p1: "5 6 2 + * 12 4 / -",
                      p2: "2 3 1 * + 9 -",
                      p3: "10 2 8 * + 3 -",
                      p4: "2 3 ^ 4 +",
                    };
                    setExprInput(map[id]);
                    setCommittedExpr(map[id]);
                  }}
                />
              </InspectorBlock>
            </>
          }
          footerNotes={
            <ConceptNotesGrid
              intuition="Postfix (Reverse Polish Notation) needs zero parentheses: scan left-to-right, push operands, and pop two values whenever an operator arrives."
              keyPoints={[
                "Each token is processed exactly once -> O(n) time and O(n) stack space.",
                "Watch operand order on non-commutative operators: second pop is left operand (a), first pop is right operand (b).",
                "Division by zero and malformed token counts are caught immediately during evaluation.",
              ]}
              complexities={[
                { op: "Postfix Evaluation", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
              ]}
              javaCode={`static int evalPostfix(String[] tokens) {
  Deque<Integer> st = new ArrayDeque<>();
  for (String t : tokens) {
    if ("+-*/".contains(t)) {
      int b = st.pop(), a = st.pop();
      if (t.equals("+")) st.push(a + b);
      else if (t.equals("-")) st.push(a - b);
      else if (t.equals("*")) st.push(a * b);
      else st.push(a / b);
    } else st.push(Integer.parseInt(t));
  }
  return st.pop();
}`}
            />
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   4. QUEUE, DEQUE & PRIORITY QUEUE (with Live Binary Heap View!)
   ========================================================= */
interface PQEntry {
  id: number;
  label: string;
  pri: number;
}

function buildBinaryHeap(items: PQEntry[], mode: "min" | "max"): PQEntry[] {
  const heap = [...items];
  const better = (a: PQEntry, b: PQEntry) => (mode === "min" ? a.pri < b.pri : a.pri > b.pri);
  const siftDown = (idx: number) => {
    let best = idx;
    const l = 2 * idx + 1;
    const r = 2 * idx + 2;
    if (l < heap.length && better(heap[l], heap[best])) best = l;
    if (r < heap.length && better(heap[r], heap[best])) best = r;
    if (best !== idx) {
      [heap[idx], heap[best]] = [heap[best], heap[idx]];
      siftDown(best);
    }
  };
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
    siftDown(i);
  }
  return heap;
}

function QueueFamilyVisualizer({ kind }: { kind: "queue" | "deque" | "pqueue" }) {
  const idRef = useRef(105);
  const [items, setItems] = useState<KeyedNum[]>(() =>
    [14, 28, 35, 52].map((val, i) => ({ id: i + 1, val }))
  );
  const [bulkInput, setBulkInput] = useState("14, 28, 35, 52");
  const [valInput, setValInput] = useState("64");

  const [pqItems, setPqItems] = useState<PQEntry[]>(() => [
    { id: 101, label: "CPU Interrupt", pri: 1 },
    { id: 102, label: "Render Frame", pri: 3 },
    { id: 103, label: "Disk Sync", pri: 5 },
    { id: 104, label: "Log Flush", pri: 8 },
  ]);

  const [pqMode, setPqMode] = useState<"min" | "max">("min");
  const [pqName, setPqName] = useState("Network IO");
  const [pqPri, setPqPri] = useState("2");
  const [pqBulk, setPqBulk] = useState("TaskA:3, TaskB:0, TaskC:5, TaskD:2");
  const [status, setStatus] = useState(
    kind === "pqueue"
      ? "Min-Priority Heap ready — priority 0 and negative values are supported."
      : `Ready — perform ${kind === "queue" ? "FIFO enqueue/dequeue" : "front and rear"} operations.`
  );

  const pqHeap = useMemo(() => buildBinaryHeap(pqItems, pqMode), [pqItems, pqMode]);
  const pqSorted = useMemo(
    () => [...pqItems].sort((a, b) => (pqMode === "min" ? a.pri - b.pri : b.pri - a.pri)),
    [pqItems, pqMode]
  );

  if (kind === "pqueue") {
    const hs = pqHeap.length;
    const maxLevel = hs > 0 ? Math.floor(Math.log2(hs)) : 0;
    const svgH = Math.max(120, 32 + maxLevel * 54 + 32);

    return (
      <VisualizerWorkspace
        badge={`${pqMode === "min" ? "Min" : "Max"}-Heap · ${hs} items`}
        statusText={status}
        stage={
          <div className="space-y-4 py-2">
            {hs === 0 ? (
              <div className="py-12 text-center text-sm text-[#93939a]">
                Priority queue is empty
              </div>
            ) : (
              <>
                {/* Synchronized Binary Heap SVG View */}
                <div className="border-b border-[#ededed]/[0.07] pb-3">
                  <div className="mb-1 text-center font-mono text-xs text-[#93939a]">
                    Backing {pqMode === "min" ? "Min-Heap" : "Max-Heap"} tree (root = next to extract)
                  </div>
                  <svg viewBox={`0 0 640 ${svgH}`} className="mx-auto w-full max-w-xl">
                    {pqHeap.map((_, i) => {
                      const level = Math.floor(Math.log2(i + 1));
                      const pos = i - (Math.pow(2, level) - 1);
                      const count = Math.pow(2, level);
                      const x = ((pos + 0.5) / count) * 640;
                      const y = 28 + level * 54;
                      const childXY = (ci: number) => {
                        const cl = Math.floor(Math.log2(ci + 1));
                        const cp = ci - (Math.pow(2, cl) - 1);
                        const cc = Math.pow(2, cl);
                        return { x: ((cp + 0.5) / cc) * 640, y: 28 + cl * 54 };
                      };
                      return (
                        <g key={`pe-${i}`}>
                          {2 * i + 1 < hs && (
                            <line
                              x1={x}
                              y1={y}
                              x2={childXY(2 * i + 1).x}
                              y2={childXY(2 * i + 1).y}
                              stroke="rgba(237,237,237,0.18)"
                              strokeWidth="1.5"
                            />
                          )}
                          {2 * i + 2 < hs && (
                            <line
                              x1={x}
                              y1={y}
                              x2={childXY(2 * i + 2).x}
                              y2={childXY(2 * i + 2).y}
                              stroke="rgba(237,237,237,0.18)"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      );
                    })}
                    {pqHeap.map((node, i) => {
                      const level = Math.floor(Math.log2(i + 1));
                      const pos = i - (Math.pow(2, level) - 1);
                      const count = Math.pow(2, level);
                      const x = ((pos + 0.5) / count) * 640;
                      const y = 28 + level * 54;
                      const isRoot = i === 0;
                      return (
                        <g key={node.id}>
                          <circle
                            cx={x}
                            cy={y}
                            r={18}
                            fill={isRoot ? "#261c0b" : "#19191b"}
                            stroke={isRoot ? "#f59e0b" : "#48484f"}
                            strokeWidth={isRoot ? 2.2 : 1.6}
                          />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isRoot ? "#fde68a" : "#ededed"}
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {node.pri}
                          </text>
                          <text
                            x={x}
                            y={y + 28}
                            textAnchor="middle"
                            fill="#93939a"
                            fontSize="10"
                          >
                            {node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Serving Order List */}
                <div className="mx-auto flex max-w-md flex-col gap-2">
                  {pqSorted.map((it, idx) => (
                    <motion.div
                      key={it.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2 ${
                        idx === 0
                          ? "border-amber-500/60 bg-amber-500/12 text-[#ededed]"
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
                  ))}
                </div>
              </>
            )}
          </div>
        }
        inspector={
          <>
            <InspectorBlock title="Priority Mode">
              <div className="flex gap-2">
                <StudioBtn
                  variant={pqMode === "min" ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => setPqMode("min")}
                >
                  Min-Priority
                </StudioBtn>
                <StudioBtn
                  variant={pqMode === "max" ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => setPqMode("max")}
                >
                  Max-Priority
                </StudioBtn>
              </div>
            </InspectorBlock>

            <InspectorBlock
              highlight
              title="Custom Batch Input"
              description="Format: Label:Priority separated by commas (0 and negatives allowed)."
            >
              <StudioInput value={pqBulk} onChange={(e) => setPqBulk(e.target.value)} />
              <StudioBtn
                variant="primary"
                className="mt-2 w-full"
                onClick={() => {
                  const parsed = parsePriorityBatch(pqBulk).slice(0, 12);
                  if (parsed.length) {
                    setPqItems(parsed.map((p) => ({ ...p, id: idRef.current++ })));
                    setStatus(`Loaded ${parsed.length} prioritized items into ${pqMode}-heap.`);
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
                  <StudioInput
                    type="number"
                    value={pqPri}
                    onChange={(e) => setPqPri(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <StudioBtn
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    if (!pqName.trim()) return;
                    const parsedPri = pqPri.trim() === "" ? 0 : Number(pqPri);
                    if (!Number.isFinite(parsedPri)) return;
                    setPqItems((prev) => [
                      ...prev,
                      { id: idRef.current++, label: pqName.trim(), pri: parsedPri },
                    ]);
                    setStatus(`Inserted "${pqName.trim()}" with priority ${parsedPri}.`);
                  }}
                >
                  Insert
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    if (!pqHeap.length) return setStatus("Priority queue is empty.");
                    const top = pqHeap[0];
                    setPqItems((prev) => prev.filter((x) => x.id !== top.id));
                    setStatus(`Extracted root "${top.label}" (Priority ${top.pri}).`);
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
            intuition="Elements are served strictly by priority key, backed by a Binary Heap so insertion and extraction both take O(log n)."
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
            javaCode={`PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
int next = minHeap.poll(); // 1 in O(log n)`}
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
            <span className="text-[#4cc38a]">
              FRONT {kind === "deque" ? "(Add / Remove)" : "(Dequeue)"}
            </span>
            <span className="text-amber-400">
              REAR {kind === "deque" ? "(Add / Remove)" : "(Enqueue)"}
            </span>
          </div>
          <div className="flex min-h-[84px] w-full max-w-xl flex-wrap items-center justify-center gap-2 rounded-xl border border-[#ededed]/[0.1] bg-[#141415] p-3">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <span className="text-sm text-[#93939a]">Empty</span>
              ) : (
                items.map((item, i) => {
                  const isF = i === 0;
                  const isR = i === items.length - 1;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.92, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex flex-col items-center rounded-lg border-2 px-4 py-2 font-mono text-sm font-medium tabular-nums ${
                        isF
                          ? "border-[#4cc38a] bg-[#4cc38a]/15 text-[#4cc38a]"
                          : isR
                          ? "border-amber-400 bg-amber-500/15 text-amber-200"
                          : "border-[#ededed]/[0.15] bg-[#19191b] text-[#ededed]"
                      }`}
                    >
                      <span>{item.val}</span>
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
                  const parsed = parseNumberList(bulkInput, { maxCount: 12 });
                  setItems(makeKeyed(parsed.values, idRef));
                  setBulkInput(parsed.values.join(", "));
                  setStatus(`Loaded ${parsed.values.length} items.`);
                }}
              >
                Load
              </StudioBtn>
            </div>
          </InspectorBlock>

          <InspectorBlock title={kind === "queue" ? "Enqueue / Dequeue" : "Front & Rear Operations"}>
            <div className="flex gap-2">
              <StudioInput
                type="number"
                value={valInput}
                onChange={(e) => setValInput(e.target.value)}
              />
              {kind === "queue" && (
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (!Number.isFinite(v) || valInput.trim() === "") return;
                    setItems((p) => [...p, { id: idRef.current++, val: v }]);
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
                    if (!items.length) return setStatus("Queue underflow.");
                    const f = items[0].val;
                    setItems((p) => p.slice(1));
                    setStatus(`Dequeued ${f} from FRONT.`);
                  }}
                >
                  Dequeue
                </StudioBtn>
                <StudioBtn
                  variant="secondary"
                  onClick={() => {
                    setItems([]);
                    setStatus("Cleared queue.");
                  }}
                >
                  Clear
                </StudioBtn>
              </div>
            ) : (
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (Number.isFinite(v) && valInput.trim() !== "") {
                      setItems((p) => [{ id: idRef.current++, val: v }, ...p]);
                      setStatus(`Added ${v} at FRONT.`);
                    }
                  }}
                >
                  Add Front
                </StudioBtn>
                <StudioBtn
                  variant="primary"
                  onClick={() => {
                    const v = Number(valInput);
                    if (Number.isFinite(v) && valInput.trim() !== "") {
                      setItems((p) => [...p, { id: idRef.current++, val: v }]);
                      setStatus(`Added ${v} at REAR.`);
                    }
                  }}
                >
                  Add Rear
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  onClick={() => {
                    if (!items.length) return setStatus("Deque is empty.");
                    setStatus(`Removed ${items[0].val} from FRONT.`);
                    setItems((p) => p.slice(1));
                  }}
                >
                  Remove Front
                </StudioBtn>
                <StudioBtn
                  variant="danger"
                  onClick={() => {
                    if (!items.length) return setStatus("Deque is empty.");
                    setStatus(`Removed ${items[items.length - 1].val} from REAR.`);
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
          javaCode={
            kind === "queue"
              ? `Queue<Integer> q = new ArrayDeque<>();
q.offer(14);       // Enqueue rear O(1)
int front = q.poll(); // Dequeue front O(1)`
              : `Deque<Integer> dq = new ArrayDeque<>();
dq.addFirst(10);   // O(1)
dq.addLast(20);    // O(1)
dq.removeFirst();  // O(1)`
          }
        />
      }
    />
  );
}

export function LinearSectionRouter({ topicId }: { topicId: TopicId }) {
  switch (topicId) {
    case "list":
      return <ArrayVisualizer />;
    case "singly":
      return <LinkedListVisualizer key="singly" kind="singly" />;
    case "doubly":
      return <LinkedListVisualizer key="doubly" kind="doubly" />;
    case "circular":
      return <LinkedListVisualizer key="circular" kind="circular" />;
    case "stack":
      return <StackVisualizer />;
    case "queue":
      return <QueueFamilyVisualizer key="queue" kind="queue" />;
    case "deque":
      return <QueueFamilyVisualizer key="deque" kind="deque" />;
    case "pqueue":
      return <QueueFamilyVisualizer key="pqueue" kind="pqueue" />;
    default:
      return <ArrayVisualizer />;
  }
}
