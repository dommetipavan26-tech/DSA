export interface ParsedNumberList {
  values: number[];
  truncated: number;
  droppedOutOfRange: number;
  invalidTokens: number;
}

export function parseNumberList(
  raw: string,
  opts: {
    min?: number;
    max?: number;
    maxCount?: number;
    unique?: boolean;
  } = {}
): ParsedNumberList {
  const { min = -Infinity, max = Infinity, maxCount = Infinity, unique = false } = opts;
  const tokens = raw
    .trim()
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const values: number[] = [];
  const seen = new Set<number>();
  let invalidTokens = 0;
  let droppedOutOfRange = 0;
  let truncated = 0;

  for (const tok of tokens) {
    const n = Number(tok);
    if (!Number.isFinite(n)) {
      invalidTokens++;
      continue;
    }
    if (n < min || n > max) {
      droppedOutOfRange++;
      continue;
    }
    if (unique) {
      if (seen.has(n)) continue;
      seen.add(n);
    }
    if (values.length >= maxCount) {
      truncated++;
      continue;
    }
    values.push(n);
  }

  return { values, truncated, droppedOutOfRange, invalidTokens };
}

export function parsePriorityBatch(raw: string): { label: string; pri: number }[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const colonIdx = pair.lastIndexOf(":");
      if (colonIdx === -1) {
        return { label: pair, pri: 1 };
      }
      const lbl = pair.slice(0, colonIdx).trim();
      const priStr = pair.slice(colonIdx + 1).trim();
      const parsed = priStr === "" ? NaN : Number(priStr);
      return {
        label: lbl || "Task",
        pri: Number.isFinite(parsed) ? parsed : 1,
      };
    });
}

export interface PostfixEvalStep {
  stack: number[];
  tokenIdx: number;
  tokens: string[];
  msg: string;
  isError?: boolean;
}

export function buildPostfixEvalSteps(expr: string): PostfixEvalStep[] {
  const tokens = expr.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return [
      {
        stack: [],
        tokenIdx: -1,
        tokens: [],
        msg: "Enter a space-separated postfix expression (e.g. 5 6 2 + *).",
        isError: true,
      },
    ];
  }

  const s: number[] = [];
  const steps: PostfixEvalStep[] = [
    {
      stack: [],
      tokenIdx: -1,
      tokens,
      msg: `Ready to evaluate postfix: "${tokens.join(" ")}"`,
    },
  ];

  const ops = new Set(["+", "-", "*", "/", "^"]);

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    if (ops.has(tok)) {
      if (s.length < 2) {
        steps.push({
          stack: [...s],
          tokenIdx: idx,
          tokens,
          msg: `Error at '${tok}': need 2 operands on stack, found ${s.length}.`,
          isError: true,
        });
        return steps;
      }
      const b = s.pop()!;
      const a = s.pop()!;
      if (tok === "/" && b === 0) {
        steps.push({
          stack: [...s, a, b],
          tokenIdx: idx,
          tokens,
          msg: `Error: Division by zero (${a} / 0) is undefined.`,
          isError: true,
        });
        return steps;
      }
      const res =
        tok === "+"
          ? a + b
          : tok === "-"
          ? a - b
          : tok === "*"
          ? a * b
          : tok === "/"
          ? Math.trunc(a / b)
          : Math.pow(a, b);
      s.push(res);
      steps.push({
        stack: [...s],
        tokenIdx: idx,
        tokens,
        msg: `Operator '${tok}': pop ${b} and ${a} -> push (${a} ${tok} ${b}) = ${res}`,
      });
    } else {
      const num = Number(tok);
      if (!Number.isFinite(num)) {
        steps.push({
          stack: [...s],
          tokenIdx: idx,
          tokens,
          msg: `Error: Unrecognized token "${tok}". Use numbers and +, -, *, /, ^.`,
          isError: true,
        });
        return steps;
      }
      s.push(num);
      steps.push({
        stack: [...s],
        tokenIdx: idx,
        tokens,
        msg: `Operand ${num}: push onto stack.`,
      });
    }
  }

  if (s.length === 1) {
    steps.push({
      stack: [...s],
      tokenIdx: tokens.length,
      tokens,
      msg: `Evaluation complete — final answer = ${s[0]}`,
    });
  } else {
    steps.push({
      stack: [...s],
      tokenIdx: tokens.length,
      tokens,
      msg: `Malformed postfix expression: ${s.length} values remain on stack (missing operator).`,
      isError: true,
    });
  }
  return steps;
}

