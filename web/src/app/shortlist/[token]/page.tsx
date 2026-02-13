"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Shield, Users, ExternalLink } from "lucide-react";

type PassportShareItem = {
  playerId: string;
  publicToken: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  nationality?: string | null;
  clubName?: string | null;
  avatarUrl?: string | null;
};

type PassportShareSet = {
  token: string;
  title?: string | null;
  clubName?: string | null;
  items: PassportShareItem[];
  createdAt: string;
};

export default function ShortlistPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<PassportShareSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shareApiUrl = useMemo(
    () => {
      const raw = process.env.NEXT_PUBLIC_PUBLIC_SHARE_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
      return String(raw ?? "")
        .trim()
        .replace(/\/+$/, "");
    },
    [],
  );

  const fetchShortlist = useCallback(async () => {
    if (!token || !shareApiUrl) return;
    try {
      setLoading(true);
      setError(null);
      const path = shareApiUrl.includes("functions.supabase.co") ? "shortlist" : "passport-shares";
      const res = await fetch(`${shareApiUrl}/${path}/${token}`);
      if (!res.ok) {
        throw new Error("Shortlist not found");
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error("Error fetching shortlist:", e);
      setError(e?.message || "Failed to load shortlist");
    } finally {
      setLoading(false);
    }
  }, [token, shareApiUrl]);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
          <p className="text-arcane-grey">Loading shortlist...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 max-w-md mx-auto p-6">
          <GlassCard variant="elevated" className="p-12 text-center">
            <Shield className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Shortlist introuvable</h3>
            <p className="text-arcane-grey">
              Ce lien n&apos;existe pas ou a été révoqué.
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold text-2xl">A</span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">ARCANE</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Shortlist</h1>
            <p className="text-arcane-grey">
              {data.title || data.clubName ? (
                <>
                  {data.title ? <span className="text-white font-semibold">{data.title}</span> : null}
                  {data.title && data.clubName ? <span> • </span> : null}
                  {data.clubName ? <span className="text-white font-semibold">{data.clubName}</span> : null}
                </>
              ) : (
                "Joueurs sélectionnés"
              )}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            {data.items?.length ? (
              data.items.map((it) => {
                const name = `${it.firstName ?? ""} ${it.lastName ?? ""}`.trim() || "Joueur";
                return (
                  <GlassCard key={it.publicToken} variant="elevated" className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 flex items-center justify-center">
                        {it.avatarUrl ? (
                          <Image
                            src={it.avatarUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <Users className="h-7 w-7 text-arcane-accent/60" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-white font-extrabold text-lg truncate">{name}</h3>
                          {it.position ? (
                            <span className="text-xs font-bold tracking-wide uppercase text-arcane-accent">
                              {it.position}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-arcane-grey text-sm truncate">
                          {[
                            it.clubName ?? null,
                            it.nationality ?? null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </p>
                      </div>

                      <Link
                        href={`/passport/${it.publicToken}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-arcane-accent text-arcane-dark font-black text-sm hover:opacity-95 transition"
                      >
                        Ouvrir passeport
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard variant="elevated" className="p-10 text-center">
                <p className="text-arcane-grey">Aucun joueur dans cette shortlist.</p>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
