# DSA Studio — Visualizer & Repository Report

**Date:** 25 November 2026
**Scope:** All source, configuration, assets and generated files in this repository.
**Branch:** `arena/0cc24bdd-dsa`

---

## 1. Executive summary

DSA Studio is a **client-side, single-page interactive lab** for 29 DSA topics across six syllabus modules. There is no server, database, login or network API: every algorithm runs in the browser on data typed by the student.

The app is written almost entirely in **TypeScript + React (TSX)**. Visual output is produced with **SVG** (trees, graphs, growth charts), ordinary **HTML/CSS flex and grid boxes** (arrays, lists, tables), **Tailwind CSS v4** for styling and the **`motion`** library for transitions. A single **Java** function is present as a *display-only code sample* in the recursion notes; it is not compiled or executed. Build/deployment metadata is **JSON/TypeScript/YAML/Markdown**, and the published site is one self-contained **HTML file with inlined JavaScript and CSS**.

During the audit the repository contained two half-finished generations of the app, a 636 KB generated bundle checked in as the root `index.html`, broken import paths, and missing toolchain dependencies. Those issues have been corrected; details in §5 and §6.

---

## 2. How the visualizers work

### 2.1 Bootstrap and navigation

1. `index.html` is a small Vite template with `<div id="root">` and `<script type="module" src="/src/main.tsx">`.
2. `src/main.tsx` mounts `<App />` inside `React.StrictMode` and imports `src/index.css`.
3. `src/App.tsx` holds the only top-level state:
   - `activeTopic` (`TopicId`), `homeCategory`, `searchQuery`, `sidebarOpen`.
   - Topic metadata comes from `src/data/syllabus.ts` (`TOPICS`, `CATEGORIES`), which drives the overview cards, sidebar, search filter and top navigation. There is **no URL router** — switching topics is a React state update followed by `window.scrollTo({ top: 0 })`.
   - `Ctrl/Cmd + K` focuses the sidebar filter.
4. `renderActiveVisualizer()` in `App.tsx` dispatches on the selected topic's `category` to one of six visualizer modules. Each module then dispatches on the specific `TopicId`.

```
App (topic state)
 └─ category router in App.tsx
     ├─ analysis   → src/visualizers/AnalysisVisualizer.tsx   (renderAnalysisTopic)
     ├─ linear     → src/visualizers/LinearVisualizer.tsx     (renderLinearTopic)
     ├─ trees      → src/visualizers/TreeVisualizer.tsx       (renderTreeTopic)
     ├─ graphs     → src/visualizers/GraphVisualizer.tsx      (GraphSectionRouter)
     ├─ sorting    → src/visualizers/SortingVisualizer.tsx    (SortingVisualizer)
     └─ searching  → src/visualizers/SearchHashVisualizer.tsx (renderSearchHashTopic)
```

### 2.2 The shared "studio" pattern

All six modules compose the same primitives from `src/components/ui/`:

| Primitive | File | Role |
|---|---|---|
| `VisualizerWorkspace` | `primitives-21st.tsx` | Two-column workbench shell: **stage** on the left, **"Input & controls"** inspector on the right, status badge and optional notes. |
| `PlaybackDock` | `primitives-21st.tsx` | Reset / Step back / Play-Pause / Step forward buttons, speed slider and colour legend used by all stepped algorithms. |
| `MorphingPillTabs` | `primitives-21st.tsx` | Segmented tab switching (algorithm, traversal mode, heap type, etc.) using a shared `layoutId`. |
| `ConceptNotesGrid` | `primitives-21st.tsx` | Intuition, key points, time/space complexity table and an optional "View Java code" disclosure. |
| `HeroSpecimen` | `hero-specimen.tsx` | Interactive Quick Sort trace preview embedded in the Overview split hero. |
| `StudioInput`, `StudioTextarea`, `StudioSelect`, `StudioBtn`, `PresetRow`, `InspectorBlock` | `input-helpers.tsx` | Consistent, labelled inputs, presets and explanatory callouts. |
| `SlidingNumber`, `AnimatedGroup` | `motion-primitives.tsx` | Tabular step digit transitions and initial grid entrance motion. |

