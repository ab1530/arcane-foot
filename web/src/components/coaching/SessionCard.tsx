"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Clock, DollarSign, MessageCircle, X, Star, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Booking } from "@/lib/api/coaching";

export interface SessionCardProps {
  session: Booking;
  onCancel?: () => void;
  onReview?: () => void;
  onRebook?: () => void;
  className?: string;
}

/**
 * SessionCard Component
 * Displays a coaching session/booking
 * Features:
 * - Coach info with avatar
 * - Date and time with calendar icon
 * - Duration and session type
 * - Status badge (color-coded)
 * - Action buttons based on status
 * - Price display
 */
export function SessionCard({
  session,
  onCancel,
  onReview,
  onRebook,
  className,
}: SessionCardProps) {
  const coachName = session.coach?.name || "Unknown Coach";
  const coachInitial = coachName.charAt(0).toUpperCase();

  const sessionDate = format(new Date(session.scheduledAt), "MMM dd, yyyy");
  const sessionTime = format(new Date(session.scheduledAt), "HH:mm");

  const statusConfig = {
    scheduled: {
      label: "Upcoming",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    completed: {
      label: "Completed",
      color: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    no_show: {
      label: "No Show",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
  };

  const status = statusConfig[session.status] || statusConfig.scheduled;

  const canCancel = session.status === "scheduled" && onCancel;
  const canReview = session.status === "completed" && !session.playerRating && onReview;
  const canRebook = (session.status === "completed" || session.status === "cancelled") && onRebook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="hover:border-arcane-accent/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Coach Avatar */}
            <div className="flex-shrink-0">
              <div className="h-14 w-14 rounded-full bg-arcane-darkBorder flex items-center justify-center text-xl font-bold text-arcane-accent overflow-hidden">
                {session.coach?.avatar ? (
                  <img
                    src={session.coach.avatar}
                    alt={coachName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{coachInitial}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{coachName}</h3>
                  <p className="text-sm text-arcane-grey">{session.sessionType}</p>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                    status.color
                  )}
                >
                  {status.label}
                </span>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-arcane-accent" />
                  <span className="text-white">{sessionDate}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-arcane-accent" />
                  <span className="text-white">
                    {sessionTime} ({session.duration} min)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-arcane-accent" />
                  <span className="text-white font-bold">${session.price}</span>
                </div>
              </div>

              {/* Notes */}
              {session.notes && (
                <div className="mb-4 p-3 bg-arcane-darkBorder/30 rounded-lg">
                  <p className="text-xs text-arcane-grey font-medium mb-1">Notes:</p>
                  <p className="text-sm text-white">{session.notes}</p>
                </div>
              )}

              {/* Coach Feedback */}
              {session.coachFeedback && (
                <div className="mb-4 p-3 bg-arcane-accent/10 rounded-lg border border-arcane-accent/20">
                  <p className="text-xs text-arcane-accent font-bold mb-1">Coach Feedback:</p>
                  <p className="text-sm text-white">{session.coachFeedback}</p>
                </div>
              )}

              {/* Player Review */}
              {session.playerRating && session.playerReview && (
                <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-green-400 font-bold">Your Review:</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-arcane-accent text-arcane-accent" />
                      <span className="text-xs text-white font-bold">{session.playerRating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white">{session.playerReview}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}

                {canReview && (
                  <Button variant="primary" size="sm" onClick={onReview}>
                    <Star className="h-4 w-4 mr-1" />
                    Leave Review
                  </Button>
                )}

                {canRebook && (
                  <Button variant="outline" size="sm" onClick={onRebook}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Book Again
                  </Button>
                )}

                {session.coach?.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`mailto:${session.coach?.email}`, "_blank")}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * SessionCard Skeleton for loading states
 */
export function SessionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-arcane-darkBorder animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-32" />
                <div className="h-4 bg-arcane-darkBorder rounded animate-pulse w-24" />
              </div>
              <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-5 bg-arcane-darkBorder rounded animate-pulse" />
              <div className="h-5 bg-arcane-darkBorder rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-arcane-darkBorder rounded animate-pulse w-24" />
              <div className="h-9 bg-arcane-darkBorder rounded animate-pulse w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
