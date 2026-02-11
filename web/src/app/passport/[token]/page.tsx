"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import {
  Users, Trophy, MapPin, Calendar, Star, Ruler, Weight, Footprints,
  CheckCircle, XCircle, Clock, Shield
} from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

interface PassportData {
  id: string;
  playerId: string;
  status: string;
  publicToken: string;
  verifiedAt?: string;
  passportData: {
    firstName: string;
    lastName: string;
    position: string;
    nationality: string;
    dateOfBirth: string;
    height?: number;
    weight?: number;
    preferredFoot?: string;
    club?: { name: string; logo?: string };
    avatar?: string;
    averageRating?: number;
    totalReports?: number;
  };
  qrCodeUrl: string;
  createdAt: string;
}

export default function PublicPassportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const shareApiUrl =
        process.env.NEXT_PUBLIC_PUBLIC_SHARE_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
      const base = String(shareApiUrl ?? "").replace(/\/+$/, "");
      if (!base) throw new Error("Missing API URL");
      const path = base.includes("functions.supabase.co") ? "passport" : "passport/token";
      const response = await fetch(`${base}/${path}/${token}`);
      
      if (!response.ok) {
        throw new Error('Passport not found');
      }

      const data = await response.json();
      setPassport(data);
    } catch (err: any) {
      console.error('Error fetching passport:', err);
      setError(err.message || 'Failed to load passport');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'Verified' };
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Pending Verification' };
      case 'EXPIRED':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Expired' };
      case 'REVOKED':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Revoked' };
      default:
        return { icon: Shield, color: 'text-arcane-grey', bg: 'bg-arcane-grey/20', border: 'border-arcane-grey/30', label: status };
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
          <p className="text-arcane-grey">Loading passport...</p>
        </div>
      </main>
    );
  }

  if (error || !passport) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 max-w-md mx-auto p-6">
          <GlassCard variant="elevated" className="p-12 text-center">
            <Shield className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Passport Not Found</h3>
            <p className="text-arcane-grey">The requested player passport could not be found or has been revoked.</p>
          </GlassCard>
        </div>
      </main>
    );
  }

  const statusBadge = getStatusBadge(passport.status);
  const StatusIcon = statusBadge.icon;
  const age = getAge(passport.passportData.dateOfBirth);

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
            <h1 className="text-4xl font-black text-white mb-2">Player Passport</h1>
            <p className="text-arcane-grey">Official verified player identification</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard variant="elevated" className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}>
                  <StatusIcon className={`h-5 w-5 ${statusBadge.color}`} />
                  <span className={`font-bold text-sm ${statusBadge.color}`}>{statusBadge.label}</span>
                </div>
                {passport.verifiedAt && (
                  <span className="text-xs text-arcane-grey">
                    Verified {new Date(passport.verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="aspect-square bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-xl relative overflow-hidden mb-4">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-arcane-accent/10 via-transparent to-arcane-accent/5"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {passport.passportData.avatar ? (
                        <Image
                          src={passport.passportData.avatar}
                          alt={`${passport.passportData.firstName} ${passport.passportData.lastName}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-arcane-accent/10 flex items-center justify-center backdrop-blur-sm border border-arcane-accent/20">
                          <Users className="w-16 h-16 text-arcane-accent/50" />
                        </div>
                      )}
                    </div>
                    {passport.passportData.averageRating && passport.passportData.averageRating > 0 && (
                      <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-arcane-accent backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-[0_0_20px_rgba(228,255,59,0.5)]">
                        <span className="text-arcane-dark font-black text-lg">
                          {passport.passportData.averageRating}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/passport/${passport.publicToken}`}
                      size={180}
                      level="H"
                      fgColor="#080C1D"
                      bgColor="#FFFFFF"
                      includeMargin
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase mb-2">
                      {passport.passportData.firstName} {passport.passportData.lastName}
                    </h2>
                    <p className="text-arcane-accent uppercase text-sm tracking-widest font-bold">
                      {passport.passportData.position}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {passport.passportData.club && (
                      <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Current Club</span>
                        </div>
                        <span className="text-white font-bold">{passport.passportData.club.name}</span>
                      </div>
                    )}
                    <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey text-sm">Nationality</span>
                      </div>
                      <span className="text-white font-bold">{passport.passportData.nationality}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-arcane-accent" />
                        <span className="text-arcane-grey text-sm">Age</span>
                      </div>
                      <span className="text-white font-bold">{age} years</span>
                    </div>
                    {passport.passportData.height && (
                      <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Ruler className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Height</span>
                        </div>
                        <span className="text-white font-bold">{passport.passportData.height} cm</span>
                      </div>
                    )}
                    {passport.passportData.weight && (
                      <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Weight className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Weight</span>
                        </div>
                        <span className="text-white font-bold">{passport.passportData.weight} kg</span>
                      </div>
                    )}
                    {passport.passportData.preferredFoot && (
                      <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Footprints className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Preferred Foot</span>
                        </div>
                        <span className="text-white font-bold">{passport.passportData.preferredFoot}</span>
                      </div>
                    )}
                  </div>

                  {(passport.passportData.totalReports !== undefined && passport.passportData.totalReports > 0) && (
                    <div className="p-4 rounded-lg bg-arcane-accent/10 border border-arcane-accent/30">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-arcane-accent" />
                        <div>
                          <p className="text-white font-bold">{passport.passportData.totalReports} Scouting Reports</p>
                          <p className="text-arcane-grey text-sm">Professional evaluations on record</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-arcane-darkBorder/50">
                    <p className="text-xs text-arcane-grey text-center">
                      This passport is issued by ARCANE and certifies the identity and athletic profile of the player.
                      <br />
                      Passport ID: {passport.publicToken.substring(0, 8)}... | Issued: {new Date(passport.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <div className="text-center mt-8">
            <p className="text-arcane-grey text-sm">
              Powered by <span className="text-arcane-accent font-bold">ARCANE</span> Football Platform
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
