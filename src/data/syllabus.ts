export type CategoryId =
  | "all"
  | "analysis"
  | "linear"
  | "trees"
  | "sorting"
  | "searching"
  | "graphs";

export type TopicId =
  | "home"
  | "asymptotic"
  | "recursion"
  | "list"
  | "singly"
  | "doubly"
  | "circular"
  | "stack"
  | "queue"
  | "deque"
  | "pqueue"
  | "tree-basics"
  | "binary-tree"
  | "avl"
  | "expression-tree"
  | "selection-sort"
  | "insertion-sort"
  | "quick-sort"
  | "merge-sort"
  | "heap-sort"
  | "linear-search"
  | "binary-search"
  | "hashing"
  | "graph-basics"
  | "bfs"
  | "dfs"
  | "mst"
  | "dijkstra"
  | "floyd"
  | "warshall";

export interface TopicMeta {
  id: TopicId;
  category: Exclude<CategoryId, "all">;
  moduleTag: string;
  title: string;
  shortDesc: string;
  tags: string[];
}

export const CATEGORIES: { id: Exclude<CategoryId, "all">; label: string; moduleCode: string }[] = [
  { id: "analysis", label: "Algorithm Analysis", moduleCode: "Module 1" },
  { id: "linear", label: "Linear Structures", moduleCode: "Module 2" },
  { id: "trees", label: "Trees", moduleCode: "Module 3" },
  { id: "sorting", label: "Sorting Algorithms", moduleCode: "Module 4" },
  { id: "searching", label: "Search & Hashing", moduleCode: "Module 5" },
  { id: "graphs", label: "Graphs", moduleCode: "Module 6" },
];

