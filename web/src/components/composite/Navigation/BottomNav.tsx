"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BottomNavProps, BottomNavItem } from "./types";
import { AnimatedBadge } from "@/components/ui/animated-badge";

/**
 * BottomNav Component - Arcane Design System
 *
 * A fixed bottom navigation component optimized for mobile devices.
 * Provides quick access to primary app sections.
 *
 * Features:
 * - Fixed bottom navigation (mobile-first)
 * - Icon + label for each tab
 * - Badge notifications
 * - Active indicator with yellow accent
 * - Smooth transitions between tabs
 * - Max 5 tabs recommended
 * - Touch-optimized tap targets
 * - Haptic feedback support (on capable devices)
 * - Smooth spring animations
 */
export function BottomNav({
  items,
  activeId,
  onActiveChange,
  className,
}: BottomNavProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    activeId || items[0]?.id
  );

  // Update internal state when activeId prop changes
  useEffect(() => {
    if (activeId) {
      setInternalActiveId(activeId);
    }
  }, [activeId]);

  const currentActiveId = activeId || internalActiveId;

  const handleNavChange = (item: BottomNavItem) => {
    if (item.disabled) return;

    setInternalActiveId(item.id);

    // Trigger haptic feedback on capable devices
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    if (onActiveChange) {
      onActiveChange(item.id);
    }

    if (item.onClick) {
      item.onClick();
    }
  };

  // Warn if more than 5 items
  if (items.length > 5) {
    console.warn(
      "BottomNav: More than 5 items detected. Consider limiting to 5 items for optimal UX."
    );
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "lg:hidden", // Only show on mobile/tablet
        "border-t border-arcane-slate/30",
        "bg-arcane-black/95 backdrop-blur-xl",
        "safe-area-inset-bottom", // iOS safe area support
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = item.id === currentActiveId;
          const Icon = item.icon;

          const content = (
            <motion.button
              onClick={() => handleNavChange(item)}
              disabled={item.disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1",
                "min-w-[60px] h-14 px-2 rounded-xl",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow",
                isActive
                  ? "text-arcane-yellow"
                  : "text-arcane-gray-400 hover:text-arcane-gray-200",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              whileTap={!item.disabled ? { scale: 0.95 } : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon with badge */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>

                {/* Badge */}
                {item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <AnimatedBadge
                      variant={item.badgeVariant || "error"}
                      pulse={true}
                      glow={true}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </AnimatedBadge>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <motion.span
                className={cn(
                  "text-[11px] font-medium transition-all",
                  isActive && "font-semibold"
                )}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
              >
                {item.label}
              </motion.span>

              {/* Active indicator - Top border */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-arcane-yellow rounded-b-full"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  style={{
                    boxShadow: "0 2px 10px var(--arcane-yellow-glow)",
                  }}
                />
              )}

              {/* Background glow for active item */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-xl bg-arcane-yellow/5 -z-10"
                />
              )}
            </motion.button>
          );

          // Wrap with Link if href is provided
          if (item.href && !item.disabled) {
            return (
              <Link key={item.id} href={item.href} className="flex-1">
                {content}
              </Link>
            );
          }

          return <div key={item.id} className="flex-1">{content}</div>;
        })}
      </div>
    </nav>
  );
}

/**
 * BottomNavSpacer
 *
 * A spacer component to prevent content from being hidden
 * behind the fixed bottom navigation.
 *
 * Place this at the bottom of your page content.
 */
export function BottomNavSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-16 lg:hidden", // Match BottomNav height
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * FloatingBottomNav
 *
 * A variant that floats above the content with rounded corners
 * and a shadow, creating a more modern appearance.
 */
export function FloatingBottomNav({
  items,
  activeId,
  onActiveChange,
  className,
}: BottomNavProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    activeId || items[0]?.id
  );

  useEffect(() => {
    if (activeId) {
      setInternalActiveId(activeId);
    }
  }, [activeId]);

  const currentActiveId = activeId || internalActiveId;

  const handleNavChange = (item: BottomNavItem) => {
    if (item.disabled) return;

    setInternalActiveId(item.id);

    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    if (onActiveChange) {
      onActiveChange(item.id);
    }

    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50",
        "lg:hidden",
        "rounded-2xl",
        "border border-arcane-slate/30",
        "bg-arcane-anthracite/95 backdrop-blur-xl",
        "shadow-2xl",
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
      style={{
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px var(--arcane-yellow-dim)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = item.id === currentActiveId;
          const Icon = item.icon;

          const content = (
            <motion.button
              onClick={() => handleNavChange(item)}
              disabled={item.disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1",
                "min-w-[60px] h-14 px-2 rounded-xl",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow",
                isActive
                  ? "text-arcane-yellow"
                  : "text-arcane-gray-400 hover:text-arcane-gray-200",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              whileTap={!item.disabled ? { scale: 0.95 } : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>

                {item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <AnimatedBadge
                      variant={item.badgeVariant || "error"}
                      pulse={true}
                      glow={true}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </AnimatedBadge>
                  </motion.div>
                )}
              </div>

              <motion.span
                className={cn(
                  "text-[11px] font-medium transition-all",
                  isActive && "font-semibold"
                )}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
              >
                {item.label}
              </motion.span>

              {isActive && (
                <motion.div
                  layoutId="floatingBottomNavIndicator"
                  className="absolute inset-0 rounded-xl bg-arcane-yellow/10 border border-arcane-yellow/30 -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );

          if (item.href && !item.disabled) {
            return (
              <Link key={item.id} href={item.href} className="flex-1">
                {content}
              </Link>
            );
          }

          return <div key={item.id} className="flex-1">{content}</div>;
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
