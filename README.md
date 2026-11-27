# DSA Studio — Interactive Data Structures & Algorithms Workbench

[![Deploy to GitHub Pages](https://github.com/dommetipavan26-tech/DSA/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/dommetipavan26-tech/DSA/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

An interactive, client-side web workbench for exploring **29 Data Structures and Algorithms topics** across 6 syllabus modules with your own inputs. Everything runs locally in the browser with zero backend, database, or login required.

## Highlights

- **Graphite & Amber workbench shell:** Persistent `256px` desktop syllabus sidebar with `Ctrl/Cmd + K` quick filtering, mobile drawer navigation, split Overview hero with an interactive Quick Sort trace specimen, and focused per-topic inspector panels.
- **Interactive controls on every visualizer:** Enter custom arrays, linked lists, matrices, expressions, or edge lists, pick presets, and step through algorithms using **Play / Pause / Step Back / Step Forward / Reset / Speed** controls.
- **Module 1 — Algorithm Analysis (2 topics):** Interactive Big-O / $\Omega$ / $\Theta$ / $o$ growth curves with live input size $n$; recursion call-stack traces for factorial and matrix transpose.
- **Module 2 — Linear Structures (8 topics):** Array/List, Singly, Doubly, and Circular Linked Lists with glowing node states, Stack + Postfix Evaluator, Queue, Deque, and Priority Queue.
- **Module 3 — Trees (4 topics):** Tree fundamentals and Full/Complete/Perfect checks, BST insert/delete/search + traversals, AVL self-balancing rotations (`LL`, `RR`, `LR`, `RL`), and expression/reconstruction trees.
- **Module 4 — Sorting (5 topics):** Selection, Insertion, Quick Sort (4 pivot modes), Merge Sort (divide-and-conquer tree + bar chart), and Heap Sort (Min/Max heap with live binary heap tree).
- **Module 5 — Search & Hashing (3 topics):** Linear & Binary Search; Division, Mid-Square, and Multiplication hash functions with Chaining, Linear/Quadratic Probing, Double Hashing, Rehashing, and Extendible Hashing.
- **Module 6 — Graphs (7 topics):** Custom interactive graph builder (Adjacency Matrix, Adjacency List, Sparse Triplets), BFS, DFS, Prim's & Kruskal's MST, Dijkstra's Shortest Path, Floyd-Warshall, and Warshall's Transitive Closure.

See [`docs/REPORT.md`](docs/REPORT.md) for the architecture breakdown, module map, and engineering report.

## Tech stack

| Layer | Technology |
|---|---|
| UI & algorithm engines | TypeScript + React 19 (TSX) |
| Styling & typography | Tailwind CSS v4 (`Inter` + `JetBrains Mono`) |
| Motion | `motion/react` |
| Graphics & icons | Declarative SVG in TSX, `lucide-react` |
| Build & bundling | Vite 8 + `vite-plugin-singlefile` (offline-ready single HTML) |
| Quality & CI | `tsc --noEmit`, `oxlint`, GitHub Actions |
| Hosting | GitHub Pages or Vercel |

## Project structure

```text
.
├── index.html                           # Vite HTML entry & font/theme metadata
├── public/favicon.svg                   # Flat geometric brand icon
├── src/
│   ├── main.tsx                         # React entry point
│   ├── App.tsx                          # Workbench shell, sidebar & topic router
│   ├── index.css                        # Tailwind import & Graphite/Amber tokens
│   ├── data/syllabus.ts                 # 29-topic syllabus catalog & types
│   ├── lib/utils.ts                     # cn() class-merging utility
│   ├── components/ui/
│   │   ├── hero-specimen.tsx            # Interactive Quick Sort overview preview
│   │   ├── input-helpers.tsx            # Studio inputs, selects, buttons & presets
│   │   ├── motion-primitives.tsx        # SlidingNumber & AnimatedGroup
│   │   └── primitives-21st.tsx          # VisualizerWorkspace, PlaybackDock, tabs & notes
│   └── visualizers/                     # Six module-level visualizer implementations
├── docs/REPORT.md                       # Architecture, languages & audit report
├── .github/workflows/deploy-pages.yml   # CI checks & GitHub Pages deployment
├── .editorconfig                        # Formatting defaults
├── .oxlintrc.json                       # Oxlint configuration
├── tsconfig.json                        # Strict TypeScript configuration
└── vite.config.ts                       # Vite + Tailwind + singlefile config
```

## Getting started

Requires **Node.js 22** or newer.

```bash
npm ci        # install locked dependencies
npm run dev   # start dev server at http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Emit the self-contained production bundle in `dist/index.html`. |
| `npm run preview` | Serve `dist/` locally to inspect the production build. |
| `npm run typecheck` | Run strict TypeScript typechecking (`tsc --noEmit`). |
| `npm run lint` | Lint `src/` and `vite.config.ts` with `oxlint`. |
| `npm run check` | Run `typecheck` and `lint` together. |

## Deployment & offline use

- **GitHub Pages:** Enable **Settings → Pages → Source: GitHub Actions**. Every push to `main` runs `npm ci`, `npm run check`, `npm run build`, and deploys `dist/`. Pull requests to `main` run the check and build steps automatically.
- **Offline single-file bundle:** Run `npm run build` and open `dist/index.html` directly in any browser — all JS and CSS are inlined by `vite-plugin-singlefile`.

## License

[MIT](LICENSE) — Copyright (c) 2026 Pavan Dommeti
