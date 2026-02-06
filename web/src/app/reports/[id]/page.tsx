"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { AnimatedBackground } from "@/components/ui/animated-background";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Shield,
  Brain,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  FileText,
  Trophy,
  Loader2,
  Send,
  ThumbsUp,
  ThumbsDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Star } from "lucide-react";

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  position?: string;
  nationality?: string;
  dateOfBirth?: string;
  club?: {
    name: string;
    logo?: string;
  };
}

interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Match {
  id: string;
  scheduledAt: string;
  homeClub: {
    name: string;
    shortName?: string;
    logo?: string;
  };
  awayClub: {
    name: string;
    shortName?: string;
    logo?: string;
  };
  venueOld?: string;
  competitionOld?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
}

interface Report {
  id: string;
  status: string;
  overallRating?: number;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  recommendationNotes?: string;
  tags?: string[];
  player: Player;
  scout: Scout;
  match: Match;
  createdAt: string;
  updatedAt: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Edit form state
  const [editOverallRating, setEditOverallRating] = useState(50);
  const [editTechnicalRating, setEditTechnicalRating] = useState(50);
  const [editPhysicalRating, setEditPhysicalRating] = useState(50);
  const [editMentalRating, setEditMentalRating] = useState(50);
  const [editTacticalRating, setEditTacticalRating] = useState(50);
  const [editSummary, setEditSummary] = useState("");
  const [editStrengths, setEditStrengths] = useState("");
  const [editWeaknesses, setEditWeaknesses] = useState("");
  const [editRecommendation, setEditRecommendation] = useState("");
  const [editRecommendationNotes, setEditRecommendationNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  const fetchReport = useCallback(async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      const data = await apiClient.getScoutingReport(reportId);
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Erreur lors du chargement du rapport");
      router.push("/reports");
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) return;

    try {
      setDeleting(true);
      await apiClient.deleteScoutingReport(reportId);
      toast.success("Rapport supprimé avec succès");
      router.push("/reports");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erreur lors de la suppression du rapport");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!report) return;

    // Pre-fill form with current values
    setEditOverallRating(report.overallRating || 50);
    setEditTechnicalRating(report.technicalRating || 50);
    setEditPhysicalRating(report.physicalRating || 50);
    setEditMentalRating(report.mentalRating || 50);
    setEditTacticalRating(report.tacticalRating || 50);
    setEditSummary(report.summary || "");
    setEditStrengths(report.strengths || "");
    setEditWeaknesses(report.weaknesses || "");
    setEditRecommendation(report.recommendation || "");
    setEditRecommendationNotes(report.recommendationNotes || "");
    setEditTags(report.tags?.join(", ") || "");

    setShowEditModal(true);
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);

      const data = {
        overallRating: editOverallRating || undefined,
        technicalRating: editTechnicalRating || undefined,
        physicalRating: editPhysicalRating || undefined,
        mentalRating: editMentalRating || undefined,
        tacticalRating: editTacticalRating || undefined,
        summary: editSummary || undefined,
        strengths: editStrengths || undefined,
        weaknesses: editWeaknesses || undefined,
        recommendation: editRecommendation || undefined,
        recommendationNotes: editRecommendationNotes || undefined,
        tags: editTags ? editTags.split(",").map((t) => t.trim()) : undefined,
      };

      await apiClient.updateScoutingReport(reportId, data);

      toast.success("Rapport mis à jour avec succès");
      setShowEditModal(false);
      fetchReport(); // Refresh the report data
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error("Erreur lors de la mise à jour du rapport", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir soumettre ce rapport ? Il sera envoyé pour approbation."
      )
    )
      return;

    try {
      setSubmitting(true);
      await apiClient.submitScoutingReport(reportId);
      toast.success("Rapport soumis avec succès");
      fetchReport(); // Refresh to show new status
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Erreur lors de la soumission du rapport", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = (action: "approve" | "reject") => {
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewModal(true);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewAction) return;

