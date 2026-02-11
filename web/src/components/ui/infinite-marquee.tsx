/**
 * INFINITE MARQUEE - 120K Premium
 * Défilement infini de logos avec hover pause
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
}

export function InfiniteMarquee({
  children,
  speed = 50,
  direction = "left",
  pauseOnHover = true,
}: MarqueeProps) {
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.scrollWidth / 2);
    }
  }, [children]);

  const directionMultiplier = direction === "left" ? -1 : 1;

  return (
    <div className="overflow-hidden relative">
      <motion.div
        ref={containerRef}
        className="flex gap-8"
        animate={{
          x: directionMultiplier * width,
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
      >
        {/* Dupliquer le contenu pour effet infini */}
        <div className="flex gap-8 shrink-0">{children}</div>
        <div className="flex gap-8 shrink-0">{children}</div>
      </motion.div>
    </div>
  );
}

interface LogoItemProps {
  name: string;
  className?: string;
}

export function LogoItem({ name, className = "" }: LogoItemProps) {
  return (
    <motion.div
      className={`
        flex items-center justify-center
        px-12 py-6 rounded-xl
        bg-arcane-darkBorder/30 backdrop-blur-sm
        border border-arcane-darkBorder
        hover:border-arcane-accent/30 hover:bg-arcane-accent/5
        transition-all duration-500
        cursor-pointer group
        ${className}
      `}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-arcane-grey group-hover:text-white transition-colors font-semibold text-lg uppercase tracking-wide whitespace-nowrap">
        {name}
      </span>
    </motion.div>
  );
}
