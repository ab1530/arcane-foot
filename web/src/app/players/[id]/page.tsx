"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Gauge,
  Globe,
  Link2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlayerTabs } from "@/components/players/PlayerTabs";
import { EmptySection, SectionCard, SectionItem } from "@/components/players/profile-sections";
import {
  ProfileEditorDrawer,
  type ProfileEditorField,
} from "@/components/players/profile-editor-drawer";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import type {
  PlayerMediaItem,
  PlayerProfileView,
  ProfileContentStatus,
  ProfileSectionKey,
} from "@/types/player-profile";

type TabKey =
  | "profile"
  | "performance"
  | "scouting"
  | "market"
  | "transfers"
  | "career"
  | "nationalTeam"
  | "achievements"
  | "news"
  | "rumours"
  | "hardware";

const SECTION_BY_TAB: Partial<Record<TabKey, ProfileSectionKey>> = {
  performance: "performance-rows",
  transfers: "transfers",
  career: "career",
  nationalTeam: "national-team",
  achievements: "achievements",
  news: "news",
  rumours: "rumours",
};

const STATUS_ACTIONS: Array<{ label: string; status: ProfileContentStatus }> = [
  { label: "Save Draft", status: "DRAFT" },
  { label: "Verify", status: "VERIFIED" },
  { label: "Publish", status: "PUBLISHED" },
  { label: "Archive", status: "ARCHIVED" },
];

