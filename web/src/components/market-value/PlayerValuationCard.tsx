"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { marketValueApi } from '@/lib/api/market-value';
import { PlayerValuation } from '@/types/market-value';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface PlayerValuationCardProps {
  playerId: string;
  className?: string;
  onValuationComplete?: (valuation: PlayerValuation) => void;
}

export function PlayerValuationCard({
  playerId,
  className = '',
  onValuationComplete,
}: PlayerValuationCardProps) {
  const [valuation, setValuation] = useState<PlayerValuation | null>(null);
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countUpValue, setCountUpValue] = useState(0);

  // Fetch player info
  useEffect(() => {
    const fetchPlayerInfo = async () => {
      try {
        const response = await apiClient.getPlayer(playerId);
        setPlayerInfo(response.player);
      } catch (err) {
        console.error('Error fetching player info:', err);
      }
    };

    if (playerId) {
      fetchPlayerInfo();
    }
  }, [playerId]);

  // Count-up animation for value
  useEffect(() => {
    if (valuation) {
      let start = 0;
      const end = valuation.estimatedValue;
      const duration = 2000; // 2 seconds
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCountUpValue(end);
          clearInterval(timer);
        } else {
          setCountUpValue(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [valuation]);

  const handleGetValuation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketValueApi.getPlayerValuation(playerId);
      setValuation(data);
      toast.success('Valuation generated successfully');
      if (onValuationComplete) {
        onValuationComplete(data);
      }
    } catch (err: any) {
      console.error('Error fetching valuation:', err);
      const errorMessage = err.message || 'Failed to get valuation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setValuation(null);
    setCountUpValue(0);
    handleGetValuation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl overflow-hidden ${className}`}
    >
      {/* Player Header */}
      <div className="relative bg-gradient-to-br from-arcane-accent/10 to-transparent p-6 border-b border-arcane-darkBorder/50">
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
          <div className="w-16 h-16 rounded-full bg-arcane-darkBorder/50 border-2 border-arcane-accent/30 flex items-center justify-center overflow-hidden">
            {playerInfo?.profilePicture ? (
              <img
                src={playerInfo.profilePicture}
                alt={playerInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-arcane-accent" />
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <h3 className="text-xl font-black text-white mb-1">
              {playerInfo?.name || 'Loading...'}
            </h3>
            {playerInfo && (
              <div className="flex items-center gap-3 text-sm text-arcane-grey">
                <span className="font-bold text-arcane-accent">{playerInfo.position}</span>
                <span>•</span>
                <span>{playerInfo.age || 'N/A'} years</span>
                {playerInfo.currentClub && (
                  <>
                    <span>•</span>
                    <span>{playerInfo.currentClub}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ML Badge */}
          <div className="px-3 py-1.5 bg-arcane-accent/20 border border-arcane-accent/30 rounded-full">
            <span className="text-xs font-bold text-arcane-accent uppercase">ML Powered</span>
          </div>
        </div>
      </div>

      {/* Valuation Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-12 w-12 text-arcane-accent animate-spin mb-4" />
              <p className="text-white font-bold mb-1">Analyzing Player Data...</p>
              <p className="text-sm text-arcane-grey">This may take a few seconds</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-white font-bold mb-1">Error</p>
              <p className="text-sm text-arcane-grey text-center mb-4">{error}</p>
              <Button onClick={handleGetValuation} variant="outline" size="sm">
                Try Again
              </Button>
            </motion.div>
          ) : valuation ? (
            <motion.div
              key="valuation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Estimated Value */}
              <div className="text-center">
                <p className="text-sm text-arcane-grey uppercase tracking-wider mb-2">
                  Estimated Market Value
                </p>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-6xl font-black text-arcane-accent mb-2"
                >
                  €{countUpValue.toFixed(1)}M
                </motion.div>
                <p className="text-sm text-arcane-grey">
                  Range: €{valuation.confidenceInterval.low.toFixed(1)}M - €
                  {valuation.confidenceInterval.high.toFixed(1)}M
                </p>
              </div>

              {/* Confidence Indicator */}
              <div className="flex justify-center">
                <ConfidenceIndicator
                  score={valuation.confidenceScore}
                  interval={[valuation.confidenceInterval.low, valuation.confidenceInterval.high]}
                />
              </div>

              {/* Model Info */}
              <div className="flex items-center justify-between pt-4 border-t border-arcane-darkBorder/50 text-xs text-arcane-grey">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-arcane-accent" />
                  <span>Model: {valuation.modelVersion}</span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 text-arcane-accent hover:text-arcane-accent/80 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-arcane-accent/20 border border-arcane-accent/30 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-arcane-accent" />
              </div>
              <p className="text-white font-bold mb-2">Ready to Valuate</p>
              <p className="text-sm text-arcane-grey text-center mb-6 max-w-sm">
                Get an AI-powered market value estimation based on performance, age, and position
              </p>
              <Button
                onClick={handleGetValuation}
                className="bg-arcane-accent hover:bg-arcane-accent/80 text-arcane-dark font-black"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Valuation
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
