import React from "react";
import { cn } from "../../lib/utils";

export function InspectorBlock({
  title,
  description,
  children,
  highlight = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors",
        highlight
          ? "border-violet-500/35 bg-violet-500/[0.06]"
          : "border-white/[0.07] bg-[#141826]"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-200">{title}</span>
      </div>
      {description && (
        <p className="mb-2.5 text-[11px] leading-relaxed text-slate-400">{description}</p>
      )}
      {children}
    </div>
  );
}

export function PresetRow({
  presets,
  onSelect,
  activeId,
}: {
  presets: { id: string; label: string }[];
  onSelect: (id: string) => void;
  activeId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition cursor-pointer",
              active
                ? "border-violet-400/60 bg-violet-500/20 text-violet-200"
                : "border-white/[0.09] bg-[#181d2e] text-slate-300 hover:border-white/[0.2] hover:text-white"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export function StudioInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-white/[0.1] bg-[#0b0d14] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
        className
      )}
    />
  );
}

export function StudioTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-white/[0.1] bg-[#0b0d14] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
        className
      )}
    />
  );
}

export function StudioSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-white/[0.1] bg-[#0b0d14] px-3 py-2 text-xs font-medium text-slate-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer",
        className
      )}
    >
      {children}
    </select>
  );
}

export function StudioBtn({
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "emerald";
  size?: "xs" | "sm";
}) {
  const variants = {
    primary:
      "border-violet-500/70 bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_16px_-4px_rgba(124,58,237,0.65)]",
    secondary:
      "border-white/[0.1] bg-[#181d2e] text-slate-200 hover:border-white/[0.22] hover:bg-[#1f253a]",
    danger:
      "border-rose-500/35 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
    emerald:
      "border-emerald-500/35 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
  };
  const sizes = {
    xs: "px-2.5 py-1 text-[11px]",
    sm: "px-3 py-1.5 text-xs",
  };

  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