`src/lib/utils.ts` provides the usual `cn()` helper (`clsx` + `tailwind-merge`). `src/index.css` imports Tailwind v4 and defines the Graphite & Amber surface/text tokens and focus/scrollbar styling.

### 2.3 Two interaction models

**A. Direct-manipulation model** — arrays, linked lists, stack/queue/deque/priority queue, tree fundamentals, expression-tree construction, graph builder and hashing.

- Inputs parse text (comma/space separated numbers, edge lists, matrix rows, expressions) into plain TypeScript data structures (arrays, node objects, maps).
- A button mutates the structure in React state (`setItems`, `setRoot`, `setGraph`, …).
- The stage re-renders immediately; `motion`/`AnimatePresence` animates entering, leaving and reordered elements. Highlights and a status string explain what changed (e.g. "shifted 3 elements right", "LL imbalance → right rotate").
- `useMemo` derives expensive views such as tree layout, adjacency matrix/list/sparse matrix, hash buckets or reconstruction results from the current inputs.

**B. Step-timeline model** — recursion traces, postfix evaluation, BST traversals, AVL insertions/rotations, all five sorts, BFS/DFS, MST, Dijkstra, Floyd-Warshall, Warshall and linear/binary search.

- A pure TypeScript generator walks the algorithm once and produces an **array of immutable snapshots** (`RecStep`, `PostfixStep`, `TreeStep`, `AVLStep`, `SortStep`, `TraversalStep`, `MSTStep`, `DijkStep`, `FWStep`, `SearchStep`).
- Each snapshot carries the complete visible state (array + per-element colour state, tree root, node/edge states, stack/queue contents, distance table, message text), so rendering any index is deterministic and **Step Back costs nothing**.
- `stepIdx` selects the snapshot. A `setInterval` in `useEffect` advances it while `playing` is true; interval length is `1150 - speed * 95` ms (tree: `1100 - speed * 90`) with `speed` from 1–10. Play, pause, reset, step and speed are available through `PlaybackDock`.
- Inputs are parsed and the timeline is rebuilt with `useMemo`/`setSteps` whenever the source data or algorithm mode changes, and playback resets to index 0.

**Hybrid cases:** sorting uses a step timeline for the bar view *and* a separate derived merge tree (`buildMergeTreeData`); hashing recomputes buckets and probe logs live with `useMemo` rather than animating a step list; the asymptotic chart draws sample points for toggled O/Ω/Θ/o functions directly from a slider value `n`.

### 2.4 Rendering

- **SVG** is generated declaratively inside TSX: `TreeSvgCanvas` layout for trees (`layoutBinaryTree`), `GraphSvgStage` for vertices/edges, `SortingVisualizer` for the merge tree and heap tree, `AsymptoticVisualizer` for growth curves.
- **HTML + Tailwind** renders array cells, linked-list nodes with arrow glyphs, stack/queue columns, hash buckets, matrices and tables.
- **No `<canvas>`**, no WebGL, no external charting library; `lucide-react` supplies icons.
- Concept notes are data passed into `ConceptNotesGrid`; complexity values are plain strings, not computed.

### 2.5 Segment-by-segment map

| Module | Topics | Source file | Algorithm engine / state | Visible output |
|---|---:|---|---|---|
| 1 — Analysis | 2 | `AnalysisVisualizer.tsx` | Growth functions evaluated for `n`; recursive frame and transpose snapshot builders | SVG curve chart; call-stack frames and matrix cell walk |
| 2 — Linear structures | 8 | `LinearVisualizer.tsx` | Immutable array splice/filter, node-pointer rebuild, stack postfix step builder, queue/deque/priority logic | Animated boxes, pointer arrows, stack columns, priority heap view |
| 3 — Trees | 4 | `TreeVisualizer.tsx` | Full/complete/perfect checks, BST clone/insert/delete, recursive traversal snapshots, AVL heights/balance factors and LL/RR/LR/RL rotations, expression parsing and reconstruction | SVG tree canvas per step, balance-factor labels, traversal output chips |
| 4 — Sorting | 5 | `SortingVisualizer.tsx` | One `generateSortSteps` switch (selection, insertion, quick with pivot strategy, merge, heap with min/max) plus merge-tree builder | Colour-coded bars, step narration, SVG divide-and-conquer tree, heap tree |
| 5 — Search & hashing | 3 | `SearchHashVisualizer.tsx` | Linear/binary search snapshots (`lo`, `mid`, `hi`); division/mid-square/multiplication hashes; chaining, linear/quadratic/double probing, rehashing to next prime, extendible hashing | Index range highlights, comparison counters, hash buckets/slot probes, directory/bucket table |
| 6 — Graphs | 7 | `GraphVisualizer.tsx` | Shared graph state; edge-list parser; adjacency matrix/list/sparse derivation; BFS queue, DFS stack, Prim/Kruskal with union-find, Dijkstra relaxation, Floyd-Warshall and Warshall triple loops | Interactive SVG graph, frontier/visit colours, edge highlighting, distance/reachability matrices |

