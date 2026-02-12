"use client";

import { Modal } from "@/components/ui/modal";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Circle,
  Settings,
} from "lucide-react";

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

type MatchStatus = "SCHEDULED" | "CONFIRMED" | "LIVE" | "COMPLETED" | "CANCELLED";

interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  scheduledAt: string;
  venueOld?: string;
  competitionOld?: string;
  season: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  scoutId?: string | null;
  notes?: string | null;
  homeClub: Club;
  awayClub: Club;
  scout?: Scout | null;
  _count?: {
    scoutingReports: number;
  };
}

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  matches: Match[];
  onRefresh?: () => void;
}

export function MatchDetailModal({
  isOpen,
  onClose,
  date,
  matches,
  onRefresh,
}: MatchDetailModalProps) {
  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "SCHEDULED":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "LIVE":
        return <Circle className="h-4 w-4 text-red-500 animate-pulse" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-arcane-accent" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: MatchStatus) => {
    const labels: Record<MatchStatus, string> = {
      SCHEDULED: "Prévu",
      CONFIRMED: "Confirmé",
      LIVE: "En Direct",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return labels[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(date.toISOString())}
      size="lg"
    >
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-arcane-grey">Aucun match pour cette date</p>
          </div>
        ) : (
          matches.map((match) => (
            <GlassCard
              key={match.id}
              variant="elevated"
              className="p-6 hover:border-arcane-accent/50 transition-all"
            >
              <div className="space-y-4">
                {/* Status and Competition */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.status)}
                    <span className="text-sm font-bold text-arcane-grey uppercase tracking-wider">
                      {getStatusLabel(match.status)}
                    </span>
                  </div>
                  {match.competitionOld && (
                    <span className="text-sm text-arcane-grey bg-arcane-darkBorder/30 px-3 py-1 rounded-lg">
                      {match.competitionOld}
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div className="text-center py-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {match.homeClub.name}
                  </h3>
                  <div className="my-2">
                    <span className="text-arcane-accent font-bold text-lg">VS</span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {match.awayClub.name}
                  </h3>

                  {/* Score if available */}
                  {(match.status === "COMPLETED" || match.status === "LIVE") &&
                    match.homeScore !== null &&
                    match.awayScore !== null && (
                      <div className="mt-3 text-2xl font-bold text-arcane-accent">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    )}
                </div>

                {/* Match Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-arcane-grey">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(match.scheduledAt)}</span>
                  </div>
                  {match.venueOld && (
                    <div className="flex items-center gap-2 text-arcane-grey">
                      <MapPin className="h-4 w-4" />
                      <span>{match.venueOld}</span>
                    </div>
                  )}
                </div>

                {/* Scout Assignment */}
                {match.scout && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-arcane-darkBorder/30">
                    <div className="w-8 h-8 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-arcane-dark font-bold text-sm">
                        {match.scout.firstName[0]}
                        {match.scout.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Scout Assigné
                      </div>
                      <div className="text-sm text-white font-medium truncate">
                        {match.scout.firstName} {match.scout.lastName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scouting Reports */}
                {match._count && match._count.scoutingReports > 0 && (
                  <div className="flex items-center gap-2 text-sm text-arcane-accent">
                    <Users className="h-4 w-4" />
                    <span>
                      {match._count.scoutingReports} rapport
                      {match._count.scoutingReports > 1 ? "s" : ""} de scouting
                    </span>
                  </div>
                )}

                {/* Notes */}
                {match.notes && (
                  <div className="p-3 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/30">
                    <div className="text-xs font-bold text-arcane-accent uppercase tracking-wider mb-1">
                      Notes
                    </div>
                    <p className="text-sm text-white">{match.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Détails
                  </Button>
                  {match.venueOld && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            match.venueOld || ""
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Itinéraire
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </Modal>
  );
}
