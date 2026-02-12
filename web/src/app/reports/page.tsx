"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  FileText,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  User,
  Calendar,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { CreateReportModal } from "@/components/reports/create-report-modal";
import { useLanguage } from "@/contexts/language-context";

type ReportStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface ScoutingReport {
  id: string;
  status: ReportStatus;
  overallRating?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  recommendation?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    position?: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  scout: {
    id: string;
    firstName: string;
    lastName: string;
  };
  match: {
    id: string;
    scheduledAt: string;
    homeClub: {
      name: string;
      logo?: string;
    };
    awayClub: {
      name: string;
      logo?: string;
    };
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const { dictionary } = useLanguage();
  const reportsCopy = dictionary.reports;
  const heroCopy = reportsCopy.hero;
  const searchCopy = reportsCopy.search;
  const statsCopy = reportsCopy.stats;
  const filtersCopy = reportsCopy.filters;
  const listCopy = reportsCopy.list;
  const statusLabels = reportsCopy.statusLabels;
  const actionsCopy = reportsCopy.actions;
  const confirmations = reportsCopy.confirmations;
  const toastsCopy = reportsCopy.toasts;
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.getScoutingReports(params);
      setReports(response.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(toastsCopy.loadError);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toastsCopy.loadError]);

  const filterButtonLabel = showFilters
    ? searchCopy.toggleFiltersHide
    : searchCopy.toggleFiltersShow;

  // Fetch reports from API
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports by search query (client-side)
  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const playerName = `${report.player.user.firstName} ${report.player.user.lastName}`.toLowerCase();
    const scoutName = `${report.scout.firstName} ${report.scout.lastName}`.toLowerCase();
    const matchName = `${report.match.homeClub.name} ${report.match.awayClub.name}`.toLowerCase();

    return (
      playerName.includes(query) ||
      scoutName.includes(query) ||
      matchName.includes(query) ||
      report.summary?.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case "DRAFT":
        return <Edit className="h-4 w-4 text-arcane-grey" />;
      case "SUBMITTED":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    return statusLabels[status] || status;
  };

  const getStatusBadgeColor = (status: ReportStatus) => {
    const colors = {
      DRAFT: "bg-arcane-grey/20 text-arcane-grey border-arcane-grey/30",
      SUBMITTED: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      APPROVED: "bg-green-500/20 text-green-500 border-green-500/30",
      REJECTED: "bg-red-500/20 text-red-500 border-red-500/30",
    };
    return colors[status];
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-arcane-grey";
    if (rating >= 80) return "text-green-500";
    if (rating >= 60) return "text-yellow-500";
    if (rating >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const handleViewReport = (reportId: string) => {
    // Navigate to report detail page
    router.push(`/reports/${reportId}`);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (
      !confirm(`${confirmations.delete.title}\n${confirmations.delete.description}`)
    )
      return;

    try {
      await apiClient.deleteScoutingReport(reportId);
      toast.success(toastsCopy.deleteSuccess);
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error(toastsCopy.deleteError);
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    if (
      !confirm(`${confirmations.submit.title}\n${confirmations.submit.description}`)
    )
      return;

    try {
      await apiClient.submitScoutingReport(reportId);
      toast.success(toastsCopy.submitSuccess);
      fetchReports();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(toastsCopy.submitError);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    if (
      !confirm(`${confirmations.approve.title}\n${confirmations.approve.description}`)
    )
      return;

    try {
      await apiClient.reviewScoutingReport(reportId, true);
      toast.success(toastsCopy.approveSuccess);
      fetchReports();
    } catch (error) {
      console.error("Error approving report:", error);
      toast.error(toastsCopy.approveError);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    if (
      !confirm(`${confirmations.reject.title}\n${confirmations.reject.description}`)
    )
      return;

    try {
      await apiClient.reviewScoutingReport(reportId, false);
      toast.success(toastsCopy.rejectSuccess);
      fetchReports();
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast.error(toastsCopy.rejectError);
    }
  };

  return (
    <ProtectedPage>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          {/* Main Content */}
          <div className="relative z-10">
            {/* Top Bar */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1
                      className="text-2xl font-black text-white flex items-center gap-3"
                      data-test="reports-hero-title"
                    >
                      <FileText className="h-6 w-6 text-arcane-accent" />
                      {heroCopy.title}
                    </h1>
                    <p className="text-sm text-arcane-grey" data-test="reports-hero-subtitle">
                      {heroCopy.subtitle}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {heroCopy.cta}
                  </Button>
                </div>
                <Breadcrumb
                  items={[
                    { label: heroCopy.breadcrumb.dashboard, href: "/dashboard" },
                    { label: heroCopy.breadcrumb.current },
                  ]}
                />
              </div>
            </div>

            <div className="p-6">
              <div className="container-arcane">
                {/* Header Actions */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={searchCopy.placeholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full sm:w-96 pl-10 pr-4 py-2.5 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                      </div>

                      {/* Filter Toggle */}
                      <Button
                        variant={showFilters ? "primary" : "secondary"}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {filterButtonLabel}
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{reports.length}</p>
                        <p className="text-xs text-arcane-grey uppercase tracking-wider">
                          {statsCopy.total}
                        </p>
                      </div>
                      <div className="h-12 w-px bg-arcane-darkBorder" />
                      <div className="text-center">
                        <p className="text-2xl font-black text-yellow-500">
                          {reports.filter((r) => r.status === "SUBMITTED").length}
                        </p>
                        <p className="text-xs text-arcane-grey uppercase tracking-wider">
                          {statsCopy.review}
                        </p>
                      </div>
                      <div className="h-12 w-px bg-arcane-darkBorder" />
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-500">
                          {reports.filter((r) => r.status === "APPROVED").length}
                        </p>
                        <p className="text-xs text-arcane-grey uppercase tracking-wider">
                          {statsCopy.approved}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <GlassCard className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                              {filtersCopy.statusLabel}
                            </label>
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none"
                            >
                              <option value="">{filtersCopy.options.all}</option>
                              <option value="DRAFT">{filtersCopy.options.draft}</option>
                              <option value="SUBMITTED">{filtersCopy.options.submitted}</option>
                              <option value="APPROVED">{filtersCopy.options.approved}</option>
                              <option value="REJECTED">{filtersCopy.options.rejected}</option>
                            </select>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )}
                </motion.div>

                {/* Content Area */}
                <div className="space-y-4">
                  {/* Loading State */}
                  {loading && (
                    <GlassCard variant="elevated" className="p-12 text-center">
                      <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        {listCopy.loadingTitle}
                      </h3>
                    </GlassCard>
                  )}

                  {/* Reports List */}
                  {!loading && filteredReports.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {filteredReports.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <GlassCard
                            variant="elevated"
                            glowOnHover
                            className="p-6 cursor-pointer transition-all hover:border-arcane-accent/50"
                            onClick={() => handleViewReport(report.id)}
                          >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Left - Player Info */}
                                <div className="flex-1">
                                  <div className="flex items-start gap-4">
                                    {/* Player Avatar */}
                                    <div className="w-16 h-16 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                                      <span className="text-arcane-dark font-bold text-xl">
                                        {report.player.user.firstName[0]}
                                        {report.player.user.lastName[0]}
                                      </span>
                                    </div>

                                    {/* Player Details */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black text-white">
                                          {report.player.user.firstName} {report.player.user.lastName}
                                        </h3>
                                        {report.player.position && (
                                          <span className="px-2 py-1 rounded-md bg-arcane-darkBorder/50 text-xs font-bold text-arcane-grey uppercase">
                                            {report.player.position}
                                          </span>
                                        )}
                                      </div>

                                      {/* Match Info */}
                                      <div className="flex items-center gap-2 text-sm text-arcane-grey mb-3">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {report.match.homeClub.name} vs {report.match.awayClub.name}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {new Date(report.match.scheduledAt).toLocaleDateString("fr-FR")}
                                        </span>
                                      </div>

                                      {/* Summary */}
                                      {report.summary && (
                                        <p className="text-sm text-arcane-grey line-clamp-2">
                                          {report.summary}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Middle - Ratings */}
                                <div className="flex flex-col justify-center">
                                  {/* Overall Rating */}
                                  {report.overallRating !== null && (
                                    <div className="text-center mb-4">
                                      <div className={`text-4xl font-black ${getRatingColor(report.overallRating)}`}>
                                        {report.overallRating}
                                      </div>
                                      <div className="text-xs text-arcane-grey uppercase tracking-wider">
                                        {listCopy.metrics.overall}
                                      </div>
                                    </div>
                                  )}

                                  {/* Detailed Ratings Grid */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {report.technicalRating !== null && (
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${getRatingColor(report.technicalRating)}`}>
                                          {report.technicalRating}
                                        </div>
                                        <div className="text-xs text-arcane-grey">
                                          {listCopy.metrics.technical}
                                        </div>
                                      </div>
                                    )}
                                    {report.physicalRating !== null && (
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${getRatingColor(report.physicalRating)}`}>
                                          {report.physicalRating}
                                        </div>
                                        <div className="text-xs text-arcane-grey">
                                          {listCopy.metrics.physical}
                                        </div>
                                      </div>
                                    )}
                                    {report.mentalRating !== null && (
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${getRatingColor(report.mentalRating)}`}>
                                          {report.mentalRating}
                                        </div>
                                        <div className="text-xs text-arcane-grey">
                                          {listCopy.metrics.mental}
                                        </div>
                                      </div>
                                    )}
                                    {report.tacticalRating !== null && (
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${getRatingColor(report.tacticalRating)}`}>
                                          {report.tacticalRating}
                                        </div>
                                        <div className="text-xs text-arcane-grey">
                                          {listCopy.metrics.tactical}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right - Status & Actions */}
                                <div className="space-y-4 lg:min-w-[200px]">
                                  {/* Status Badge */}
                                  <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${getStatusBadgeColor(report.status)}`}>
                                    {getStatusIcon(report.status)}
                                    <span className="text-sm font-bold">
                                      {getStatusLabel(report.status)}
                                    </span>
                                  </div>

                                  {/* Scout Info */}
                                  <div className="p-3 rounded-lg bg-arcane-darkBorder/30">
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="h-3 w-3 text-arcane-grey" />
                                      <span className="text-xs text-arcane-grey uppercase tracking-wider">
                                        {listCopy.columns.scout}
                                      </span>
                                    </div>
                                    <p className="text-sm text-white font-medium">
                                      {report.scout.firstName} {report.scout.lastName}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex flex-col gap-2">
                                    {/* DRAFT Status Actions */}
                                    {report.status === "DRAFT" && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmitReport(report.id);
                                          }}
                                          className="border-arcane-accent bg-arcane-accent/10 text-arcane-accent hover:bg-arcane-accent/20"
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          {actionsCopy.submit}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReport(report.id);
                                          }}
                                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {actionsCopy.delete}
                                        </Button>
                                      </>
                                    )}

                                    {/* SUBMITTED Status Actions */}
                                    {report.status === "SUBMITTED" && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveReport(report.id);
                                          }}
                                          className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                        >
                                          <ThumbsUp className="h-4 w-4 mr-2" />
                                          {actionsCopy.approve}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRejectReport(report.id);
                                          }}
                                          className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        >
                                          <ThumbsDown className="h-4 w-4 mr-2" />
                                          {actionsCopy.reject}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </GlassCard>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Empty State */}
                  {!loading && filteredReports.length === 0 && (
                    <GlassCard variant="elevated" className="p-12 text-center">
                      <FileText className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        {reports.length === 0 ? listCopy.emptyTitle : listCopy.emptyFilteredTitle}
                      </h3>
                      <p className="text-arcane-grey mb-6">
                        {reports.length === 0
                          ? listCopy.emptyDescription
                          : listCopy.emptyFilteredDescription}
                      </p>
                      {reports.length === 0 && (
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          {listCopy.emptyCta}
                        </Button>
                      )}
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Create Report Modal */}
        <CreateReportModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchReports}
        />
      </MainLayout>
    </ProtectedPage>
  );
}
