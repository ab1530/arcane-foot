'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Upload,
  FileText,
  Video,
  Mic,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trophy,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import { PremiumCard, FeatureCard } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// AI Auto-Scout V2 - Premium Design
export default function AutoScoutV2() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    { label: 'Analyzing Match Data', icon: Brain, color: 'primary' },
    { label: 'Processing Video Footage', icon: Video, color: 'secondary' },
    { label: 'Evaluating Performance', icon: TrendingUp, color: 'success' },
    { label: 'Generating Insights', icon: Sparkles, color: 'warning' },
    { label: 'Creating Report', icon: FileText, color: 'primary' },
  ];

  const startGeneration = () => {
    setGenerating(true);
    setProgress(0);
    setStep(0);

    // Simulate generation process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return prev + 2;
      });

      setStep((prev) => {
        const newStep = Math.floor((prev + 2) / 20);
        return Math.min(newStep, steps.length - 1);
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/5 to-secondary-50/5 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-2xl"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Brain className="h-12 w-12" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            AI Auto-Scout
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">
            Generate professional scouting reports in seconds with AI
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <PremiumCard variant="glass" className="h-full">
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Upload className="h-6 w-6 text-primary-500" />
                  Input Sources
                </h2>

                {/* Input Options */}
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                  {[
                    { icon: Video, label: 'Match Video', status: 'ready' },
                    { icon: FileText, label: 'Match Data', status: 'ready' },
                    { icon: Mic, label: 'Voice Notes', status: 'optional' },
                    { icon: Camera, label: 'Photos', status: 'optional' },
                  ].map((input) => (
                    <motion.div
                      key={input.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                        ${
                          input.status === 'ready'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-500'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input.icon
                          className={`h-6 w-6 ${
                            input.status === 'ready'
                              ? 'text-green-600'
                              : 'text-neutral-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {input.label}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {input.status === 'ready' ? 'Ready' : 'Optional'}
                          </p>
                        </div>
                        {input.status === 'ready' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Player Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Target Player</h3>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center">
                        <Target className="h-8 w-8 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Kylian Mbappé</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Forward • Paris Saint-Germain • #7
                        </p>
                      </div>
                      <Button variant="outline">Change</Button>
                    </div>
                  </div>
                </div>

                {/* Generation Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={startGeneration}
                    disabled={generating}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-xl"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Generate AI Report
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Progress Section */}
                <AnimatePresence>
                  {generating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-8"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            Processing...
                          </span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />

                        {/* Steps */}
                        <div className="space-y-3 mt-6">
                          {steps.map((s, index) => (
                            <motion.div
                              key={s.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{
                                opacity: index <= step ? 1 : 0.3,
                                x: 0,
                              }}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`
                                  p-2 rounded-lg transition-all
                                  ${
                                    index <= step
                                      ? 'bg-primary-100 dark:bg-primary-900/30'
                                      : 'bg-neutral-100 dark:bg-neutral-800'
                                  }
                                `}
                              >
                                <s.icon
                                  className={`h-4 w-4 ${
                                    index <= step
                                      ? 'text-primary-600'
                                      : 'text-neutral-400'
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-sm ${
                                  index <= step
                                    ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                                    : 'text-neutral-500'
                                }`}
                              >
                                {s.label}
                              </span>
                              {index < step && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                              )}
                              {index === step && (
                                <Loader2 className="h-4 w-4 text-primary-500 ml-auto animate-spin" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Quality Score */}
            <PremiumCard variant="gradient">
              <div className="p-6 text-center">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quality Score</h3>
                <div className="flex justify-center items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                  Professional Grade Reports
                </p>
              </div>
            </PremiumCard>

            {/* Features */}
            <div className="space-y-4">
              <FeatureCard
                icon={Brain}
                title="AI Analysis"
                description="Advanced ML models trained on 100k+ reports"
              />
              <FeatureCard
                icon={Shield}
                title="Accuracy"
                description="95% accuracy validated by pro scouts"
              />
              <FeatureCard
                icon={Zap}
                title="Speed"
                description="Complete reports in under 30 seconds"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}