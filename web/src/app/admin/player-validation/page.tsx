'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ValidationStats } from './components/ValidationStats';
import { PlayerValidationList } from './components/PlayerValidationList';
import { BulkActions } from './components/BulkActions';
import { validationService } from '@/services/validationService';

export default function PlayerValidationPage() {
  // Fetch verification stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: () => validationService.getVerificationStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="min-h-screen bg-arcane-dark py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-arcane-accent/10 rounded-lg">
                <Shield className="w-8 h-8 text-arcane-accent" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-ananstonExpanded text-white uppercase">
                  Player Validation
                </h1>
                <p className="text-arcane-grey mt-1">
                  Manage and verify public player submissions
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="border-arcane-darkBorder bg-gradient-to-br from-arcane-accent/10 to-transparent">
              <CardContent className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-arcane-accent" />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {stats?.totalPublicPlayers || 0}
                    </div>
                    <div className="text-xs text-arcane-grey uppercase tracking-wider">
                      Total Players
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Validation Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {stats && <ValidationStats stats={stats} isLoading={statsLoading} />}
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-arcane-darkBorder bg-gradient-to-r from-arcane-darkCard to-arcane-darkAlt">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-xl font-bold font-ananstonExpanded text-white uppercase mb-2">
                    Recent Activity
                  </h2>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      <span className="text-arcane-grey">Last 30 days:</span>
                      <span className="font-bold text-white">
                        {stats?.recentActivity.validationsLast30Days || 0} validated
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-arcane-accent" />
                      <span className="text-arcane-grey">Pending review:</span>
                      <span className="font-bold text-white">
                        {stats?.statusBreakdown.pending || 0} players
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BulkActions />
        </motion.div>

        {/* Player List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PlayerValidationList />
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-arcane-grey text-sm">
            Player Validation Dashboard - Arcane Football Platform
          </p>
          <p className="text-arcane-grey text-xs mt-1">
            For support, contact the system administrator
          </p>
        </motion.div>
      </div>
    </div>
  );
}
