"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TabsProps, TabItem } from "./types";
import { AnimatedBadge } from "@/components/ui/animated-badge";

/**
 * Tabs Component - Arcane Design System
 *
 * A flexible tabs component with horizontal/vertical orientation,
 * icon support, badge notifications, and smooth transitions.
 *
 * Features:
 * - Horizontal tabs (default)
 * - Vertical tabs (variant)
 * - Icon support on tabs
 * - Badge notifications
 * - Active indicator with yellow underline/sideline
 * - Keyboard navigation (arrow keys)
 * - Content panels with smooth transitions
 * - Smooth spring animations
 */
export function Tabs({
  items,
  activeId,
  onActiveChange,
  orientation = "horizontal",
  className,
  showContent = true,
}: TabsProps) {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    activeId || items[0]?.id
  );
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Update internal state when activeId prop changes
  useEffect(() => {
    if (activeId) {
      setInternalActiveId(activeId);
    }
  }, [activeId]);

  const currentActiveId = activeId || internalActiveId;
  const activeTab = items.find((item) => item.id === currentActiveId);

  const handleTabChange = (id: string) => {
    if (items.find((item) => item.id === id)?.disabled) return;

    setInternalActiveId(id);
    if (onActiveChange) {
      onActiveChange(id);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const currentIndex = items.findIndex((item) => item.id === currentId);
    let targetIndex = currentIndex;

    const isHorizontal = orientation === "horizontal";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

    if (e.key === prevKey) {
      e.preventDefault();
      // Find previous non-disabled tab
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!items[i].disabled) {
          targetIndex = i;
          break;
        }
      }
    } else if (e.key === nextKey) {
      e.preventDefault();
      // Find next non-disabled tab
      for (let i = currentIndex + 1; i < items.length; i++) {
        if (!items[i].disabled) {
          targetIndex = i;
          break;
        }
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      // First non-disabled tab
      targetIndex = items.findIndex((item) => !item.disabled);
    } else if (e.key === "End") {
      e.preventDefault();
      // Last non-disabled tab
      for (let i = items.length - 1; i >= 0; i--) {
        if (!items[i].disabled) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== currentIndex && targetIndex >= 0) {
      handleTabChange(items[targetIndex].id);
      // Focus the new tab
      const targetButton = tabsRef.current.get(items[targetIndex].id);
      targetButton?.focus();
    }
  };

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={cn(
        "w-full",
        !isHorizontal && "flex gap-6",
        className
      )}
    >
      {/* Tab List */}
      <div
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          "relative",
          isHorizontal
            ? "flex gap-1 border-b border-arcane-slate/30 overflow-x-auto"
            : "flex flex-col gap-1 border-r border-arcane-slate/30 min-w-[200px]"
        )}
      >
        {items.map((item) => {
          const isActive = item.id === currentActiveId;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) {
                  tabsRef.current.set(item.id, el);
                } else {
                  tabsRef.current.delete(item.id);
                }
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              aria-disabled={item.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              disabled={item.disabled}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3",
                "text-sm font-medium transition-all whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow",
                isActive
                  ? "text-arcane-yellow"
                  : "text-arcane-gray-400 hover:text-arcane-gray-200",
                item.disabled && "opacity-50 cursor-not-allowed",
                !isHorizontal && "w-full justify-start"
              )}
            >
              {/* Icon */}
              {Icon && <Icon className="h-4 w-4" />}

              {/* Label */}
              <span>{item.label}</span>

              {/* Badge */}
              {item.badge && (
                <AnimatedBadge
                  variant={item.badgeVariant || "default"}
                  pulse={item.badgeVariant === "error"}
                  className="text-xs ml-auto"
                >
                  {item.badge}
                </AnimatedBadge>
              )}

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId={`tab-indicator-${orientation}`}
                  className={cn(
                    "absolute bg-arcane-yellow",
                    isHorizontal
                      ? "bottom-0 left-0 right-0 h-0.5"
                      : "left-0 top-0 bottom-0 w-0.5"
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  style={{
                    boxShadow: isHorizontal
                      ? "0 0 10px var(--arcane-yellow-glow)"
                      : "0 0 10px var(--arcane-yellow-glow)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {showContent && (
        <div className={cn("flex-1", isHorizontal && "mt-6")}>
          <AnimatePresence mode="wait">
            {activeTab && (
              <motion.div
                key={activeTab.id}
                id={`tabpanel-${activeTab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1], // Spring easing
                }}
                className="focus-visible:outline-none"
                tabIndex={0}
              >
                {activeTab.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Tabs Component (without content panels)
 *
 * Use this when you want to manually control the content display
 * or when using tabs for navigation purposes.
 */
export function SimpleTabs({
  items,
  activeId,
  onActiveChange,
  orientation = "horizontal",
  className,
}: Omit<TabsProps, "showContent">) {
  return (
    <Tabs
      items={items}
      activeId={activeId}
      onActiveChange={onActiveChange}
      orientation={orientation}
      className={className}
      showContent={false}
    />
  );
}

export default Tabs;
