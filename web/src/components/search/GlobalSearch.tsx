"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  FileText,
  Trophy,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: "player" | "report" | "camp" | "match";
  title: string;
  subtitle: string;
  url: string;
  icon: any;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeList = (payload: any): any[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      if (Array.isArray((payload as any).items)) {
        return (payload as any).items;
      }
      if (Array.isArray((payload as any).data)) {
        return (payload as any).data;
      }
    }
    return [];
  };

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("arcane_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Keyboard shortcut: Cmd/Ctrl + K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setActiveIndex(0);
      return;
    }

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [query]);

  // Reset activeIndex when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search players
      const playersRes = await apiClient
        .getPlayers({ search: searchQuery, limit: 3 })
        .catch(() => null);
      const playersData = normalizeList(playersRes);
      playersData.forEach((player: any) => {
        const firstName = player.firstName ?? player.user?.firstName ?? "";
        const lastName = player.lastName ?? player.user?.lastName ?? "";
        searchResults.push({
          id: player.id,
          type: "player",
          title: `${firstName} ${lastName}`.trim() || "Joueur",
          subtitle: `${player.position || "Joueur"} - ${player.currentClub?.name || "Sans club"}`,
          url: `/players/${player.id}`,
          icon: Users,
        });
      });

      // Search reports
      const reportsRes = await apiClient
        .getScoutingReports({ limit: 3 })
        .catch(() => null);
      const reportsData = normalizeList(reportsRes);
      reportsData
        .filter((report: any) =>
          report.player?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.player?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 3)
        .forEach((report: any) => {
          searchResults.push({
            id: report.id,
            type: "report",
            title: `Rapport: ${report.player?.firstName} ${report.player?.lastName}`,
            subtitle: `${report.status} - ${new Date(report.createdAt).toLocaleDateString("fr-FR")}`,
            url: `/reports/${report.id}`,
            icon: FileText,
          });
        });

      // Search camps
      const campsRes = await apiClient.getCamps().catch(() => null);
      const campsData = normalizeList(campsRes);
      campsData
        .filter((camp: any) =>
          camp.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 3)
        .forEach((camp: any) => {
          searchResults.push({
            id: camp.id,
            type: "camp",
            title: camp.name,
            subtitle: `${camp.type} - ${new Date(camp.startDate).toLocaleDateString("fr-FR")}`,
            url: `/camps/${camp.id}`,
            icon: Trophy,
          });
        });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("arcane_recent_searches", JSON.stringify(newRecent));

    // Navigate
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("arcane_recent_searches");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[activeIndex]) {
          handleSelectResult(results[activeIndex]);
        }
        break;
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-arcane-darkBorder/50 hover:bg-arcane-darkBorder transition-colors text-arcane-grey hover:text-white"
        aria-label="Ouvrir la recherche globale"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden md:inline text-sm">Rechercher...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-arcane-dark text-xs text-arcane-grey" aria-hidden="true">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
              role="dialog"
              aria-modal="true"
              aria-label="Recherche globale"
            >
              <GlassCard variant="elevated" className="overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-arcane-darkBorder">
                  <Search className="h-5 w-5 text-arcane-grey" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Rechercher des joueurs, rapports, camps..."
                    className="flex-1 bg-transparent text-white placeholder-arcane-grey focus:outline-none"
                    aria-label="Champ de recherche"
                    aria-autocomplete="list"
                    role="combobox"
                    aria-expanded={results.length > 0}
                    aria-controls="search-results"
                    aria-activedescendant={results.length > 0 ? `search-result-${activeIndex}` : undefined}
                  />
                  {loading && (
                    <Loader2 className="h-5 w-5 text-arcane-accent animate-spin" aria-label="Chargement" />
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-arcane-darkBorder/50 rounded transition-colors"
                    aria-label="Fermer la recherche"
                  >
                    <X className="h-5 w-5 text-arcane-grey" aria-hidden="true" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto" id="search-results" role="listbox">
                  {query.trim().length < 2 && recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-arcane-grey flex items-center gap-2">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          Recherches récentes
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-arcane-grey hover:text-white transition-colors"
                          aria-label="Effacer l'historique de recherche"
                        >
                          Effacer
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearch(search)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-arcane-darkBorder/30 transition-colors text-sm text-arcane-grey"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {query.trim().length >= 2 && results.length === 0 && !loading && (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-arcane-grey opacity-50 mx-auto mb-3" />
                      <p className="text-arcane-grey">Aucun résultat trouvé</p>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="divide-y divide-arcane-darkBorder">
                      {results.map((result, index) => {
                        const Icon = result.icon;
                        const typeLabel = result.type === "player" ? "Joueur" : result.type === "report" ? "Rapport" : result.type === "camp" ? "Camp" : "Match";
                        const isActive = index === activeIndex;
                        return (
                          <button
                            key={result.id}
                            id={`search-result-${index}`}
                            onClick={() => handleSelectResult(result)}
                            className={`w-full flex items-center gap-4 p-4 transition-colors text-left ${
                              isActive
                                ? "bg-arcane-darkBorder/50"
                                : "hover:bg-arcane-darkBorder/30"
                            }`}
                            role="option"
                            aria-selected={isActive}
                            aria-label={`${typeLabel}: ${result.title}, ${result.subtitle}`}
                          >
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                result.type === "player"
                                  ? "bg-blue-500/20"
                                  : result.type === "report"
                                  ? "bg-purple-500/20"
                                  : result.type === "camp"
                                  ? "bg-arcane-accent/20"
                                  : "bg-green-500/20"
                              }`}
                              aria-hidden="true"
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  result.type === "player"
                                    ? "text-blue-400"
                                    : result.type === "report"
                                    ? "text-purple-400"
                                    : result.type === "camp"
                                    ? "text-arcane-accent"
                                    : "text-green-400"
                                }`}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold mb-1">
                                {result.title}
                              </p>
                              <p className="text-xs text-arcane-grey truncate">
                                {result.subtitle}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-arcane-grey flex-shrink-0" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 border-t border-arcane-darkBorder bg-arcane-darkBorder/30">
                  <div className="flex items-center gap-4 text-xs text-arcane-grey">
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-arcane-dark">↑↓</kbd>
                      <span>Naviguer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-arcane-dark">↵</kbd>
                      <span>Sélectionner</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-0.5 rounded bg-arcane-dark">Esc</kbd>
                      <span>Fermer</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
