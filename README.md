# DSA Studio — Visual Data Structures & Algorithms Explorer

An interactive, student-friendly, zero-login web resource designed for **CSE2001 (Data Structures and Algorithms)** students to explore algorithms step-by-step using their own custom inputs.

## Quick Open (No Setup Required)

- **Open directly in browser**: Double-click `index.html` right in the project root — it is a self-contained single-file production bundle (`dist/index.html` is identical) that runs offline with zero install.
- **Deploy on GitHub Pages**: Upload to GitHub and enable **Settings → Pages → Deploy from branch (`main` / `(root)`)** — works immediately with no build step needed.

## Features

- **Custom User Input Everywhere**: Every visualizer includes a live **User Input & Controls** panel alongside presets and step-by-step Play / Pause / Step Back / Step Forward / Speed playback.
- **29 Interactive Visualizers Across 6 Modules**:
  - **Module 1 (Algorithm Analysis)**: Asymptotic Notations (`O`, `Omega`, `Theta`, `o`) growth curve explorer, Recursion vs Iteration call stack (Factorial & Matrix Transpose).
  - **Module 2 (Linear Data Structures)**: Array/List, Singly/Doubly/Circular Linked Lists, Stack + Postfix Expression Evaluator, Queue, Deque, Priority Queue (Min & Max).
  - **Module 3 (Trees)**: Tree Fundamentals (Full / Complete / Perfect Binary Tree checker & node inspector), BST Insert/Delete/Search & Traversals (In-order, Pre-order, Post-order), AVL Tree (LL, RR, LR, RL rotations with Balance Factors), Expression & Tree Reconstruction (from Infix/Prefix/Postfix or In-order + Pre/Post-order).
  - **Module 4 (Sorting)**: Selection Sort, Insertion Sort, Quick Sort (selectable pivot: Last, First, Middle, Random), Merge Sort (Divide-and-Conquer tree + Bar view), Heap Sort (Max-Heap & Min-Heap with synchronized Binary Heap tree).
  - **Module 5 (Searching & Hashing)**: Linear Search, Binary Search, and Hashing (Division, Mid-Square, Multiplication; Separate Chaining, Linear/Quadratic Probing, Double Hashing, Rehashing, Extendible Hashing).
  - **Module 6 (Graphs & Connectivity)**: Interactive Graph Builder & Custom Edge List parser (Adjacency Matrix, Adjacency List, Sparse Matrix), BFS, DFS, MST (Prim's & Kruskal's), Dijkstra's Shortest Path, Floyd-Warshall (editable matrix), Warshall's Transitive Closure (toggleable Boolean matrix).

## Run & Edit Source Locally

```bash
npm install
npm run dev
```

## Rebuild Production `index.html`

```bash
npm run build
```

Builds `dist/index.html` from `entry.html` + `src/` and updates the root `index.html` automatically.
