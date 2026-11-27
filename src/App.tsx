import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Binary,
  Compass,
  GitBranch,
  Layers,
  Menu,
  Network,
  Search,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  TOPICS,
  VALID_TOPIC_IDS,
  type CategoryId,
  type TopicId,
} from "./data/syllabus";
import { AnimatedGroup } from "./components/ui/motion-primitives";
import { MorphingPillTabs } from "./components/ui/primitives-21st";
import { HeroSpecimen } from "./components/ui/hero-specimen";
import { AnalysisSectionRouter } from "./visualizers/AnalysisVisualizer";
import { LinearSectionRouter } from "./visualizers/LinearVisualizer";
import { TreeSectionRouter } from "./visualizers/TreeVisualizer";
import { GraphSectionRouter } from "./visualizers/GraphVisualizer";
import { SortingVisualizer } from "./visualizers/SortingVisualizer";
import { SearchHashSectionRouter } from "./visualizers/SearchHashVisualizer";

const CATEGORY_ICON: Record<Exclude<CategoryId, "all">, React.ReactNode> = {
  analysis: <Activity className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
  linear: <Layers className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
  trees: <GitBranch className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
  sorting: <BarChart3 className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
  searching: <Binary className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
  graphs: <Network className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />,
};

function readTopicFromHash(): TopicId {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (!raw || raw === "syllabus-grid") return "home";
  return VALID_TOPIC_IDS.has(raw) ? (raw as TopicId) : "home";
}

function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="10" width="4" height="8" rx="1" fill="#93939a" />
      <rect x="8" y="3" width="4" height="15" rx="1" fill="#f59e0b" />
      <rect x="14" y="7" width="4" height="11" rx="1" fill="#ededed" />
    </svg>
  );
}

