"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Star,
  Users,
  BadgeCheck,
  Sliders,
  SortAsc,
  Globe,
  DollarSign
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Breadcrumb } from "@/components/breadcrumb";
import { ScoutProfileCard, ScoutListing } from "@/components/marketplace/scout/ScoutProfileCard";
import { ScoutCardSkeletonGrid } from "@/components/marketplace/shared/ScoutCardSkeleton";
import { Badge } from "@/components/marketplace/shared/Badge";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";

// Filter state interface
interface Filters {
  search: string;
  leagues: string[];
  positions: string[];
  country: string;
  maxBudget: number;
  minRating: number;
  verifiedOnly: boolean;
}

// Available filter options
const LEAGUES = [
  "LaLiga",
  "Premier League",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Eredivisie",
  "Liga Portugal",
  "Belgian Pro League"
];

const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "CAM",
  "LW",
  "RW",
  "ST",
  "CF"
];

const COUNTRIES = [
  "All Countries",
  "Spain",
  "England",
  "Germany",
  "Italy",
  "France",
  "Netherlands",
  "Portugal",
  "Belgium",
  "Brazil",
  "Argentina"
];

const SORT_OPTIONS = [
  { value: "bestMatch", label: "Best Match" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest" }
];

export default function ScoutMarketplace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scouts, setScouts] = useState<ScoutListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    leagues: searchParams.getAll("leagues") || [],
    positions: searchParams.getAll("positions") || [],
    country: searchParams.get("country") || "",
    maxBudget: parseInt(searchParams.get("maxBudget") || "300"),
    minRating: parseInt(searchParams.get("minRating") || "0"),
    verifiedOnly: searchParams.get("verifiedOnly") === "true"
  });

  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "bestMatch");

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch scouts
  const fetchScouts = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: 12
      };

      if (filters.leagues.length > 0) params.leagues = filters.leagues;
      if (filters.positions.length > 0) params.positions = filters.positions;
      if (filters.country && filters.country !== "All Countries") params.country = filters.country;
      if (filters.maxBudget < 300) params.maxBudget = filters.maxBudget;
      if (filters.minRating > 0) params.minRating = filters.minRating;
      if (filters.verifiedOnly) params.verifiedOnly = true;

      const response = await apiClient.searchScoutListings(params);

      setScouts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalResults(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching scout listings:", error);
      toast.error("Failed to load scout listings");
      setScouts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchScouts();
  }, [fetchScouts]);

  // Update URL query params
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.leagues.length > 0) filters.leagues.forEach(l => params.append("leagues", l));
    if (filters.positions.length > 0) filters.positions.forEach(p => params.append("positions", p));
    if (filters.country && filters.country !== "All Countries") params.set("country", filters.country);
    if (filters.maxBudget < 300) params.set("maxBudget", filters.maxBudget.toString());
    if (filters.minRating > 0) params.set("minRating", filters.minRating.toString());
    if (filters.verifiedOnly) params.set("verifiedOnly", "true");
    if (sortBy !== "bestMatch") params.set("sortBy", sortBy);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "/marketplace";

    window.history.replaceState({}, "", newUrl);
  }, [filters, sortBy]);

  // Handle filter changes
  const toggleLeague = (league: string) => {
    setFilters((prev) => ({
      ...prev,
      leagues: prev.leagues.includes(league)
        ? prev.leagues.filter((l) => l !== league)
        : [...prev.leagues, league]
    }));
    setPage(1);
  };

  const togglePosition = (position: string) => {
    setFilters((prev) => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter((p) => p !== position)
        : [...prev.positions, position]
    }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      leagues: [],
      positions: [],
      country: "",
      maxBudget: 300,
      minRating: 0,
      verifiedOnly: false
    });
    setSearchInput("");
    setSortBy("bestMatch");
    setPage(1);
  };

  const hasActiveFilters =
    filters.leagues.length > 0 ||
    filters.positions.length > 0 ||
    filters.country !== "" ||
    filters.maxBudget < 300 ||
    filters.minRating > 0 ||
    filters.verifiedOnly;

  const handleFavoriteToggle = async (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
      toast.success("Removed from favorites");
    } else {
      newFavorites.add(id);
      toast.success("Added to favorites");
    }
    setFavorites(newFavorites);
  };

  const handleScoutClick = (id: string) => {
    router.push(`/marketplace/${id}`);
  };

  return (
    <ProtectedRoute>
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
                    <h1 className="text-2xl font-black text-white uppercase tracking-wide">
                      Scout Marketplace
                    </h1>
                    <p className="text-sm text-arcane-grey">
                      Find and connect with professional football scouts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-arcane-grey">
                      {totalResults} scout{totalResults !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Breadcrumb items={[{ label: "Marketplace" }]} />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex gap-6">
                {/* Filters Sidebar - Desktop */}
                <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6 sticky top-32 h-fit">
                  <GlassCard variant="elevated" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                        <Filter className="h-5 w-5 text-arcane-accent" />
                        Filters
                      </h2>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="text-xs text-red-400 hover:text-red-300 font-bold uppercase"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Leagues */}
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                          Leagues
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {LEAGUES.map((league) => (
                            <label
                              key={league}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={filters.leagues.includes(league)}
                                onChange={() => toggleLeague(league)}
                                className="w-4 h-4 rounded border-arcane-darkBorder bg-arcane-darkBorder/30 text-arcane-accent focus:ring-arcane-accent focus:ring-offset-0"
                              />
                              <span className="text-sm text-arcane-grey group-hover:text-white transition-colors">
                                {league}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Positions */}
                      <div className="pt-4 border-t border-arcane-darkBorder/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                          Positions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {POSITIONS.map((position) => (
                            <button
                              key={position}
                              onClick={() => togglePosition(position)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                filters.positions.includes(position)
                                  ? "bg-arcane-accent/20 text-arcane-accent border-arcane-accent/30"
                                  : "bg-arcane-darkBorder/30 text-arcane-grey border-arcane-darkBorder/50 hover:border-arcane-accent/30"
                              }`}
                            >
                              {position}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Country */}
                      <div className="pt-4 border-t border-arcane-darkBorder/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                          Location
                        </h3>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey pointer-events-none" />
                          <select
                            value={filters.country}
                            onChange={(e) => {
                              setFilters((prev) => ({ ...prev, country: e.target.value }));
                              setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white text-sm focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                          >
                            {COUNTRIES.map((country) => (
                              <option key={country} value={country === "All Countries" ? "" : country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Budget Range */}
                      <div className="pt-4 border-t border-arcane-darkBorder/50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Max Budget
                          </h3>
                          <span className="text-sm text-arcane-accent font-bold">
                            {filters.maxBudget}€/hr
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="300"
                          step="10"
                          value={filters.maxBudget}
                          onChange={(e) => {
                            setFilters((prev) => ({ ...prev, maxBudget: parseInt(e.target.value) }));
                            setPage(1);
                          }}
                          className="w-full h-2 bg-arcane-darkBorder/30 rounded-lg appearance-none cursor-pointer accent-arcane-accent"
                        />
                        <div className="flex justify-between text-xs text-arcane-grey mt-1">
                          <span>0€</span>
                          <span>300€</span>
                        </div>
                      </div>

                      {/* Min Rating */}
                      <div className="pt-4 border-t border-arcane-darkBorder/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                          Minimum Rating
                        </h3>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  minRating: prev.minRating === rating ? 0 : rating
                                }));
                                setPage(1);
                              }}
                              className={`flex-1 py-2 rounded-lg border transition-all ${
                                filters.minRating === rating
                                  ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                                  : "bg-arcane-darkBorder/30 text-arcane-grey border-arcane-darkBorder/50 hover:border-yellow-400/30"
                              }`}
                            >
                              <Star
                                className={`h-4 w-4 mx-auto ${
                                  filters.minRating === rating ? "fill-yellow-400" : ""
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Verified Only */}
                      <div className="pt-4 border-t border-arcane-darkBorder/50">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="h-5 w-5 text-arcane-accent" />
                            <span className="text-sm font-bold text-white">
                              Verified Scouts Only
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={filters.verifiedOnly}
                            onChange={(e) => {
                              setFilters((prev) => ({ ...prev, verifiedOnly: e.target.checked }));
                              setPage(1);
                            }}
                            className="w-4 h-4 rounded border-arcane-darkBorder bg-arcane-darkBorder/30 text-arcane-accent focus:ring-arcane-accent focus:ring-offset-0"
                          />
                        </label>
                      </div>
                    </div>
                  </GlassCard>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                  {/* Search + Sort Bar */}
                  <GlassCard variant="elevated" className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                        <input
                          type="text"
                          placeholder="Search scouts by name, expertise..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white placeholder-arcane-grey focus:outline-none focus:border-arcane-accent/50 transition-colors"
                        />
                      </div>

                      {/* Sort */}
                      <div className="relative min-w-[200px]">
                        <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey pointer-events-none" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mobile Filter Toggle */}
                      <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="lg:hidden px-4 py-3 bg-arcane-accent/20 border border-arcane-accent/30 rounded-lg text-arcane-accent font-bold flex items-center justify-center gap-2"
                      >
                        <Sliders className="h-5 w-5" />
                        Filters
                      </button>
                    </div>

                    {/* Active Filter Badges */}
                    {hasActiveFilters && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-arcane-darkBorder/50">
                        {filters.leagues.map((league) => (
                          <Badge
                            key={league}
                            variant="league"
                            onRemove={() => toggleLeague(league)}
                          >
                            {league}
                          </Badge>
                        ))}
                        {filters.positions.map((position) => (
                          <Badge
                            key={position}
                            variant="position"
                            onRemove={() => togglePosition(position)}
                          >
                            {position}
                          </Badge>
                        ))}
                        {filters.country && filters.country !== "All Countries" && (
                          <Badge
                            variant="filter"
                            onRemove={() => setFilters((prev) => ({ ...prev, country: "" }))}
                          >
                            {filters.country}
                          </Badge>
                        )}
                        {filters.maxBudget < 300 && (
                          <Badge
                            variant="filter"
                            onRemove={() => setFilters((prev) => ({ ...prev, maxBudget: 300 }))}
                          >
                            Max {filters.maxBudget}€/hr
                          </Badge>
                        )}
                        {filters.minRating > 0 && (
                          <Badge
                            variant="filter"
                            onRemove={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
                          >
                            Min {filters.minRating}⭐
                          </Badge>
                        )}
                        {filters.verifiedOnly && (
                          <Badge
                            variant="filter"
                            onRemove={() => setFilters((prev) => ({ ...prev, verifiedOnly: false }))}
                          >
                            Verified Only
                          </Badge>
                        )}
                      </div>
                    )}
                  </GlassCard>

                  {/* Results Grid */}
                  {loading ? (
                    <ScoutCardSkeletonGrid count={6} />
                  ) : scouts.length === 0 ? (
                    <GlassCard variant="elevated" className="p-12 text-center">
                      <Users className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No scouts found</h3>
                      <p className="text-arcane-grey mb-6">
                        Try adjusting your search or filters to find more scouts
                      </p>
                      {hasActiveFilters && (
                        <Button onClick={clearAllFilters} variant="outline">
                          Clear All Filters
                        </Button>
                      )}
                    </GlassCard>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {scouts.map((scout) => (
                        <motion.div key={scout.id} variants={staggerItem}>
                          <ScoutProfileCard
                            listing={scout}
                            isFavorite={favorites.has(scout.id)}
                            onFavoriteToggle={handleFavoriteToggle}
                            onClick={() => handleScoutClick(scout.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Pagination */}
                  {!loading && scouts.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                page === pageNum
                                  ? "bg-arcane-accent text-arcane-dark"
                                  : "bg-arcane-darkBorder/30 text-arcane-grey hover:bg-arcane-darkBorder/50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedRoute>
  );
}
