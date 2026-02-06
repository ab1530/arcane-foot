"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Trophy,
  Clock,
  Euro,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProtectedPage } from "@/components/guards/ProtectedPage";

interface Registration {
  id: string;
  status: string;
  hasPaid: boolean;
  paidAmount?: number;
  registeredAt: string;
  camp: {
    id: string;
    name: string;
    type: string;
    location: string;
    city: string;
    startDate: string;
    endDate: string;
    price: number;
    currency: string;
    coverImage?: string;
    club?: {
      name: string;
      logo?: string;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: {
    label: "En attente",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    icon: Clock,
  },
  REGISTERED: {
    label: "Inscrit",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: "Confirmé",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Terminé",
    color: "text-arcane-grey bg-arcane-grey/10 border-arcane-grey/30",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    icon: XCircle,
  },
  SELECTED: {
    label: "Sélectionné",
    color: "text-arcane-accent bg-arcane-accent/10 border-arcane-accent/30",
    icon: Trophy,
  },
};

const campTypeLabels: Record<string, string> = {
  CAMP: "Camp",
  DETECTION: "Détection",
  SHOWCASE: "Showcase",
  TRAINING: "Stage",
};

export default function MyCampsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Erreur lors du chargement de vos inscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string, campName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler votre inscription à "${campName}" ?`)) {
      return;
    }

    try {
      setCancelling(registrationId);
      await apiClient.cancelRegistration(registrationId);
      toast.success("Inscription annulée avec succès");
      fetchRegistrations(); // Refresh list
    } catch (error: any) {
      console.error("Error cancelling registration:", error);
      toast.error(error.message || "Erreur lors de l'annulation");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const groupedRegistrations = {
    upcoming: registrations.filter(
      (r) =>
        new Date(r.camp.startDate) > new Date() &&
        !["CANCELLED", "COMPLETED"].includes(r.status)
    ),
    past: registrations.filter(
      (r) =>
        new Date(r.camp.startDate) <= new Date() || ["COMPLETED"].includes(r.status)
    ),
    cancelled: registrations.filter((r) => r.status === "CANCELLED"),
  };

  if (loading) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10">
              <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
                <div className="px-6 py-4">
                  <Breadcrumb />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
                  <p className="text-arcane-grey">Chargement de vos inscriptions...</p>
                </div>
              </div>
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
            {/* Top Bar */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-arcane-accent" />
                      Mes Inscriptions
                    </h1>
                    <p className="text-sm text-arcane-grey">
                      Gérez vos inscriptions aux camps, stages et détections
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push("/camps")}
                  >
                    Découvrir les camps
                  </Button>
                </div>
                <Breadcrumb />
              </div>
            </div>

            <div className="p-6">

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arcane-grey mb-1">À venir</p>
                <p className="text-3xl font-black text-white">{groupedRegistrations.upcoming.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arcane-grey mb-1">Terminés</p>
                <p className="text-3xl font-black text-white">{groupedRegistrations.past.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-arcane-grey mb-1">Annulés</p>
                <p className="text-3xl font-black text-white">{groupedRegistrations.cancelled.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* No registrations */}
        {registrations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-12 text-center">
              <Trophy className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Aucune inscription</h3>
              <p className="text-arcane-grey mb-6">
                Vous n'êtes inscrit à aucun camp pour le moment
              </p>
              <Button
                onClick={() => router.push("/camps")}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
              >
                Découvrir les camps disponibles
              </Button>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            {/* Upcoming Camps */}
            {groupedRegistrations.upcoming.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wide">
                  Camps à venir ({groupedRegistrations.upcoming.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedRegistrations.upcoming.map((registration, index) => (
                    <motion.div
                      key={registration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <GlassCard variant="elevated" className="h-full overflow-hidden">
                        {/* Image */}
                        <div className="relative h-40 bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder">
                          {registration.camp.coverImage ? (
                            <Image
                              src={registration.camp.coverImage}
                              alt={registration.camp.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Trophy className="h-16 w-16 text-arcane-accent/20" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 rounded-full bg-arcane-accent/90 backdrop-blur-sm text-arcane-dark text-xs font-bold">
                              {campTypeLabels[registration.camp.type]}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            {statusConfig[registration.status] && (
                              <span
                                className={`px-3 py-1 rounded-full backdrop-blur-sm text-xs font-bold border flex items-center gap-1 ${
                                  statusConfig[registration.status].color
                                }`}
                              >
                                {React.createElement(statusConfig[registration.status].icon, {
                                  className: "h-3 w-3",
                                })}
                                {statusConfig[registration.status].label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Club */}
                          {registration.camp.club && (
                            <div className="flex items-center gap-2 mb-2">
                              {registration.camp.club.logo && (
                                <Image
                                  src={registration.camp.club.logo}
                                  alt={registration.camp.club.name}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4 rounded object-cover"
                                />
                              )}
                              <span className="text-xs text-arcane-accent font-bold">
                                {registration.camp.club.name}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="text-lg font-black text-white mb-3 line-clamp-2">
                            {registration.camp.name}
                          </h3>

                          {/* Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="h-3 w-3 text-arcane-accent flex-shrink-0" />
                              <span className="text-arcane-grey">
                                {formatDate(registration.camp.startDate)} -{" "}
                                {formatDate(registration.camp.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="h-3 w-3 text-arcane-accent flex-shrink-0" />
                              <span className="text-arcane-grey">
                                {registration.camp.city}
                              </span>
                            </div>
                            {registration.camp.price > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <Euro className="h-3 w-3 text-arcane-accent flex-shrink-0" />
                                <span className="text-arcane-grey">
                                  {registration.camp.price} {registration.camp.currency}
                                  {registration.hasPaid && (
                                    <span className="text-green-400 ml-1">(✓ Payé)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/camps/${registration.camp.id}`)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Détails
                            </Button>
                            {["PENDING", "REGISTERED"].includes(registration.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCancelRegistration(
                                    registration.id,
                                    registration.camp.name
                                  )
                                }
                                disabled={cancelling === registration.id}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                {cancelling === registration.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Camps */}
            {groupedRegistrations.past.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wide opacity-70">
                  Camps passés ({groupedRegistrations.past.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedRegistrations.past.map((registration, index) => (
                    <motion.div
                      key={registration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <GlassCard className="h-full opacity-75 hover:opacity-100 transition-opacity">
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <span className="text-xs text-arcane-accent font-bold mb-1 block">
                                {campTypeLabels[registration.camp.type]}
                              </span>
                              <h3 className="text-lg font-black text-white line-clamp-2">
                                {registration.camp.name}
                              </h3>
                            </div>
                            {statusConfig[registration.status] && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                  statusConfig[registration.status].color
                                }`}
                              >
                                {statusConfig[registration.status].label}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-xs text-arcane-grey">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(registration.camp.startDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {registration.camp.city}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
