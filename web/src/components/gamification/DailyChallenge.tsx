'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Star, Trophy, Flame } from 'lucide-react';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardHeader } from '@/components/primitives/Card/CardHeader';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { Badge } from '@/components/primitives/Badge/Badge';
import { cn } from '@/lib/utils';
import { DailyChallenge as DailyChallengeType, getTimeRemaining } from '@/lib/api/gamification';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface DailyChallengeProps {
  challenge: DailyChallengeType;
  onClaim?: () => void;
  onComplete?: () => void;
  variant?: 'card' | 'compact';
  showHistory?: boolean;
}

/**
 * DailyChallenge - Display daily challenge with countdown and rewards
 *
 * Features:
 * - Progress tracking
 * - Countdown timer
 * - XP reward display
 * - Completion animation (confetti)
 * - Claim reward button
 * - Difficulty indicator
 * - Auto-refresh at expiry
 */
export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  challenge,
  onClaim,
  onComplete,
  variant = 'card',
  showHistory = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(challenge.expiresAt));
  const [showConfetti, setShowConfetti] = useState(false);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(challenge.expiresAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  // Listen for challenge completion events
  useEffect(() => {
    const handleCompletion = () => {
      setShowConfetti(true);
      triggerConfetti();
    };

    window.addEventListener('challenge-completed', handleCompletion);
    return () => window.removeEventListener('challenge-completed', handleCompletion);
  }, []);

  const progressPercentage = (challenge.progress.current / challenge.progress.total) * 100;
  const isCompleted = challenge.isCompleted;
  const isClaimed = challenge.isClaimed;
  const canClaim = isCompleted && !isClaimed;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'hard':
        return 'text-error';
      default:
        return 'text-info';
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleClaimClick = () => {
    if (canClaim && onClaim) {
      triggerConfetti();
      onClaim();
    }
  };

  if (variant === 'compact') {
    return (
      <ArcaneCard
        variant="feature"
        className={cn(
          'border-l-4',
          isCompleted ? 'border-l-success' : 'border-l-arcane-yellow'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                isCompleted ? 'bg-success/20' : 'bg-arcane-yellow/20'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <span className="text-2xl">{challenge.icon}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Text size="sm" weight="semibold" className="mb-1 truncate">
                {challenge.title}
              </Text>
              <div className="flex items-center gap-2">
                <Text size="xs" color="tertiary">
                  {challenge.progress.current} / {challenge.progress.total}
                </Text>
                <span className="text-arcane-gray-500">•</span>
                <Text size="xs" className="text-arcane-yellow">
                  +{challenge.xpReward} XP
                </Text>
              </div>
            </div>

            {/* Action */}
            {canClaim && onClaim && (
              <ArcaneButton variant="primary" size="sm" onClick={handleClaimClick}>
                Claim
              </ArcaneButton>
            )}
          </div>
        </CardContent>
      </ArcaneCard>
    );
  }

  return (
    <ArcaneCard
      variant="feature"
      glow={isCompleted}
      className={cn(
        'relative overflow-hidden',
        isCompleted && 'border-success/30 shadow-glow-success'
      )}
    >
      {/* Completion overlay animation */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-success/10 via-success/5 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Challenge Icon */}
            <motion.div
              className={cn(
                'h-14 w-14 rounded-lg flex items-center justify-center',
                isCompleted
                  ? 'bg-success/20 border-2 border-success/50'
                  : 'bg-arcane-yellow/20 border-2 border-arcane-yellow/50'
              )}
              animate={
                !isCompleted
                  ? {
                      scale: [1, 1.05, 1],
                    }
                  : undefined
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-7 w-7 text-success" />
              ) : (
                <span className="text-3xl">{challenge.icon}</span>
              )}
            </motion.div>

            {/* Title & Badges */}
            <div>
              <Heading level={5} className="mb-2">
                {challenge.title}
              </Heading>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="premium" size="sm" icon={<Star />}>
                  +{challenge.xpReward} XP
                </Badge>
                {challenge.difficulty && (
                  <Badge variant="info" size="sm">
                    <span className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </span>
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="success" size="sm" icon={<Trophy />}>
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-arcane-gray-400" />
              <Text size="sm" weight="semibold" color="secondary">
                {timeRemaining}
              </Text>
            </div>
            <Text size="xs" color="tertiary">
              Time Remaining
            </Text>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <Text size="sm" color="secondary">
          {challenge.description}
        </Text>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text size="sm" weight="semibold" color="secondary">
              Progress
            </Text>
            <Text size="sm" weight="bold" className="text-arcane-yellow">
              {challenge.progress.current} / {challenge.progress.total}
            </Text>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-arcane-slate/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                isCompleted
                  ? 'bg-gradient-to-r from-success to-emerald-400'
                  : 'bg-gradient-to-r from-arcane-yellow to-yellow-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                boxShadow: isCompleted
                  ? '0 0 10px rgba(16, 185, 129, 0.5)'
                  : '0 0 10px rgba(228, 255, 59, 0.5)',
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Text size="xs" color="tertiary">
              {progressPercentage.toFixed(0)}% Complete
            </Text>
            {!isCompleted && (
              <Text size="xs" color="tertiary">
                {challenge.progress.total - challenge.progress.current} more to go
              </Text>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {canClaim && onClaim ? (
            <motion.div
              className="flex-1"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArcaneButton
                variant="primary"
                size="md"
                icon={<Trophy />}
                fullWidth
                onClick={handleClaimClick}
              >
                Claim Reward
              </ArcaneButton>
            </motion.div>
          ) : isCompleted ? (
            <div className="flex-1">
              <ArcaneButton variant="ghost" size="md" fullWidth disabled icon={<CheckCircle2 />}>
                Reward Claimed
              </ArcaneButton>
            </div>
          ) : onComplete ? (
            <div className="flex-1">
              <ArcaneButton
                variant="secondary"
                size="md"
                fullWidth
                onClick={onComplete}
                icon={<Flame />}
              >
                Continue Challenge
              </ArcaneButton>
            </div>
          ) : null}
        </div>

        {/* Streak Bonus (Optional) */}
        {isCompleted && (
          <motion.div
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Flame className="h-5 w-5 text-success" />
            <Text size="sm" weight="semibold" className="text-success">
              Daily streak maintained!
            </Text>
          </motion.div>
        )}
      </CardContent>
    </ArcaneCard>
  );
};

DailyChallenge.displayName = 'DailyChallenge';
