/**
 * GLASS CARD - Premium glass morphism component
 * Effet vitre avec blur, bordures subtiles et hover 3D
 */

"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { glassCardHover } from "@/lib/design-system/animations";

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  variant?: "default" | "bordered" | "elevated";
  glowOnHover?: boolean;
  noPadding?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, variant = "default", glowOnHover = false, noPadding = false, ...props }, ref) => {
    const baseStyles = "group relative overflow-hidden backdrop-blur-md";

    const variantStyles = {
      default: "bg-[rgba(15,20,37,0.6)] border border-[rgba(255,255,255,0.1)]",
      bordered: "bg-[rgba(15,20,37,0.4)] border-2 border-arcane-darkBorder",
      elevated: "bg-[rgba(15,20,37,0.7)] border border-[rgba(255,255,255,0.15)] shadow-lg",
    };

    const paddingStyles = noPadding ? "" : "p-6 md:p-8";

    const hoverGlow = glowOnHover
      ? "hover:shadow-[0_0_24px_rgba(228,255,59,0.15)] hover:border-arcane-accent/30"
      : "";

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles,
          hoverGlow,
          "rounded-lg transition-all duration-300",
          className
        )}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        variants={glassCardHover}
        {...props}
      >
        {/* Gradient subtil en background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Blur orb décoratif */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-arcane-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Contenu */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
