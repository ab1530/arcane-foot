'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Target, TrendingUp } from 'lucide-react';
import { getStyleColor, getStyleIcon } from '@/lib/utils/playstyle-colors';
import { StyleBadge } from './StyleBadge';
import type { StyleDefinition } from '@/types/playstyle-dna';

interface StyleDetailModalProps {
  style: StyleDefinition | null;
  open: boolean;
  onClose: () => void;
}

export function StyleDetailModal({ style, open, onClose }: StyleDetailModalProps) {
  if (!style) return null;

  const color = getStyleColor(style.styleName);
  const Icon = getStyleIcon(style.styleName);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 overflow-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-arcane-dark border border-arcane-darkBorder rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                  className="relative p-8 border-b border-arcane-darkBorder"
                  style={{
                    background: `linear-gradient(135deg, ${color}10, transparent)`,
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-arcane-darkCard/50 hover:bg-arcane-darkCard flex items-center justify-center transition-colors border border-arcane-darkBorder"
                  >
                    <X size={20} className="text-arcane-grey" />
                  </button>

                  {/* Icon and title */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${color}20`,
                        border: `2px solid ${color}40`,
                      }}
                    >
                      <Icon size={32} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white mb-2">{style.styleName}</h2>
                      <p className="text-arcane-greyLight leading-relaxed">{style.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                  {/* Ideal Positions */}
                  {style.idealPositions && style.idealPositions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin size={20} className="text-arcane-accent" />
                        <h3 className="text-lg font-semibold text-white">Ideal Positions</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {style.idealPositions.map((position) => (
                          <div
                            key={position}
                            className="px-3 py-1.5 rounded-lg bg-arcane-darkCard border border-arcane-darkBorder text-sm text-arcane-greyLight"
                          >
                            {position}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Characteristics */}
                  {style.characteristics && Object.keys(style.characteristics).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={20} className="text-arcane-accent" />
                        <h3 className="text-lg font-semibold text-white">Key Characteristics</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(style.characteristics).map(([key, value]) => (
                          <div
                            key={key}
                            className="p-3 rounded-lg bg-arcane-darkCard border border-arcane-darkBorder"
                          >
                            <div className="text-xs text-arcane-grey mb-1">{key}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-arcane-darkBorder rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${(value / 10) * 100}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                              <div className="text-sm font-semibold text-white">{value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Training Focus */}
                  {style.trainingFocus && style.trainingFocus.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-arcane-accent" />
                        <h3 className="text-lg font-semibold text-white">Training Focus</h3>
                      </div>
                      <div className="space-y-2">
                        {style.trainingFocus.map((focus, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-arcane-darkCard/50 border border-arcane-darkBorder"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                              style={{
                                backgroundColor: `${color}20`,
                                color,
                              }}
                            >
                              {index + 1}
                            </div>
                            <p className="text-sm text-arcane-greyLight flex-1">{focus}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-World Examples */}
                  {style.examplePlayers && style.examplePlayers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Real-World Examples</h3>
                      <div className="flex flex-wrap gap-3">
                        {style.examplePlayers.map((player) => (
                          <div
                            key={player}
                            className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105"
                            style={{
                              backgroundColor: `${color}10`,
                              borderColor: `${color}30`,
                              color,
                            }}
                          >
                            {player}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
