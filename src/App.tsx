import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Binary,
  GitBranch,
  Layers,
  Menu,
  Network,
  Search,
  X,
} from "lucide-react";
import { CATEGORIES, TOPICS, type CategoryId, type TopicId } from "./data/syllabus";
import { DotPattern, MagicCard, NumberTicker } from "./components/ui/magic-ui";
import { BlurText, ClickSpark } from "./components/ui/react-bits";
import { AnimatedGroup } from "./components/ui/motion-primitives";
import { MorphingPillTabs } from "./components/ui/primitives-21st";
import { renderAnalysisTopic } from "./visualizers/AnalysisVisualizer";
import { renderLinearTopic } from "./visualizers/LinearVisualizer";
import { renderTreeTopic } from "./visualizers/TreeVisualizer";
import { GraphSectionRouter } from "./visualizers/GraphVisualizer";
import { SortingVisualizer } from "./visualizers/SortingVisualizer";
import { renderSearchHashTopic } from "./visualizers/SearchHashVisualizer";

const CATEGORY_ICON: Record<Exclude<CategoryId, "all">, React.ReactNode> = {
  analysis: <Activity className="h-4 w-4 text-cyan-400" />,
  linear: <Layers className="h-4 w-4 text-violet-400" />,
  trees: <GitBranch className="h-4 w-4 text-emerald-400" />,
  graphs: <Network className="h-4 w-4 text-amber-400" />,
  sorting: <BarChart3 className="h-4 w-4 text-pink-400" />,
  searching: <Binary className="h-4 w-4 text-sky-400" />,
};

