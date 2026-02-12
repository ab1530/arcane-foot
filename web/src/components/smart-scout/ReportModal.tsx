"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Loader2, User, Calendar, MapPin, TrendingUp, Star, FileText } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
}

interface ReportDetails {
  id: string;
  status: string;
  overallRating?: number;
  technicalRating?: number;
  tacticalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  strengths?: string;
  weaknesses?: string;
  summary?: string;
  recommendation?: string;
  recommendationNotes?: string;
  tags?: string[];
  playerMinutesPlayed?: number;
  playerPosition?: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
    nationality?: string;
    dateOfBirth?: string;
    club?: {
      name: string;
      league?: string;
      country?: string;
    };
  };
  scout?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  match?: {
    id: string;
    scheduledAt: string;
    homeClub: { name: string };
    awayClub: { name: string };
    competitionOld?: string;
    season?: string;
  };
}

export function ReportModal({ isOpen, onClose, reportId }: ReportModalProps) {
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reportId) {
      setReport(null);
      setError(null);
      return;
    }

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getScoutingReport(reportId);
        setReport(data);
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.message || 'Failed to fetch report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, reportId]);

  const RatingBar = ({ label, value, color }: { label: string; value?: number; color: string }) => {
    if (value === undefined) return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-arcane-grey">{label}</span>
          <span className={cn("text-sm font-bold", color)}>{value.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-arcane-dark rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(value / 10) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("rounded-full h-2", color.replace('text-', 'bg-'))}
          />
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scouting Report Details" size="lg">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-arcane-accent animate-spin mx-auto mb-4" />
            <p className="text-sm text-arcane-grey">Loading report...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-6">
          {/* Player Info */}
          {report.player && (
            <div className="bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {report.player.firstName} {report.player.lastName}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-arcane-grey">
                    {report.playerPosition && (
                      <span className="font-semibold text-arcane-accent">{report.playerPosition}</span>
                    )}
                    {report.player.nationality && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {report.player.nationality}
                      </span>
                    )}
                  </div>
                </div>
                {report.overallRating && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-arcane-accent">
                      {report.overallRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-arcane-grey">Overall</div>
                  </div>
                )}
              </div>

              {report.player.club && (
                <div className="flex items-center gap-2 text-sm text-arcane-grey">
                  <span className="font-semibold">{report.player.club.name}</span>
                  {report.player.club.league && (
                    <>
                      <span>•</span>
                      <span>{report.player.club.league}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Match Info */}
          {report.match && (
            <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-arcane-accent" />
                <span className="text-xs font-semibold text-arcane-grey">Match Details</span>
              </div>
              <p className="text-sm text-white">
                {report.match.homeClub.name} vs {report.match.awayClub.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-arcane-grey mt-1">
                <span>{new Date(report.match.scheduledAt).toLocaleDateString()}</span>
                {report.match.competitionOld && (
                  <>
                    <span>•</span>
                    <span>{report.match.competitionOld}</span>
                  </>
                )}
                {report.match.season && (
                  <>
                    <span>•</span>
                    <span>{report.match.season}</span>
                  </>
                )}
              </div>
              {report.playerMinutesPlayed !== undefined && (
                <p className="text-xs text-arcane-grey mt-2">
                  Minutes played: {report.playerMinutesPlayed}'
                </p>
              )}
            </div>
          )}

          {/* Ratings */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-arcane-accent" />
              Performance Ratings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RatingBar label="Technical" value={report.technicalRating} color="text-arcane-accent" />
              <RatingBar label="Tactical" value={report.tacticalRating} color="text-blue-400" />
              <RatingBar label="Physical" value={report.physicalRating} color="text-green-400" />
              <RatingBar label="Mental" value={report.mentalRating} color="text-purple-400" />
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.strengths && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-sm font-bold text-green-400 mb-2">Strengths</h4>
                <p className="text-sm text-green-300 leading-relaxed">{report.strengths}</p>
              </div>
            )}
            {report.weaknesses && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="text-sm font-bold text-orange-400 mb-2">Weaknesses</h4>
                <p className="text-sm text-orange-300 leading-relaxed">{report.weaknesses}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="bg-arcane-darkCard/40 border border-arcane-darkBorder rounded-lg p-4">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-arcane-accent" />
                Summary
              </h4>
              <p className="text-sm text-arcane-grey leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div className="bg-arcane-accent/10 border border-arcane-accent/20 rounded-lg p-4">
              <h4 className="text-sm font-bold text-arcane-accent mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Recommendation: {report.recommendation}
              </h4>
              {report.recommendationNotes && (
                <p className="text-sm text-arcane-grey leading-relaxed">{report.recommendationNotes}</p>
              )}
            </div>
          )}

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-arcane-accent/20 text-arcane-accent text-xs font-semibold rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scout Info */}
          {report.scout && (
            <div className="flex items-center justify-between pt-4 border-t border-arcane-darkBorder">
              <div className="flex items-center gap-2 text-sm text-arcane-grey">
                <User className="w-4 h-4" />
                <span>
                  Scout: {report.scout.firstName} {report.scout.lastName}
                </span>
              </div>
              <div className="text-xs text-arcane-grey">
                Created {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