export function App() {
  const [activeTopic, setActiveTopic] = useState<TopicId>(() => readTopicFromHash());
  const [homeCategory, setHomeCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform),
    []
  );

  const currentMeta = useMemo(
    () => TOPICS.find((t) => t.id === activeTopic) ?? null,
    [activeTopic]
  );

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TOPICS.filter((t) => {
      const catMatch = homeCategory === "all" || t.category === homeCategory;
      const qMatch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.moduleTag.toLowerCase().includes(q) ||
        t.tags.some((tg) => tg.toLowerCase().includes(q));
      return catMatch && qMatch;
    });
  }, [homeCategory, searchQuery]);

  const navigateTopic = useCallback((id: TopicId) => {
    setActiveTopic(id);
    setSidebarOpen(false);
    const nextHash = id === "home" ? "#/" : `#/${id}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sync browser Back / Forward / hash navigation
  useEffect(() => {
    const onHashOrPop = () => {
      setActiveTopic(readTopicFromHash());
      setSidebarOpen(false);
    };
    window.addEventListener("hashchange", onHashOrPop);
    window.addEventListener("popstate", onHashOrPop);
    return () => {
      window.removeEventListener("hashchange", onHashOrPop);
      window.removeEventListener("popstate", onHashOrPop);
    };
  }, []);

  // Ctrl/Cmd + K focuses sidebar search; Escape closes mobile drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        const el = document.getElementById("sidebar-search-input");
        el?.focus();
      } else if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sidebarHasAnyMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return TOPICS.some(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.moduleTag.toLowerCase().includes(q) ||
        t.tags.some((tg) => tg.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const renderActiveVisualizer = () => {
    if (!currentMeta) return null;
    switch (currentMeta.category) {
      case "analysis":
        return <AnalysisSectionRouter topicId={currentMeta.id} />;
      case "linear":
        return <LinearSectionRouter topicId={currentMeta.id} />;
      case "trees":
        return <TreeSectionRouter topicId={currentMeta.id} />;
      case "sorting":
        return <SortingVisualizer topicId={currentMeta.id} onSelectTopic={navigateTopic} />;
      case "searching":
        return <SearchHashSectionRouter topicId={currentMeta.id} />;
      case "graphs":
        return <GraphSectionRouter topicId={currentMeta.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#141415] text-[#ededed]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-[#ededed]/[0.08] bg-[#141415] px-4 lg:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:text-[#ededed] lg:hidden cursor-pointer"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTopic("home")}
            className="flex shrink-0 items-center gap-2.5 text-left whitespace-nowrap cursor-pointer"
          >
            <BrandMark />
            <span className="text-base font-semibold tracking-[-0.01em] text-[#ededed]">
              DSA Studio
            </span>
          </button>
        </div>

        {currentMeta ? (
          <div className="flex items-center gap-2 text-xs text-[#93939a]">
            <span className="hidden font-mono sm:inline">{currentMeta.moduleTag}</span>
            <span className="hidden sm:inline">·</span>
            <span className="truncate font-medium text-[#a1a1a6]">{currentMeta.title}</span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 text-xs text-[#93939a] sm:flex">
            <span className="font-mono">29 topics</span>
            <span>·</span>
            <span>6 modules</span>
          </div>
        )}
      </header>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Persistent Desktop Syllabus Sidebar (256px) / Mobile Drawer */}
        <aside
          aria-label="Syllabus navigation"
          className={`fixed bottom-0 left-0 top-14 z-40 flex w-64 shrink-0 flex-col border-r border-[#ededed]/[0.08] bg-[#0f0f10] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="border-b border-[#ededed]/[0.07] p-4">
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-[#93939a]"
                strokeWidth={1.5}
              />
              <input
                id="sidebar-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter topics"
                aria-label="Filter syllabus topics"
                className="h-9 w-full rounded-lg border border-[#ededed]/[0.09] bg-[#19191b] pl-9 pr-14 text-xs text-[#ededed] placeholder:text-[#93939a] outline-none transition-colors duration-150 focus:border-amber-500/70"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear filter"
                  className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-[#93939a] hover:bg-[#232325] hover:text-[#ededed] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2 rounded border border-[#ededed]/[0.1] bg-[#232325] px-1.5 py-0.5 font-mono text-[11px] text-[#93939a]">
                  {isMac ? "⌘K" : "Ctrl K"}
                </kbd>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <button
              type="button"
              onClick={() => navigateTopic("home")}
              className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 cursor-pointer ${
                activeTopic === "home"
                  ? "bg-[#232325] font-medium text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-[#a1a1a6] hover:bg-[#19191b] hover:text-[#ededed]"
              }`}
            >
              <span className="flex w-4 shrink-0 items-center justify-center">
                <Compass className="h-4 w-4 text-[#93939a]" strokeWidth={1.5} />
              </span>
              <span className="flex-1 truncate">Overview</span>
              {activeTopic === "home" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              )}
            </button>

            {!sidebarHasAnyMatches ? (
              <div className="mt-6 rounded-xl border border-[#ededed]/[0.07] bg-[#141415] p-4 text-center">
                <p className="text-xs text-[#a1a1a6]">No topics match &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              CATEGORIES.map((cat) => {
                const q = searchQuery.trim().toLowerCase();
                const catTopics = TOPICS.filter(
                  (t) =>
                    t.category === cat.id &&
                    (!q ||
                      t.title.toLowerCase().includes(q) ||
                      t.shortDesc.toLowerCase().includes(q) ||
                      t.moduleTag.toLowerCase().includes(q) ||
                      t.tags.some((tg) => tg.toLowerCase().includes(q)))
                );
                if (!catTopics.length) return null;

                return (
                  <div key={cat.id} className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-2 px-2.5 text-xs font-medium text-[#93939a]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex w-4 shrink-0 items-center justify-center">
                          {CATEGORY_ICON[cat.id]}
                        </span>
                        <span className="truncate">{cat.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[#93939a]/80">
                        {cat.moduleCode.replace("Module ", "M")}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {catTopics.map((topic) => {
                        const isActive = activeTopic === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => navigateTopic(topic.id)}
                            className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] transition-colors duration-150 cursor-pointer ${
                              isActive
                                ? "bg-[#232325] font-medium text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                : "text-[#a1a1a6] hover:bg-[#19191b] hover:text-[#ededed]"
                            }`}
                          >
                            <span className="flex w-2.5 shrink-0 items-center justify-center">
                              <span
                                className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
                                  isActive ? "bg-amber-500" : "bg-[#93939a]/40"
                                }`}
                              />
                            </span>
                            <span className="truncate">{topic.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
            {activeTopic === "home" ? (
              <div className="space-y-12">
                {/* Asymmetric Split Hero */}
                <section className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-12">
                  <div>
                    <h1 className="text-4xl font-medium tracking-[-0.025em] leading-[1.06] text-[#ededed] sm:text-5xl">
                      Step through data structures and algorithms
                    </h1>
                    <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-[#a1a1a6] sm:text-lg">
                      Supply your own arrays, trees, graphs, or expressions and watch pointers,
                      rotations, and comparisons update one step at a time
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigateTopic("quick-sort")}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#ededed] px-5 text-sm font-medium text-[#141415] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white active:scale-[0.98] cursor-pointer"
                      >
                        Start with Quick Sort
                        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("syllabus-grid")
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="inline-flex h-11 items-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] px-5 text-sm font-medium text-[#ededed] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:bg-[#2b2b2e] cursor-pointer"
                      >
                        Browse 29 topics
                      </button>
                    </div>
                  </div>

                  <HeroSpecimen onOpenTopic={navigateTopic} />
                </section>

                {/* Syllabus Section */}
                <section id="syllabus-grid" className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-lg font-medium text-[#ededed]">Syllabus workbench</h2>
                      <span className="font-mono text-xs tabular-nums text-[#93939a]">
                        {filteredTopics.length} topics
                      </span>
                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                        >
                          Filter: &ldquo;{searchQuery.trim()}&rdquo;
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <MorphingPillTabs
                      layoutId="home-cat-tabs"
                      value={homeCategory}
                      onChange={setHomeCategory}
                      options={[
                        { id: "all", label: "All topics" },
                        { id: "analysis", label: "Analysis" },
                        { id: "linear", label: "Linear DS" },
                        { id: "trees", label: "Trees" },
                        { id: "sorting", label: "Sorting" },
                        { id: "searching", label: "Search & Hash" },
                        { id: "graphs", label: "Graphs" },
                      ]}
                    />
                  </div>

                  {filteredTopics.length === 0 ? (
                    <div className="rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-10 text-center">
                      <p className="text-sm font-medium text-[#ededed]">
                        No matching topics found
                      </p>
                      <p className="mt-1 text-xs text-[#93939a]">
                        Try a different keyword or reset the active category filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setHomeCategory("all");
                        }}
                        className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#ededed]/[0.12] bg-[#232325] px-4 text-xs font-medium text-[#ededed] hover:bg-[#2b2b2e] cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <AnimatedGroup
                      key={`${homeCategory}-${searchQuery}`}
                      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {filteredTopics.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => navigateTopic(topic.id)}
                          className="group flex flex-col justify-between rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-5 text-left transition-colors duration-150 hover:border-[#ededed]/[0.18] hover:bg-[#1e1e21] cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ededed]/[0.08] bg-[#232325]">
                                  {CATEGORY_ICON[topic.category]}
                                </span>
                                <span className="font-mono text-xs text-[#93939a]">
                                  {topic.moduleTag}
                                </span>
                              </div>
                              <ArrowRight
                                className="h-4 w-4 text-[#93939a] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-amber-400"
                                strokeWidth={1.5}
                              />
                            </div>

                            <h3 className="mt-3 text-base font-medium text-[#ededed]">
                              {topic.title}
                            </h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#a1a1a6]">
                              {topic.shortDesc.replace(/\.$/, "")}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {topic.tags.map((tg) => (
                              <span
                                key={tg}
                                className="rounded-md border border-[#ededed]/[0.07] bg-[#141415] px-2 py-0.5 font-mono text-xs text-[#93939a]"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </AnimatedGroup>
                  )}
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Topic Page Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#93939a]">
                      <button
                        type="button"
                        onClick={() => navigateTopic("home")}
                        className="transition-colors duration-150 hover:text-[#ededed] cursor-pointer"
                      >
                        All topics
                      </button>
                      <span>/</span>
                      <span className="font-mono text-amber-400">{currentMeta?.moduleTag}</span>
                    </div>
                    <h1 className="mt-1 text-3xl font-medium tracking-[-0.02em] text-[#ededed]">
                      {currentMeta?.title}
                    </h1>
                    <p className="mt-1 text-sm text-[#a1a1a6]">
                      {currentMeta?.shortDesc.replace(/\.$/, "")}
                    </p>
                  </div>
                </div>

                {renderActiveVisualizer()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
