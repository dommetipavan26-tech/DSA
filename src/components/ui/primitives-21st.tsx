import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { SlidingNumber } from "./motion-primitives";

const EASE_INSTRUMENT: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-[#ededed]/[0.08] bg-[#19191b] p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer",
              active ? "text-[#ededed]" : "text-[#85858b] hover:text-[#ededed]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.18, ease: EASE_INSTRUMENT }}
                className="absolute inset-0 rounded-lg border border-[#ededed]/[0.14] bg-[#232325] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {opt.label}
              {opt.badge && (
                <span className="rounded bg-[#141415] px-1.5 py-0.5 font-mono text-xs text-[#a1a1a6]">
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
            aria-label="Reset"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:text-[#ededed] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onStepBack}
            disabled={!canStepBack}
            title="Step Back"
            aria-label="Step Back"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:text-[#ededed] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-9 min-w-24 items-center justify-center gap-1.5 rounded-lg bg-[#f59e0b] px-4 text-sm font-medium text-[#141415] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbbf24] active:scale-[0.98] cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" strokeWidth={1.75} />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" strokeWidth={1.75} />
                Play
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onStepForward}
            disabled={!canStepForward}
            title="Step Forward"
            aria-label="Step Forward"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ededed]/[0.1] bg-[#232325] text-[#a1a1a6] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:text-[#ededed] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-[#a1a1a6]">
          <span>Speed</span>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            aria-label="Playback speed"
            className="h-1.5 w-28 cursor-pointer accent-amber-500"
          />
          <span className="w-7 text-right font-mono tabular-nums text-[#ededed]">{speed}x</span>
        </div>
      </div>

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ededed]/[0.06] pt-3 text-xs text-[#a1a1a6]">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-[3px]", item.colorClass)} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Left: Recessed Visual Canvas + Playback */}
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-4 sm:p-5">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              {typeof step === "number" && typeof totalSteps === "number" && (
                <div className="flex items-center gap-1.5 text-xs text-[#85858b]">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors duration-150",
                      isPlaying ? "bg-amber-500" : "bg-[#85858b]/60"
                    )}
                  />
                  <span>Step</span>
                  <span className="font-mono font-medium tabular-nums text-[#ededed]">
                    <SlidingNumber value={step} />
                  </span>
                  <span>/</span>
                  <span className="font-mono tabular-nums text-[#a1a1a6]">{totalSteps}</span>
                </div>
              )}
              <div className="min-h-6 text-sm font-medium leading-6 text-[#ededed]">
                {statusText}
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-[#ededed]/[0.08] bg-[#232325] px-2.5 py-1 font-mono text-xs text-[#a1a1a6]">
              {badge}
            </span>
          </div>

          {/* Inner Stage — fills available vertical space cleanly without leaving dead gap */}
          <div className="flex min-h-[320px] min-w-0 flex-1 flex-col justify-center overflow-hidden rounded-xl border border-[#ededed]/[0.07] bg-[#0f0f10] p-3 sm:p-4">
            <div className="w-full min-w-0">{stage}</div>
          </div>

          {/* Controls */}
          {controls && <div>{controls}</div>}
        </div>

        {/* Right: User Input Inspector */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-5">
          <div className="flex items-center justify-between border-b border-[#ededed]/[0.07] pb-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#ededed]">
              <SlidersHorizontal className="h-4 w-4 text-[#85858b]" strokeWidth={1.5} />
              Input &amp; controls
            </span>
          </div>
          <div className="flex flex-col gap-3">{inspector}</div>
        </div>
      </div>

      {footerNotes}
    </div>
  );
}

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
      <div className="rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-5">
        <h3 className="text-sm font-medium text-[#ededed]">Concept &amp; intuition</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#a1a1a6]">{intuition}</p>
        <ul className="mt-4 space-y-2 text-xs leading-relaxed text-[#a1a1a6]">
          {keyPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#85858b]" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-[#ededed]/[0.08] bg-[#19191b] p-5">
        {complexities && complexities.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-[#ededed]">Time &amp; space complexity</h3>
              {javaCode && (
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#ededed]/[0.1] bg-[#232325] px-2.5 py-1 text-xs font-medium text-[#a1a1a6] transition-colors duration-150 hover:border-[#ededed]/[0.2] hover:text-[#ededed] cursor-pointer"
                >
                  <Code2 className="h-4 w-4 text-[#85858b]" strokeWidth={1.5} />
                  {showCode ? "Hide Java code" : "View Java code"}
                </button>
              )}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ededed]/[0.08] text-xs font-medium text-[#85858b]">
                    <th className="py-2 pr-3 font-medium">Operation</th>
                    <th className="py-2 pr-3 font-medium">Best</th>
                    <th className="py-2 pr-3 font-medium">Average</th>
                    <th className="py-2 pr-3 font-medium">Worst</th>
                    {complexities[0]?.space && <th className="py-2 font-medium">Space</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ededed]/[0.06] font-mono tabular-nums">
                  {complexities.map((row) => (
                    <tr key={row.op}>
                      <td className="py-2.5 pr-3 font-sans font-medium text-[#ededed]">{row.op}</td>
                      <td className="py-2.5 pr-3 text-[#4cc38a]">{row.best}</td>
                      <td className="py-2.5 pr-3 text-amber-400">{row.avg}</td>
                      <td className="py-2.5 pr-3 text-[#e5484d]">{row.worst}</td>
                      {row.space && <td className="py-2.5 text-[#a1a1a6]">{row.space}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCode && javaCode && (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-[#ededed]/[0.08] bg-[#0f0f10] p-4 font-mono text-xs leading-relaxed text-[#ededed]">
            <code>{javaCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
