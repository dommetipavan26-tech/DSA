import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildExprTreeFromPostfix,
  buildExprTreeFromPrefix,
  buildPostfixEvalSteps,
  evaluateExprTree,
  infixToPostfixChecked,
  nextAvailableVertexId,
  parseEdgeListText,
  parseNumberList,
  parsePriorityBatch,
  reconstructBinaryTree,
} from "./parsers.ts";
import { CATEGORIES, TOPICS, VALID_TOPIC_IDS } from "../data/syllabus.ts";

describe("parseNumberList", () => {
  it("ignores trailing commas and extra whitespace without injecting 0", () => {
    const res = parseNumberList("  12, -5, 0, , 44,  ");
    assert.deepEqual(res.values, [12, -5, 0, 44]);
    assert.equal(res.invalidTokens, 0);
    assert.equal(res.truncated, 0);
  });

  it("enforces min/max, unique, and maxCount with accurate counters", () => {
    const res = parseNumberList("10, 10, -5, 200, abc, 20, 30, 40", {
      min: 0,
      max: 100,
      unique: true,
      maxCount: 2,
    });
    assert.deepEqual(res.values, [10, 20]);
    assert.equal(res.droppedOutOfRange, 2); // -5, 200
    assert.equal(res.invalidTokens, 1); // abc
    assert.equal(res.truncated, 2); // 30, 40
  });
});

describe("parsePriorityBatch", () => {
  it("preserves priority 0 and negative priorities instead of defaulting to 1", () => {
    const res = parsePriorityBatch("Kernel:0, Emergency:-3, Idle:7, NoPri");
    assert.deepEqual(res, [
      { label: "Kernel", pri: 0 },
      { label: "Emergency", pri: -3 },
      { label: "Idle", pri: 7 },
      { label: "NoPri", pri: 1 },
    ]);
  });
});

describe("buildPostfixEvalSteps", () => {
  it("evaluates valid postfix expressions including exponentiation", () => {
    const steps = buildPostfixEvalSteps("5 6 2 + * 12 4 / -");
    const last = steps[steps.length - 1];
    assert.equal(last.isError, undefined);
    assert.deepEqual(last.stack, [37]);
    assert.match(last.msg, /37/);

    const powSteps = buildPostfixEvalSteps("2 3 2 ^ ^");
    assert.deepEqual(powSteps[powSteps.length - 1].stack, [512]);
  });

  it("reports explicit errors for division by zero, underflow, invalid tokens, and leftover operands", () => {
    const divZero = buildPostfixEvalSteps("10 0 /");
    assert.equal(divZero[divZero.length - 1].isError, true);
    assert.match(divZero[divZero.length - 1].msg, /Division by zero/i);

    const underflow = buildPostfixEvalSteps("5 +");
    assert.equal(underflow[underflow.length - 1].isError, true);

    const badTok = buildPostfixEvalSteps("5 foo +");
    assert.equal(badTok[badTok.length - 1].isError, true);

    const leftover = buildPostfixEvalSteps("5 6 7 +");
    assert.equal(leftover[leftover.length - 1].isError, true);
  });
});

describe("expression trees & shunting-yard", () => {
  it("handles right-associative exponentiation 2^3^2 = 512", () => {
    const conv = infixToPostfixChecked("2^3^2");
    assert.equal(conv.error, undefined);
    assert.deepEqual(conv.tokens, ["2", "3", "2", "^", "^"]);
    const tree = buildExprTreeFromPostfix(conv.tokens);
    assert.ok(tree);
    const evalRes = evaluateExprTree(tree);
    assert.equal(evalRes.value, 512);
    assert.equal(evalRes.error, undefined);
  });

  it("detects unmatched parentheses and unsupported symbols", () => {
    assert.ok(infixToPostfixChecked("(3 + 4").error);
    assert.ok(infixToPostfixChecked("3 + 4)").error);
    assert.ok(infixToPostfixChecked("3 @ 4").error);
  });

  it("builds equivalent trees from prefix and catches divide-by-zero", () => {
    const preTree = buildExprTreeFromPrefix(["*", "+", "3", "5", "-", "9", "2"]);
    assert.ok(preTree);
    assert.equal(evaluateExprTree(preTree).value, 56);

    const divTree = buildExprTreeFromPostfix(["8", "0", "/"]);
    const divRes = evaluateExprTree(divTree);
    assert.equal(divRes.value, null);
    assert.match(divRes.error ?? "", /Division by zero/i);
  });
});

describe("reconstructBinaryTree", () => {
  it("reconstructs binary tree from in-order + pre-order and in-order + post-order", () => {
    const ino = ["D", "B", "E", "A", "F", "C"];
    const pre = ["A", "B", "D", "E", "C", "F"];
    const post = ["D", "E", "B", "F", "C", "A"];

    const fromPre = reconstructBinaryTree(ino, pre, "pre");
    assert.equal(fromPre.error, undefined);
    assert.equal(fromPre.root?.label, "A");
    assert.equal(fromPre.root?.left?.label, "B");
    assert.equal(fromPre.root?.right?.label, "C");

    const fromPost = reconstructBinaryTree(ino, post, "post");
    assert.equal(fromPost.error, undefined);
    assert.equal(fromPost.root?.label, "A");
    assert.equal(fromPost.root?.left?.right?.label, "E");
    assert.equal(fromPost.root?.right?.left?.label, "F");
  });

  it("rejects duplicate labels and mismatched lengths", () => {
    assert.ok(reconstructBinaryTree(["A", "A", "B"], ["A", "B", "A"], "pre").error);
    assert.ok(reconstructBinaryTree(["A", "B"], ["A"], "pre").error);
    assert.ok(reconstructBinaryTree(["A", "B"], ["A", "Z"], "post").error);
  });
});

describe("graph edge parser & vertex ID allocation", () => {
  it("deduplicates undirected parallel edges while keeping directed reverse edges", () => {
    const undir = parseEdgeListText("A-B:2, B-A:5, B-C:-3", false);
    assert.ok(undir);
    assert.equal(undir.edges.length, 2);
    assert.equal(undir.hasNegativeWeights, true);
    const ab = undir.edges.find((e) => (e.a === "A" && e.b === "B") || (e.a === "B" && e.b === "A"));
    assert.equal(ab?.w, 5);

    const dir = parseEdgeListText("A->B:2, B->A:5", true);
    assert.ok(dir);
    assert.equal(dir.edges.length, 2);
    assert.equal(dir.hasNegativeWeights, false);
  });

  it("allocates lowest unused A..Z vertex ID and returns null when full", () => {
    assert.equal(nextAvailableVertexId(["A", "C", "D"]), "B");
    const all26 = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    assert.equal(nextAvailableVertexId(all26), null);
  });
});

describe("syllabus integrity", () => {
  it("contains 29 unique topics ordered strictly Module 1 through Module 6", () => {
    assert.equal(TOPICS.length, 29);
    assert.equal(CATEGORIES.length, 6);
    assert.deepEqual(
      CATEGORIES.map((c) => c.moduleCode),
      ["Module 1", "Module 2", "Module 3", "Module 4", "Module 5", "Module 6"]
    );
    assert.equal(VALID_TOPIC_IDS.has("home"), true);
    assert.equal(VALID_TOPIC_IDS.size, 30);
  });
});
