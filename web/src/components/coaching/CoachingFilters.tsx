"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterState {
  coachingType: string[];
  city?: string;
  minRating?: number;
  maxHourlyRate?: number;
  canWorkRemote?: boolean;
  languages: string[];
}

export interface CoachingFiltersCopy {
  title?: string;
  reset?: string;
  sections?: {
    coachingType?: string;
    rating?: string;
    price?: string;
    city?: string;
    languages?: string;
    remote?: string;
  };
  ratingSuffix?: string;
  coachingTypes?: LabeledOption[];
  languages?: LabeledOption[];
  cities?: LabeledOption[];
  priceSteps?: number[];
}

export interface CoachingFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
  copy?: CoachingFiltersCopy;
  formatPrice?: (price: number) => string;
}

type LabeledOption = string | { value: string; label: string };

const normalizeOptions = (options: LabeledOption[]): Array<{ value: string; label: string }> =>
  options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

const DEFAULT_COACHING_TYPES: LabeledOption[] = [
  "Tactics",
  "Fitness",
  "Mental",
  "Technical",
  "Video Analysis",
  "Goalkeeper",
  "Nutrition",
];

const DEFAULT_LANGUAGES: LabeledOption[] = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Arabic",
];

const DEFAULT_CITIES: LabeledOption[] = [
  "London",
  "Madrid",
  "Barcelona",
  "Paris",
  "Munich",
  "Milan",
  "Amsterdam",
  "Berlin",
];

const DEFAULT_PRICE_STEPS = [50, 100, 150, 200];

/**
 * CoachingFilters Component
 * Provides filtering options for coach search
 * Features:
 * - Collapsible filter sections
 * - Multi-select for coaching types
 * - Multi-select for languages
 * - City selection
 * - Rating filter
 * - Price range filter
 * - Remote work toggle
 * - Active filter count badge
 * - Reset filters button
 */
