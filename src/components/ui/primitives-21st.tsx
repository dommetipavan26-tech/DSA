import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { BorderBeam, DotPattern, ShimmerButton } from "./magic-ui";
import { BorderTrail, SlidingNumber, TextEffect } from "./motion-primitives";

/* 21st.dev Pattern: MorphingPillTabs (shared layoutId active pill) */
export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string;
}

export function MorphingPillTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId = "pill-tabs",
  className,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (val: T) => void;
  layoutId?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              active
                ? "text-white"
                : "border border-white/[0.08] bg-[#131724] text-slate-400 hover:border-white/[0.18] hover:text-slate-200"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full border border-violet-400/60 bg-violet-500/20 shadow-[0_0_16px_rgba(124,58,237,0.28)]"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.label}
              {opt.badge && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-violet-200">
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* 21st.dev + Reference Studio Stage & Transport Dock */
export interface LegendEntry {
  label: string;
  colorClass: string;
}

export function PlaybackDock({
  isPlaying,
  onTogglePlay,
  onReset,
  onStepBack,
  onStepForward,
  canStepBack = true,
  canStepForward = true,
  speed,
  onSpeedChange,
  legend,
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  canStepBack?: boolean;
  canStepForward?: boolean;
  speed: number;
  onSpeedChange: (val: number) => void;
  legend?: LegendEntry[];
}) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            title="Reset"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#171b2a] text-slate-300 transition hover:border-violet-500/50 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onStepBack}
            disabled={!canStepBack}
            title="Step Back"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#171b2a] text-slate-300 transition hover:border-violet-500/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <ShimmerButton onClick={onTogglePlay} className="h-9 min-w-[96px] px-4">
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Play
              </>
            )}
          </ShimmerButton>
          <button
            type="button"
            onClick={onStepForward}
            disabled={!canStepForward}
            title="Step Forward"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#171b2a] text-slate-300 transition hover:border-violet-500/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <span>Speed</span>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-1.5 w-28 cursor-pointer accent-violet-500"
          />
          <span className="w-6 text-right font-mono text-slate-300">{speed}x</span>
        </div>
      </div>

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-2.5 text-xs text-slate-400">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-[3px]", item.colorClass)} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* Main 2-Column Studio Workspace matching the user's reference screenshots */
export function VisualizerWorkspace({
  step,
  totalSteps,
  statusText,
  badge,
  isPlaying,
  stage,
  controls,
  inspector,
  footerNotes,
}: {
  step?: number;
  totalSteps?: number;
  statusText: string;
  badge: string;
  isPlaying?: boolean;
  stage: React.ReactNode;
  controls?: React.ReactNode;
  inspector: React.ReactNode;
  footerNotes?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_285px] lg:grid-cols-[minmax(0,1fr)_295px] xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* Left: Recessed Visual Canvas + Playback */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.09] bg-[#10131e] p-4 sm:p-5">
          {isPlaying && <BorderBeam duration={6} size={130} />}

          {/* Header Bar */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              {typeof step === "number" && typeof totalSteps === "number" && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span>Step</span>
                  <span className="font-mono font-bold text-white">
                    <SlidingNumber value={step} />
                  </span>
                  <span>/</span>
                  <span className="font-mono text-slate-400">{totalSteps}</span>
                </div>
              )}
              <div className="min-h-[22px] text-sm font-medium text-slate-200">
                <TextEffect>{statusText}</TextEffect>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-white/[0.1] bg-[#181c2b] px-2.5 py-1 text-xs font-medium text-slate-300">
              {badge}
            </span>
          </div>

          {/* Inner Stage */}
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-[#080a10] p-3 sm:p-4">
            <DotPattern className="opacity-45 [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_88%)]" />
            <div className="relative z-10 w-full">{stage}</div>
          </div>

          {/* Controls */}
          {controls && <div className="mt-4">{controls}</div>}
        </div>

        {/* Right: User Input Inspector Sidebar */}
        <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#10131e] p-4">
          <BorderTrail size={80} />
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              User Input & Controls
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
              <Sparkles className="h-2.5 w-2.5" />
              Interactive
            </span>
          </div>
          <div className="relative z-10 flex flex-col gap-3.5">{inspector}</div>
        </div>
      </div>

      {footerNotes}
    </div>
  );
}

/* Student-friendly Concept + Complexity + Java Implementation Accordion Card */
export function ConceptNotesGrid({
  intuition,
  keyPoints,
  complexities,
  javaCode,
}: {
  intuition: string;
  keyPoints: string[];
  complexities?: { op: string; best: string; avg: string; worst: string; space?: string }[];
  javaCode?: string;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.08] bg-[#10131e] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-white">Concept & Intuition</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{intuition}</p>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
          {keyPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#10131e] p-4 sm:p-5">
        {complexities && complexities.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Time & Space Complexity</h3>
              {javaCode && (
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#171b2a] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-violet-500/40 hover:text-white cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5 text-violet-400" />
                  {showCode ? "Hide Java Code" : "View Java Code"}
                </button>
              )}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3">Operation</th>
                    <th className="py-2 pr-3">Best</th>
                    <th className="py-2 pr-3">Average</th>
                    <th className="py-2 pr-3">Worst</th>
                    {complexities[0]?.space && <th className="py-2">Space</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-mono">
                  {complexities.map((row) => (
                    <tr key={row.op}>
                      <td className="py-2 pr-3 font-sans font-medium text-slate-200">{row.op}</td>
                      <td className="py-2 pr-3 text-emerald-400">{row.best}</td>
                      <td className="py-2 pr-3 text-amber-300">{row.avg}</td>
                      <td className="py-2 pr-3 text-rose-400">{row.worst}</td>
                      {row.space && <td className="py-2 text-sky-300">{row.space}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showCode && javaCode && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#080a10] p-3 font-mono text-xs leading-relaxed text-slate-300"
            >
              <code>{javaCode}</code>
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