export interface SimpleTreeNode {
  id: string;
  label: string;
  left?: SimpleTreeNode | null;
  right?: SimpleTreeNode | null;
}

const EXPR_OPS = new Set(["+", "-", "*", "/", "^"]);
const EXPR_PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

export function infixToPostfixChecked(expr: string): { tokens: string[]; error?: string } {
  const cleaned = expr.trim();
  if (!cleaned) return { tokens: [], error: "Enter an expression to build its tree." };

  const unsupported = cleaned.replace(/[A-Za-z0-9.+\-*/^()\s]/g, "");
  if (unsupported.length > 0) {
    return { tokens: [], error: `Unsupported symbol "${unsupported[0]}" in expression.` };
  }

  const tokens = cleaned.match(/[A-Za-z0-9]+(?:\.[0-9]+)?|[+\-*/^()]/g) ?? [];
  if (!tokens.length) return { tokens: [], error: "No valid tokens found." };

  const out: string[] = [];
  const ops: string[] = [];

  for (const t of tokens) {
    if (/^[A-Za-z0-9]+(?:\.[0-9]+)?$/.test(t)) {
      out.push(t);
    } else if (t === "(") {
      ops.push(t);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        out.push(ops.pop()!);
      }
      if (!ops.length || ops[ops.length - 1] !== "(") {
        return { tokens: [], error: "Unmatched closing parenthesis ')'." };
      }
      ops.pop();
    } else if (EXPR_OPS.has(t)) {
      const isRightAssoc = t === "^";
      while (ops.length && ops[ops.length - 1] !== "(") {
        const top = ops[ops.length - 1];
        const topP = EXPR_PREC[top] ?? 0;
        const curP = EXPR_PREC[t] ?? 0;
        if (isRightAssoc ? topP > curP : topP >= curP) {
          out.push(ops.pop()!);
        } else {
          break;
        }
      }
      ops.push(t);
    }
  }

  while (ops.length) {
    const top = ops.pop()!;
    if (top === "(" || top === ")") {
      return { tokens: [], error: "Unmatched opening parenthesis '('." };
    }
    out.push(top);
  }

  return { tokens: out };
}