    try {
      if (reviewAction === "approve") {
        setApproving(true);
      } else {
        setRejecting(true);
      }

      await apiClient.reviewScoutingReport(reportId, reviewAction === "approve");

      toast.success(
        reviewAction === "approve"
          ? "Rapport approuvé avec succès"
          : "Rapport rejeté"
      );
      setShowReviewModal(false);
      setReviewNotes("");
      fetchReport(); // Refresh to show new status
    } catch (error: any) {
      console.error("Error reviewing report:", error);
      toast.error("Erreur lors de la révision du rapport", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);

      const token = localStorage.getItem("arcane_auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scouting-reports/${reportId}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF téléchargé avec succès");
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast.error("Erreur lors du téléchargement du PDF", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      DRAFT: {
        label: "Brouillon",
        color: "text-gray-400",
        bg: "bg-gray-400/10",
        border: "border-gray-400/30",
        icon: FileText,
      },
      SUBMITTED: {
        label: "En Revue",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/30",
        icon: Clock,
      },
      APPROVED: {
        label: "Approuvé",
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/30",
        icon: CheckCircle2,
      },
      REJECTED: {
        label: "Rejeté",
        color: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/30",
        icon: AlertCircle,
      },
    };
    return configs[status as keyof typeof configs] || configs.DRAFT;
  };