Topic counts: 2 + 8 + 4 + 7 + 5 + 3 = **29**.

---

## 3. Programming languages and technologies by segment

| Segment | Language / technology | What it is used for | Where |
|---|---|---|---|
| Application shell and routing | **TypeScript (TSX)**, React 19 | Topic state, navigation, filters, module dispatch | `src/App.tsx`, `src/main.tsx` |
| Algorithm simulations | **TypeScript** (pure functions, interfaces, typed snapshot arrays) | Every algorithm, parser, validator and derived structure | `src/visualizers/*.tsx`, `src/data/syllabus.ts` |
| UI components and animation | **TSX + `motion/react`** | Reusable workspace, docks, tabs, cards, entrance/exit motion | `src/components/ui/*.tsx` |
| Styling | **Tailwind CSS v4** + hand-written **CSS** | Graphite & Amber dark tokens, responsive layout, focus states | `src/index.css`, utility classes throughout TSX |
| Graphics | **SVG markup emitted by TSX**; static **SVG** asset | Trees, graphs, charts, icons; flat geometric favicon | `src/visualizers/*.tsx`, `public/favicon.svg` |
| Code samples shown to students | **Java** (text only, inside a template string) | One recursive vs iterative factorial example in the concept notes. It is displayed, never compiled or run. | `src/visualizers/AnalysisVisualizer.tsx` |
| Build tooling | **TypeScript config**, **JSON**, **Vite plugin API** | Vite 8 + React + Tailwind + `vite-plugin-singlefile`; type checking and lint scripts | `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `.oxlintrc.json` |
| Output artifact | **Minified JavaScript + CSS inlined into HTML** | One offline-openable `dist/index.html` (≈ 609 KB) | Generated by `npm run build`; not committed |
| Documentation | **Markdown** | Setup, architecture and this report | `README.md`, `docs/REPORT.md` |
| CI / hosting | **YAML** | Build, typecheck, lint and optionally publish to GitHub Pages (skipped when Pages is not enabled) | `.github/workflows/deploy-pages.yml` |
| Backend / data | **None** | No server-side language, database, API calls or persistence | — |

> **Answer in one line:** the product segment (UI + algorithms) is TypeScript/React; presentation is Tailwind CSS + SVG; configuration is JSON/TS/YAML; documentation is Markdown; the only other programming language appearing in content is a single Java teaching snippet. The committed root HTML used to be generated JavaScript, but it is now a source template.

---

## 4. Development workflow

```bash
npm ci            # install exact locked versions
npm run dev       # Vite dev server at http://localhost:5173
npm run check     # TypeScript typecheck + oxlint
npm run build     # emits the self-contained dist/index.html
npm run preview   # serve the built file locally
```

Two ways to use the built app:

- **Online:** GitHub Pages deploys `dist/` through `.github/workflows/deploy-pages.yml` on every push to `main`, provided Pages is enabled (**Settings → Pages → Source: GitHub Actions**). When Pages is disabled, the workflow still builds and checks the site but skips deployment, so CI remains green; Vercel can serve the same build.
- **Offline:** after `npm run build`, double-click `dist/index.html`. JS and CSS are inlined by `vite-plugin-singlefile`, so no server is required.

---

## 5. Audit findings and changes made

| Finding | Action |
|---|---|
| Two parallel implementations were mixed: the live app imported `./visualizers/*` and `./components/ui/*`, while an older set of 16 `framer-motion` / `react-router-dom` files referenced a non-existent `src/data/topics.ts` and a missing `Layout` component. | Removed the 16 stale components/pages. Kept the six visualizers that `App.tsx` actually imports. |
| The six live visualizers sat in `src/pages/` and five shared UI primitives sat directly in `src/components/`, so all relative imports were broken. | Relocated the six files to `src/visualizers/` and the five primitives to `src/components/ui/`; their existing relative imports now resolve. |
| Root `index.html` was a 636 KB generated production bundle, yet Vite treated it as its own build input. `npm run build` rebuilt the bundle instead of compiling `src/` (only 6 modules transformed), and the README's `entry.html`/copy step did not exist. | Replaced it with a small Vite source template. Enabled `vite-plugin-singlefile`; a real build now transforms ~2,600 modules and emits `dist/index.html` with JS/CSS inlined. |
| Generated `dist/` was not ignored; stale `public/icons.svg` and `public/sidebar-toggle.png` were unreferenced; `favicon.svg` was never linked. | Added `dist/` and `.env*` to `.gitignore`, deleted the unused assets, linked the favicon in the template. |
| `tsconfig.json`, `tsconfig.app.json` and `tsconfig.node.json` overlapped; no `typecheck` or lint script existed and `typescript`, `@types/node` and `oxlint` were not installed. | Consolidated into one strict `tsconfig.json`, added the three dev dependencies and `typecheck` / `lint` / `check` scripts; removed three unused React default imports. |
| `vite-plugin-singlefile` was listed as a dependency but unused; Pages deployment instructions assumed a no-build root deployment that no longer exists. | Wired the plugin into `vite.config.ts` and added a GitHub Actions Pages workflow. |
| README described an `entry.html` workflow and did not document the folder layout, checks or CI. | Rewrote the README with accurate setup, structure, checks and deployment steps. |

**Net result:** 26 obsolete files removed, 11 files moved into the folders their imports expect, 16 source files retained, no stale dependency references, and a reproducible build/typecheck/lint pipeline.

---

## 6. Verification performed

| Check | Result |
|---|---|
| `npm ci` / `npm install` | Dependencies install cleanly (47 base packages plus toolchain). |
| `npm run typecheck` (`tsc --noEmit`, strict + unused checks) | Passes with zero errors. |
| `npm run lint` (`oxlint src vite.config.ts`) | 0 errors; 20 non-blocking warnings (fast-refresh export shape and `setState` in effects used to reset timelines). |
| `npm run build` | Passes: ~2,593 modules transformed; single `dist/index.html` ≈ 619 KB, JS and CSS inlined, no external JS chunk. |
| `npm run dev` | Vite serves on `0.0.0.0:5173`; `/`, `/src/main.tsx`, `/src/App.tsx` and all visualizer modules return HTTP 200 with successful transforms. |

### Recommended follow-ups (not required for the current build)

1. Extract each algorithm engine into a `src/lib/algorithms/` module with unit tests; the step builders are already pure enough to test directly.
2. Resolve the 20 lint warnings — mainly split `render*Topic` routers into separate files and derive/reset timeline state outside effects.
3. Add lazy loading (`React.lazy`) per module for hosted deployments while preserving the offline single-file build as a separate target.
4. Add a shortcut/help panel documenting `Ctrl/Cmd + K` and the playback controls for new students.

---

## 7. UI workbench refactor (November 2026)

- **Design system & shell:** Replaced the purple-gradient hero, continuous border/shimmer effects, and duplicate top-bar category links with a Graphite & Amber workbench palette (`#0f0f10` / `#141415` / `#19191b` / `#232325` + `#f59e0b`), `Inter` + `JetBrains Mono` typography, a persistent `256px` desktop syllabus sidebar, and the interactive `HeroSpecimen` Quick Sort preview. Removed unused `magic-ui.tsx` and `react-bits.tsx` wrappers and redrew `public/favicon.svg`.
- **Stage & chart fixes:** Fixed the vertical whitespace gap inside `VisualizerWorkspace`, separated colliding curve labels and operation cards in `AsymptoticVisualizer`, kept linked-list `NULL` markers aligned on a single horizontal track without wrapping below the list (`1280px` and `1440px`), and preserved glowing node borders across linear, search/hash, tree, and graph visualizers.