export function App() {
  const [activeTopic, setActiveTopic] = useState<TopicId>("home");
  const [homeCategory, setHomeCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        t.tags.some((tg) => tg.toLowerCase().includes(q));
      return catMatch && qMatch;
    });
  }, [homeCategory, searchQuery]);

  const navigateTopic = (id: TopicId) => {
    setActiveTopic(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Ctrl+K shortcut to focus sidebar filter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("sidebar-search-input");
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const renderActiveVisualizer = () => {
    if (!currentMeta) return null;
    switch (currentMeta.category) {
      case "analysis":
        return renderAnalysisTopic(currentMeta.id);
      case "linear":
        return renderLinearTopic(currentMeta.id);
      case "trees":
        return renderTreeTopic(currentMeta.id);
      case "graphs":
        return <GraphSectionRouter topicId={currentMeta.id} />;
      case "sorting":
        return <SortingVisualizer topicId={currentMeta.id} onSelectTopic={navigateTopic} />;
      case "searching":
        return renderSearchHashTopic(currentMeta.id);
    }
  };

  return (
    <ClickSpark sparkColor="#a78bfa">
      <div className="min-h-screen bg-[#0b0d14] text-[#eef0f6]">
        {/* Top Navbar */}
        <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-white/[0.08] bg-[#0b0d14]/90 px-4 backdrop-blur-md lg:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#131724] text-slate-300 lg:hidden"
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => navigateTopic("home")}
              className="flex shrink-0 items-center gap-2.5 text-left whitespace-nowrap cursor-pointer"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/40 bg-violet-600/20 font-mono text-xs font-bold text-violet-300">
                DS
              </div>
              <div className="flex items-center">
                <span className="text-sm font-bold tracking-tight text-white">DSA Studio</span>
              </div>
            </button>
          </div>

          <nav className="hidden items-center gap-1 whitespace-nowrap md:flex">
            {[
              { id: "home" as TopicId, label: "Overview", cat: null },
              { id: "asymptotic" as TopicId, label: "Analysis", cat: "analysis" },
              { id: "list" as TopicId, label: "Linear DS", cat: "linear" },
              { id: "binary-tree" as TopicId, label: "Trees", cat: "trees" },
              { id: "bfs" as TopicId, label: "Graphs", cat: "graphs" },
              { id: "quick-sort" as TopicId, label: "Sorting", cat: "sorting" },
              { id: "hashing" as TopicId, label: "Search & Hash", cat: "searching" },
            ].map((navItem) => {
              const isActive =
                navItem.id === "home"
                  ? activeTopic === "home"
                  : currentMeta?.category === navItem.cat;
              return (
                <button
                  key={navItem.label}
                  type="button"
                  onClick={() => navigateTopic(navItem.id)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer lg:px-3 ${
                    isActive
                      ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

        </header>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex pt-14">
          {/* Left Sidebar */}
          <aside
            className={`fixed bottom-0 left-0 top-14 z-40 flex w-64 flex-col border-r border-white/[0.08] bg-[#0e111a] transition-transform duration-200 lg:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="border-b border-white/[0.06] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  id="sidebar-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter topics (Ctrl+K)"
                  className="w-full rounded-lg border border-white/[0.09] bg-[#080a10] py-1.5 pl-8 pr-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
              {CATEGORIES.map((cat) => {
                const catTopics = TOPICS.filter(
                  (t) =>
                    t.category === cat.id &&
                    (!searchQuery.trim() ||
                      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.tags.some((tg) => tg.toLowerCase().includes(searchQuery.toLowerCase())))
                );
                if (!catTopics.length) return null;

                return (
                  <div key={cat.id}>
                    <div className="mb-1 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5">
                        {CATEGORY_ICON[cat.id]}
                        {cat.label}
                      </span>
                      <span className="font-mono">{cat.moduleCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      {catTopics.map((topic) => {
                        const isActive = activeTopic === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => navigateTopic(topic.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                              isActive
                                ? "bg-violet-500/15 font-semibold text-violet-200 ring-1 ring-violet-500/35"
                                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                            }`}
                          >
                            <span className="truncate">{topic.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="min-h-[calc(100vh-3.5rem)] flex-1 lg:pl-64">
            <div className="mx-auto max-w-[1380px] p-4 sm:p-6">
              {activeTopic === "home" ? (
                <div className="space-y-6">
                  {/* Hero Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#10131e] px-6 py-10 sm:px-10">
                    <DotPattern className="opacity-50 [mask-image:radial-gradient(ellipse_at_center,white_35%,transparent_80%)]" />
                    <div className="relative z-10 max-w-3xl space-y-4">
                      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        <BlurText text="Understand Every Algorithm Step-by-Step With Your Own Inputs" />
                      </h1>

                      <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                        Built as an open, zero-login visual handbook for college juniors. Every data
                        structure, tree rotation, graph traversal, sorting tree, and hash table lets
                        you enter custom values and step through how it executes.
                      </p>

                      {/* Stats with NumberTicker */}
                      <div className="max-w-lg border-t border-white/[0.08] pt-5">
                        <div>
                          <div className="font-mono text-2xl font-bold text-white">
                            <NumberTicker value={TOPICS.length} />
                          </div>
                          <div className="text-xs text-slate-400">Interactive Visualizers</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <MorphingPillTabs
                      layoutId="home-cat-tabs"
                      value={homeCategory}
                      onChange={setHomeCategory}
                      options={[
                        { id: "all", label: "All Topics", badge: String(TOPICS.length) },
                        { id: "analysis", label: "Module 1: Analysis" },
                        { id: "linear", label: "Linear DS" },
                        { id: "trees", label: "Trees" },
                        { id: "graphs", label: "Graphs" },
                        { id: "sorting", label: "Sorting" },
                        { id: "searching", label: "Search & Hash" },
                      ]}
                    />
                  </div>

                  {/* Bento / Topic Cards Grid */}
                  <AnimatedGroup key={homeCategory} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredTopics.map((topic) => (
                      <MagicCard
                        key={topic.id}
                        onClick={() => navigateTopic(topic.id)}
                        className="p-4.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-[#171c2b]">
                              {CATEGORY_ICON[topic.category]}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" />
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-white">{topic.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{topic.shortDesc}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {topic.tags.map((tg) => (
                            <span
                              key={tg}
                              className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-slate-300"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      </MagicCard>
                    ))}
                  </AnimatedGroup>

                </div>
              ) : (
                <div className="space-y-4">
                  {/* Topic Page Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => navigateTopic("home")}
                          className="hover:text-white cursor-pointer"
                        >
                          All Topics
                        </button>
                        <span>/</span>
                        <span className="font-mono text-violet-300">{currentMeta?.moduleTag}</span>
                      </div>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                        {currentMeta?.title}
                      </h1>
                      <p className="text-sm text-slate-400">{currentMeta?.shortDesc}</p>
                    </div>
                  </div>

                  {renderActiveVisualizer()}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ClickSpark>
  );
}

export default App;
