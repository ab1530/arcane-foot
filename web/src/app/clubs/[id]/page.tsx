"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  MapPin,
  Globe,
  Calendar,
  Users,
  Edit,
  ArrowLeft,
  Building2,
  Shield,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  country: string;
  city?: string;
  stadium?: string;
  founded?: number;
  website?: string;
  players: any[];
  homeMatches: any[];
  awayMatches: any[];
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params?.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClub = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const response = await apiClient.getClub(clubId);
      setClub(response);
    } catch (error) {
      console.error("Error fetching club:", error);
      toast.error("Erreur lors du chargement du club");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10">
              <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
                <div className="px-6 py-4">
                  <Breadcrumb items={[{ label: "Clubs", href: "/clubs" }, { label: "Loading..." }]} />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
                  <p className="text-arcane-grey">Loading club...</p>
                </div>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!club) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10">
              <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
                <div className="px-6 py-4">
                  <Breadcrumb items={[{ label: "Clubs", href: "/clubs" }, { label: "Not Found" }]} />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <Card3D>
                  <GlassCard variant="elevated" className="p-12 text-center">
                    <Building2 className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Club not found</h3>
                    <p className="text-arcane-grey mb-6">The requested club could not be found</p>
                    <Button onClick={() => router.push("/clubs")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Clubs
                    </Button>
                  </GlassCard>
                </Card3D>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const players = club.players || [];
  const allMatches = [...(club.homeMatches || []), ...(club.awayMatches || [])];
  const totalMatches = allMatches.length;

  return (
    <ProtectedRoute>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          <div className="relative z-10">
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.push("/clubs")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h1 className="text-2xl font-black text-white">
                        {club.name}
                      </h1>
                      <p className="text-sm text-arcane-grey">
                        {club.city && club.country ? `${club.city}, ${club.country}` : club.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Club
                    </Button>
                  </div>
                </div>
                <Breadcrumb items={[
                  { label: "Clubs", href: "/clubs" },
                  { label: club.name }
                ]} />
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card3D>
                  <GlassCard variant="elevated" className="p-6">
                    <div className="aspect-square bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-xl mb-6 relative overflow-hidden">
                      <motion.div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/10 via-transparent to-arcane-accent/5" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {club.logo ? (
                          <Image
                            src={club.logo}
                            alt={club.name}
                            width={160}
                            height={160}
                            className="w-40 h-40 object-contain"
                          />
                        ) : (
                          <div className="w-40 h-40 rounded-full bg-arcane-accent/10 flex items-center justify-center backdrop-blur-sm border border-arcane-accent/20">
                            <Shield className="w-20 h-20 text-arcane-accent/50" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase mb-2">{club.name}</h2>
                        {club.shortName && (
                          <p className="text-arcane-accent uppercase text-sm tracking-widest font-bold">{club.shortName}</p>
                        )}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-arcane-darkBorder/50">
                        {club.stadium && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-arcane-accent" />
                              <span className="text-arcane-grey text-sm">Stadium</span>
                            </div>
                            <span className="text-white font-bold text-sm">{club.stadium}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-arcane-accent" />
                            <span className="text-arcane-grey text-sm">Location</span>
                          </div>
                          <span className="text-white font-bold text-sm">
                            {club.city ? `${club.city}, ${club.country}` : club.country}
                          </span>
                        </div>
                        {club.founded && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-arcane-accent" />
                              <span className="text-arcane-grey text-sm">Founded</span>
                            </div>
                            <span className="text-white font-bold text-sm">{club.founded}</span>
                          </div>
                        )}
                        {club.website && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-arcane-accent" />
                              <span className="text-arcane-grey text-sm">Website</span>
                            </div>
                            <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-arcane-accent hover:text-arcane-accent/80 font-bold text-sm transition-colors">
                              Visit
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </Card3D>

                <div className="lg:col-span-2 space-y-6">
                  <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Players", value: players.length, icon: Users, color: "text-arcane-accent" },
                      { label: "Matches", value: totalMatches, icon: Trophy, color: "text-blue-400" },
                    ].map((stat, index) => (
                      <motion.div key={index} variants={staggerItem}>
                        <Card3D>
                          <GlassCard variant="elevated" glowOnHover className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <stat.icon className={`h-8 w-8 ${stat.color}`} />
                            </div>
                            <div className="text-4xl font-black mb-2">
                              <NeonText>
                                <AnimatedCounter to={stat.value} duration={1.5} />
                              </NeonText>
                            </div>
                            <div className="text-sm text-arcane-grey uppercase tracking-wider">{stat.label}</div>
                          </GlassCard>
                        </Card3D>
                      </motion.div>
                    ))}
                  </motion.div>

                  <Card3D>
                    <GlassCard variant="elevated" className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
                          <Users className="h-6 w-6 text-arcane-accent" />
                          Players
                        </h3>
                      </div>

                      {players.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                          <h4 className="text-lg font-bold text-white mb-2">No players</h4>
                          <p className="text-arcane-grey">No players are currently registered with this club</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {players.map((player) => (
                            <Link key={player.id} href={`/players/${player.id}`}>
                              <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50 hover:bg-arcane-darkBorder/30 hover:border-arcane-accent/30 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center border border-arcane-accent/30">
                                    <Users className="h-6 w-6 text-arcane-accent/70" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white font-bold group-hover:text-arcane-accent transition-colors">
                                      {player.user?.firstName} {player.user?.lastName}
                                    </p>
                                    <p className="text-sm text-arcane-grey">{player.position}</p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </Card3D>
                </div>
              </div>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedRoute>
  );
}
