import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

/* Motion Primitives: SlidingNumber */
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
        <span key={`${index}-${digits.length}`} className="relative inline-block h-[1.25em] w-[0.62em] overflow-hidden text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              initial={{ y: "65%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-65%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
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

/* Motion Primitives: BorderTrail */
export function BorderTrail({
  className,
  size = 70,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn(
          "absolute aspect-square bg-gradient-to-r from-transparent via-violet-400 to-sky-400",
          className
        )}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: "linear" }}
      />
    </div>
  );
}

/* Motion Primitives: TextEffect */
export function TextEffect({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={children}
        initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className={cn("inline-block", className)}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/* Motion Primitives: AnimatedGroup */
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
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
