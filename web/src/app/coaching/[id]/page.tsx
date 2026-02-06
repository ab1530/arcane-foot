"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { format, addWeeks, startOfWeek } from "date-fns";
import {
  MapPin,
  Globe,
  Award,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/coaching/RatingStars";
import { BookingCalendar } from "@/components/coaching/BookingCalendar";
import { ReviewCard, ReviewCardSkeleton } from "@/components/coaching/ReviewCard";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCoach,
  useCoachReviews,
  useCoachAvailability,
  useCreateBooking,
} from "@/hooks/useCoaching";
import { AvailabilitySlot } from "@/lib/api/coaching";

/**
 * Coach Profile Page
 * Detailed coach profile with booking capability
 */
export default function CoachProfilePage() {
  const params = useParams();
  const coachId = params.id as string;

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sessionType, setSessionType] = useState("1-on-1 Training");
  const [notes, setNotes] = useState("");

  // Fetch coach data
  const { data: coach, isLoading: coachLoading } = useCoach(coachId);
  const { data: reviewsData, isLoading: reviewsLoading } = useCoachReviews(coachId, 1, 10);

  // Fetch availability for next 2 weeks
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = addWeeks(startDate, 2);
  const { data: availability = [], isLoading: availabilityLoading } = useCoachAvailability(
    coachId,
    startDate.toISOString(),
    endDate.toISOString()
  );

  const createBookingMutation = useCreateBooking();

  const handleBookSession = () => {
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    await createBookingMutation.mutateAsync({
      coachId,
      scheduledAt: selectedSlot.start,
      duration: 60, // Default 1 hour
      sessionType,
      notes: notes || undefined,
    });

    setShowBookingModal(false);
    setSelectedSlot(null);
    setNotes("");
  };

  if (coachLoading) {
    return <CoachProfileSkeleton />;
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-arcane-dark flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Coach Not Found</h2>
            <p className="text-arcane-grey">The coach you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const location = [coach.city, coach.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Hero Section */}
      <div className="border-b border-arcane-darkBorder/50 bg-gradient-to-b from-arcane-darkBorder/20 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-arcane-darkBorder flex items-center justify-center text-4xl font-bold text-arcane-accent overflow-hidden ring-4 ring-arcane-accent ring-offset-4 ring-offset-arcane-dark">
                {coach.avatar ? (
                  <img src={coach.avatar} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{coach.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {coach.isActive && (
                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-arcane-dark rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white uppercase mb-2">{coach.name}</h1>
              <p className="text-xl text-arcane-grey mb-4">{coach.title}</p>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <RatingStars rating={coach.rating} size="lg" showNumber />
                <span className="text-arcane-grey">
                  ({coach.reviewCount} {coach.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm mb-6">
                {location && (
                  <div className="flex items-center gap-2 text-arcane-grey">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-arcane-grey">
                  <Award className="h-4 w-4" />
                  <span>{coach.yearsExperience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-arcane-grey">
                  <TrendingUp className="h-4 w-4" />
                  <span>{coach.totalSessions} sessions completed</span>
                </div>
                {coach.canWorkRemote && (
                  <div className="flex items-center gap-2 text-arcane-accent">
                    <Globe className="h-4 w-4" />
                    <span>Remote sessions available</span>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" onClick={handleBookSession}>
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Session
                </Button>
                <Button variant="outline" size="lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message
                </Button>
              </div>
            </div>

            {/* Pricing Card */}
            <Card className="md:w-80">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <DollarSign className="h-6 w-6 text-arcane-accent" />
                  <span className="text-3xl font-black text-white">${coach.hourlyRate}</span>
                  <span className="text-arcane-grey">/hour</span>
                </div>
                <Button variant="primary" className="w-full" onClick={handleBookSession}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey leading-relaxed">{coach.bio}</p>
              </CardContent>
            </Card>

            {/* Expertise */}
            <Card>
              <CardHeader>
                <CardTitle>Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.coachingType.map((type, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-arcane-darkBorder rounded-lg text-sm font-bold text-arcane-accent"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-arcane-darkBorder/50 rounded-lg text-sm text-white"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Availability Calendar */}
            <BookingCalendar
              coachId={coachId}
              availability={availability}
              onSlotSelect={setSelectedSlot}
              selectedSlot={selectedSlot || undefined}
              isLoading={availabilityLoading}
            />

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviewsData?.stats.totalReviews || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ReviewCardSkeleton key={i} />
                    ))}
                  </div>
                ) : reviewsData && reviewsData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-arcane-grey py-8">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatItem
                  icon={<CheckCircle className="h-5 w-5 text-green-400" />}
                  label="Sessions Completed"
                  value={coach.totalSessions.toString()}
                />
                <StatItem
                  icon={<Clock className="h-5 w-5 text-blue-400" />}
                  label="Response Time"
                  value={coach.responseTime}
                />
                <StatItem
                  icon={<Star className="h-5 w-5 text-arcane-accent fill-arcane-accent" />}
                  label="Satisfaction Rate"
                  value={`${coach.satisfactionRate}%`}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <Modal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title="Book Session"
          size="md"
        >
          <div className="space-y-6">
            {/* Coach Summary */}
            <div className="flex items-center gap-4 p-4 bg-arcane-darkBorder/30 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-arcane-darkBorder flex items-center justify-center text-lg font-bold text-arcane-accent overflow-hidden">
                {coach.avatar ? (
                  <img src={coach.avatar} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{coach.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">{coach.name}</h3>
                <p className="text-sm text-arcane-grey">{coach.title}</p>
              </div>
            </div>

            {/* Selected Slot */}
            <div className="p-4 bg-arcane-accent/10 border border-arcane-accent/20 rounded-lg">
              <p className="text-sm text-arcane-grey mb-1">Selected Time:</p>
              <p className="text-lg font-bold text-white">
                {format(new Date(selectedSlot.start), "EEEE, MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white focus:outline-none focus:border-arcane-accent"
              >
                <option>1-on-1 Training</option>
                <option>Tactical Analysis</option>
                <option>Video Review</option>
                <option>Mental Coaching</option>
                <option>Fitness Assessment</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any specific topics or goals for this session..."
                rows={4}
                className="w-full px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent resize-none"
              />
            </div>

            {/* Price */}
            <div className="p-4 bg-arcane-darkBorder/30 rounded-lg flex items-center justify-between">
              <span className="text-arcane-grey">Total Price:</span>
              <span className="text-2xl font-bold text-white">${coach.hourlyRate}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmBooking}
                loading={createBookingMutation.isPending}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-arcane-grey uppercase">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function CoachProfileSkeleton() {
  return (
    <div className="min-h-screen bg-arcane-dark">
      <div className="border-b border-arcane-darkBorder/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex gap-8 items-start">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
