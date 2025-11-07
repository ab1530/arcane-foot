'use client';

import { motion } from 'framer-motion';
import { Brain, Database, Sparkles, CheckCircle } from 'lucide-react';
import { GenerationProgress as ProgressType } from '@/types/auto-scout';

interface GenerationProgressProps {
  progress: ProgressType;
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const stages = [
    { id: 'fetching_stats', label: 'Fetching Player Data', icon: Database },
    { id: 'generating', label: 'Generating Report', icon: Brain },
    { id: 'scoring', label: 'Quality Scoring', icon: Sparkles },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === progress.stage);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-white">
            {progress.message}
          </span>
          <span className="text-sm text-gray-400">
            {progress.progress}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#E4FF3B] to-[#B8CC2F] rounded-full"
          />
        </div>
        {progress.estimatedTimeRemaining !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Estimated time remaining: ~{progress.estimatedTimeRemaining}s
          </p>
        )}
      </div>

      {/* Stage indicators */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${isActive
                  ? 'border-[#E4FF3B] bg-[#E4FF3B]/10'
                  : isComplete
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-white/10 bg-black/30'
                }
              `}
            >
              {/* Icon */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isActive
                      ? 'bg-[#E4FF3B] text-black'
                      : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-white/5 text-gray-500'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Label */}
                <span
                  className={`
                    text-xs text-center font-medium
                    ${isActive
                      ? 'text-[#E4FF3B]'
                      : isComplete
                      ? 'text-green-400'
                      : 'text-gray-500'
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>

              {/* Pulse animation for active stage */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-[#E4FF3B]"
                  animate={{
                    opacity: [0.5, 0, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Checkmark for complete */}
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* GPT-4 indicator */}
      {progress.stage === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Brain className="w-6 h-6 text-purple-400" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-white">
              GPT-4 is analyzing player data...
            </p>
            <p className="text-xs text-gray-400">
              This may take 5-10 seconds
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
