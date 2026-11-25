# DSA Studio — Visual Data Structures & Algorithms Explorer

An interactive, student-friendly, zero-login web app for exploring **CSE2001 Data Structures and Algorithms** topics step by step with your own inputs. Everything runs in the browser — no backend, database or account required.

## Highlights

- **29 interactive visualizers across 6 syllabus modules**, each with live user input, presets and (where it makes sense) Play / Pause / Step Back / Step Forward / Speed controls.
- **Module 1 — Algorithm Analysis:** Big-O / Ω / Θ / o growth curves; recursion vs iteration call stacks for factorial and matrix transpose.
- **Module 2 — Linear Structures:** array/list, singly / doubly / circular linked lists, stack + postfix evaluator, queue, deque, priority queue.
- **Module 3 — Trees:** tree fundamentals and type checks, BST insert/delete/search + traversals, AVL rotations (LL/RR/LR/RL), expression and reconstruction trees.
- **Module 4 — Sorting:** selection, insertion, quick (four pivot strategies), merge (divide tree + bars), heap (min/max with synchronized heap tree).
- **Module 5 — Search & Hashing:** linear/binary search, division / mid-square / multiplication hashes, chaining, linear/quadratic probing, double hashing, rehashing and extendible hashing.
- **Module 6 — Graphs:** graph builder and edge-list parser with matrix/list/sparse views, BFS, DFS, Prim's & Kruskal's MST, Dijkstra, Floyd-Warshall and Warshall's transitive closure.

See [`docs/REPORT.md`](docs/REPORT.md) for a detailed explanation of how the visualizers work, the languages used in each segment, and the repository audit.

## Tech stack

| Layer | Technology |
|---|---|
| UI and algorithm logic | TypeScript + React 19 (TSX) |
| Styling | Tailwind CSS v4 + custom CSS |
| Animation | `motion/react` |
| Graphics | SVG generated in TSX, `lucide-react` icons |
| Build | Vite 8 + `vite-plugin-singlefile` (one offline-ready HTML file) |
| Quality | TypeScript (`npm run typecheck`), oxlint (`npm run lint`) |
| Hosting | Vercel or GitHub Pages (GitHub Actions) |

## Project structure

```text
.
├── index.html                 # Vite source template (not the built app)
├── public/favicon.svg         # Static asset
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Shell, navigation and category router
│   ├── index.css              # Tailwind import, theme and hero styles
│   ├── data/syllabus.ts       # Topic catalogue and type definitions
│   ├── lib/utils.ts           # cn() class-name helper
│   ├── components/ui/         # Shared workspace, inputs, tabs, playback, effects
│   └── visualizers/           # Six module-level visualizer implementations
├── docs/REPORT.md             # Architecture, languages and audit report
├── vite.config.ts             # React + Tailwind + single-file build config
└── .github/workflows/         # GitHub Pages deployment workflow
```

## Getting started

Requires Node.js 22 or newer.

```bash
npm ci        # or: npm install
npm run dev   # http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Produce the self-contained production site in `dist/index.html`. |
| `npm run preview` | Serve `dist/` locally to check the production build. |
| `npm run typecheck` | Run the TypeScript compiler with no emit. |
| `npm run lint` | Lint `src/` and the Vite config with oxlint. |
| `npm run check` | Run typecheck and lint together. |

## Deployment / offline use

- **GitHub Pages:** first enable **Settings → Pages → Source: GitHub Actions**. Pushes to `main` then run the workflow, which checks, builds and publishes `dist/`. Until Pages is enabled, the workflow still checks and builds but skips the deployment step instead of failing.
- **Offline:** run `npm run build`, then double-click `dist/index.html`. JavaScript and CSS are inlined, so it works without a server. `dist/` is generated and intentionally not tracked.

## License

[MIT](LICENSE)
