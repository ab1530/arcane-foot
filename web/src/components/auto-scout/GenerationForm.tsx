'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface GenerationFormProps {
  selectedTemplate: string;
  onGenerate: (data: {
    playerId: string;
    matchId?: string;
    reportType: string;
    customContext?: string;
    autoSave: boolean;
  }) => void;
}

export function GenerationForm({ selectedTemplate, onGenerate }: GenerationFormProps) {
  const [playerId, setPlayerId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [costEstimate, setCostEstimate] = useState<any>(null);

  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');

  // Load matches on mount
  useEffect(() => {
    loadMatches();
  }, []);

  // Load players with debounce
  useEffect(() => {
    // Don't search if we already have a player selected and user hasn't changed the query
    if (selectedPlayerName && searchQuery === selectedPlayerName) {
      return;
    }

    // If user is changing the query after selecting a player, reset the selection
    if (selectedPlayerName && searchQuery !== selectedPlayerName) {
      setPlayerId('');
      setSelectedPlayerName('');
    }

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        loadPlayers();
        setShowDropdown(true);
      } else {
        setPlayers([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlayerName]);

  // Load cost estimate
  useEffect(() => {
    if (selectedTemplate) {
      loadCostEstimate();
    }
  }, [selectedTemplate]);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await apiClient.getPlayers({ search: searchQuery, limit: 50 });
      // Backend returns array directly, not { data: [...] }
      const playersData = Array.isArray(response) ? response : (response.data || []);
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to load players:', error);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await apiClient.getMatches({ limit: 50 });
      const matchesData = response.data || [];
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const loadCostEstimate = async () => {
    try {
      const response = await apiClient.getAutoScoutCostEstimate(selectedTemplate);
      if (response.success) {
        setCostEstimate(response.data);
      }
    } catch (error) {
      console.error('Failed to load cost estimate:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerId) {
      toast.error('Please select a player');
      return;
    }

    onGenerate({
      playerId,
      matchId: matchId || undefined,
      reportType: selectedTemplate,
      customContext: customContext || undefined,
      autoSave,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Configure Report
        </h2>
        <p className="text-gray-400">
          Select player and provide additional context for the AI
        </p>
      </div>

      {/* Cost warning */}
      {costEstimate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-400 mb-1">
                Cost Estimate
              </h4>
              <p className="text-xs text-gray-300">
                This report will use approximately{' '}
                <span className="font-bold text-white">{costEstimate.estimatedTokens} tokens</span>{' '}
                and cost around{' '}
                <span className="font-bold text-amber-400">{costEstimate.estimatedCost}</span>.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {costEstimate.note}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Player selection */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Player <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#E4FF3B] transition-colors"
          />
        </div>

        {/* Player dropdown */}
        {showDropdown && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-black/95 border border-white/20 shadow-2xl"
          >
            {loadingPlayers ? (
              <div className="p-4 text-center text-gray-400">
                Loading players...
              </div>
            ) : players.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No players found
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {players.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setPlayerId(player.id);
                      const fullName = player.user ? `${player.user.firstName} ${player.user.lastName}` : 'Unknown';
                      setSearchQuery(fullName);
                      setSelectedPlayerName(fullName);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm font-semibold text-white">
                      {player.user ? `${player.user.firstName} ${player.user.lastName}` : 'Unknown Player'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {player.position} • {player.club?.name || 'Free Agent'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Match selection (optional) */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Match (Optional)
        </label>
        <select
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#E4FF3B] transition-colors"
        >
          <option value="">Select a match (optional)</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.homeClub?.name || 'Unknown'} vs {match.awayClub?.name || 'Unknown'} - {new Date(match.scheduledAt).toLocaleDateString()}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Specify a match for match-specific analysis
        </p>
      </div>

      {/* Custom context */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Additional Context (Optional)
        </label>
        <textarea
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          placeholder="Add any specific context, focus areas, or questions for the AI..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#E4FF3B] transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          E.g., "Focus on defensive positioning" or "Compare with Xavi's playing style"
        </p>
      </div>

      {/* Auto-save checkbox */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <input
          type="checkbox"
          id="autoSave"
          checked={autoSave}
          onChange={(e) => setAutoSave(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-[#E4FF3B] focus:ring-[#E4FF3B] focus:ring-offset-0"
        />
        <div className="flex-1">
          <label htmlFor="autoSave" className="text-sm font-semibold text-white cursor-pointer">
            Save as Official Report
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Automatically save this report to the database after generation. You can always edit it before saving manually.
          </p>
        </div>
      </div>

      {/* AI warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
        <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-purple-400 mb-1">
            AI-Generated Content
          </h4>
          <p className="text-xs text-gray-300">
            This report will be generated using GPT-4. While AI provides excellent insights,
            always review and verify the content before using it officially.
          </p>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!playerId}
        className="w-full py-4 rounded-xl bg-[#E4FF3B] text-black font-bold text-lg hover:bg-[#d4ef2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Report
      </button>
    </form>
  );
}
