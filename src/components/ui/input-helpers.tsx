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
        "rounded-xl border p-4 transition-colors duration-150",
        highlight
          ? "border-amber-500/30 bg-[#141415]"
          : "border-[#ededed]/[0.07] bg-[#141415]"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#ededed]">
          {highlight && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
          {title}
        </span>
      </div>
      {description && (
        <p className="mb-3 text-xs leading-relaxed text-[#85858b]">{description}</p>
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
              "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer",
              active
                ? "border-amber-500/50 bg-amber-500/12 text-amber-300"
                : "border-[#ededed]/[0.08] bg-[#232325] text-[#a1a1a6] hover:border-[#ededed]/[0.18] hover:text-[#ededed]"
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
        "w-full rounded-lg border border-[#ededed]/[0.1] bg-[#0f0f10] px-3 py-2 font-mono text-xs text-[#ededed] placeholder:text-[#85858b] outline-none transition-colors duration-150 focus:border-amber-500/70",
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
        "w-full rounded-lg border border-[#ededed]/[0.1] bg-[#0f0f10] px-3 py-2 font-mono text-xs text-[#ededed] placeholder:text-[#85858b] outline-none transition-colors duration-150 focus:border-amber-500/70",
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
        "w-full rounded-lg border border-[#ededed]/[0.1] bg-[#0f0f10] px-3 py-2 text-xs font-medium text-[#ededed] outline-none transition-colors duration-150 focus:border-amber-500/70 cursor-pointer",
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
      "border-transparent bg-[#ededed] text-[#141415] hover:bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    secondary:
      "border-[#ededed]/[0.1] bg-[#232325] text-[#ededed] hover:border-[#ededed]/[0.2] hover:bg-[#2b2b2e]",
    danger:
      "border-[#e5484d]/35 bg-[#e5484d]/12 text-[#f87171] hover:bg-[#e5484d]/20",
    emerald:
      "border-[#4cc38a]/35 bg-[#4cc38a]/12 text-[#4cc38a] hover:bg-[#4cc38a]/20",
  };
  const sizes = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3 py-1.5 text-xs",
  };

  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