  const getRecommendationConfig = (recommendation?: string) => {
    const configs = {
      BUY_NOW: {
        label: "Acheter Maintenant",
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/30",
      },
      MONITOR: {
        label: "Suivre",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/30",
      },
      FOLLOW_UP: {
        label: "Revoir Plus Tard",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/30",
      },
      NOT_INTERESTED: {
        label: "Pas Intéressé",
        color: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/30",
      },
      NEEDS_MORE_DATA: {
        label: "Plus de Données",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/30",
      },
    };
    return (
      configs[recommendation as keyof typeof configs] || {
        label: "Non Défini",
        color: "text-gray-400",
        bg: "bg-gray-400/10",
        border: "border-gray-400/30",
      }
    );
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-arcane-grey";
    if (rating >= 80) return "text-green-500";
    if (rating >= 60) return "text-yellow-500";
    if (rating >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getRatingLabel = (rating?: number) => {
    if (!rating) return "N/A";
    if (rating >= 90) return "Exceptionnel";
    if (rating >= 80) return "Excellent";
    if (rating >= 70) return "Très Bon";
    if (rating >= 60) return "Bon";
    if (rating >= 50) return "Moyen";
    if (rating >= 40) return "Passable";
    return "Faible";
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
                  <Loader2 className="h-12 w-12 text-arcane-accent animate-spin mx-auto mb-4" />
                  <p className="text-arcane-grey">Chargement du rapport...</p>
                </div>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  if (!report) {
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
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Rapport introuvable</h2>
                  <Button onClick={() => router.push("/reports")} variant="outline">
                    Retour aux Rapports
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  const statusConfig = getStatusConfig(report.status);
  const StatusIcon = statusConfig.icon;
  const recommendationConfig = getRecommendationConfig(report.recommendation);

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
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/reports")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                    <div>
                      <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <FileText className="h-6 w-6 text-arcane-accent" />
                        Rapport de Scouting
                      </h1>
                      <p className="text-sm text-arcane-grey">
                        Créé le {new Date(report.createdAt).toLocaleDateString("fr-FR")} • Modifié le {new Date(report.updatedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
            {report.status === "DRAFT" && (
              <>
                <Button variant="outline" onClick={handleOpenEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="border-arcane-accent bg-arcane-accent/10 text-arcane-accent hover:bg-arcane-accent/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Soumission...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Soumettre
                    </>
                  )}
                </Button>
              </>
            )}
            {report.status === "SUBMITTED" && (
              <>
                <Button
                  onClick={() => handleOpenReview("reject")}
                  disabled={rejecting || approving}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {rejecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rejet...
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rejeter
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleOpenReview("approve")}
                  disabled={approving || rejecting}
                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approbation...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approuver
                    </>
                  )}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="border-arcane-accent/30 text-arcane-accent hover:bg-arcane-accent/10"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
                </div>
                <Breadcrumb />
              </div>
            </div>

            <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-arcane-accent/5 rounded-full blur-3xl" />

            <div className="relative flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                <span className="text-arcane-dark font-black text-3xl">
                  {report.player.user.firstName[0]}
                  {report.player.user.lastName[0]}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">
                      {report.player.user.firstName} {report.player.user.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {report.player.position && (
                        <span className="px-3 py-1 rounded-full bg-arcane-accent/20 text-arcane-accent text-sm font-bold">
                          {report.player.position}
                        </span>
                      )}
                      {report.player.club && (
                        <span className="px-3 py-1 rounded-full bg-arcane-darkBorder/50 text-white text-sm font-bold">
                          {report.player.club.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-lg border ${statusConfig.bg} ${statusConfig.border} flex items-center gap-2`}
                  >
                    <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                    <span className={`font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {report.player.nationality && (
                  <p className="text-arcane-grey">
                    Nationalité: {report.player.nationality}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Overall Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-arcane-accent/5 rounded-full blur-3xl" />

            <div className="relative text-center">
              <p className="text-sm font-bold text-arcane-grey uppercase tracking-wider mb-4">
                Note Globale
              </p>
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`text-8xl font-black ${getRatingColor(
                    report.overallRating
                  )}`}
                >
                  {report.overallRating || "N/A"}
                </div>
                <div className="text-left">
                  <div className="text-4xl font-bold text-arcane-grey">/100</div>
                  <div
                    className={`text-xl font-bold ${getRatingColor(
                      report.overallRating
                    )}`}
                  >
                    {getRatingLabel(report.overallRating)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Ratings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50"
          >
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-arcane-accent" />
              Évaluations Détaillées
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Technical */}
              <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-arcane-grey uppercase">
                      Technique
                    </p>
                    <p
                      className={`text-2xl font-black ${getRatingColor(
                        report.technicalRating
                      )}`}
                    >
                      {report.technicalRating || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      report.technicalRating && report.technicalRating >= 80
                        ? "bg-green-500"
                        : report.technicalRating && report.technicalRating >= 60
                        ? "bg-yellow-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${report.technicalRating || 0}%` }}
                  />
                </div>
              </div>

              {/* Physical */}
              <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-arcane-grey uppercase">
                      Physique
                    </p>
                    <p
                      className={`text-2xl font-black ${getRatingColor(
                        report.physicalRating
                      )}`}
                    >
                      {report.physicalRating || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      report.physicalRating && report.physicalRating >= 80
                        ? "bg-green-500"
                        : report.physicalRating && report.physicalRating >= 60
                        ? "bg-yellow-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${report.physicalRating || 0}%` }}
                  />
                </div>
              </div>

              {/* Mental */}
              <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-arcane-grey uppercase">
                      Mental
                    </p>
                    <p
                      className={`text-2xl font-black ${getRatingColor(
                        report.mentalRating
                      )}`}
                    >
                      {report.mentalRating || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      report.mentalRating && report.mentalRating >= 80
                        ? "bg-green-500"
                        : report.mentalRating && report.mentalRating >= 60
                        ? "bg-yellow-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${report.mentalRating || 0}%` }}
                  />
                </div>
              </div>

              {/* Tactical */}
              <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-arcane-grey uppercase">
                      Tactique
                    </p>
                    <p
                      className={`text-2xl font-black ${getRatingColor(
                        report.tacticalRating
                      )}`}
                    >
                      {report.tacticalRating || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      report.tacticalRating && report.tacticalRating >= 80
                        ? "bg-green-500"
                        : report.tacticalRating && report.tacticalRating >= 60
                        ? "bg-yellow-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${report.tacticalRating || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary */}
          {report.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50"
            >
              <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-5 w-5 text-arcane-accent" />
                Résumé
              </h3>
              <p className="text-arcane-grey leading-relaxed">{report.summary}</p>
            </motion.div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.strengths && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-green-500/30"
              >
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Points Forts
                </h3>
                <p className="text-arcane-grey leading-relaxed">{report.strengths}</p>
              </motion.div>
            )}

            {report.weaknesses && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-red-500/30"
              >
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  Points Faibles
                </h3>
                <p className="text-arcane-grey leading-relaxed">{report.weaknesses}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column - Context */}
        <div className="space-y-6">
          {/* Match Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50"
          >
            <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-5 w-5 text-arcane-accent" />
              Match
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-white font-bold">{report.match.homeClub.name}</p>
                  {report.match.status === "COMPLETED" && (
                    <p className="text-3xl font-black text-arcane-accent mt-2">
                      {report.match.homeScore}
                    </p>
                  )}
                </div>
                <div className="px-3 text-arcane-grey font-bold">VS</div>
                <div className="text-center flex-1">
                  <p className="text-white font-bold">{report.match.awayClub.name}</p>
                  {report.match.status === "COMPLETED" && (
                    <p className="text-3xl font-black text-arcane-accent mt-2">
                      {report.match.awayScore}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-arcane-darkBorder/50 space-y-3">
                {report.match.competitionOld && (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-arcane-accent" />
                    <span className="text-arcane-grey">{report.match.competitionOld}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-arcane-accent" />
                  <span className="text-arcane-grey">
                    {new Date(report.match.scheduledAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {report.match.venueOld && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-arcane-accent" />
                    <span className="text-arcane-grey">{report.match.venueOld}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Scout Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50"
          >
            <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <User className="h-5 w-5 text-arcane-accent" />
              Scout
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold">
                  {report.scout.firstName[0]}
                  {report.scout.lastName[0]}
                </span>
              </div>
              <div>
                <p className="text-white font-bold">
                  {report.scout.firstName} {report.scout.lastName}
                </p>
                {report.scout.email && (
                  <p className="text-sm text-arcane-grey">{report.scout.email}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recommendation */}
          {report.recommendation && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border ${recommendationConfig.border}`}
            >
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <Target className="h-5 w-5 text-arcane-accent" />
                Recommandation
              </h3>

              <div
                className={`px-4 py-3 rounded-lg ${recommendationConfig.bg} border ${recommendationConfig.border}`}
              >
                <p className={`font-black text-lg ${recommendationConfig.color}`}>
                  {recommendationConfig.label}
                </p>
              </div>

              {report.recommendationNotes && (
                <p className="text-arcane-grey mt-4 leading-relaxed">
                  {report.recommendationNotes}
                </p>
              )}
            </motion.div>
          )}

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl bg-arcane-dark/50 backdrop-blur-sm border border-arcane-darkBorder/50"
            >
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-arcane-accent/20 text-arcane-accent text-sm font-bold border border-arcane-accent/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Edit Report Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le Rapport"
        size="xl"
      >
        <form onSubmit={handleUpdateReport} className="space-y-6">
          {/* Overall Rating */}
          <div className="p-6 rounded-xl bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 text-arcane-accent" />
                Note Globale
              </label>
              <span className={`text-3xl font-black ${getRatingColor(editOverallRating)}`}>
                {editOverallRating}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={editOverallRating}
              onChange={(e) => setEditOverallRating(parseInt(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${
                  editOverallRating >= 80
                    ? "#22c55e"
                    : editOverallRating >= 60
                    ? "#eab308"
                    : editOverallRating >= 40
                    ? "#f97316"
                    : "#ef4444"
                } 0%, ${
                  editOverallRating >= 80
                    ? "#22c55e"
                    : editOverallRating >= 60
                    ? "#eab308"
                    : editOverallRating >= 40
                    ? "#f97316"
                    : "#ef4444"
                } ${editOverallRating}%, #1f2937 ${editOverallRating}%, #1f2937 100%)`,
              }}
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical */}
            <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-400" />
                  Technique
                </label>
                <span className={`text-xl font-black ${getRatingColor(editTechnicalRating)}`}>
                  {editTechnicalRating}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editTechnicalRating}
                onChange={(e) => setEditTechnicalRating(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${editTechnicalRating}%, #1f2937 ${editTechnicalRating}%, #1f2937 100%)`,
                }}
              />
            </div>

            {/* Physical */}
            <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  Physique
                </label>
                <span className={`text-xl font-black ${getRatingColor(editPhysicalRating)}`}>
                  {editPhysicalRating}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editPhysicalRating}
                onChange={(e) => setEditPhysicalRating(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${editPhysicalRating}%, #1f2937 ${editPhysicalRating}%, #1f2937 100%)`,
                }}
              />
            </div>

            {/* Mental */}
            <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Mental
                </label>
                <span className={`text-xl font-black ${getRatingColor(editMentalRating)}`}>
                  {editMentalRating}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editMentalRating}
                onChange={(e) => setEditMentalRating(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${editMentalRating}%, #1f2937 ${editMentalRating}%, #1f2937 100%)`,
                }}
              />
            </div>

            {/* Tactical */}
            <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  Tactique
                </label>
                <span className={`text-xl font-black ${getRatingColor(editTacticalRating)}`}>
                  {editTacticalRating}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editTacticalRating}
                onChange={(e) => setEditTacticalRating(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${editTacticalRating}%, #1f2937 ${editTacticalRating}%, #1f2937 100%)`,
                }}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Résumé
            </label>
            <textarea
              rows={3}
              placeholder="Résumé général du joueur..."
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
            />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Points Forts
              </label>
              <textarea
                rows={4}
                placeholder="Qualités du joueur..."
                value={editStrengths}
                onChange={(e) => setEditStrengths(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-green-500/30 text-white placeholder-arcane-grey focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Points Faibles
              </label>
              <textarea
                rows={4}
                placeholder="Points à améliorer..."
                value={editWeaknesses}
                onChange={(e) => setEditWeaknesses(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-red-500/30 text-white placeholder-arcane-grey focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Recommandation
              </label>
              <select
                value={editRecommendation}
                onChange={(e) => setEditRecommendation(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
              >
                <option value="">Sélectionner...</option>
                <option value="BUY_NOW">Acheter Maintenant</option>
                <option value="MONITOR">Suivre</option>
                <option value="FOLLOW_UP">Revoir Plus Tard</option>
                <option value="NOT_INTERESTED">Pas Intéressé</option>
                <option value="NEEDS_MORE_DATA">Plus de Données</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                placeholder="Ex: Rapide, Technique, Leader..."
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
              />
            </div>
          </div>

          {/* Recommendation Notes */}
          {editRecommendation && (
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                Notes sur la Recommandation
              </label>
              <textarea
                rows={2}
                placeholder="Détails de la recommandation..."
                value={editRecommendationNotes}
                onChange={(e) => setEditRecommendationNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-arcane-darkBorder/50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Report Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === "approve" ? "Approuver le Rapport" : "Rejeter le Rapport"}
        size="md"
      >
        <form onSubmit={handleReview} className="space-y-6">
          <div className="p-6 rounded-xl bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <p className="text-white text-center mb-4">
              {reviewAction === "approve"
                ? "Êtes-vous sûr de vouloir approuver ce rapport de scouting ?"
                : "Êtes-vous sûr de vouloir rejeter ce rapport de scouting ?"}
            </p>
            <p className="text-arcane-grey text-sm text-center">
              {reviewAction === "approve"
                ? "Le rapport sera marqué comme approuvé et disponible pour consultation."
                : "Le rapport sera marqué comme rejeté. Le scout pourra le consulter et éventuellement le modifier."}
            </p>
          </div>

          {/* Optional Review Notes */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Notes de Révision (Optionnel)
            </label>
            <textarea
              rows={4}
              placeholder="Ajoutez des commentaires sur votre décision..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-arcane-darkBorder/50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={approving || rejecting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={approving || rejecting}
              className={
                reviewAction === "approve"
                  ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              }
            >
              {approving || rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {reviewAction === "approve" ? "Approbation..." : "Rejet..."}
                </>
              ) : (
                <>
                  {reviewAction === "approve" ? (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approuver
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rejeter
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
