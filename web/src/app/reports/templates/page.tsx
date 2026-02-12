"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/language-context";
import { LinkButton } from "@/components/ui/link-button";
import { apiClient } from "@/lib/api-client";
import { logError } from "@/lib/logger";

type TemplateEntry = {
  name: string;
  description: string;
  badge?: string;
};

export default function ReportsTemplatesPage() {
  const { dictionary } = useLanguage();
  const scoutCopy = dictionary.aiTools.scout;
  const templatesCopy = scoutCopy.templates;
  const templatesMeta = templatesCopy.meta ?? {
    provider: "ArkaneScout",
    format: "PDF / Slides",
  };
  const [liveTemplates, setLiveTemplates] = useState<TemplateEntry[] | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
          const response = await apiClient
            .getAutoScoutTemplates()
          .catch((error: any) => {
            if (error?.message?.includes("403") || error?.message?.includes("Unauthorized")) {
              return null;
            }
            throw error;
          });

        if (!cancelled && response?.success && Array.isArray(response.data)) {
          const normalized = response.data.map((template: any, index: number) => {
            const fallback = templatesCopy.list[index % templatesCopy.list.length];
            return {
              name: template.name ?? fallback.name,
              description: template.description ?? fallback.description,
              badge: template.reportType ?? template.category ?? fallback.badge,
            } satisfies TemplateEntry;
          });
          setLiveTemplates(normalized);
        }
      } catch (error) {
        logError("Failed to fetch AutoScout template library", error as Error);
      } finally {
        if (!cancelled) {
          setLoadingTemplates(false);
        }
      }
    };

    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, [templatesCopy.list]);

  const templatesToDisplay = useMemo(
    () => (liveTemplates?.length ? liveTemplates : templatesCopy.list),
    [liveTemplates, templatesCopy.list],
  );

  return (
    <MainLayout>
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12 space-y-10">
          <nav className="flex items-center justify-between gap-4 flex-wrap">
            <Link
              href="/reports"
              className="text-arcane-grey hover:text-white transition-colors inline-flex items-center gap-2 text-sm uppercase tracking-wide"
            >
              <ArrowLeft className="h-4 w-4" />
              {scoutCopy.hero.primaryCta.label}
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arcane-accent/10 border border-arcane-accent/30" data-test="reports-templates-badge">
              <Sparkles className="h-3.5 w-3.5 text-arcane-accent" />
              <span className="text-xs font-semibold text-arcane-accent uppercase tracking-widest">
                {templatesCopy.badge}
              </span>
            </div>
          </nav>

          <header className="text-center space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-arcane-grey">
              {templatesCopy.subtitle}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight" data-test="reports-templates-title">
              {templatesCopy.title}
            </h1>
            <p className="text-arcane-grey max-w-3xl mx-auto" data-test="reports-templates-description">
              {scoutCopy.hero.description}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {templatesToDisplay.map((template) => (
              <GlassCard key={template.name} className="p-6 flex flex-col gap-4" data-test="reports-template-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl">{template.name}</h2>
                  <span className="text-xs uppercase tracking-wide text-arcane-accent border border-arcane-accent/40 rounded-full px-3 py-1">
                    {template.badge}
                  </span>
                </div>
                <p className="text-arcane-grey text-sm flex-1">{template.description}</p>
                <div className="flex items-center justify-between text-sm text-arcane-grey">
                  <span>{templatesMeta.provider}</span>
                  <span>{templatesMeta.format}</span>
                </div>
              </GlassCard>
            ))}
          </section>
          {loadingTemplates && (
            <p className="text-xs text-arcane-grey text-center">
              {templatesCopy.loading}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-arcane-accent/10 via-transparent to-arcane-accent/5 border-arcane-accent/30">
              <div>
                <h2 className="text-white text-2xl font-black mb-2">{scoutCopy.cta.title}</h2>
                <p className="text-arcane-grey text-sm">{scoutCopy.cta.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <LinkButton
                  href={scoutCopy.cta.primary.href}
                  className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                  data-test="reports-templates-primary-cta"
                >
                  {scoutCopy.cta.primary.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </LinkButton>
                <LinkButton variant="outline" href={scoutCopy.cta.secondary.href}>
                  {scoutCopy.cta.secondary.label}
                </LinkButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