export function CoachingFilters({
  filters,
  onChange,
  onReset,
  className,
  copy,
  formatPrice,
}: CoachingFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["coaching-type", "price", "location"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleCoachingType = (type: string) => {
    const newTypes = filters.coachingType.includes(type)
      ? filters.coachingType.filter((t) => t !== type)
      : [...filters.coachingType, type];
    onChange({ ...filters, coachingType: newTypes });
  };

  const toggleLanguage = (language: string) => {
    const newLanguages = filters.languages.includes(language)
      ? filters.languages.filter((l) => l !== language)
      : [...filters.languages, language];
    onChange({ ...filters, languages: newLanguages });
  };

  const setCity = (city: string) => {
    onChange({ ...filters, city: filters.city === city ? undefined : city });
  };

  const setRating = (rating: number) => {
    onChange({ ...filters, minRating: filters.minRating === rating ? undefined : rating });
  };

  const setMaxPrice = (price: number) => {
    onChange({ ...filters, maxHourlyRate: filters.maxHourlyRate === price ? undefined : price });
  };

  const toggleRemote = () => {
    onChange({ ...filters, canWorkRemote: !filters.canWorkRemote });
  };

  // Count active filters
  const activeFilterCount =
    filters.coachingType.length +
    filters.languages.length +
    (filters.city ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.maxHourlyRate ? 1 : 0) +
    (filters.canWorkRemote ? 1 : 0);

  const sections = copy?.sections ?? {};
  const coachingTypes = normalizeOptions(copy?.coachingTypes ?? DEFAULT_COACHING_TYPES);
  const languages = normalizeOptions(copy?.languages ?? DEFAULT_LANGUAGES);
  const cities = normalizeOptions(copy?.cities ?? DEFAULT_CITIES);
  const priceSteps = copy?.priceSteps ?? DEFAULT_PRICE_STEPS;
  const formatPriceLabel =
    formatPrice ?? ((value: number) => `$${value}`);
  const ratingSuffix = copy?.ratingSuffix ?? "Stars";

  return (
    <Card className={cn("sticky top-20", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-arcane-accent" />
            <CardTitle className="text-lg">{copy?.title ?? "Filters"}</CardTitle>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-arcane-accent text-arcane-dark rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-auto p-1 text-xs"
            >
              {copy?.reset ?? "Reset"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Coaching Type */}
        <FilterSection
          title={sections.coachingType ?? "Coaching Type"}
          id="coaching-type"
          expanded={expandedSections.has("coaching-type")}
          onToggle={() => toggleSection("coaching-type")}
        >
          <div className="space-y-2">
            {coachingTypes.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.coachingType.includes(value)}
                  onChange={() => toggleCoachingType(value)}
                  className="w-4 h-4 rounded border-arcane-darkBorder bg-arcane-dark text-arcane-accent focus:ring-arcane-accent focus:ring-offset-arcane-dark"
                />
                <span className="text-sm text-arcane-grey group-hover:text-white transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection
          title={sections.rating ?? "Minimum Rating"}
          id="rating"
          expanded={expandedSections.has("rating")}
          onToggle={() => toggleSection("rating")}
        >
          <div className="flex flex-wrap gap-2">
            {[5, 4, 3].map((rating) => (
              <button
                key={rating}
                onClick={() => setRating(rating)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filters.minRating === rating
                    ? "bg-arcane-accent text-arcane-dark"
                    : "bg-arcane-darkBorder text-arcane-grey hover:bg-arcane-darkBorder/70"
                )}
              >
                {rating}+ {ratingSuffix}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection
          title={sections.price ?? "Max Price per Hour"}
          id="price"
          expanded={expandedSections.has("price")}
          onToggle={() => toggleSection("price")}
        >
          <div className="flex flex-wrap gap-2">
            {priceSteps.map((price) => (
              <button
                key={price}
                onClick={() => setMaxPrice(price)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filters.maxHourlyRate === price
                    ? "bg-arcane-accent text-arcane-dark"
                    : "bg-arcane-darkBorder text-arcane-grey hover:bg-arcane-darkBorder/70"
                )}
              >
                {formatPriceLabel(price)}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection
          title={sections.city ?? "City"}
          id="location"
          expanded={expandedSections.has("location")}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-2">
            {cities.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCity(value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                  filters.city === value
                    ? "bg-arcane-accent text-arcane-dark font-medium"
                    : "text-arcane-grey hover:bg-arcane-darkBorder/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Languages */}
        <FilterSection
          title={sections.languages ?? "Languages"}
          id="languages"
          expanded={expandedSections.has("languages")}
          onToggle={() => toggleSection("languages")}
        >
          <div className="space-y-2">
            {languages.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.languages.includes(value)}
                  onChange={() => toggleLanguage(value)}
                  className="w-4 h-4 rounded border-arcane-darkBorder bg-arcane-dark text-arcane-accent focus:ring-arcane-accent focus:ring-offset-arcane-dark"
                />
                <span className="text-sm text-arcane-grey group-hover:text-white transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Remote Work */}
        <div className="pt-4 border-t border-arcane-darkBorder/50">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-white">
              {sections.remote ?? "Remote Sessions"}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={filters.canWorkRemote}
                onChange={toggleRemote}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-11 h-6 rounded-full transition-colors",
                  filters.canWorkRemote ? "bg-arcane-accent" : "bg-arcane-darkBorder"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                    filters.canWorkRemote && "translate-x-5"
                  )}
                />
              </div>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * FilterSection - Collapsible filter section
 */
interface FilterSectionProps {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, id, expanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="border-b border-arcane-darkBorder/50 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group mb-3"
        aria-expanded={expanded}
        aria-controls={`filter-${id}`}
      >
        <span className="text-sm font-bold text-white uppercase tracking-wide">
          {title}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-arcane-grey group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-arcane-grey group-hover:text-white transition-colors" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`filter-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
