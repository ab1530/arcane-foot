"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProps, SidebarItem } from "./types";
import { AnimatedBadge } from "@/components/ui/animated-badge";

/**
 * Sidebar Component - Arcane Design System
 *
 * A collapsible navigation sidebar with nested menu support,
 * badge notifications, and responsive mobile overlay.
 *
 * Features:
 * - Collapsible behavior (expand/collapse)
 * - Nested menu support with smooth animations
 * - Active state highlighting with yellow accent
 * - Badge notifications on menu items
 * - Icon + label for each item
 * - Mobile responsive (full overlay on mobile)
 * - Keyboard navigation support
 * - Smooth spring animations
 */
export function Sidebar({
  items,
  activeId,
  collapsed = false,
  onCollapsedChange,
  logo,
  footer,
  className,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle nested menu expansion
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Check if item or any child is active
  const isItemOrChildActive = (item: SidebarItem): boolean => {
    if (item.id === activeId) return true;
    if (item.children) {
      return item.children.some((child) => isItemOrChildActive(child));
    }
    return false;
  };

  // Auto-expand parent of active item
  useEffect(() => {
    const findParentAndExpand = (items: SidebarItem[], parentId?: string) => {
      items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = isItemOrChildActive(item);
          if (hasActiveChild) {
            setExpandedItems((prev) => new Set(prev).add(item.id));
          }
          findParentAndExpand(item.children, item.id);
        }
      });
    };
    findParentAndExpand(items);
  }, [activeId, items]);

  // Render a single navigation item
  const renderNavItem = (item: SidebarItem, depth: number = 0) => {
    const isActive = item.id === activeId;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    const content = (
      <motion.div
        initial={false}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg transition-all",
          "px-4 py-3 cursor-pointer",
          isActive
            ? "bg-arcane-yellow/10 text-arcane-yellow border border-arcane-yellow/30"
            : "text-arcane-gray-300 hover:text-arcane-gray-50 hover:bg-arcane-charcoal/50",
          item.disabled && "opacity-50 cursor-not-allowed",
          collapsed && !mobileOpen && "justify-center px-2"
        )}
        style={{ paddingLeft: collapsed ? undefined : `${depth * 16 + 16}px` }}
        whileHover={!item.disabled ? { x: 2 } : undefined}
        whileTap={!item.disabled ? { scale: 0.98 } : undefined}
      >
        {/* Icon */}
        {Icon && (
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0 transition-colors",
              isActive && "text-arcane-yellow"
            )}
          />
        )}

        {/* Label - hidden when collapsed */}
        {(!collapsed || mobileOpen) && (
          <span
            className={cn(
              "flex-1 font-medium text-sm transition-colors",
              isActive && "font-semibold"
            )}
          >
            {item.label}
          </span>
        )}

        {/* Badge */}
        {item.badge && (!collapsed || mobileOpen) && (
          <AnimatedBadge
            variant={item.badgeVariant || "default"}
            pulse={item.badgeVariant === "error"}
            className="text-xs"
          >
            {item.badge}
          </AnimatedBadge>
        )}

        {/* Expand/Collapse icon for nested items */}
        {hasChildren && (!collapsed || mobileOpen) && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        )}

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-0 bottom-0 w-1 bg-arcane-yellow rounded-r-full"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}

        {/* Hover glow */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, var(--arcane-yellow-glow), transparent 70%)",
            }}
          />
        )}
      </motion.div>
    );

    const handleClick = () => {
      if (item.disabled) return;
      if (hasChildren) {
        toggleExpanded(item.id);
      }
      if (item.onClick) {
        item.onClick();
      }
      // Close mobile menu after click
      if (mobileOpen && onMobileClose && !hasChildren) {
        onMobileClose();
      }
    };

    return (
      <div key={item.id} className="relative">
        {item.href && !hasChildren ? (
          <Link href={item.href} onClick={handleClick}>
            {content}
          </Link>
        ) : (
          <div onClick={handleClick}>{content}</div>
        )}

        {/* Nested items */}
        <AnimatePresence>
          {hasChildren && isExpanded && (!collapsed || mobileOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1], // Spring easing
              }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children!.map((child) => renderNavItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      {logo && (
        <div
          className={cn(
            "p-6 flex items-center",
            collapsed && !mobileOpen && "justify-center p-4"
          )}
        >
          {logo}
        </div>
      )}

      {/* Navigation Items */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-1",
          collapsed && !mobileOpen ? "px-2" : "px-4"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {items.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer Section */}
      {footer && (
        <div
          className={cn(
            "p-4 border-t border-arcane-slate/30 mt-auto",
            collapsed && !mobileOpen && "px-2"
          )}
        >
          {footer}
        </div>
      )}

      {/* Collapse Toggle Button - Desktop only */}
      {onCollapsedChange && !mobileOpen && (
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "mx-4 mb-4 p-3 rounded-lg",
            "bg-arcane-charcoal/50 text-arcane-gray-300",
            "hover:bg-arcane-charcoal hover:text-arcane-yellow",
            "transition-all duration-200",
            "flex items-center justify-center gap-2",
            collapsed && "mx-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 bottom-0 z-40",
          "border-r border-arcane-slate/30",
          "bg-arcane-black/90 backdrop-blur-xl",
          "transition-all duration-300 ease-spring",
          collapsed ? "w-20" : "w-64",
          className
        )}
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                "lg:hidden fixed left-0 top-0 bottom-0 w-80 z-50",
                "border-r border-arcane-slate/30",
                "bg-arcane-black/95 backdrop-blur-xl",
                className
              )}
              role="dialog"
              aria-label="Mobile navigation"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-arcane-charcoal/50 text-arcane-gray-300 hover:text-arcane-yellow transition-colors"
                aria-label="Close mobile menu"
              >
                <X className="h-5 w-5" />
              </button>

              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
