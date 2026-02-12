"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { BreadcrumbsProps, BreadcrumbItem } from "./types";

/**
 * Breadcrumbs Component - Arcane Design System
 *
 * A hierarchical navigation component showing the current page's
 * location within the site structure.
 *
 * Features:
 * - Hierarchical navigation display
 * - Custom separator (default: chevron)
 * - Max items with collapse (...)
 * - Clickable items (except current)
 * - Current page highlighted
 * - Responsive (collapse on mobile)
 * - Icon support for items
 * - Smooth animations
 */
export function Breadcrumbs({
  items,
  separator,
  maxItems = 4,
  className,
}: BreadcrumbsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Determine which items to show
  const shouldCollapse = items.length > maxItems && !isExpanded;
  let visibleItems: (BreadcrumbItem | "collapse")[] = items;

  if (shouldCollapse) {
    // On mobile: show only first and last
    if (isMobile) {
      visibleItems = [items[0], "collapse", items[items.length - 1]];
    } else {
      // On desktop: show first, collapse, and last 2
      const firstItems = items.slice(0, 1);
      const lastItems = items.slice(-2);
      visibleItems = [...firstItems, "collapse", ...lastItems];
    }
  }

  const defaultSeparator = separator || (
    <ChevronRight className="h-4 w-4 text-arcane-gray-500" />
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 flex-wrap", className)}
    >
      <ol className="flex items-center gap-2 flex-wrap" role="list">
        {visibleItems.map((item, index) => {
          // Handle collapse indicator
          if (item === "collapse") {
            return (
              <li key="collapse" className="flex items-center gap-2">
                {/* Separator before collapse */}
                {index > 0 && (
                  <span aria-hidden="true" className="flex items-center">
                    {defaultSeparator}
                  </span>
                )}

                {/* Collapse button */}
                <button
                  onClick={() => setIsExpanded(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg",
                    "text-arcane-gray-400 hover:text-arcane-gray-200",
                    "hover:bg-arcane-charcoal/30",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow"
                  )}
                  aria-label="Show hidden breadcrumb items"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* Separator after collapse */}
                <span aria-hidden="true" className="flex items-center">
                  {defaultSeparator}
                </span>
              </li>
            );
          }

          const breadcrumbItem = item as BreadcrumbItem;
          const isLast = index === visibleItems.length - 1;
          const Icon = breadcrumbItem.icon;

          return (
            <li
              key={index}
              className="flex items-center gap-2"
              aria-current={isLast ? "page" : undefined}
            >
              {/* Separator (except for first item) */}
              {index > 0 && (
                <span aria-hidden="true" className="flex items-center">
                  {defaultSeparator}
                </span>
              )}

              {/* Breadcrumb item */}
              {breadcrumbItem.href && !isLast ? (
                <Link
                  href={breadcrumbItem.href}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    "text-sm font-medium transition-all duration-200",
                    "text-arcane-gray-400 hover:text-arcane-yellow",
                    "hover:bg-arcane-charcoal/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow"
                  )}
                >
                  {Icon && (
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  )}
                  <motion.span
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    {breadcrumbItem.label}
                  </motion.span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    "text-sm font-medium",
                    isLast
                      ? "text-arcane-yellow font-semibold bg-arcane-yellow/10"
                      : "text-arcane-gray-400"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {breadcrumbItem.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact Breadcrumbs
 *
 * A more compact variant that only shows the current page
 * with a back arrow to the parent.
 */
export function CompactBreadcrumbs({
  items,
  className,
}: Pick<BreadcrumbsProps, "items" | "className">) {
  if (items.length === 0) return null;

  const currentItem = items[items.length - 1];
  const parentItem = items.length > 1 ? items[items.length - 2] : null;
  const CurrentIcon = currentItem.icon;
  const ParentIcon = parentItem?.icon;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-3", className)}>
      {/* Back to parent */}
      {parentItem && parentItem.href && (
        <>
          <Link
            href={parentItem.href}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-lg",
              "text-sm font-medium transition-all duration-200",
              "text-arcane-gray-400 hover:text-arcane-yellow",
              "hover:bg-arcane-charcoal/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow"
            )}
          >
            {ParentIcon && <ParentIcon className="h-4 w-4" />}
            <motion.span
              whileHover={{ x: -2 }}
              transition={{ duration: 0.2 }}
            >
              {parentItem.label}
            </motion.span>
          </Link>

          <ChevronRight className="h-4 w-4 text-arcane-gray-500" />
        </>
      )}

      {/* Current page */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "text-sm font-semibold",
          "text-arcane-yellow bg-arcane-yellow/10 border border-arcane-yellow/30"
        )}
      >
        {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
        {currentItem.label}
      </div>
    </nav>
  );
}

/**
 * Minimal Breadcrumbs
 *
 * Only renders text with separators, no backgrounds or interactive states.
 */
export function MinimalBreadcrumbs({
  items,
  separator,
  className,
}: Pick<BreadcrumbsProps, "items" | "separator" | "className">) {
  const defaultSeparator = separator || (
    <span className="text-arcane-gray-500">/</span>
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="flex items-center">
                {defaultSeparator}
              </span>
            )}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 text-arcane-gray-400 hover:text-arcane-yellow transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  isLast ? "text-arcane-yellow font-medium" : "text-arcane-gray-400"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