const EDITOR_FIELDS: Record<ProfileSectionKey, ProfileEditorField[]> = {
  "performance-rows": [
    { key: "competitionName", label: "Competition" },
    { key: "season", label: "Season", placeholder: "2025/26" },
    { key: "appearances", label: "Appearances", type: "number" },
    { key: "goals", label: "Goals", type: "number" },
    { key: "assists", label: "Assists", type: "number" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
  transfers: [
    { key: "toClubName", label: "Joined club" },
    { key: "fromClubName", label: "Left club" },
    { key: "season", label: "Season", placeholder: "2025/26" },
    { key: "feeAmount", label: "Fee", type: "number" },
    { key: "feeCurrency", label: "Currency", placeholder: "EUR" },
    { key: "transferDate", label: "Transfer date", type: "date" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
  career: [
    { key: "clubName", label: "Club" },
    { key: "teamLevel", label: "Team level", placeholder: "YOUTH/SENIOR/NATIONAL" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "isLoan", label: "Loan", placeholder: "true/false" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
  achievements: [
    { key: "title", label: "Title" },
    { key: "competition", label: "Competition" },
    { key: "season", label: "Season" },
    { key: "count", label: "Count", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
  "national-team": [
    { key: "country", label: "Country" },
    { key: "teamLevel", label: "Team level", placeholder: "U17/U19/U21/A" },
    { key: "caps", label: "Caps", type: "number" },
    { key: "goals", label: "Goals", type: "number" },
    { key: "fromDate", label: "From", type: "date" },
    { key: "toDate", label: "To", type: "date" },
    { key: "isCurrent", label: "Current", placeholder: "true/false" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
  news: [
    { key: "headline", label: "Headline" },
    { key: "summary", label: "Summary", type: "textarea" },
    { key: "publishedAtSource", label: "Published at", type: "date" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
  ],
  rumours: [
    { key: "headline", label: "Headline" },
    { key: "summary", label: "Summary", type: "textarea" },
    { key: "destinationClub", label: "Destination club" },
    { key: "probabilityPercent", label: "Probability %", type: "number" },
    { key: "sourceName", label: "Source name" },
    { key: "sourceUrl", label: "Source URL", placeholder: "https://..." },
    { key: "sourceDate", label: "Source date", type: "date" },
  ],
};

const NUMBER_KEYS = new Set([
  "possibleGames",
  "appearances",
  "goals",
  "assists",
  "yellowCards",
  "secondYellowCards",
  "redCards",
  "startingXIPercent",
  "minutesPercent",
  "goalParticipationPercent",
  "feeAmount",
  "count",
  "caps",
  "probabilityPercent",
]);

const BOOLEAN_KEYS = new Set(["isLoan", "isCurrent"]);

const toDateLabel = (value?: string | Date | null, locale: "fr" | "en" = "fr") => {
  if (!value) return "—";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMoney = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatBytes = (bytes?: number | null) => {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(mb))} MB`;
};

const decodeFileName = (filename?: string | null) => {
  if (!filename) return "Video";
  const plusReplaced = filename.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusReplaced);
  } catch {
    return plusReplaced;
  }
};

const formatDuration = (duration?: number | null) => {
  if (!duration || duration <= 0) return null;
  const total = Math.floor(duration);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "oui"].includes(normalized)) return true;
  if (["false", "0", "no", "non"].includes(normalized)) return false;
  return undefined;
};

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toSectionTitle = (section: ProfileSectionKey, language: "fr" | "en") => {
  const titles: Record<ProfileSectionKey, { fr: string; en: string }> = {
    "performance-rows": { fr: "Performance data", en: "Performance data" },
    transfers: { fr: "Historique transferts", en: "Transfer history" },
    career: { fr: "Historique carrière", en: "Career history" },
    achievements: { fr: "Palmarès", en: "Achievements" },
    "national-team": { fr: "Parcours national", en: "National team" },
    news: { fr: "News", en: "News" },
    rumours: { fr: "Rumeurs", en: "Rumours" },
  };

  return titles[section][language];
};

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<PlayerProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [mediaItems, setMediaItems] = useState<PlayerMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSection, setEditorSection] = useState<ProfileSectionKey>("news");
  const [editorValues, setEditorValues] = useState<Record<string, string>>({});
  const [savingEditor, setSavingEditor] = useState(false);
  const [statusLoadingKey, setStatusLoadingKey] = useState<string | null>(null);

  const tx = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t],
  );

  const tabs = useMemo(
    () => [
      { key: "profile" as const, label: tx("players.profileView.tabs.profile", language === "fr" ? "Profil" : "Profile") },
      { key: "performance" as const, label: tx("players.profileView.tabs.performance", "Performance") },
      { key: "scouting" as const, label: tx("players.profileView.tabs.scouting", "Scouting") },
      { key: "market" as const, label: tx("players.profileView.tabs.market", language === "fr" ? "Marché" : "Market") },
      { key: "transfers" as const, label: tx("players.profileView.tabs.transfers", language === "fr" ? "Transferts" : "Transfers") },
      { key: "career" as const, label: tx("players.profileView.tabs.career", language === "fr" ? "Carrière" : "Career") },
      { key: "nationalTeam" as const, label: tx("players.profileView.tabs.nationalTeam", language === "fr" ? "Nation" : "National team") },
      { key: "achievements" as const, label: tx("players.profileView.tabs.achievements", language === "fr" ? "Palmarès" : "Achievements") },
      { key: "news" as const, label: tx("players.profileView.tabs.news", "News") },
      { key: "rumours" as const, label: tx("players.profileView.tabs.rumours", language === "fr" ? "Rumeurs" : "Rumours") },
      { key: "hardware" as const, label: tx("players.profileView.tabs.hardware", "Hardware") },
    ],
    [language, tx],
  );

  const videoItems = useMemo(
    () =>
      mediaItems
        .filter((item) => String(item.type).toUpperCase() === "VIDEO")
        .slice(0, 3),
    [mediaItems],
  );

  const loadMedia = useCallback(async (targetPlayerId: string) => {
    setMediaLoading(true);
    try {
      const response = await apiClient.getPlayerMedia(targetPlayerId);
      setMediaItems(Array.isArray(response) ? response : []);
    } catch (err) {
      logger.warn("Unable to load player media", {
        scope: "PLAYER_PROFILE",
        playerId: targetPlayerId,
        error: (err as Error).message,
      });
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const loadProfile = useCallback(
    async (silent = false) => {
      if (!playerId) {
        setLoading(false);
        setError(language === "fr" ? "Joueur introuvable" : "Player not found");
        return;
      }

      try {
        let nextProfile: PlayerProfileView;
        let nextCanEdit = false;

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const adminView = await apiClient.getPlayerProfileView(playerId, {
            includeUnpublished: true,
          });
          nextProfile = adminView;
          nextCanEdit = true;
        } catch (adminError) {
          logger.info("Falling back to published player profile view", {
            scope: "PLAYER_PROFILE",
            playerId,
            reason: (adminError as Error).message,
          });

          const publishedView = await apiClient.getPlayerProfileView(playerId);
          nextProfile = publishedView;
        }

        setProfile(nextProfile);
        setCanEdit(nextCanEdit);
        setError(null);
        await loadMedia(playerId);
      } catch (err) {
        logger.error("Unable to load player profile", err as Error, {
          scope: "PLAYER_PROFILE",
          playerId,
        });
        setMediaItems([]);
        setError(language === "fr" ? "Impossible de charger le profil" : "Failed to load profile");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language, loadMedia, playerId],
  );

  useEffect(() => {
    loadProfile(false);
  }, [loadProfile]);

  const openEditor = useCallback((section: ProfileSectionKey) => {
    const nextValues: Record<string, string> = {};
    for (const field of EDITOR_FIELDS[section]) {
      nextValues[field.key] = "";
    }

    setEditorSection(section);
    setEditorValues(nextValues);
    setEditorOpen(true);
  }, []);

  const createPayload = useCallback(() => {
    const payload: Record<string, any> = {};

    for (const [key, rawValue] of Object.entries(editorValues)) {
      const value = rawValue.trim();
      if (!value) continue;

      if (NUMBER_KEYS.has(key)) {
        const parsed = parseNumber(value);
        if (parsed !== undefined) payload[key] = parsed;
        continue;
      }

      if (BOOLEAN_KEYS.has(key)) {
        const parsed = parseBoolean(value);
        if (parsed !== undefined) payload[key] = parsed;
        continue;
      }

      payload[key] = value;
    }

    return payload;
  }, [editorValues]);

  const saveDraft = useCallback(async () => {
    if (!playerId) return;

    try {
      setSavingEditor(true);
      const payload = createPayload();

      if (!payload.sourceName) {
        toast.error(
          tx(
            "players.profileView.toasts.sourceRequired",
            language === "fr" ? "La source est obligatoire pour publier ce contenu." : "Source is required for this content.",
          ),
        );
        return;
      }

      await apiClient.createPlayerProfileSectionItem(playerId, editorSection, payload);
      toast.success(
        tx(
          "players.profileView.toasts.draftSaved",
          language === "fr" ? "Draft enregistré" : "Draft saved",
        ),
      );
      setEditorOpen(false);
      await loadProfile(true);
    } catch (err) {
      logger.error("Unable to save profile draft", err as Error, {
        scope: "PLAYER_PROFILE",
        section: editorSection,
      });
      toast.error(
        tx(
          "players.profileView.toasts.saveError",
          language === "fr" ? "Impossible de sauvegarder ce draft" : "Unable to save this draft",
        ),
      );
    } finally {
      setSavingEditor(false);
    }
  }, [createPayload, editorSection, language, loadProfile, playerId, tx]);

  const applyStatus = useCallback(
    async (section: ProfileSectionKey, itemId: string, status: ProfileContentStatus) => {
      if (!playerId) return;
      const key = `${section}-${itemId}-${status}`;

      try {
        setStatusLoadingKey(key);
        await apiClient.updatePlayerProfileSectionStatus(playerId, section, itemId, status);
        toast.success(
          tx(
            "players.profileView.toasts.statusUpdated",
            language === "fr" ? "Statut mis à jour" : "Status updated",
          ),
        );
        await loadProfile(true);
      } catch (err) {
        logger.error("Unable to update section status", err as Error, {
          scope: "PLAYER_PROFILE",
          section,
          itemId,
          status,
        });
        toast.error(
          tx(
            "players.profileView.toasts.invalidTransition",
            language === "fr"
              ? "Transition invalide pour cet élément"
              : "Invalid status transition for this item",
          ),
        );
      } finally {
        setStatusLoadingKey(null);
      }
    },
    [language, loadProfile, playerId, tx],
  );

  const statusActions = useCallback(
    (section: ProfileSectionKey, itemId: string) =>
      STATUS_ACTIONS.map((action) => ({
        key: `${itemId}-${action.status}`,
        label: action.label,
        disabled: statusLoadingKey === `${section}-${itemId}-${action.status}`,
        onClick: () => applyStatus(section, itemId, action.status),
      })),
    [applyStatus, statusLoadingKey],
  );

  const sectionItems = useMemo(() => {
    if (!profile) return [] as any[];
    const section = SECTION_BY_TAB[activeTab];
    if (!section) return [] as any[];

    switch (section) {
      case "performance-rows":
        return profile.performance.competitionRows;
      case "transfers":
        return profile.transfers;
      case "career":
        return profile.career;
      case "achievements":
        return profile.achievements;
      case "national-team":
        return profile.nationalTeam;
      case "news":
        return profile.news;
      case "rumours":
        return profile.rumours;
      default:
        return [] as any[];
    }
  }, [activeTab, profile]);

  const renderIdentity = () => {
    if (!profile) return null;

    const fullName = profile.identity.fullName;
    const ageText = profile.identity.age != null ? `${profile.identity.age}` : "—";
    const heightText =
      profile.identity.physical.height != null ? `${profile.identity.physical.height} cm` : "—";
    const weightText =
      profile.identity.physical.weight != null ? `${profile.identity.physical.weight} kg` : "—";

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card3D className="xl:col-span-2">
            <SectionCard
              title={tx("players.profileView.sections.identity", language === "fr" ? "Profil joueur" : "Player profile")}
              subtitle={tx(
                "players.profileView.subtitles.identity",
                language === "fr"
                  ? "Données internes consolidées pour décision club"
                  : "Consolidated internal profile for club decisions",
              )}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    key: "age",
                    label: tx("players.profileView.labels.age", language === "fr" ? "Âge" : "Age"),
                    value: ageText,
                    icon: Calendar,
                  },
                  {
                    key: "foot",
                    label: tx("players.profileView.labels.foot", language === "fr" ? "Pied" : "Foot"),
                    value: profile.identity.physical.preferredFoot || "—",
                    icon: Activity,
                  },
                  {
                    key: "height",
                    label: tx("players.profileView.labels.height", language === "fr" ? "Taille" : "Height"),
                    value: heightText,
                    icon: Target,
                  },
                  {
                    key: "weight",
                    label: tx("players.profileView.labels.weight", language === "fr" ? "Poids" : "Weight"),
                    value: weightText,
                    icon: Gauge,
                  },
                ].map((metric) => (
                  <div key={metric.key} className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                    <div className="flex items-center gap-2 text-arcane-grey text-xs uppercase tracking-wide mb-2">
                      <metric.icon className="h-4 w-4 text-arcane-accent" />
                      <span>{metric.label}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                  <p className="text-xs uppercase tracking-wide text-arcane-grey mb-2">
                    {tx("players.profileView.labels.identity", language === "fr" ? "Identité" : "Identity")}
                  </p>
                  <p className="text-lg font-semibold text-white">{fullName}</p>
                  <p className="text-sm text-arcane-grey mt-1">
                    {(profile.identity.positions.main ?? "—") + " • " + (profile.identity.nationality ?? "—")}
                  </p>
                  <p className="text-sm text-arcane-grey mt-1">{profile.identity.club?.name ?? "—"}</p>
                </div>

                <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                  <p className="text-xs uppercase tracking-wide text-arcane-grey mb-2">
                    {tx("players.profileView.labels.meta", language === "fr" ? "Meta profil" : "Profile meta")}
                  </p>
                  <p className="text-sm text-arcane-grey">
                    {tx("players.profileView.labels.pronunciation", language === "fr" ? "Prononciation" : "Pronunciation")}
                    : {profile.identity.profile.pronunciation || "—"}
                  </p>
                  <p className="text-sm text-arcane-grey mt-1">
                    {tx("players.profileView.labels.agent", language === "fr" ? "Agent" : "Agent")}
                    : {profile.identity.profile.agentName || "—"}
                  </p>
                  <p className="text-sm text-arcane-grey mt-1">
                    {tx("players.profileView.labels.outfitter", language === "fr" ? "Équipementier" : "Outfitter")}
                    : {profile.identity.profile.outfitter || "—"}
                  </p>
                </div>
              </div>
            </SectionCard>
          </Card3D>

          <Card3D>
            <SectionCard
              title={tx("players.profileView.sections.kpis", language === "fr" ? "KPI décision" : "Decision KPIs")}
            >
              <div className="space-y-3">
                {[
                  {
                    label: tx("players.profileView.labels.currentValue", language === "fr" ? "Valeur actuelle" : "Current value"),
                    value: toMoney(profile.market.currentValue),
                  },
                  {
                    label: tx("players.profileView.labels.highestValue", language === "fr" ? "Valeur max" : "Highest value"),
                    value: toMoney(profile.market.highestValue),
                  },
                  {
                    label: tx("players.profileView.labels.averageRating", language === "fr" ? "Note moyenne" : "Average rating"),
                    value: profile.scouting.averageRating != null ? `${profile.scouting.averageRating}` : "—",
                  },
                  {
                    label: tx("players.profileView.labels.totalReports", language === "fr" ? "Rapports" : "Reports"),
                    value: `${profile.scouting.totalReports}`,
                  },
                  {
                    label: tx("players.profileView.labels.hardwareSessions", language === "fr" ? "Sessions hardware" : "Hardware sessions"),
                    value: `${profile.hardware.totalSessions}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-arcane-darkBorder/60 bg-arcane-dark/50 px-3 py-2"
                  >
                    <p className="text-sm text-arcane-grey">{item.label}</p>
                    <p className="text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </Card3D>
        </div>

        <Card3D>
          <SectionCard
            title={tx(
              "players.profileView.sections.highlights",
              language === "fr" ? "Highlights vidéos" : "Video highlights",
            )}
          >
            {mediaLoading ? (
              <div className="flex items-center gap-2 text-sm text-arcane-grey">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{language === "fr" ? "Chargement des vidéos…" : "Loading videos…"}</span>
              </div>
            ) : videoItems.length === 0 ? (
              <EmptySection
                title={tx(
                  "players.profileView.empty.videoTitle",
                  language === "fr" ? "Aucune vidéo disponible" : "No video available",
                )}
                description={tx(
                  "players.profileView.empty.videoBody",
                  language === "fr"
                    ? "Aucun highlight n'a encore été uploadé pour ce joueur."
                    : "No highlight has been uploaded for this player yet.",
                )}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {videoItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full border border-lime-300/40 bg-lime-300/10 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.05em] text-lime-300">
                        VIDEO
                      </span>
                      {formatDuration(item.duration) ? (
                        <span className="inline-flex items-center rounded-full border border-arcane-darkBorder/60 bg-arcane-dark/60 px-2 py-0.5 text-[10px] font-semibold text-arcane-grey">
                          {formatDuration(item.duration)}
                        </span>
                      ) : null}
                    </div>
                    <div className="overflow-hidden rounded-lg bg-black">
                      <video
                        src={item.playbackUrl ?? item.url}
                        controls
                        preload="metadata"
                        className="h-52 w-full object-contain bg-black"
                        onError={() => {
                          if (playerId) {
                            void loadMedia(playerId);
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-white truncate">
                      {decodeFileName(
                        item.filename ||
                          tx("players.profileView.labels.video", language === "fr" ? "Vidéo" : "Video"),
                      )}
                    </p>
                    <p className="text-xs text-arcane-grey">
                      {`${tx("players.profileView.labels.fileSize", language === "fr" ? "Taille" : "Size")}: ${formatBytes(item.size)} • ${tx(
                        "players.profileView.labels.uploadedAt",
                        language === "fr" ? "Upload" : "Uploaded",
                      )}: ${toDateLabel(item.uploadedAt, language)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </Card3D>
      </div>
    );
  };

  const renderScouting = () => {
    if (!profile) return null;

    if (profile.emptyStateFlags.scouting) {
      return (
        <Card3D>
          <SectionCard title={tx("players.profileView.sections.scouting", "Scouting")}> 
            <EmptySection
              title={tx(
                "players.profileView.empty.scoutingTitle",
                language === "fr" ? "Aucun rapport approuvé" : "No approved report",
              )}
              description={tx(
                "players.profileView.empty.scoutingBody",
                language === "fr"
                  ? "La section reste visible tant qu’aucun rapport approuvé n’existe."
                  : "This section stays visible while no approved report is available.",
              )}
            />
          </SectionCard>
        </Card3D>
      );
    }

    return (
      <Card3D>
        <SectionCard title={tx("players.profileView.sections.scouting", "Scouting")}> 
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: tx("players.profileView.labels.averageRating", language === "fr" ? "Note moyenne" : "Average rating"),
                value: profile.scouting.averageRating != null ? `${profile.scouting.averageRating}` : "—",
              },
              {
                label: tx("players.profileView.labels.totalReports", language === "fr" ? "Rapports" : "Reports"),
                value: `${profile.scouting.totalReports}`,
              },
              {
                label: tx("players.profileView.labels.recommendation", language === "fr" ? "Reco dominante" : "Dominant reco"),
                value: profile.scouting.recommendation || "—",
              },
              {
                label: tx("players.profileView.labels.lastReport", language === "fr" ? "Dernier rapport" : "Last report"),
                value: toDateLabel(profile.scouting.lastReportAt, language),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                <p className="text-xs uppercase tracking-wide text-arcane-grey">{item.label}</p>
                <p className="text-lg font-semibold text-white mt-2">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-sm font-semibold text-white mb-2">
                {tx("players.profileView.labels.strengths", language === "fr" ? "Forces clés" : "Top strengths")}
              </p>
              <p className="text-sm text-arcane-grey">
                {profile.scouting.strengthsTop.length
                  ? profile.scouting.strengthsTop.join(" • ")
                  : tx("players.profileView.empty.common", language === "fr" ? "Aucune donnée vérifiée" : "No verified data")}
              </p>
            </div>
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-sm font-semibold text-white mb-2">
                {tx("players.profileView.labels.weaknesses", language === "fr" ? "Points de vigilance" : "Watch points")}
              </p>
              <p className="text-sm text-arcane-grey">
                {profile.scouting.weaknessesTop.length
                  ? profile.scouting.weaknessesTop.join(" • ")
                  : tx("players.profileView.empty.common", language === "fr" ? "Aucune donnée vérifiée" : "No verified data")}
              </p>
            </div>
          </div>
        </SectionCard>
      </Card3D>
    );
  };

  const renderMarket = () => {
    if (!profile) return null;

    return (
      <Card3D>
        <SectionCard
          title={tx("players.profileView.sections.market", language === "fr" ? "Marché" : "Market")}
          subtitle={tx(
            "players.profileView.subtitles.market",
            language === "fr" ? "Snapshot financier et contractualisation" : "Financial and contract snapshot",
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-xs uppercase tracking-wide text-arcane-grey">
                {tx("players.profileView.labels.currentValue", language === "fr" ? "Valeur actuelle" : "Current value")}
              </p>
              <p className="text-lg font-semibold text-white mt-2">{toMoney(profile.market.currentValue)}</p>
            </div>
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-xs uppercase tracking-wide text-arcane-grey">
                {tx("players.profileView.labels.highestValue", language === "fr" ? "Valeur max" : "Highest value")}
              </p>
              <p className="text-lg font-semibold text-white mt-2">{toMoney(profile.market.highestValue)}</p>
            </div>
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-xs uppercase tracking-wide text-arcane-grey">
                {tx("players.profileView.labels.contractUntil", language === "fr" ? "Fin contrat" : "Contract end")}
              </p>
              <p className="text-lg font-semibold text-white mt-2">{toDateLabel(profile.market.contractUntil, language)}</p>
            </div>
            <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
              <p className="text-xs uppercase tracking-wide text-arcane-grey">
                {tx("players.profileView.labels.latestValuation", language === "fr" ? "Dernière valuation" : "Latest valuation")}
              </p>
              <p className="text-lg font-semibold text-white mt-2">
                {toDateLabel(profile.market.latestValuationAt, language)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!profile.market.externalMarketUrl}
              onClick={() => {
                if (!profile.market.externalMarketUrl) return;
                window.open(profile.market.externalMarketUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <Globe className="h-4 w-4 mr-2" />
              {tx("players.profileView.actions.openMarket", language === "fr" ? "Ouvrir lien marché" : "Open market link")}
            </Button>
            <Button
              variant="outline"
              disabled={!profile.market.externalMarketUrl}
              onClick={async () => {
                if (!profile.market.externalMarketUrl) return;
                try {
                  await navigator.clipboard.writeText(profile.market.externalMarketUrl);
                  toast.success(
                    tx("players.profileView.toasts.linkCopied", language === "fr" ? "Lien copié" : "Link copied"),
                  );
                } catch {
                  toast.error(
                    tx(
                      "players.profileView.toasts.copyFailed",
                      language === "fr" ? "Copie impossible" : "Copy failed",
                    ),
                  );
                }
              }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {tx("players.profileView.actions.copyLink", language === "fr" ? "Copier le lien" : "Copy link")}
            </Button>
          </div>
        </SectionCard>
      </Card3D>
    );
  };

  const renderPerformance = () => {
    if (!profile) return null;

    return (
      <Card3D>
        <SectionCard
          title={tx("players.profileView.sections.performance", "Performance")}
          canEdit={canEdit}
          editLabel={tx("players.profileView.actions.edit", language === "fr" ? "Éditer" : "Edit")}
          onEdit={() => openEditor("performance-rows")}
        >
          {profile.performance.competitionRows.length === 0 ? (
            Object.keys(profile.performance.statsFallback).length === 0 ? (
              <EmptySection
                title={tx(
                  "players.profileView.empty.performanceTitle",
                  language === "fr" ? "Aucune donnée vérifiée" : "No verified data",
                )}
                description={tx(
                  "players.profileView.empty.performanceBody",
                  language === "fr"
                    ? "La section performance reste visible en attente de données publiées."
                    : "Performance section is visible while waiting for published data.",
                )}
              />
            ) : (
              <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                <p className="text-sm text-arcane-grey">
                  {Object.entries(profile.performance.statsFallback)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" • ")}
                </p>
              </div>
            )
          ) : (
            profile.performance.competitionRows.map((item) => (
              <SectionItem
                key={item.id}
                title={`${item.competitionName} ${item.season ?? ""}`.trim()}
                subtitle={`${tx("players.profileView.labels.appearances", language === "fr" ? "Apparitions" : "Appearances")}: ${item.appearances ?? "—"} • ${tx("players.profileView.labels.goals", "Goals")}: ${item.goals ?? "—"} • ${tx("players.profileView.labels.assists", "Assists")}: ${item.assists ?? "—"}`}
                details={[
                  `${tx("players.profileView.labels.possibleGames", language === "fr" ? "Matchs possibles" : "Possible games")}: ${item.possibleGames ?? "—"}`,
                  `${tx("players.profileView.labels.startingXi", language === "fr" ? "Titularisations" : "Starting XI")}: ${item.startingXIPercent ?? "—"}% • ${tx("players.profileView.labels.minutesPercent", language === "fr" ? "Minutes" : "Minutes")}: ${item.minutesPercent ?? "—"}%`,
                ]}
                sourceMeta={item.sourceMeta}
                statusActions={canEdit ? statusActions("performance-rows", item.id) : []}
              />
            ))
          )}
        </SectionCard>
      </Card3D>
    );
  };

  const renderHardware = () => {
    if (!profile) return null;

    return (
      <Card3D>
        <SectionCard
          title={tx("players.profileView.sections.hardware", "Hardware")}
          subtitle={tx(
            "players.profileView.subtitles.hardware",
            language === "fr" ? "Données GPS/bracelet synchronisées" : "GPS/wearable synchronized data",
          )}
        >
          {profile.emptyStateFlags.hardware ? (
            <EmptySection
              title={tx(
                "players.profileView.empty.hardwareTitle",
                language === "fr" ? "Aucune session synchronisée" : "No synced session",
              )}
              description={tx(
                "players.profileView.empty.hardwareBody",
                language === "fr"
                  ? "La section hardware reste visible pour activer la collecte device."
                  : "Hardware section stays visible until devices sync sessions.",
              )}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    label: tx("players.profileView.labels.sessions", language === "fr" ? "Sessions" : "Sessions"),
                    value: `${profile.hardware.totalSessions}`,
                    icon: Smartphone,
                  },
                  {
                    label: tx("players.profileView.labels.distance", language === "fr" ? "Distance" : "Distance"),
                    value: profile.hardware.totalDistanceKm != null ? `${profile.hardware.totalDistanceKm} km` : "—",
                    icon: Activity,
                  },
                  {
                    label: tx("players.profileView.labels.sprintDistance", language === "fr" ? "Sprint" : "Sprint"),
                    value: profile.hardware.sprintDistanceKm != null ? `${profile.hardware.sprintDistanceKm} km` : "—",
                    icon: Zap,
                  },
                  {
                    label: tx("players.profileView.labels.maxSpeed", language === "fr" ? "Vitesse max" : "Max speed"),
                    value: profile.hardware.maxSpeedKmh != null ? `${profile.hardware.maxSpeedKmh} km/h` : "—",
                    icon: Gauge,
                  },
                  {
                    label: tx("players.profileView.labels.lastSync", language === "fr" ? "Dernière sync" : "Last sync"),
                    value: toDateLabel(profile.hardware.lastSyncedAt, language),
                    icon: Calendar,
                  },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4">
                    <div className="flex items-center gap-2 text-arcane-grey text-xs uppercase tracking-wide mb-2">
                      <metric.icon className="h-4 w-4 text-arcane-accent" />
                      <span>{metric.label}</span>
                    </div>
                    <p className="text-base font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {profile.hardware.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4"
                  >
                    <p className="text-sm text-white font-semibold">
                      {(session.source ?? "—") + " • " + (session.type ?? "—")}
                    </p>
                    <p className="text-sm text-arcane-grey mt-1">
                      {toDateLabel(session.startedAt, language)} •{" "}
                      {session.movementDistanceM != null
                        ? `${(session.movementDistanceM / 1000).toFixed(2)} km`
                        : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </Card3D>
    );
  };

  const itemHeader = useCallback(
    (section: ProfileSectionKey, item: any) => {
      switch (section) {
        case "transfers":
          return {
            title: `${item.fromClubName ?? "—"} → ${item.toClubName ?? "—"}`,
            subtitle: `${item.season ?? "—"} • ${toDateLabel(item.transferDate, language)}`,
            details: [
              `${tx("players.profileView.labels.fee", language === "fr" ? "Montant" : "Fee")}: ${item.feeAmount ?? "—"} ${item.feeCurrency ?? ""}`.trim(),
              `${tx("players.profileView.labels.marketValue", language === "fr" ? "Valeur marché" : "Market value")}: ${toMoney(item.marketValueAtTime)}`,
              `${tx("players.profileView.labels.transferType", language === "fr" ? "Type" : "Type")}: ${item.transferType ?? "—"}`,
            ],
          };
        case "career":
          return {
            title: item.clubName ?? "—",
            subtitle: `${item.teamLevel ?? "—"} • ${toDateLabel(item.startDate, language)} → ${toDateLabel(item.endDate, language)}`,
            details: [`${tx("players.profileView.labels.loan", language === "fr" ? "Prêt" : "Loan")}: ${item.isLoan ? "Yes" : "No"}`],
          };
        case "achievements":
          return {
            title: item.title ?? "—",
            subtitle: `${item.competition ?? "—"} • ${item.season ?? "—"}`,
            details: [
              `${tx("players.profileView.labels.count", language === "fr" ? "Nombre" : "Count")}: ${item.count ?? "—"}`,
              item.description ?? "",
            ].filter(Boolean),
          };
        case "national-team":
          return {
            title: `${item.country ?? "—"} ${item.teamLevel ?? ""}`,
            subtitle: `${toDateLabel(item.fromDate, language)} → ${toDateLabel(item.toDate, language)}`,
            details: [
              `${tx("players.profileView.labels.caps", "Caps")}: ${item.caps ?? "—"}`,
              `${tx("players.profileView.labels.goals", "Goals")}: ${item.goals ?? "—"}`,
            ],
          };
        case "news":
          return {
            title: item.headline ?? "—",
            subtitle: toDateLabel(item.publishedAtSource, language),
            details: [item.summary ?? ""].filter(Boolean),
          };
        case "rumours":
          return {
            title: item.headline ?? "—",
            subtitle: `${item.destinationClub ?? "—"} • ${item.probabilityPercent ?? "—"}%`,
            details: [item.summary ?? ""].filter(Boolean),
          };
        case "performance-rows":
        default:
          return {
            title: `${item.competitionName ?? "—"} ${item.season ?? ""}`.trim(),
            subtitle: `${tx("players.profileView.labels.appearances", language === "fr" ? "Apparitions" : "Appearances")}: ${item.appearances ?? "—"} • ${tx("players.profileView.labels.goals", "Goals")}: ${item.goals ?? "—"} • ${tx("players.profileView.labels.assists", "Assists")}: ${item.assists ?? "—"}`,
            details: [],
          };
      }
    },
    [language, tx],
  );

  const renderGenericSection = () => {
    if (!profile) return null;
    const section = SECTION_BY_TAB[activeTab];
    if (!section) return null;

    return (
      <Card3D>
        <SectionCard
          title={toSectionTitle(section, language)}
          canEdit={canEdit}
          editLabel={tx("players.profileView.actions.edit", language === "fr" ? "Éditer" : "Edit")}
          onEdit={() => openEditor(section)}
        >
          {!sectionItems.length ? (
            <EmptySection
              title={tx(
                "players.profileView.empty.commonTitle",
                language === "fr" ? "Section vide" : "Empty section",
              )}
              description={tx(
                "players.profileView.empty.common",
                language === "fr" ? "Aucune donnée vérifiée" : "No verified data",
              )}
            />
          ) : (
            sectionItems.map((item: any) => {
              const { title, subtitle, details } = itemHeader(section, item);
              return (
                <SectionItem
                  key={item.id}
                  title={title}
                  subtitle={subtitle}
                  details={details}
                  sourceMeta={item.sourceMeta}
                  statusActions={canEdit ? statusActions(section, item.id) : []}
                />
              );
            })
          )}
        </SectionCard>
      </Card3D>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderIdentity();
      case "performance":
        return renderPerformance();
      case "scouting":
        return renderScouting();
      case "market":
        return renderMarket();
      case "hardware":
        return renderHardware();
      default:
        return renderGenericSection();
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10 p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 100px)" }}>
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
                <p className="text-arcane-grey">{tx("players.profileView.loading", language === "fr" ? "Chargement…" : "Loading…")}</p>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10 p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 100px)" }}>
              <Card3D>
                <GlassCard variant="elevated" className="p-10 text-center space-y-4">
                  <UserRound className="h-14 w-14 text-arcane-grey mx-auto" />
                  <p className="text-white text-lg font-semibold">{error || (language === "fr" ? "Profil introuvable" : "Profile not found")}</p>
                  <Button onClick={() => router.push("/players")}> 
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {language === "fr" ? "Retour joueurs" : "Back to players"}
                  </Button>
                </GlassCard>
              </Card3D>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          <div className="relative z-10">
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button variant="outline" size="sm" onClick={() => router.push("/players")}> 
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {language === "fr" ? "Retour" : "Back"}
                    </Button>
                    <div className="min-w-0">
                      <h1 className="text-2xl font-black text-white truncate">{profile.identity.fullName}</h1>
                      <p className="text-sm text-arcane-grey truncate">
                        {(profile.identity.positions.main ?? "—") + " • " + (profile.identity.club?.name ?? "—")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadProfile(true)}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                      {language === "fr" ? "Actualiser" : "Refresh"}
                    </Button>
                    <Link href={`/reports/new?playerId=${profile.playerId}`}>
                      <Button size="sm">
                        {language === "fr" ? "Nouveau rapport" : "New report"}
                      </Button>
                    </Link>
                  </div>
                </div>

                <Breadcrumb
                  items={[
                    { label: tx("players.topBar.title", language === "fr" ? "Joueurs" : "Players"), href: "/players" },
                    { label: profile.identity.fullName },
                  ]}
                />

                <div className="flex items-center gap-2 text-xs text-arcane-grey">
                  <ShieldCheck className="h-4 w-4 text-arcane-accent" />
                  <span>
                    {tx(
                      "players.profileView.labels.lastUpdated",
                      language === "fr" ? "Dernière mise à jour" : "Last updated",
                    )}
                    : {toDateLabel(profile.lastUpdatedAt, language)}
                  </span>
                  {canEdit ? (
                    <span className="rounded-full border border-arcane-accent/40 bg-arcane-accent/10 px-2 py-0.5 text-arcane-accent">
                      {language === "fr" ? "Mode admin" : "Admin mode"}
                    </span>
                  ) : null}
                </div>

                <PlayerTabs
                  active={activeTab}
                  items={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
                  onChange={(key) => setActiveTab(key as TabKey)}
                />
              </div>
            </div>

            <div className="p-6 space-y-6">{renderTabContent()}</div>
          </div>

          <ProfileEditorDrawer
            isOpen={editorOpen}
            title={tx(
              "players.profileView.editor.title",
              language === "fr" ? "Créer un élément (draft)" : "Create item (draft)",
            )}
            fields={EDITOR_FIELDS[editorSection]}
            values={editorValues}
            isSubmitting={savingEditor}
            submitLabel={tx("players.profileView.actions.saveDraft", "Save Draft")}
            cancelLabel={tx("common.actions.cancel", language === "fr" ? "Annuler" : "Cancel")}
            onClose={() => setEditorOpen(false)}
            onChange={(key, value) =>
              setEditorValues((prev) => ({
                ...prev,
                [key]: value,
              }))
            }
            onSubmit={saveDraft}
          />
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
