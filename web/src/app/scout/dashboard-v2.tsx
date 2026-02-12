'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Eye,
  Users,
  BarChart3,
  Activity,
  Zap,
  Trophy,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { PremiumCard, StatsCard, FeatureCard } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Scout Dashboard V2 - Premium Design
export default function ScoutDashboardV2() {
  // Mock data
  const stats = {
    reportsThisMonth: 12,
    reportsTotal: 156,
    playersTracked: 234,
    upcomingMatches: 5,
    pendingAssignments: 2,
    marketplaceOffers: 3,
    completionRate: 92,
    averageRating: 4.7,
  };

  const upcomingAssignments = [
    {
      id: 1,
      match: 'PSG vs Lyon',
      date: '2025-02-15',
      time: '20:45',
      venue: 'Parc des Princes',
      targetPlayer: 'Lyon #6',
      status: 'confirmed',
      homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/e/e2/Olympique_Lyonnais_logo.svg',
    },
    {
      id: 2,
      match: 'Monaco vs Marseille',
      date: '2025-02-18',
      time: '21:00',
      venue: 'Stade Louis II',
      targetPlayer: 'Multiple targets',
      status: 'pending',
      homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/AS_Monaco_FC.svg',
      awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/10 to-secondary-50/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Header Section */}
        <motion.div variants={item} className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Scout Dashboard
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Welcome back! Here&apos;s your scouting overview
            </p>
          </div>

          {/* Profile Card */}
          <PremiumCard variant="glass" padding="sm" className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary-500 ring-offset-2">
              <AvatarImage src="/scout-avatar.jpg" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Jean Scout
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Elite Scout • Ligue 1 Specialist
              </p>
            </div>
            <div className="ml-6 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-semibold">4.9</span>
              </div>
              <Badge className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0">
                PRO
              </Badge>
            </div>
          </PremiumCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="flex gap-4">
          {[
            { icon: FileText, label: 'Create Report', href: '/scout/reports/create', color: 'primary' },
            { icon: Clock, label: 'Voice Note', href: '/scout/reports/voice', color: 'secondary' },
            { icon: Target, label: 'Find Player', href: '/scout/players/search', color: 'success' },
            { icon: Calendar, label: 'View Calendar', href: '/scout/calendar', color: 'warning' },
          ].map((action, index) => (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={action.href}>
                <Button
                  className={`
                    relative overflow-hidden
                    bg-gradient-to-r from-${action.color}-500 to-${action.color}-600
                    hover:from-${action.color}-600 hover:to-${action.color}-700
                    text-white border-0 shadow-lg hover:shadow-xl
                    transition-all duration-300
                  `}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Reports This Month"
            value={stats.reportsThisMonth}
            change={{ value: '+15%', trend: 'up' }}
            icon={FileText}
            color="primary"
          />
          <StatsCard
            title="Players Tracked"
            value={stats.playersTracked}
            change={{ value: '+12', trend: 'up' }}
            icon={Eye}
            color="secondary"
          />
          <StatsCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            change={{ value: '+2%', trend: 'up' }}
            icon={CheckCircle}
            color="success"
          />
          <StatsCard
            title="Average Rating"
            value={stats.averageRating}
            change={{ value: 'Stable', trend: 'neutral' }}
            icon={Star}
            color="warning"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Upcoming Assignments */}
          <motion.div variants={item} className="lg:col-span-4">
            <PremiumCard
              variant="glass"
              title="Upcoming Assignments"
              subtitle="Your scheduled match observations"
              badge={`${stats.pendingAssignments} pending`}
              action={
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              }
            >
              <div className="space-y-4">
                <AnimatePresence>
                  {upcomingAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Team Logos */}
                          <div className="flex items-center -space-x-2">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 p-2 shadow-md">
                              <img
                                src={assignment.homeTeamLogo}
                                alt="Home team"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 p-2 shadow-md">
                              <img
                                src={assignment.awayTeamLogo}
                                alt="Away team"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {assignment.match}
                              </h4>
                              {assignment.status === 'pending' ? (
                                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {assignment.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {assignment.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {assignment.venue}
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Target: {' '}
                              </span>
                              <span className="text-sm text-primary-600 dark:text-primary-400">
                                {assignment.targetPlayer}
                              </span>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-medium text-sm transition-colors"
                        >
                          View Details
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Activity Chart */}
          <motion.div variants={item} className="lg:col-span-3">
            <PremiumCard
              variant="gradient"
              title="Activity Overview"
              subtitle="Your performance this week"
              icon={Activity}
            >
              <div className="space-y-6">
                {/* Mini Chart */}
                <div className="flex items-end justify-between h-32 gap-2">
                  {[40, 65, 45, 80, 95, 75, 90].map((height, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-primary-500 to-secondary-500 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  {[
                    { label: 'Reports Submitted', value: 7, max: 10 },
                    { label: 'Players Analyzed', value: 23, max: 30 },
                    { label: 'Matches Attended', value: 4, max: 5 },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {stat.label}
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {stat.value}/{stat.max}
                        </span>
                      </div>
                      <Progress
                        value={(stat.value / stat.max) * 100}
                        className="h-2 bg-neutral-200 dark:bg-neutral-800"
                      />
                    </div>
                  ))}
                </div>

                {/* Achievement */}
                <motion.div
                  className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Top Scout This Week! 🎉
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        You&apos;ve submitted the most reports
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Zap}
            title="AI Auto-Scout"
            description="Generate reports instantly with AI assistance"
            action={{ label: 'Try Now', onClick: () => {} }}
            gradient
          />
          <FeatureCard
            icon={Users}
            title="Player Database"
            description="Access 10,000+ player profiles and stats"
            action={{ label: 'Browse', onClick: () => {} }}
          />
          <FeatureCard
            icon={DollarSign}
            title="Marketplace"
            description="3 new offers from top clubs"
            action={{ label: 'View Offers', onClick: () => {} }}
          />
          <FeatureCard
            icon={BarChart3}
            title="Analytics"
            description="Track your scouting performance"
            action={{ label: 'View Stats', onClick: () => {} }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}