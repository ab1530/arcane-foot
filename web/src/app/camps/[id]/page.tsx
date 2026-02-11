"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Euro,
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Modal } from "@/components/ui/modal";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";

interface Camp {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  location: string;
  address?: string;
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
  programDetails?: string;
  includedBenefits: string[];
  partnerClubs: string[];
  hasShowcaseGame: boolean;
  showcaseDate?: string;
  coverImage?: string;
  images: string[];
  club?: {
    id: string;
    name: string;
    logo?: string;
    city?: string;
  };
}

const campTypeLabels: Record<string, string> = {
  CAMP: "Camp de Formation",
  DETECTION: "Journée de Détection",
  SHOWCASE: "Match Showcase",
  TRAINING: "Stage d'Entraînement",
};

export default function CampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campId = params?.id as string;

  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Registration form state
  const [playerAge, setPlayerAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [medicalWaiver, setMedicalWaiver] = useState(false);
  const [notes, setNotes] = useState("");

  const fetchCamp = useCallback(async () => {
    if (!campId) return;
    try {
      setLoading(true);
      const data = await apiClient.getCamp(campId);
      setCamp(data);
    } catch (error) {
      console.error("Error fetching camp:", error);
      toast.error("Erreur lors du chargement du camp");
      router.push("/camps");
    } finally {
      setLoading(false);
    }
  }, [campId, router]);

  useEffect(() => {
    fetchCamp();
  }, [fetchCamp]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get current user and player
    try {
      setRegistering(true);

      // Validate age if required
      if (camp?.ageMin || camp?.ageMax) {
        const age = parseInt(playerAge);
        if (isNaN(age)) {
          toast.error("Veuillez entrer un âge valide");
          return;
        }
        if (camp.ageMin && age < camp.ageMin) {
          toast.error(`L'âge minimum pour ce camp est ${camp.ageMin} ans`);
          return;
        }
        if (camp.ageMax && age > camp.ageMax) {
          toast.error(`L'âge maximum pour ce camp est ${camp.ageMax} ans`);
          return;
        }
      }

      // Check parental consent for minors
      const age = parseInt(playerAge);
      if (age < 18) {
        if (!parentalConsent) {
          toast.error("Le consentement parental est requis pour les mineurs");
          return;
        }
        if (!parentName || !parentEmail || !parentPhone) {
          toast.error("Les informations du parent sont requises pour les mineurs");
          return;
        }
      }

      // Check medical waiver
      if (!medicalWaiver) {
        toast.error("Vous devez accepter la décharge médicale");
        return;
      }

      // Get current user's player ID (this should come from auth context)
      const user = await apiClient.getCurrentUser();
      if (!user?.user?.player?.id) {
        toast.error("Profil joueur introuvable. Veuillez créer un profil joueur d'abord.");
        return;
      }

      const registrationData = {
        playerId: user.user.player.id,
        parentalConsentGiven: age < 18 ? parentalConsent : undefined,
        parentName: age < 18 ? parentName : undefined,
        parentEmail: age < 18 ? parentEmail : undefined,
        parentPhone: age < 18 ? parentPhone : undefined,
        medicalWaiverSigned: medicalWaiver,
        medicalConditions: medicalConditions || undefined,
        emergencyContact,
        emergencyPhone,
        notes: notes || undefined,
      };

      const result = await apiClient.registerForCamp(campId, registrationData);

      // If payment is required, redirect to Stripe (paymentIntentId in result)
      if (camp?.requiresPayment && camp.price > 0 && result.paymentIntentId) {
        toast.success("Redirection vers le paiement...");
        // In a real app, you would redirect to Stripe Checkout or Elements
        // For now, just show success
        toast.success("Inscription créée! Paiement requis.");
      } else {
        toast.success("Inscription réussie!");
      }

      setShowRegistrationModal(false);
      router.push("/my-camps");
    } catch (error: any) {
      console.error("Error registering:", error);
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  if (loading) {
    return (
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
          <AnimatedBackground />
          <div className="text-center relative z-10">
            <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
            <p className="text-arcane-grey">Chargement...</p>
          </div>
        </main>
      </MainLayout>
    );
  }

  if (!camp) {
    return (
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
          <AnimatedBackground />
          <div className="relative z-10">
            <GlassCard className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Camp introuvable</h2>
              <Button onClick={() => router.push("/camps")} variant="outline" className="mt-4">
                Retour aux camps
              </Button>
            </GlassCard>
          </div>
        </main>
      </MainLayout>
    );
  }

  const duration = getDuration(camp.startDate, camp.endDate);
  const isAvailable = camp.availableSpots > 0 && camp.status === "PUBLISHED";

  return (
    <MainLayout>
      <main className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            onClick={() => router.push("/camps")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux camps
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard variant="elevated" className="overflow-hidden">
                <div className="relative h-96 bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder">
                  {camp.coverImage ? (
                    <Image
                      src={camp.coverImage}
                      alt={camp.name}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="h-32 w-32 text-arcane-accent/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-4 py-2 rounded-full bg-arcane-accent backdrop-blur-sm text-arcane-dark text-sm font-bold">
                      {campTypeLabels[camp.type] || camp.type}
                    </span>
                    {camp.hasShowcaseGame && (
                      <span className="px-4 py-2 rounded-full bg-purple-500 backdrop-blur-sm text-white text-sm font-bold flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        SHOWCASE
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Title & Club */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6">
                {camp.club && (
                  <div className="flex items-center gap-3 mb-4">
                    {camp.club.logo && (
                      <Image
                        src={camp.club.logo}
                        alt={camp.club.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm text-arcane-grey">Organisé par</p>
                      <p className="text-lg font-bold text-arcane-accent">{camp.club.name}</p>
                    </div>
                  </div>
                )}
                <h1 className="text-4xl font-black text-white mb-2">{camp.name}</h1>
                {camp.description && (
                  <p className="text-arcane-grey leading-relaxed">{camp.description}</p>
                )}
              </GlassCard>
            </motion.div>

            {/* Program Details */}
            {camp.programDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-arcane-accent" />
                    Programme
                  </h3>
                  <p className="text-arcane-grey leading-relaxed whitespace-pre-wrap">
                    {camp.programDetails}
                  </p>
                </GlassCard>
              </motion.div>
            )}

            {/* Benefits */}
            {camp.includedBenefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-arcane-accent" />
                    Inclus
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {camp.includedBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-arcane-grey">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Partner Clubs */}
            {camp.partnerClubs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-arcane-accent" />
                    Clubs Partenaires
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {camp.partnerClubs.map((club, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-arcane-darkBorder/50 text-white text-sm border border-arcane-darkBorder"
                      >
                        {club}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard variant="elevated" className="p-6 sticky top-6">
                {/* Price */}
                <div className="text-center mb-6">
                  {camp.requiresPayment && camp.price > 0 ? (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Euro className="h-8 w-8 text-arcane-accent" />
                        <span className="text-5xl font-black text-white">{camp.price}</span>
                        <span className="text-xl text-arcane-grey">{camp.currency}</span>
                      </div>
                      <p className="text-sm text-arcane-grey">par participant</p>
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-arcane-accent">GRATUIT</div>
                  )}
                </div>

                {/* Info List */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-arcane-darkBorder/30">
                    <Calendar className="h-5 w-5 text-arcane-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-arcane-grey mb-1">Dates</p>
                      <p className="text-sm font-bold text-white">
                        {formatDate(camp.startDate)}
                      </p>
                      <p className="text-sm font-bold text-white">au {formatDate(camp.endDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-arcane-darkBorder/30">
                    <Clock className="h-5 w-5 text-arcane-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-arcane-grey mb-1">Durée</p>
                      <p className="text-sm font-bold text-white">
                        {duration} jour{duration > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-arcane-darkBorder/30">
                    <MapPin className="h-5 w-5 text-arcane-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-arcane-grey mb-1">Lieu</p>
                      <p className="text-sm font-bold text-white">{camp.location}</p>
                      {camp.address && (
                        <p className="text-xs text-arcane-grey mt-1">{camp.address}</p>
                      )}
                      <p className="text-xs text-arcane-grey">
                        {camp.city}, {camp.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-arcane-darkBorder/30">
                    <Users className="h-5 w-5 text-arcane-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-arcane-grey mb-1">Places disponibles</p>
                      <p className="text-sm font-bold text-white">
                        {camp.availableSpots} / {camp.capacity}
                      </p>
                    </div>
                  </div>

                  {(camp.ageMin || camp.ageMax) && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-arcane-darkBorder/30">
                      <Target className="h-5 w-5 text-arcane-accent flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-arcane-grey mb-1">Âge</p>
                        <p className="text-sm font-bold text-white">
                          {camp.ageMin && camp.ageMax
                            ? `${camp.ageMin} - ${camp.ageMax} ans`
                            : camp.ageMin
                            ? `${camp.ageMin}+ ans`
                            : `Jusqu'à ${camp.ageMax} ans`}
                        </p>
                      </div>
                    </div>
                  )}

                  {camp.requiredTier && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Shield className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-purple-400 mb-1">Abonnement requis</p>
                        <p className="text-sm font-bold text-white">{camp.requiredTier}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isAvailable ? (
                  <Button
                    onClick={() => setShowRegistrationModal(true)}
                    className="w-full bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 font-bold text-lg py-6"
                  >
                    S'inscrire maintenant
                  </Button>
                ) : (
                  <Button disabled className="w-full" variant="outline">
                    {camp.availableSpots === 0 ? "Complet" : "Inscriptions fermées"}
                  </Button>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </div>
        </div>

        {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Inscription au camp"
        size="xl"
      >
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Age */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Âge du participant *
            </label>
            <input
              type="number"
              required
              min={camp.ageMin || 5}
              max={camp.ageMax || 99}
              value={playerAge}
              onChange={(e) => setPlayerAge(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20"
              placeholder="Ex: 16"
            />
          </div>

          {/* Parental Info (if minor) */}
          {parseInt(playerAge) < 18 && playerAge !== "" && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Informations du parent/tuteur (requis pour les mineurs)
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Nom complet du parent *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white text-sm focus:border-orange-500 focus:outline-none"
                    placeholder="Nom et prénom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white text-sm focus:border-orange-500 focus:outline-none"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white text-sm focus:border-orange-500 focus:outline-none"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Contact d'urgence *
              </label>
              <input
                type="text"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Téléphone d'urgence *
              </label>
              <input
                type="tel"
                required
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Conditions médicales particulières
            </label>
            <textarea
              rows={3}
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none resize-none"
              placeholder="Allergies, asthme, traitement en cours, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Notes additionnelles
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none resize-none"
              placeholder="Informations supplémentaires..."
            />
          </div>

          {/* Consents */}
          <div className="space-y-3 p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder">
            {parseInt(playerAge) < 18 && playerAge !== "" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={parentalConsent}
                  onChange={(e) => setParentalConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-arcane-darkBorder bg-arcane-dark text-arcane-accent focus:ring-arcane-accent"
                />
                <span className="text-sm text-white">
                  J'autorise mon enfant à participer à ce camp et je certifie être son
                  représentant légal *
                </span>
              </label>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={medicalWaiver}
                onChange={(e) => setMedicalWaiver(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-arcane-darkBorder bg-arcane-dark text-arcane-accent focus:ring-arcane-accent"
              />
              <span className="text-sm text-white">
                J'accepte la décharge médicale et dégage les organisateurs de toute
                responsabilité en cas d'accident *
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-arcane-darkBorder">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRegistrationModal(false)}
              disabled={registering}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={registering}
              className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
            >
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : camp.requiresPayment && camp.price > 0 ? (
                <>
                  Continuer vers le paiement ({camp.price} {camp.currency})
                </>
              ) : (
                "Confirmer l'inscription"
              )}
            </Button>
          </div>
        </form>
      </Modal>
      </main>
    </MainLayout>
  );
}
