"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Euro,
  Search,
  Loader2,
  ChevronRight,
  Star,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";

interface Camp {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  location: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  capacity: number;
  availableSpots: number;
  ageMin?: number;
  ageMax?: number;
  price: number;
  currency: string;
  requiresPayment: boolean;
  requiredTier?: string;
  coverImage?: string;
  includedBenefits: string[];
  hasShowcaseGame: boolean;
  club?: {
    name: string;
    logo?: string;
  };
}

const campTypeLabels: Record<string, string> = {
  CAMP: "Camp",
  DETECTION: "Détection",
  SHOWCASE: "Showcase",
  TRAINING: "Stage",
};

const campTypeColors: Record<string, string> = {
  CAMP: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DETECTION: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  SHOWCASE: "bg-arcane-accent/20 text-arcane-accent border-arcane-accent/30",
  TRAINING: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function CampsPage() {
  const router = useRouter();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCamps = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        isPublic: true,
        upcoming: true,
        status: "PUBLISHED",
      };

      if (filterType !== "all") {
        params.type = filterType;
      }

      const data = await apiClient.getCamps(params);
      setCamps(data);
    } catch (error) {
      console.error("Error fetching camps:", error);
      toast.error("Erreur lors du chargement des camps");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const filteredCamps = camps.filter((camp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      camp.name.toLowerCase().includes(query) ||
      camp.city?.toLowerCase().includes(query) ||
      camp.description?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (camp: Camp) => {
    if (camp.availableSpots === 0) {
      return (
        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
          COMPLET
        </span>
      );
    }
    if (camp.availableSpots <= camp.capacity * 0.2) {
      return (
        <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
          PLACES LIMITÉES
        </span>
      );
    }
    return null;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} jour${days > 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
          <AnimatedBackground />
          <div className="text-center relative z-10">
            <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
            <p className="text-arcane-grey">Chargement des camps...</p>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-arcane-accent flex items-center justify-center">
              <Trophy className="h-6 w-6 text-arcane-dark" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tight">
            Camps & Stages
          </h1>
          <p className="text-arcane-grey text-lg max-w-2xl mx-auto">
            Participez à nos camps de formation, journées de détection et showcases
            organisés par des clubs professionnels
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                  <input
                    type="text"
                    placeholder="Rechercher un camp, une ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className={
                    filterType === "all"
                      ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                      : ""
                  }
                >
                  Tous
                </Button>
                <Button
                  variant={filterType === "CAMP" ? "default" : "outline"}
                  onClick={() => setFilterType("CAMP")}
                  className={
                    filterType === "CAMP"
                      ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                      : ""
                  }
                >
                  Camps
                </Button>
                <Button
                  variant={filterType === "DETECTION" ? "default" : "outline"}
                  onClick={() => setFilterType("DETECTION")}
                  className={
                    filterType === "DETECTION"
                      ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                      : ""
                  }
                >
                  Détection
                </Button>
                <Button
                  variant={filterType === "SHOWCASE" ? "default" : "outline"}
                  onClick={() => setFilterType("SHOWCASE")}
                  className={
                    filterType === "SHOWCASE"
                      ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                      : ""
                  }
                >
                  Showcase
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-arcane-grey">
            {filteredCamps.length} camp{filteredCamps.length > 1 ? "s" : ""} disponible
            {filteredCamps.length > 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Camps Grid */}
        {filteredCamps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-12 text-center">
              <Trophy className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Aucun camp disponible</h3>
              <p className="text-arcane-grey">
                Aucun camp ne correspond à vos critères de recherche.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCamps.map((camp, index) => (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard
                  variant="elevated"
                  className="h-full overflow-hidden cursor-pointer hover:border-arcane-accent/50 transition-all group"
                  onClick={() => router.push(`/camps/${camp.id}`)}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder overflow-hidden">
                    {camp.coverImage ? (
                      <Image
                        src={camp.coverImage}
                        alt={camp.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Trophy className="h-20 w-20 text-arcane-accent/20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          campTypeColors[camp.type] || campTypeColors.CAMP
                        }`}
                      >
                        {campTypeLabels[camp.type] || camp.type}
                      </span>
                      {getStatusBadge(camp)}
                    </div>
                    {camp.hasShowcaseGame && (
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 rounded-full bg-arcane-accent/90 backdrop-blur-sm flex items-center gap-1">
                          <Star className="h-3 w-3 text-arcane-dark" />
                          <span className="text-xs font-bold text-arcane-dark">SHOWCASE</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Club */}
                    {camp.club && (
                      <div className="flex items-center gap-2 mb-3">
                        {camp.club.logo && (
                          <Image
                            src={camp.club.logo}
                            alt={camp.club.name}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded object-cover"
                          />
                        )}
                        <span className="text-sm text-arcane-accent font-bold">
                          {camp.club.name}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-arcane-accent transition-colors">
                      {camp.name}
                    </h3>

                    {/* Description */}
                    {camp.description && (
                      <p className="text-sm text-arcane-grey mb-4 line-clamp-2">
                        {camp.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey">
                          {formatDate(camp.startDate)} - {formatDate(camp.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey">
                          {getDuration(camp.startDate, camp.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey">
                          {camp.city}, {camp.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey">
                          {camp.availableSpots} / {camp.capacity} places
                        </span>
                      </div>
                      {(camp.ageMin || camp.ageMax) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey">
                            {camp.ageMin && camp.ageMax
                              ? `${camp.ageMin}-${camp.ageMax} ans`
                              : camp.ageMin
                              ? `${camp.ageMin}+ ans`
                              : `Jusqu'à ${camp.ageMax} ans`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-arcane-darkBorder/50">
                      <div>
                        {camp.requiresPayment && camp.price > 0 ? (
                          <div className="flex items-center gap-1">
                            <Euro className="h-5 w-5 text-arcane-accent" />
                            <span className="text-2xl font-black text-white">{camp.price}</span>
                            <span className="text-sm text-arcane-grey">{camp.currency}</span>
                          </div>
                        ) : (
                          <span className="text-xl font-black text-arcane-accent">GRATUIT</span>
                        )}
                        {camp.requiredTier && (
                          <p className="text-xs text-arcane-grey mt-1">
                            Requis: {camp.requiredTier}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="border-arcane-accent text-arcane-accent hover:bg-arcane-accent hover:text-arcane-dark"
                      >
                        Voir détails
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </main>
    </MainLayout>
  );
}