export function buildExprTreeFromPostfix(tokens: string[]): SimpleTreeNode | null {
  if (!tokens.length) return null;
  const stack: SimpleTreeNode[] = [];
  let seq = 0;
  for (const t of tokens) {
    if (EXPR_OPS.has(t)) {
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

export function buildExprTreeFromPrefix(tokens: string[]): SimpleTreeNode | null {
  if (!tokens.length) return null;
  const stack: SimpleTreeNode[] = [];
  let seq = 0;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (EXPR_OPS.has(t)) {
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

export function evaluateExprTree(
  root: SimpleTreeNode | null
): { value: number | null; error?: string; steps: string[] } {
  if (!root) return { value: null, steps: [] };
  const steps: string[] = [];

  function walk(node: SimpleTreeNode): number | null {
    if (!node.left && !node.right) {
      const num = Number(node.label);
      return Number.isFinite(num) ? num : null;
    }
    if (!node.left || !node.right) return null;
    const lv = walk(node.left);
    const rv = walk(node.right);
    if (lv === null || rv === null) return null;
    if (node.label === "/" && rv === 0) {
      throw new Error(`Division by zero (${lv} / 0)`);
    }
    const res =
      node.label === "+"
        ? lv + rv
        : node.label === "-"
        ? lv - rv
        : node.label === "*"
        ? lv * rv
        : node.label === "/"
        ? Number((lv / rv).toFixed(4))
        : Math.pow(lv, rv);
    steps.push(`${lv} ${node.label} ${rv} = ${res}`);
    return res;
  }

  try {
    const value = walk(root);
    return { value, steps };
  } catch (e) {
    return {
      value: null,
      error: e instanceof Error ? e.message : "Evaluation failed",
      steps,
    };
  }
}

export function reconstructBinaryTree(
  inArr: string[],
  otherArr: string[],
  mode: "pre" | "post"
): { root: SimpleTreeNode | null; error?: string } {
  if (!inArr.length || inArr.length !== otherArr.length) {
    return {
      root: null,
      error: "In-order and Pre/Post-order must have equal non-empty token counts.",
    };
  }
  if (new Set(inArr).size !== inArr.length) {
    return {
      root: null,
      error: "In-order traversal contains duplicate labels — unique labels are required for unambiguous reconstruction.",
    };
  }
  if (new Set(otherArr).size !== otherArr.length) {
    return {
      root: null,
      error: `${mode === "pre" ? "Pre-order" : "Post-order"} traversal contains duplicate labels.`,
    };
  }

  let seq = 0;
  function build(ino: string[], oth: string[]): SimpleTreeNode | null {
    if (!ino.length) return null;
    const rootVal = mode === "pre" ? oth[0] : oth[oth.length - 1];
    const idx = ino.indexOf(rootVal);
    if (idx === -1) throw new Error(`Token "${rootVal}" missing in In-order slice.`);
    const leftIn = ino.slice(0, idx);
    const rightIn = ino.slice(idx + 1);
    const leftOth =
      mode === "pre" ? oth.slice(1, 1 + leftIn.length) : oth.slice(0, leftIn.length);
    const rightOth =
      mode === "pre"
        ? oth.slice(1 + leftIn.length)
        : oth.slice(leftIn.length, oth.length - 1);
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

export interface ParsedGraph {
  vertices: { id: string; x: number; y: number }[];
  edges: { a: string; b: string; w: number }[];
  hasNegativeWeights: boolean;
}

export function parseEdgeListText(text: string, directed = false): ParsedGraph | null {
  const parts = text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const vertSet = new Set<string>();
  const edgeMap = new Map<string, { a: string; b: string; w: number }>();

  for (const p of parts) {
    const m = p.match(/^([A-Za-z0-9]+)\s*(?:->|[-–>])\s*([A-Za-z0-9]+)(?:\s*[:=]\s*(-?\d+))?$/);
    if (!m) continue;
    const a = m[1].toUpperCase();
    const b = m[2].toUpperCase();
    if (a === b) continue; // ignore self-loops in simple graph parser
    const w = m[3] !== undefined ? Number(m[3]) : 1;
    vertSet.add(a);
    vertSet.add(b);
    const key = directed ? `${a}->${b}` : [a, b].sort().join("--");
    edgeMap.set(key, { a, b, w });
  }

  if (!vertSet.size) return null;
  const ids = Array.from(vertSet).sort();
  const cx = 315;
  const cy = 152;
  const rx = 215;
  const ry = 108;
  const vertices = ids.map((id, i) => {
    const ang = (2 * Math.PI * i) / ids.length - Math.PI / 2;
    return {
      id,
      x: Math.round(cx + rx * Math.cos(ang)),
      y: Math.round(cy + ry * Math.sin(ang)),
    };
  });
  const edges = Array.from(edgeMap.values());
  return {
    vertices,
    edges,
    hasNegativeWeights: edges.some((e) => e.w < 0),
  };
}

export function nextAvailableVertexId(existingIds: string[]): string | null {
  const used = new Set(existingIds);
  for (let code = 65; code <= 90; code++) {
    const candidate = String.fromCharCode(code);
    if (!used.has(candidate)) return candidate;
  }
  return null;
}
