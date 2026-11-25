import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

/* ReactBits: SpotlightCard */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(139, 92, 246, 0.16)",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={(e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#111420] p-5 transition-colors hover:border-white/[0.16]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(320px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ReactBits: BlurText */
export function BlurText({
  text,
  className,
  delay = 0.03,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-flex flex-wrap gap-x-[0.28em]", className)}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ filter: "blur(6px)", opacity: 0, y: 6 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: idx * delay, ease: "easeOut" }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ReactBits: ShinyText */
export function ShinyText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "animate-shiny-text inline-block bg-gradient-to-r from-violet-300 via-white to-violet-300 bg-clip-text text-transparent",
        className
      )}
    >
      {text}
    </span>
  );
}

/* ReactBits: ClickSpark */
interface Spark {
  id: number;
  x: number;
  y: number;
}

export function ClickSpark({
  children,
  sparkColor = "#a78bfa",
  className,
}: {
  children: React.ReactNode;
  sparkColor?: string;
  className?: string;
}) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSparks((prev) => [...prev.slice(-4), { id, x, y }]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id));
    }, 450);
  };

  const rays = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div onPointerDown={handlePointerDown} className={cn("relative", className)}>
      {children}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sparks.map((spark) => (
          <div
            key={spark.id}
            style={{ left: spark.x, top: spark.y }}
            className="absolute"
          >
            {rays.map((deg) => (
              <motion.span
                key={deg}
                initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 0.4,
                  x: Math.cos((deg * Math.PI) / 180) * 18,
                  y: Math.sin((deg * Math.PI) / 180) * 18,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ backgroundColor: sparkColor }}
                className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
