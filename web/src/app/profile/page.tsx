"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  MapPin,
  Calendar,
  Crown,
  Settings,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  Edit2,
  Save,
  X,
  Camera,
  Briefcase,
  Globe,
  Award,
  TrendingUp,
  FileText,
  Trophy,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  organization?: string;
  role?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { subscription, getTierName, loading: subLoading } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    organization: "",
    role: "",
    website: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCurrentUser();
      setProfile(response);
      setFormData({
        fullName: response.fullName || "",
        firstName: response.firstName || "",
        lastName: response.lastName || "",
        phone: response.phone || "",
        location: response.location || "",
        organization: response.organization || "",
        role: response.role || "",
        website: response.website || "",
        bio: response.bio || "",
      });
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      toast.error("Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiClient.updateProfile(formData);
      toast.success("Profil mis à jour avec succès");
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        location: profile.location || "",
        organization: profile.organization || "",
        role: profile.role || "",
        website: profile.website || "",
        bio: profile.bio || "",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("arcane_auth_token");
    router.push("/");
    toast.success("Déconnexion réussie");
  };

  const stats = [
    { label: "Rapports créés", value: 24, icon: FileText, color: "text-purple-400" },
    { label: "Joueurs suivis", value: 156, icon: Target, color: "text-blue-400" },
    { label: "Camps participés", value: 8, icon: Trophy, color: "text-arcane-accent" },
    { label: "Jours d'activité", value: 127, icon: TrendingUp, color: "text-green-400" },
  ];

  const settingsSections = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Gérer vos préférences de notifications",
      href: "/settings/notifications",
    },
    {
      icon: Shield,
      title: "Sécurité",
      description: "Mot de passe et authentification",
      href: "/settings/security",
    },
    {
      icon: CreditCard,
      title: "Facturation",
      description: "Méthodes de paiement et factures",
      href: "/settings/billing",
    },
    {
      icon: Settings,
      title: "Préférences",
      description: "Personnaliser votre expérience",
      href: "/settings/preferences",
    },
  ];

  if (loading || subLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-arcane-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-arcane-grey">Chargement du profil...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
              Mon Profil
            </h1>
            <p className="text-arcane-grey">Gérez vos informations personnelles</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <GlassCard variant="elevated" className="p-6">
                {/* Avatar */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-arcane-accent to-yellow-600 flex items-center justify-center text-4xl font-black text-arcane-dark mx-auto mb-4">
                      {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-arcane-accent flex items-center justify-center hover:bg-arcane-accent/80 transition-colors">
                      <Camera className="h-5 w-5 text-arcane-dark" />
                    </button>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {profile?.fullName}
                  </h2>
                  <p className="text-arcane-grey text-sm mb-4">{profile?.email}</p>

                  {subscription && (
                    <Link href="/pricing">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-arcane-accent/20 border border-arcane-accent/30 hover:bg-arcane-accent/30 transition-all cursor-pointer">
                        <Crown className="h-4 w-4 text-arcane-accent" />
                        <span className="text-sm font-bold text-arcane-accent">
                          Plan {getTierName(subscription.tier)}
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-3 border-t border-arcane-darkBorder pt-6">
                  {profile?.organization && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-arcane-accent" />
                      <span className="text-arcane-grey">{profile.organization}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-arcane-accent" />
                      <span className="text-arcane-grey">{profile.location}</span>
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-arcane-accent" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-arcane-accent hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-arcane-accent" />
                    <span className="text-arcane-grey">
                      Membre depuis{" "}
                      {new Date(profile?.createdAt || "").toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full mt-6 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </GlassCard>

              {/* Stats */}
              <GlassCard variant="elevated" className="p-6 mt-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-arcane-accent" />
                  Statistiques
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="text-center p-3 rounded-lg bg-arcane-darkBorder/30"
                      >
                        <Icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-xs text-arcane-grey">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* Profile Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard variant="elevated" className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    Informations Personnelles
                  </h2>
                  {!editing ? (
                    <Button onClick={() => setEditing(true)} size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="h-4 w-4 border-2 border-arcane-dark border-t-transparent rounded-full animate-spin mr-2" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Nom complet
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.fullName || "-"}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
                      <Mail className="h-4 w-4 text-arcane-accent" />
                      <span className="text-white">{profile?.email}</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Téléphone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        placeholder="+33 6 12 34 56 78"
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.phone || "-"}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Localisation
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        placeholder="Paris, France"
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.location || "-"}
                      </p>
                    )}
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Organisation
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({ ...formData, organization: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        placeholder="Nom du club / agence"
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.organization || "-"}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Rôle
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        placeholder="Scout, Coach, Agent..."
                      />
                    ) : (
                      <p className="text-white px-4 py-3">{profile?.role || "-"}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Site Web
                    </label>
                    {editing ? (
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        placeholder="https://example.com"
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.website || "-"}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-arcane-grey mb-2">
                      Bio
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none resize-none"
                        placeholder="Parlez-nous de vous..."
                      />
                    ) : (
                      <p className="text-white px-4 py-3">
                        {profile?.bio || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Settings Sections */}
              <GlassCard variant="elevated" className="p-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">
                  Paramètres
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Link key={section.title} href={section.href}>
                        <div className="p-4 rounded-lg border border-arcane-darkBorder bg-arcane-darkBorder/30 hover:border-arcane-accent/50 hover:bg-arcane-accent/5 transition-all cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-arcane-accent" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold mb-1">
                                {section.title}
                              </h3>
                              <p className="text-xs text-arcane-grey">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
