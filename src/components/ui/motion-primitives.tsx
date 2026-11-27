import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

const EASE_INSTRUMENT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function SlidingNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const digits = String(value).split("");
  return (
    <span className={cn("inline-flex items-center overflow-hidden tabular-nums", className)}>
      {digits.map((digit, index) => (
        <span
          key={`${index}-${digits.length}`}
          className="relative inline-block h-[1.25em] w-[0.62em] overflow-hidden text-center"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              initial={{ y: "50%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-50%", opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_INSTRUMENT }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

export function AnimatedGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_INSTRUMENT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
