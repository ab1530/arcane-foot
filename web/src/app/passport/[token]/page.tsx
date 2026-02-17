"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  Gauge,
  Globe2,
  Ruler,
  Scale,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useLanguage } from "@/contexts/language-context";
import {
  fetchPublicShareResource,
  PublicShareError,
  PublicShareErrorReason,
} from "@/lib/public-share-api";
import type { PublicProfileView } from "@/types/passport";

type PublicPassportPayload = {
  id: string;
  playerId: string;
  status: string;
  publicToken: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
  publicProfile?: PublicProfileView;
  profileView?: PublicProfileView;
};

type MetricCard = {
  key: string;
  label: string;
  value: string;
};

const formatCurrency = (value: number | null, language: "fr" | "en") => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string | null, language: "fr" | "en") => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value: string | null, language: "fr" | "en") => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(language === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFoot = (value: string | null) => {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const formatStatFallbackLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim();

export default function PublicPassportPage() {
  const params = useParams();
  const token = params?.token as string;
  const { t, language } = useLanguage();

  const [passport, setPassport] = useState<PublicPassportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ reason: PublicShareErrorReason; message: string } | null>(
    null,
  );

  const fetchPassport = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError({ reason: "not_found", message: t("publicPassport.errors.notFoundTitle") });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicShareResource<PublicPassportPayload>({
        resource: "passport",
        token,
      });
      setPassport(data);
    } catch (fetchError) {
      if (fetchError instanceof PublicShareError) {
        setError({ reason: fetchError.reason, message: fetchError.message });
      } else {
        setError({
          reason: "unavailable",
          message: t("publicPassport.errors.unavailableTitle"),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const profile = useMemo(() => {
    if (!passport) return null;
    return passport.publicProfile ?? passport.profileView ?? null;
  }, [passport]);

  const publicUrl = useMemo(() => {
    if (!passport?.publicToken || typeof window === "undefined") return "";
    return `${window.location.origin}/passport/${passport.publicToken}`;
  }, [passport?.publicToken]);

  const metrics = useMemo<MetricCard[]>(() => {
    if (!profile) return [];

    return [
      {
        key: "age",
        label: t("publicPassport.labels.age"),
        value:
          profile.physical.age == null
            ? "—"
            : `${profile.physical.age} ${t("publicPassport.units.years")}`,
      },
      {
        key: "value",
        label: t("publicPassport.labels.marketValue"),
        value: formatCurrency(profile.market.marketValue, language),
      },
      {
        key: "contract",
        label: t("publicPassport.labels.contractUntil"),
        value: formatDate(profile.market.contractUntil, language),
      },
      {
        key: "foot",
        label: t("publicPassport.labels.preferredFoot"),
        value: formatFoot(profile.physical.preferredFoot),
      },
      {
        key: "height",
        label: t("publicPassport.labels.height"),
        value:
          profile.physical.height == null
            ? "—"
            : `${profile.physical.height} ${t("publicPassport.units.centimeters")}`,
      },
      {
        key: "weight",
        label: t("publicPassport.labels.weight"),
        value:
          profile.physical.weight == null
            ? "—"
            : `${profile.physical.weight} ${t("publicPassport.units.kilograms")}`,
      },
    ];
  }, [language, profile, t]);

  const resolveStatLabel = useCallback(
    (statKey: string) => {
      const translated = t(`publicPassport.statsKeys.${statKey}`);
      if (translated === `publicPassport.statsKeys.${statKey}`) {
        return formatStatFallbackLabel(statKey);
      }
      return translated;
    },
    [t],
  );

  const handleCopyLink = useCallback(async () => {
    if (!publicUrl || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [publicUrl]);

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-arcane-accent mb-4" />
          <p className="text-arcane-grey">{t("publicPassport.loading")}</p>
        </div>
      </main>
    );
  }

  if (error || !passport || !profile) {
    const unavailable = error?.reason === "unavailable";
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 max-w-lg mx-auto p-6 w-full">
          <GlassCard variant="elevated" className="p-10 text-center">
            <Shield className="h-14 w-14 text-arcane-grey mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">
              {unavailable
                ? t("publicPassport.errors.unavailableTitle")
                : t("publicPassport.errors.notFoundTitle")}
            </h2>
            <p className="text-arcane-grey">
              {unavailable
                ? t("publicPassport.errors.unavailableDescription")
                : t("publicPassport.errors.notFoundDescription")}
            </p>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <GlassCard variant="elevated" className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:items-start lg:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/20 bg-arcane-darkBorder/30 flex items-center justify-center">
                    {profile.identity.avatarUrl ? (
                      <img
                        src={profile.identity.avatarUrl}
                        alt={profile.identity.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-arcane-grey" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                      {profile.identity.fullName}
                    </h1>
                    <p className="text-arcane-accent font-bold uppercase tracking-wider text-xs mt-1">
                      {profile.identity.position ?? "—"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-arcane-grey">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/5 border border-white/10">
                        <Trophy className="h-3.5 w-3.5 text-arcane-accent" />
                        {profile.identity.club?.name ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/5 border border-white/10">
                        <Globe2 className="h-3.5 w-3.5 text-arcane-accent" />
                        {profile.identity.nationality ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-arcane-accent/15 border border-arcane-accent/40 text-arcane-accent font-semibold">
                        {passport.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-[240px]">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-arcane-accent text-arcane-dark font-black text-sm hover:opacity-95 transition"
                    disabled={!publicUrl}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? t("publicPassport.actions.copied") : t("publicPassport.actions.copyLink")}
                  </button>

                  {profile.market.externalMarketUrl ? (
                    <a
                      href={profile.market.externalMarketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white/10 border border-white/15 text-white font-bold text-sm"
                    >
                      <ExternalLink className="h-4 w-4 text-arcane-accent" />
                      {t("publicPassport.actions.openMarket")}
                    </a>
                  ) : (
                    <div className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white/5 border border-white/10 text-arcane-grey text-sm">
                      <ExternalLink className="h-4 w-4" />
                      {t("publicPassport.actions.openMarket")}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {metrics.map((metric) => (
              <GlassCard key={metric.key} variant="elevated" className="p-3">
                <p className="text-[11px] uppercase tracking-wide text-arcane-grey">{metric.label}</p>
                <p className="text-white font-bold text-sm mt-1">{metric.value}</p>
              </GlassCard>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <GlassCard variant="elevated" className="p-5 xl:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="h-4 w-4 text-arcane-accent" />
                <h2 className="text-white font-extrabold">{t("publicPassport.sections.scouting")}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-arcane-grey">{t("publicPassport.labels.averageRating")}</p>
                  <p className="text-white text-xl font-black mt-1">
                    {profile.scouting.averageRating == null ? "—" : profile.scouting.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-arcane-grey">{t("publicPassport.labels.totalReports")}</p>
                  <p className="text-white text-xl font-black mt-1">{profile.scouting.totalReports}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-arcane-grey">{t("publicPassport.labels.recommendation")}</p>
                  <p className="text-white text-sm font-bold mt-1 break-words">
                    {profile.scouting.recommendation ?? "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3">
                  <p className="text-xs text-emerald-300 uppercase tracking-wide mb-2">
                    {t("publicPassport.sections.strengths")}
                  </p>
                  {profile.scouting.strengthsTop.length > 0 ? (
                    <ul className="space-y-1 text-sm text-white">
                      {profile.scouting.strengthsTop.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-arcane-grey">—</p>
                  )}
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3">
                  <p className="text-xs text-amber-300 uppercase tracking-wide mb-2">
                    {t("publicPassport.sections.weaknesses")}
                  </p>
                  {profile.scouting.weaknessesTop.length > 0 ? (
                    <ul className="space-y-1 text-sm text-white">
                      {profile.scouting.weaknessesTop.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-arcane-grey">—</p>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="elevated" className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-arcane-accent" />
                <h2 className="text-white font-extrabold">{t("publicPassport.sections.profile")}</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-arcane-grey text-xs uppercase">{t("publicPassport.labels.lastReportAt")}</p>
                  <p className="text-white font-semibold mt-1">
                    {formatDateTime(profile.scouting.lastReportAt, language)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-arcane-grey text-xs uppercase">{t("publicPassport.labels.lastUpdated")}</p>
                  <p className="text-white font-semibold mt-1">
                    {formatDateTime(profile.lastUpdatedAt, language)}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-arcane-accent" />
                  <span className="text-arcane-grey">{t("publicPassport.labels.status")}</span>
                  <span className="ml-auto text-white font-bold">{passport.status}</span>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-arcane-accent" />
                  <span className="text-arcane-grey">{t("publicPassport.labels.createdAt")}</span>
                  <span className="ml-auto text-white font-bold">
                    {formatDate(passport.createdAt, language)}
                  </span>
                </div>
              </div>
            </GlassCard>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <GlassCard variant="elevated" className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-4 w-4 text-arcane-accent" />
                <h2 className="text-white font-extrabold">{t("publicPassport.sections.stats")}</h2>
              </div>

              {profile.stats.keyStats.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {profile.stats.keyStats.map((stat) => (
                    <div key={stat.key} className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-arcane-grey">
                        {resolveStatLabel(stat.key)}
                      </p>
                      <p className="text-white font-bold mt-1 text-sm">{String(stat.value ?? "—")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-arcane-grey text-sm">{t("publicPassport.statsEmpty")}</p>
              )}
            </GlassCard>

            <GlassCard variant="elevated" className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-4 w-4 text-arcane-accent" />
                <h2 className="text-white font-extrabold">{t("publicPassport.sections.media")}</h2>
              </div>

              {profile.mediaHighlights.length > 0 ? (
                <div className="space-y-3">
                  {profile.mediaHighlights.map((media) => (
                    <a
                      key={media.id}
                      href={media.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:border-arcane-accent/60 transition"
                    >
                      <div className="h-14 w-20 rounded-md overflow-hidden bg-arcane-darkBorder/40 shrink-0">
                        {media.thumbnailUrl ? (
                          <img src={media.thumbnailUrl} alt={media.filename ?? media.type} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-arcane-grey text-[10px]">
                            {media.type}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {media.filename ?? t("publicPassport.media.untitled")}
                        </p>
                        <p className="text-xs text-arcane-grey">
                          {media.type === "VIDEO" ? t("publicPassport.media.video") : t("publicPassport.media.image")}
                          {media.duration ? ` • ${media.duration}s` : ""}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-arcane-accent" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-arcane-grey text-sm">{t("publicPassport.media.empty")}</p>
              )}
            </GlassCard>
          </section>
        </div>
      </div>
    </main>
  );
}
