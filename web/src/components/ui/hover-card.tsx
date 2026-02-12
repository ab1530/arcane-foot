"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  rotateOnHover?: boolean;
}

export function HoverCard({
  children,
  className = "",
  scale = 1.03,
  rotateOnHover = false
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        rotateZ: rotateOnHover ? 2 : 0,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverGlow({ children, className = "", glowColor = "rgba(228, 255, 59, 0.3)" }: HoverCardProps & { glowColor?: string }) {
  return (
    <motion.div
      whileHover={{
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        transition: { duration: 0.3 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, className = "" }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PressEffect({ children, className = "" }: HoverCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