export const TOPICS: TopicMeta[] = [
  // Module 1: Algorithm Analysis
  {
    id: "asymptotic",
    category: "analysis",
    moduleTag: "Module 1",
    title: "Asymptotic Notations",
    shortDesc: "Compare Big-O, little-o, Omega, and Theta bounds and growth curves with live input size n.",
    tags: ["Big-O", "Omega", "Theta", "Bounds"],
  },
  {
    id: "recursion",
    category: "analysis",
    moduleTag: "Module 1",
    title: "Recursion vs Iteration",
    shortDesc: "Compare call stacks vs O(1) iterative loops for Factorial, plus 2D Matrix Transpose tracing.",
    tags: ["Call Stack", "Iterative", "Matrix Transpose"],
  },

  // Module 2: Linear Data Structures
  {
    id: "list",
    category: "linear",
    moduleTag: "Module 2",
    title: "Array / List",
    shortDesc: "Contiguous indexed memory with O(1) lookup and index-shifting insert/delete.",
    tags: ["Insert", "Delete", "Index Shift"],
  },
  {
    id: "singly",
    category: "linear",
    moduleTag: "Module 2",
    title: "Singly Linked List",
    shortDesc: "Dynamic nodes with head and next pointers. Watch pointer rewiring live.",
    tags: ["Head/Tail", "Insert", "Delete", "Traverse"],
  },
  {
    id: "doubly",
    category: "linear",
    moduleTag: "Module 2",
    title: "Doubly Linked List",
    shortDesc: "Bidirectional prev & next links allowing forward and reverse traversal.",
    tags: ["Prev & Next", "Bidirectional", "Insert/Delete"],
  },
  {
    id: "circular",
    category: "linear",
    moduleTag: "Module 2",
    title: "Circular Linked List",
    shortDesc: "Tail points back to head in a closed ring with zero NULL termination.",
    tags: ["Ring Link", "Round-Robin", "Insert/Delete"],
  },
  {
    id: "stack",
    category: "linear",
    moduleTag: "Module 2",
    title: "Stack & Postfix Eval",
    shortDesc: "LIFO push/pop operations plus step-by-step postfix expression evaluation.",
    tags: ["LIFO", "Push/Pop", "Postfix Eval"],
  },
  {
    id: "queue",
    category: "linear",
    moduleTag: "Module 2",
    title: "Queue",
    shortDesc: "FIFO buffer with explicit front and rear pointer movement during enqueue/dequeue.",
    tags: ["FIFO", "Enqueue", "Dequeue"],
  },
  {
    id: "deque",
    category: "linear",
    moduleTag: "Module 2",
    title: "Double-Ended Queue (Deque)",
    shortDesc: "Insert and remove elements symmetrically at both front and rear ends.",
    tags: ["Add Front/Rear", "Remove Front/Rear"],
  },
  {
    id: "pqueue",
    category: "linear",
    moduleTag: "Module 2",
    title: "Priority Queue",
    shortDesc: "Serve items by priority rather than arrival order with a synchronized Min/Max binary heap view.",
    tags: ["Min/Max Priority", "Heap View", "Extract"],
  },

  // Module 3: Trees
  {
    id: "tree-basics",
    category: "trees",
    moduleTag: "Module 3",
    title: "Tree Fundamentals & Types",
    shortDesc: "Interactive anatomy inspector + Full, Complete, and Perfect Binary Tree checker.",
    tags: ["Full BT", "Complete BT", "Perfect BT"],
  },
  {
    id: "binary-tree",
    category: "trees",
    moduleTag: "Module 3",
    title: "Binary Tree / BST & Traversals",
    shortDesc: "Trace insert, delete, search, and animate In-order, Pre-order, and Post-order traversals.",
    tags: ["Insert/Delete", "In-order", "Pre-order", "Post-order"],
  },
  {
    id: "avl",
    category: "trees",
    moduleTag: "Module 3",
    title: "AVL Tree & Rotations",
    shortDesc: "Self-balancing BST displaying imbalance states, balance factors, and LL, RR, LR, RL rotations.",
    tags: ["LL / RR", "LR / RL", "Balance Factor"],
  },
  {
    id: "expression-tree",
    category: "trees",
    moduleTag: "Module 3",
    title: "Expression & Reconstruction Tree",
    shortDesc: "Build and evaluate expression trees from Infix/Prefix/Postfix, or reconstruct from traversals.",
    tags: ["In/Pre/Post-order", "Reconstruct", "Evaluate"],
  },

  // Module 4: Sorting
  {
    id: "selection-sort",
    category: "sorting",
    moduleTag: "Module 4",
    title: "Selection Sort",
    shortDesc: "Repeatedly find the minimum element in the unsorted slice and swap it into place.",
    tags: ["O(n^2)", "In-place", "Min Scan"],
  },
  {
    id: "insertion-sort",
    category: "sorting",
    moduleTag: "Module 4",
    title: "Insertion Sort",
    shortDesc: "Shift larger elements right and insert each new element into the sorted prefix.",
    tags: ["O(n) Best", "Stable", "Adaptive"],
  },
  {
    id: "quick-sort",
    category: "sorting",
    moduleTag: "Module 4",
    title: "Quick Sort",
    shortDesc: "Choose pivot strategy (Last, First, Middle, Random) and trace partitioning live.",
    tags: ["Pivot Choice", "Partition", "O(n log n)"],
  },
  {
    id: "merge-sort",
    category: "sorting",
    moduleTag: "Module 4",
    title: "Merge Sort",
    shortDesc: "Dual Divide-and-Conquer Tree view + Bar view showing every split and sorted merge.",
    tags: ["Divide & Merge Tree", "Stable", "O(n log n)"],
  },
  {
    id: "heap-sort",
    category: "sorting",
    moduleTag: "Module 4",
    title: "Heap Sort (Min & Max Heap)",
    shortDesc: "Switch between Max-Heap and Min-Heap with synchronized Binary Heap tree & array view.",
    tags: ["Max-Heap", "Min-Heap", "Heapify Tree"],
  },

  // Module 5: Searching & Hashing
  {
    id: "linear-search",
    category: "searching",
    moduleTag: "Module 5",
    title: "Linear Search",
    shortDesc: "Sequential scan across custom number arrays or student records with comparison count.",
    tags: ["Sequential", "Records", "O(n)"],
  },
  {
    id: "binary-search",
    category: "searching",
    moduleTag: "Module 5",
    title: "Binary Search",
    shortDesc: "Halve the sorted search range every comparison with low, mid, and high pointers.",
    tags: ["O(log n)", "Divide & Conquer", "Sorted"],
  },
  {
    id: "hashing",
    category: "searching",
    moduleTag: "Module 5",
    title: "Hashing & Collision Resolution",
    shortDesc: "Separate Chaining, Linear/Quadratic Probing, Double Hashing, Rehashing & Extendible Hashing.",
    tags: ["Chaining", "Probing", "Double Hash", "Rehash", "Extendible"],
  },

  // Module 6: Graphs
  {
    id: "graph-basics",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Graph & Representations",
    shortDesc: "Build custom weighted directed or undirected graphs and inspect Matrix, List & Sparse views.",
    tags: ["Adjacency List", "Matrix", "Sparse Matrix"],
  },
  {
    id: "bfs",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Breadth-First Search (BFS)",
    shortDesc: "Level-by-level traversal with live Queue state, directed support, and connectivity check.",
    tags: ["Queue", "Level-Order", "Connectivity"],
  },
  {
    id: "dfs",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Depth-First Search (DFS)",
    shortDesc: "Deep branch exploration with call stack tracing, discovery order, and backtracking.",
    tags: ["Recursion Stack", "Backtracking", "O(V+E)"],
  },
  {
    id: "mst",
    category: "graphs",
    moduleTag: "Module 6",
    title: "MST: Prim's & Kruskal's",
    shortDesc: "Compare greedy Prim's frontier expansion vs Kruskal's sorted edges & Union-Find.",
    tags: ["Prim's", "Kruskal's", "Union-Find"],
  },
  {
    id: "dijkstra",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Dijkstra's Shortest Path",
    shortDesc: "Single-source shortest paths with live edge relaxation and distance table updates.",
    tags: ["Single Source", "Relaxation", "Priority"],
  },
  {
    id: "floyd",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Floyd-Warshall (All-Pairs)",
    shortDesc: "Edit your own distance matrix and step through every intermediate pivot vertex k.",
    tags: ["All-Pairs", "Editable Matrix", "O(V^3) DP"],
  },
  {
    id: "warshall",
    category: "graphs",
    moduleTag: "Module 6",
    title: "Warshall's Transitive Closure",
    shortDesc: "Toggle 0/1 reachability cells and watch transitive paths form step-by-step.",
    tags: ["Reachability", "Boolean Matrix", "Closure"],
  },
];

export const VALID_TOPIC_IDS = new Set<string>(["home", ...TOPICS.map((t) => t.id)]);
