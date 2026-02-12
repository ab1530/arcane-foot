"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Filter, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionCard, SessionCardSkeleton } from "@/components/coaching/SessionCard";
import { Modal } from "@/components/ui/modal";
import { RatingStars } from "@/components/coaching/RatingStars";
import { useMyBookings, useCancelBooking, useRateBooking } from "@/hooks/useCoaching";
import { Booking } from "@/lib/api/coaching";
import { useRouter } from "next/navigation";

type TabType = "upcoming" | "past" | "cancelled";

/**
 * My Bookings Page
 * View and manage user's coaching bookings
 */
export default function MyBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [cancelModal, setCancelModal] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; booking: Booking | null }>({
    open: false,
    booking: null,
  });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Fetch bookings based on status
  const statusMap = {
    upcoming: "scheduled",
    past: "completed",
    cancelled: "cancelled",
  };

  const { data: bookings, isLoading } = useMyBookings(statusMap[activeTab]);
  const cancelMutation = useCancelBooking();
  const rateMutation = useRateBooking();

  const handleCancelBooking = (booking: Booking) => {
    setCancelModal({ open: true, booking });
  };

  const confirmCancel = async () => {
    if (!cancelModal.booking) return;

    await cancelMutation.mutateAsync({
      id: cancelModal.booking.id,
      reason: cancelReason || undefined,
    });

    setCancelModal({ open: false, booking: null });
    setCancelReason("");
  };

  const handleReviewBooking = (booking: Booking) => {
    setReviewModal({ open: true, booking });
    setRating(5);
    setReviewText("");
  };

  const confirmReview = async () => {
    if (!reviewModal.booking) return;

    await rateMutation.mutateAsync({
      id: reviewModal.booking.id,
      rating,
      review: reviewText || undefined,
    });

    setReviewModal({ open: false, booking: null });
    setRating(5);
    setReviewText("");
  };

  const handleRebook = (booking: Booking) => {
    router.push(`/coaching/${booking.coachId}`);
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Hero Header */}
      <div className="border-b border-arcane-darkBorder/50 bg-gradient-to-b from-arcane-darkBorder/20 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-8 w-8 text-arcane-accent" />
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                My Bookings
              </h1>
            </div>
            <p className="text-lg text-arcane-grey">
              Manage your coaching sessions and track your progress
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="border-b border-arcane-darkBorder/50 mb-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wide transition-all relative ${
                  activeTab === tab.key
                    ? "text-arcane-accent"
                    : "text-arcane-grey hover:text-white"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 bg-arcane-darkBorder rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-arcane-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SessionCardSkeleton key={i} />
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <SessionCard
                  key={booking.id}
                  session={booking}
                  onCancel={() => handleCancelBooking(booking)}
                  onReview={() => handleReviewBooking(booking)}
                  onRebook={() => handleRebook(booking)}
                />
              ))}
            </div>
          ) : (
            // Empty state
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="h-20 w-20 rounded-full bg-arcane-darkBorder/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-arcane-grey" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activeTab === "upcoming" && "No upcoming sessions"}
                    {activeTab === "past" && "No past sessions"}
                    {activeTab === "cancelled" && "No cancelled sessions"}
                  </h3>
                  <p className="text-sm text-arcane-grey mb-6">
                    {activeTab === "upcoming" &&
                      "Book a session with a coach to get started on your journey"}
                    {activeTab === "past" &&
                      "Your completed sessions will appear here"}
                    {activeTab === "cancelled" &&
                      "Cancelled sessions will be shown here"}
                  </p>
                  {activeTab === "upcoming" && (
                    <Button
                      variant="primary"
                      onClick={() => router.push("/coaching")}
                    >
                      Find a Coach
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {cancelModal.open && cancelModal.booking && (
        <Modal
          isOpen={cancelModal.open}
          onClose={() => setCancelModal({ open: false, booking: null })}
          title="Cancel Booking"
          size="sm"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400 mb-1">
                  Are you sure you want to cancel this booking?
                </p>
                <p className="text-sm text-arcane-grey">
                  This action cannot be undone. Your coach will be notified.
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-4 bg-arcane-darkBorder/30 rounded-lg">
              <p className="text-sm text-arcane-grey mb-2">Booking Details:</p>
              <p className="font-bold text-white">
                {cancelModal.booking.coach?.name || "Coach"}
              </p>
              <p className="text-sm text-arcane-grey">
                {new Date(cancelModal.booking.scheduledAt).toLocaleString()}
              </p>
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                rows={3}
                className="w-full px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCancelModal({ open: false, booking: null })}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmCancel}
                loading={cancelMutation.isPending}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewModal.open && reviewModal.booking && (
        <Modal
          isOpen={reviewModal.open}
          onClose={() => setReviewModal({ open: false, booking: null })}
          title="Rate Your Session"
          size="md"
        >
          <div className="space-y-6">
            {/* Coach Info */}
            <div className="flex items-center gap-4 p-4 bg-arcane-darkBorder/30 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-arcane-darkBorder flex items-center justify-center text-lg font-bold text-arcane-accent overflow-hidden">
                {reviewModal.booking.coach?.avatar ? (
                  <img
                    src={reviewModal.booking.coach.avatar}
                    alt={reviewModal.booking.coach.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {reviewModal.booking.coach?.name.charAt(0).toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {reviewModal.booking.coach?.name || "Coach"}
                </h3>
                <p className="text-sm text-arcane-grey">
                  {new Date(reviewModal.booking.scheduledAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                How would you rate this session?
              </label>
              <div className="flex justify-center">
                <RatingStars
                  rating={rating}
                  interactive
                  size="lg"
                  onChange={setRating}
                />
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Share your experience (Optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell others about your session..."
                rows={4}
                className="w-full px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewModal({ open: false, booking: null })}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmReview}
                loading={rateMutation.isPending}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
