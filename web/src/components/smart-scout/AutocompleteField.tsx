"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { smartScoutApi } from "@/lib/api/smart-scout";
import type { ReportContext, AutocompleteOption } from "@/types/smart-scout";
import { cn } from "@/lib/utils";

interface AutocompleteFieldProps {
  label: string;
  fieldName: string;
  context?: ReportContext;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export function AutocompleteField({
  label,
  fieldName,
  context = {},
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
}: AutocompleteFieldProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [usingAI, setUsingAI] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await smartScoutApi.autocomplete(fieldName, value, context);
        setSuggestions(response.suggestions.slice(0, 5)); // Max 5 suggestions
        setUsingAI(response.usingAI);
        setShowSuggestions(response.suggestions.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, fieldName, context]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex].value);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestionValue: string) => {
    onChange(suggestionValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-arcane-accent/20 text-arcane-accent font-semibold">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Label */}
      <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
        {label}
        {usingAI && showSuggestions && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 text-xs bg-arcane-accent/20 text-arcane-accent px-2 py-0.5 rounded-full"
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </motion.span>
        )}
        {isLoading && (
          <Loader2 className="w-4 h-4 text-arcane-accent animate-spin" />
        )}
      </label>

      {/* Input Field */}
      <InputComponent
        type={multiline ? undefined : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-3",
          "text-white placeholder:text-arcane-grey",
          "focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent",
          "transition-all duration-200",
          multiline && "min-h-[100px] resize-y"
        )}
        rows={multiline ? 4 : undefined}
      />

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-arcane-darkCard border border-arcane-accent/20 rounded-lg shadow-xl backdrop-blur-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => selectSuggestion(suggestion.value)}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-all duration-200",
                    "border-b border-arcane-darkBorder last:border-b-0",
                    selectedIndex === index
                      ? "bg-arcane-accent/20 border-l-4 border-l-arcane-accent"
                      : "hover:bg-arcane-darkBorder/50 border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {highlightMatch(suggestion.value, value)}
                      </p>
                      {suggestion.metadata?.frequency && (
                        <p className="text-xs text-arcane-grey mt-1">
                          Used {suggestion.metadata.frequency}x by scouts
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Confidence Score */}
                      <span className="text-xs text-arcane-accent font-semibold">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                      {/* Source Badge */}
                      {suggestion.source === 'ai' ? (
                        <Sparkles className="w-3.5 h-3.5 text-arcane-accent" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 bg-arcane-dark/80 border-t border-arcane-darkBorder">
              <p className="text-xs text-arcane-grey text-center">
                Use ↑↓ arrows to navigate, Enter to select, Esc to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
