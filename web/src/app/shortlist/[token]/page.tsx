"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { ExternalLink, Shield, Star, Trophy, User } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  fetchPublicShareResource,
  PublicShareError,
  PublicShareErrorReason,
} from "@/lib/public-share-api";

type PassportShareItem = {
  playerId: string;
  publicToken: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  nationality?: string | null;
  clubName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  marketValue?: number | null;
  contractUntil?: string | null;
  preferredFoot?: string | null;
  averageRating?: number | null;
};

type PassportShareSet = {
  token: string;
  title?: string | null;
  clubName?: string | null;
  items: PassportShareItem[];
  createdAt: string;
};

const formatCurrency = (value: number | null | undefined, language: "fr" | "en") => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string | null | undefined, language: "fr" | "en") => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ShortlistPage() {
  const params = useParams();
  const token = params?.token as string;
  const { t, language } = useLanguage();

  const [data, setData] = useState<PassportShareSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ reason: PublicShareErrorReason; message: string } | null>(
    null,
  );

  const fetchShortlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError({ reason: "not_found", message: t("publicShortlist.errors.notFoundTitle") });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const json = await fetchPublicShareResource<PassportShareSet>({
        resource: "shortlist",
        token,
      });
      setData(json);
    } catch (fetchError) {
      if (fetchError instanceof PublicShareError) {
        setError({ reason: fetchError.reason, message: fetchError.message });
      } else {
        setError({
          reason: "unavailable",
          message: t("publicShortlist.errors.unavailableTitle"),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  const createdAtLabel = useMemo(
    () => formatDate(data?.createdAt, language),
    [data?.createdAt, language],
  );

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4" />
          <p className="text-arcane-grey">{t("publicShortlist.loading")}</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    const unavailable = error?.reason === "unavailable";
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 max-w-md mx-auto p-6">
          <GlassCard variant="elevated" className="p-10 text-center">
            <Shield className="h-14 w-14 text-arcane-grey mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {unavailable
                ? t("publicShortlist.errors.unavailableTitle")
                : t("publicShortlist.errors.notFoundTitle")}
            </h3>
            <p className="text-arcane-grey">
              {unavailable
                ? t("publicShortlist.errors.unavailableDescription")
                : t("publicShortlist.errors.notFoundDescription")}
            </p>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-5">
          <GlassCard variant="elevated" className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">
                  {t("publicShortlist.title")}
                </h1>
                <p className="text-arcane-grey mt-2">
                  {data.title || data.clubName ? (
                    <>
                      {data.title ? <span className="text-white font-semibold">{data.title}</span> : null}
                      {data.title && data.clubName ? <span> • </span> : null}
                      {data.clubName ? (
                        <span className="text-arcane-accent font-semibold">{data.clubName}</span>
                      ) : null}
                    </>
                  ) : (
                    t("publicShortlist.fallbackTitle")
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <p className="text-arcane-grey text-xs uppercase">{t("publicShortlist.labels.createdAt")}</p>
                <p className="text-white font-bold">{createdAtLabel}</p>
              </div>
            </div>
          </GlassCard>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            {data.items?.length ? (
              data.items.map((item) => {
                const playerName = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "Player";

                return (
                  <GlassCard key={item.publicToken} variant="elevated" className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 flex items-center justify-center shrink-0">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={playerName} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-7 w-7 text-arcane-accent/60" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-white font-extrabold text-lg truncate">{playerName}</h3>
                            {item.position ? (
                              <span className="text-xs font-bold tracking-wide uppercase text-arcane-accent">
                                {item.position}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-arcane-grey text-sm truncate">
                            {[item.clubName ?? null, item.nationality ?? null].filter(Boolean).join(" • ") || "—"}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-white/5 border border-white/10 text-white">
                              <Trophy className="h-3 w-3 text-arcane-accent" />
                              {item.age == null
                                ? `${t("publicShortlist.labels.age")} —`
                                : `${t("publicShortlist.labels.age")} ${item.age}`}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-white/5 border border-white/10 text-white">
                              <Star className="h-3 w-3 text-arcane-accent" />
                              {`${t("publicShortlist.labels.marketValue")} ${formatCurrency(item.marketValue, language)}`}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-white/5 border border-white/10 text-white">
                              {`${t("publicShortlist.labels.contractUntil")} ${formatDate(item.contractUntil, language)}`}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-arcane-accent/15 border border-arcane-accent/40 text-arcane-accent font-semibold">
                              {`${t("publicShortlist.labels.averageRating")} ${
                                item.averageRating == null ? "—" : item.averageRating.toFixed(1)
                              }`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/passport/${item.publicToken}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-arcane-accent text-arcane-dark font-black text-sm hover:opacity-95 transition lg:shrink-0"
                      >
                        {t("publicShortlist.actions.openPassport")}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard variant="elevated" className="p-10 text-center">
                <p className="text-arcane-grey">{t("publicShortlist.empty")}</p>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
