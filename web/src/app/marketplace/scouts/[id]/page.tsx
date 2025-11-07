/**
 * Scout Profile Detail Page
 * Full profile page for individual scout listings
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ScoutStats } from "@/components/marketplace/scout/ScoutStats";
import { ScoutExpertiseBadge } from "@/components/marketplace/scout/ScoutExpertiseBadge";
import { RatingDistribution } from "@/components/marketplace/scout/RatingDistribution";
import { ReviewList } from "@/components/marketplace/reviews/ReviewList";
import { ScoutListing, Review, ReviewStats } from "@/types/marketplace";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export default function ScoutProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const scoutId = params.id as string;

  const [scout, setScout] = useState<ScoutListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchScoutData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch scout listing
        const scoutData = await apiClient.getScoutListing(scoutId);
        setScout(scoutData);

        // Fetch reviews
        const reviewsData = await apiClient.getListingReviews(scoutId);
        setReviews(reviewsData.reviews || []);
        setReviewStats(reviewsData.stats);

        // Check if favorited (only for clubs)
        if (user && user.accountType === "club") {
          try {
            const favoriteStatus = await apiClient.checkFavorite(scoutId);
            setIsFavorite(favoriteStatus.isFavorite);
            setFavoriteId(favoriteStatus.favoriteId);
          } catch (err) {
            // Favorite check is optional, don't block page load
            console.error("Error checking favorite status:", err);
          }
        }
      } catch (err: any) {
        console.error("Error fetching scout data:", err);
        setError(err.message || "Failed to load scout profile");
      } finally {
        setLoading(false);
      }
    };

    if (scoutId) {
      fetchScoutData();
    }
  }, [scoutId, user]);

  const handleFavoriteToggle = async () => {
    if (!user || user.accountType !== "club") {
      alert("Only clubs can favorite scouts");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite && favoriteId) {
        await apiClient.removeFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(undefined);
      } else {
        const result = await apiClient.addFavorite(scoutId);
        setIsFavorite(true);
        setFavoriteId(result.id);
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      alert(err.message || "Failed to update favorite");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSendOffer = () => {
    // TODO: Open modal or navigate to offer form
    alert("Send Offer feature coming soon!");
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      english: "🇬🇧",
      french: "🇫🇷",
      spanish: "🇪🇸",
      german: "🇩🇪",
      italian: "🇮🇹",
      portuguese: "🇵🇹",
    };
    return flags[language.toLowerCase()] || "🌐";
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      france: "🇫🇷",
      spain: "🇪🇸",
      portugal: "🇵🇹",
      england: "🇬🇧",
      germany: "🇩🇪",
      italy: "🇮🇹",
    };
    return flags[country.toLowerCase()] || "🌍";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arcane-dark py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-white text-xl">Loading scout profile...</div>
        </div>
      </div>
    );
  }

  if (error || !scout) {
    return (
      <div className="min-h-screen bg-arcane-dark py-12">
        <div className="container mx-auto px-4">
          <GlassCard variant="bordered" className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">Scout Not Found</h2>
            <p className="text-arcane-grey mb-6">{error || "This scout profile could not be found"}</p>
            <Button onClick={() => router.push("/marketplace")}>
              Back to Marketplace
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arcane-dark py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back
        </Button>

        {/* Header Section */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {scout.users.avatar ? (
                <img
                  src={scout.users.avatar}
                  alt={`${scout.users.firstName} ${scout.users.lastName}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-arcane-accent/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-arcane-darkBorder flex items-center justify-center border-4 border-arcane-accent/30">
                  <span className="text-4xl font-bold text-arcane-accent">
                    {scout.users.firstName.charAt(0)}
                    {scout.users.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {scout.users.firstName} {scout.users.lastName}
                  </h1>
                  <p className="text-lg text-arcane-grey mb-2">{scout.headline}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {scout.stats.avgRating !== undefined && scout.stats.avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-semibold">
                          {scout.stats.avgRating.toFixed(1)}
                        </span>
                        <span className="text-arcane-grey text-sm">
                          ({scout.stats.totalReviews} {scout.stats.totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                    {scout.isVerified && (
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                        ✓ Verified Scout
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSendOffer}
                  className="flex-1 md:flex-none"
                >
                  Send Offer
                </Button>
                {user && user.accountType === "club" && (
                  <Button
                    variant={isFavorite ? "secondary" : "outline"}
                    size="lg"
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className="px-6"
                  >
                    {favoriteLoading ? "..." : isFavorite ? "♥ Favorited" : "♡ Add to Favorites"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <ScoutStats
          avgRating={scout.stats.avgRating}
          totalReviews={scout.stats.totalReviews}
          completionRate={scout.stats.completionRate}
          className="mb-8"
        />

        {/* About Section */}
        <GlassCard variant="bordered" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About</h2>
          <p className="text-arcane-grey leading-relaxed whitespace-pre-line mb-6">
            {scout.bio}
          </p>
          <div>
            <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-2">
              Languages
            </h3>
            <div className="flex gap-2 flex-wrap">
              {scout.languages.map((lang, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-arcane-darkBorder text-white px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{getLanguageFlag(lang)}</span>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Expertise Section */}
        <GlassCard variant="bordered" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Expertise</h2>

          {/* Leagues */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-3 flex items-center gap-2">
              <span>🏆</span> Leagues
            </h3>
            <div className="flex gap-2 flex-wrap">
              {scout.expertise.leagues.map((league, index) => (
                <ScoutExpertiseBadge
                  key={index}
                  label={league}
                  variant="league"
                />
              ))}
            </div>
          </div>

          {/* Positions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-3 flex items-center gap-2">
              <span>⚽</span> Positions
            </h3>
            <div className="flex gap-2 flex-wrap">
              {scout.expertise.positions.map((position, index) => (
                <ScoutExpertiseBadge
                  key={index}
                  label={position}
                  variant="position"
                />
              ))}
            </div>
          </div>

          {/* Age Groups */}
          <div>
            <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-3 flex items-center gap-2">
              <span>👥</span> Age Groups
            </h3>
            <div className="flex gap-2 flex-wrap">
              {scout.expertise.ageGroups.map((ageGroup, index) => (
                <ScoutExpertiseBadge
                  key={index}
                  label={ageGroup}
                  variant="age"
                />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Availability Section */}
        <GlassCard variant="bordered" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Availability</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Countries */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-3 flex items-center gap-2">
                <span>📍</span> Countries
              </h3>
              <div className="flex gap-2 flex-wrap">
                {scout.availability.countries.map((country, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-arcane-darkBorder text-white px-3 py-1.5 rounded-full text-sm"
                  >
                    <span>{getCountryFlag(country)}</span>
                    {country}
                  </span>
                ))}
              </div>
            </div>

            {/* Travel Radius */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-grey uppercase mb-3 flex items-center gap-2">
                <span>🚗</span> Travel Radius
              </h3>
              <div className="bg-arcane-darkBorder text-white px-4 py-2 rounded-lg text-lg font-semibold inline-block">
                {scout.availability.travelRadius} km
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Rates Section */}
        <GlassCard variant="bordered" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Rates</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scout.hourlyRate && (
              <div className="bg-arcane-dark p-4 rounded-lg border border-arcane-darkBorder">
                <div className="text-sm text-arcane-grey mb-2 flex items-center gap-2">
                  <span>⏰</span> Hourly Rate
                </div>
                <div className="text-2xl font-bold text-arcane-accent">
                  {scout.currency}{scout.hourlyRate}/hr
                </div>
              </div>
            )}

            {scout.matchRate && (
              <div className="bg-arcane-dark p-4 rounded-lg border border-arcane-darkBorder">
                <div className="text-sm text-arcane-grey mb-2 flex items-center gap-2">
                  <span>⚽</span> Per Match
                </div>
                <div className="text-2xl font-bold text-arcane-accent">
                  {scout.currency}{scout.matchRate}/match
                </div>
              </div>
            )}

            {scout.reportRate && (
              <div className="bg-arcane-dark p-4 rounded-lg border border-arcane-darkBorder">
                <div className="text-sm text-arcane-grey mb-2 flex items-center gap-2">
                  <span>📄</span> Per Report
                </div>
                <div className="text-2xl font-bold text-arcane-accent">
                  {scout.currency}{scout.reportRate}/report
                </div>
              </div>
            )}
          </div>

          {!scout.hourlyRate && !scout.matchRate && !scout.reportRate && (
            <div className="text-center text-arcane-grey py-4">
              Contact scout for pricing
            </div>
          )}
        </GlassCard>

        {/* Portfolio Section */}
        {scout.portfolio && (scout.portfolio.topReports?.length || scout.portfolio.playersDiscovered?.length) && (
          <GlassCard variant="bordered" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio</h2>

            {scout.portfolio.topReports && scout.portfolio.topReports.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Top Reports</h3>
                <div className="text-arcane-grey">
                  {scout.portfolio.topReports.length} reports available
                </div>
              </div>
            )}

            {scout.portfolio.playersDiscovered && scout.portfolio.playersDiscovered.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Players Discovered</h3>
                <div className="text-arcane-grey">
                  {scout.portfolio.playersDiscovered.length} players
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Distribution */}
          <div className="lg:col-span-1">
            {reviewStats && (
              <RatingDistribution
                distribution={reviewStats.ratingDistribution}
                totalReviews={reviewStats.totalReviews}
              />
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <GlassCard variant="bordered">
              <h2 className="text-2xl font-bold text-white mb-6">
                Reviews ({scout.stats.totalReviews})
              </h2>
              <ReviewList reviews={reviews} />
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
