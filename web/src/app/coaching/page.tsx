"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Star, Award, TrendingUp, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachCard, CoachCardSkeleton } from "@/components/coaching/CoachCard";
import { CoachingFilters, FilterState } from "@/components/coaching/CoachingFilters";
import { useCoaches } from "@/hooks/useCoaching";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

/**
 * Coaching Discovery Page
 * Browse and filter available coaches
 * Features:
 * - Header with page title and CTA
 * - Search bar with debounced search
 * - Sidebar filters
 * - Coach grid (3 columns → 2 → 1 responsive)
 * - Featured coaches section
 * - Loading states with skeleton
 * - Empty state when no coaches match filters
 * - Sort by rating, price, experience
 */
export default function CoachingPage() {
  const { dictionary, t, language } = useLanguage();
  const coachingCopy = dictionary.coaching;
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    coachingType: [],
    languages: [],
  });
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high" | "experience">("rating");

  // Fetch coaches with filters
  const { data: coaches, isLoading, error } = useCoaches({
    coachingType: filters.coachingType.length > 0 ? filters.coachingType : undefined,
    city: filters.city,
    minRating: filters.minRating,
    maxHourlyRate: filters.maxHourlyRate,
    canWorkRemote: filters.canWorkRemote,
    languages: filters.languages.length > 0 ? filters.languages : undefined,
  });

  // Filter and sort coaches
  const filteredCoaches = useMemo(() => {
    if (!coaches) return [];

    let filtered = coaches;

    // Search filter (name, title, bio)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coach) =>
          coach.name.toLowerCase().includes(query) ||
          coach.title.toLowerCase().includes(query) ||
          coach.bio.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return a.hourlyRate - b.hourlyRate;
        case "price-high":
          return b.hourlyRate - a.hourlyRate;
        case "experience":
          return b.yearsExperience - a.yearsExperience;
        default:
          return 0;
      }
    });

    return filtered;
  }, [coaches, searchQuery, sortBy]);

  // Featured coaches (top-rated)
  const featuredCoaches = useMemo(() => {
    return filteredCoaches.filter((coach) => coach.rating >= 4.5).slice(0, 3);
  }, [filteredCoaches]);

  const regularCoaches = useMemo(() => {
    const featuredIds = new Set(featuredCoaches.map((c) => c.id));
    return filteredCoaches.filter((coach) => !featuredIds.has(coach.id));
  }, [filteredCoaches, featuredCoaches]);

  const handleResetFilters = () => {
    setFilters({
      coachingType: [],
      languages: [],
    });
    setSearchQuery("");
  };

  const activeFilterCount =
    filters.coachingType.length +
    filters.languages.length +
    (filters.city ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.maxHourlyRate ? 1 : 0) +
    (filters.canWorkRemote ? 1 : 0);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale]
  );

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
              <Award className="h-8 w-8 text-arcane-accent" />
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                {coachingCopy.hero.title}
              </h1>
            </div>
            <p className="text-lg text-arcane-grey mb-6">
              {coachingCopy.hero.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-5 w-5 text-arcane-accent fill-arcane-accent" />
                <span className="text-white font-bold">
                  {t("coaching.hero.stats.coaches", { count: coaches?.length || 0 })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-5 w-5 text-arcane-accent" />
                <span className="text-white font-bold">{coachingCopy.hero.stats.sessions}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-80 flex-shrink-0">
            <CoachingFilters
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              copy={coachingCopy.filters}
              formatPrice={(value) => currencyFormatter.format(value)}
            />

            {/* Become a Coach CTA */}
            <Card className="mt-6 bg-gradient-to-br from-arcane-accent/10 to-arcane-accent/5 border-arcane-accent/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <UserPlus className="h-6 w-6 text-arcane-accent flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {coachingCopy.cta.title}
                    </h3>
                    <p className="text-sm text-arcane-grey mb-4">
                      {coachingCopy.cta.description}
                    </p>
                  </div>
                </div>
                <Link href="/coaching/become-coach">
                  <Button variant="primary" className="w-full">
                    {coachingCopy.cta.button}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                <input
                  type="text"
                  placeholder={coachingCopy.search.placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent focus:ring-1 focus:ring-arcane-accent"
                />
              </div>

              {/* Sort */}
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white focus:outline-none focus:border-arcane-accent focus:ring-1 focus:ring-arcane-accent"
                >
                  <option value="rating">{coachingCopy.search.sortOptions.rating}</option>
                  <option value="price-low">{coachingCopy.search.sortOptions.priceLow}</option>
                  <option value="price-high">{coachingCopy.search.sortOptions.priceHigh}</option>
                  <option value="experience">{coachingCopy.search.sortOptions.experience}</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-arcane-grey">
                {isLoading ? (
                  coachingCopy.results.loading
                ) : (
                  <>
                    {filteredCoaches.length === 1
                      ? t("coaching.results.count.singular", { count: filteredCoaches.length })
                      : t("coaching.results.count.plural", { count: filteredCoaches.length })}
                    {activeFilterCount > 0 && (
                      <>
                        {" "}
                        (
                        {activeFilterCount === 1
                          ? t("coaching.results.filtersApplied.singular", {
                              count: activeFilterCount,
                            })
                          : t("coaching.results.filtersApplied.plural", {
                              count: activeFilterCount,
                            })}
                        )
                      </>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Featured Coaches */}
            {!isLoading && featuredCoaches.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-5 w-5 text-arcane-accent fill-arcane-accent" />
                  <h2 className="text-2xl font-black text-white uppercase">
                    {coachingCopy.results.featured}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {featuredCoaches.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All Coaches */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CoachCardSkeleton key={i} />
                ))}
              </div>
            ) : regularCoaches.length > 0 ? (
              <>
                {featuredCoaches.length > 0 && (
                  <h2 className="text-xl font-bold text-white uppercase mb-6">
                    {coachingCopy.results.all}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {regularCoaches.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} />
                  ))}
                </div>
              </>
            ) : filteredCoaches.length === 0 ? (
              // Empty state
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-20 w-20 rounded-full bg-arcane-darkBorder/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-10 w-10 text-arcane-grey" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {coachingCopy.results.empty.title}
                    </h3>
                    <p className="text-sm text-arcane-grey mb-6">
                      {coachingCopy.results.empty.description}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button variant="outline" onClick={handleResetFilters}>
                        {coachingCopy.results.empty.reset}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <p className="text-red-400 mb-4">{coachingCopy.error.message}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      {coachingCopy.error.retry}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
