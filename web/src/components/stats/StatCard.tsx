"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  href?: string;
  trend?: string;
  trendColor?: string;
  loading?: boolean;
  index?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-arcane-accent",
  bgColor = "bg-arcane-accent/20",
  href,
  trend,
  trendColor = "text-arcane-accent",
  loading = false,
  index = 0,
}: StatCardProps) {
  const cardContent = (
    <GlassCard
      variant="elevated"
      className={`p-6 transition-all h-full ${
        href ? "hover:border-arcane-accent/30 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {trend && (
          <span
            className={`text-xs ${trendColor} font-bold px-2 py-1 rounded-full ${bgColor}`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white mb-1">
        {loading ? (
          <div className="h-9 w-16 bg-arcane-darkBorder/50 rounded animate-pulse" />
        ) : (
          <AnimatedCounter to={value} duration={1.5} />
        )}
      </div>
      <div className="text-sm text-arcane-grey">{label}</div>
    </GlassCard>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 * index }}
      whileHover={href ? { scale: 1.02 } : undefined}
    >
      {href ? <Link href={href}>{cardContent}</Link> : cardContent}
    </motion.div>
  );
}
