"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Target,
  FileText,
  PenSquare,
  Upload,
  Cpu,
  CheckCircle,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api-client";
import { logError } from "@/lib/logger";

const highlightIconMap = {
  zap: Zap,
  target: Target,
  file: FileText,
  sparkles: Sparkles,
} as const;

const workflowIconMap = {
  upload: Upload,
  cpu: Cpu,
  pen: PenSquare,
} as const;

const formatNumberByLang = (value: number, language: string) =>
  new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value);

const formatCurrencyByLang = (value: number, language: string) =>
  new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

type AutoScoutAnalytics = {
  totalReports?: number;
  averageQualityScore?: number;
  estimatedCost?: number;
  templateUsage?: Array<{ template: string; count: number }>;
};

type TemplateDisplay = {
  name: string;
  description: string;
  badge?: string;
};

export default function ArkaneScoutPage() {
  const router = useRouter();
  const { dictionary, language } = useLanguage();
  const scoutCopy = dictionary.aiTools.scout;
  const [analytics, setAnalytics] = useState<AutoScoutAnalytics | null>(null);
  const [liveTemplates, setLiveTemplates] = useState<TemplateDisplay[] | null>(null);
  const [templatesData, setTemplatesData] = useState<TemplateDisplay[]>(scoutCopy.templates.list);
  const [loadingLiveMetrics, setLoadingLiveMetrics] = useState(false);

  useEffect(() => {
    if (liveTemplates?.length) {
      setTemplatesData(liveTemplates);
    } else {
      setTemplatesData(scoutCopy.templates.list);
    }
  }, [liveTemplates, scoutCopy.templates.list]);

  useEffect(() => {
    let cancelled = false;

    const fetchLiveData = async () => {
      setLoadingLiveMetrics(true);
      try {
        const [analyticsRes, templatesRes] = await Promise.all([
          apiClient
            .getAutoScoutAnalytics()
            .catch((error: any) => {
              if (error?.message?.includes("403") || error?.message?.includes("Unauthorized")) {
                return null;
              }
              throw error;
            }),
          apiClient
            .getAutoScoutTemplates()
            .catch((error: any) => {
              if (error?.message?.includes("403") || error?.message?.includes("Unauthorized")) {
                return null;
              }
              throw error;
            }),
        ]);

        if (!cancelled && analyticsRes?.success) {
          setAnalytics(analyticsRes.data ?? null);
        }

        if (!cancelled && templatesRes?.success && Array.isArray(templatesRes.data)) {
          const normalized = templatesRes.data.map((template: any, index: number) => {
            const fallback = scoutCopy.templates.list[index % scoutCopy.templates.list.length];
            return {
              name: template.name ?? fallback.name,
              description: template.description ?? fallback.description,
              badge: template.reportType ?? template.category ?? fallback.badge,
            } satisfies TemplateDisplay;
          });
          setLiveTemplates(normalized);
        }
      } catch (error) {
        logError("Failed to fetch AutoScout live data", error as Error);
      } finally {
        if (!cancelled) {
          setLoadingLiveMetrics(false);
        }
      }
    };

    fetchLiveData();
    return () => {
      cancelled = true;
    };
  }, [scoutCopy.templates.list]);

  const highlights = useMemo(
    () =>
      scoutCopy.highlights.map((item) => ({
        ...item,
        Icon: highlightIconMap[item.icon as keyof typeof highlightIconMap] ?? Sparkles,
      })),
    [scoutCopy.highlights],
  );

  const resolveStatValue = useCallback(
    (key: string | undefined, fallback: string) => {
      if (!key || !analytics) return fallback;

      switch (key) {
        case "totalReports":
          return analytics.totalReports !== undefined
            ? formatNumberByLang(analytics.totalReports, language)
            : fallback;
        case "averageQualityScore":
          return analytics.averageQualityScore !== undefined
            ? `${analytics.averageQualityScore.toFixed(1)}/100`
            : fallback;
        case "estimatedCost":
          return analytics.estimatedCost !== undefined
            ? formatCurrencyByLang(analytics.estimatedCost, language)
            : fallback;
        case "templateUsage":
          return analytics.templateUsage?.length
            ? formatNumberByLang(analytics.templateUsage.length, language)
            : fallback;
        default:
          return fallback;
      }
    },
    [analytics, language],
  );

  const statsWithLiveData = useMemo(
    () =>
      scoutCopy.stats.map((stat) => ({
        ...stat,
        value: resolveStatValue((stat as any).dataKey, stat.value),
      })),
    [resolveStatValue, scoutCopy.stats],
  );

  const workflowSteps = useMemo(
    () =>
      scoutCopy.workflow.steps.map((step) => ({
        ...step,
        Icon: workflowIconMap[step.icon as keyof typeof workflowIconMap] ?? Sparkles,
      })),
    [scoutCopy.workflow.steps],
  );

  return (
    <MainLayout>
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12 space-y-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arcane-accent/10 border border-arcane-accent/30" data-test="arkane-scout-hero-badge">
              <Sparkles className="h-4 w-4 text-arcane-accent" />
              <span className="text-sm font-semibold text-arcane-accent uppercase tracking-wide">
                {scoutCopy.hero.badge}
              </span>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-arcane-grey mb-4">
                {scoutCopy.hero.eyebrow}
              </p>
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight" data-test="arkane-scout-hero-title">
                {scoutCopy.hero.title}{" "}
                <span className="text-arcane-accent">{scoutCopy.hero.highlight}</span>
              </h1>
              <p className="text-arcane-grey text-lg max-w-3xl mx-auto mt-4" data-test="arkane-scout-hero-description">
                {scoutCopy.hero.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                onClick={() => router.push(scoutCopy.hero.primaryCta.href)}
                data-test="arkane-scout-primary-cta"
              >
                <PenSquare className="h-5 w-5 mr-2" />
                {scoutCopy.hero.primaryCta.label}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push(scoutCopy.hero.secondaryCta.href)}
                data-test="arkane-scout-secondary-cta"
              >
                <FileText className="h-5 w-5 mr-2" />
                {scoutCopy.hero.secondaryCta.label}
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsWithLiveData.map((stat) => (
                <GlassCard key={stat.label} className="p-6 text-center">
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-sm uppercase tracking-wide text-arcane-accent mt-2">
                    {stat.label}
                  </p>
                  <p className="text-xs text-arcane-grey mt-1">{stat.helper}</p>
                </GlassCard>
              ))}
            </div>
            {loadingLiveMetrics && (
              <p className="text-xs text-arcane-grey text-center mt-3">
                {scoutCopy.statsLoading}
              </p>
            )}
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((highlight) => {
                const Icon = highlight.Icon;
                return (
                  <GlassCard key={highlight.title} className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-arcane-accent/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-arcane-accent" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{highlight.title}</h3>
                        <p className="text-arcane-grey text-sm mt-2">{highlight.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>

          {/* Workflow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-arcane-grey">
                  {scoutCopy.workflow.title}
                </p>
                <h2 className="text-3xl text-white font-black mt-2">{scoutCopy.workflow.subtitle}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.Icon;
                return (
                  <GlassCard key={step.title} className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-arcane-accent/15 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-arcane-accent" />
                      </div>
                      <span className="text-arcane-grey text-sm font-semibold">0{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">{step.title}</h3>
                      <p className="text-arcane-grey text-sm">{step.description}</p>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>

          {/* Templates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-arcane-grey">
                {scoutCopy.templates.subtitle}
              </p>
              <h2 className="text-3xl text-white font-black">{scoutCopy.templates.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templatesData.map((template) => (
                <GlassCard key={template.name} className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">{template.name}</h3>
                    <span className="text-xs uppercase tracking-wide text-arcane-accent border border-arcane-accent/40 rounded-full px-3 py-1">
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-arcane-grey text-sm flex-1">{template.description}</p>
                  <Button
                    variant="ghost"
                    className="justify-start px-0 text-arcane-accent hover:text-arcane-accent"
                    onClick={() => router.push(scoutCopy.hero.primaryCta.href)}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {scoutCopy.templates.ctaLabel}
                  </Button>
                </GlassCard>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-8 bg-gradient-to-r from-arcane-accent/10 via-transparent to-arcane-accent/5 border-arcane-accent/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-white text-3xl font-black mb-2">{scoutCopy.cta.title}</h3>
                  <p className="text-arcane-grey text-sm">{scoutCopy.cta.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                    onClick={() => router.push(scoutCopy.cta.primary.href)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {scoutCopy.cta.primary.label}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(scoutCopy.cta.secondary.href)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {scoutCopy.cta.secondary.label}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
