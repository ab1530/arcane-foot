'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationStats } from '../types';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface ValidationStatsProps {
  stats: VerificationStats;
  isLoading?: boolean;
}

const COLORS = {
  pending: '#E4FF3B',
  verified: '#10B981',
  rejected: '#EF4444',
  suspicious: '#F59E0B',
};

export const ValidationStats: React.FC<ValidationStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-arcane-darkBorder rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-arcane-darkBorder rounded w-16 mb-2"></div>
              <div className="h-3 bg-arcane-darkBorder rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Pending',
      value: stats.statusBreakdown.pending,
      percentage: stats.percentages.pending,
      icon: Clock,
      color: COLORS.pending,
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Verified',
      value: stats.statusBreakdown.verified,
      percentage: stats.percentages.verified,
      icon: CheckCircle,
      color: COLORS.verified,
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Rejected',
      value: stats.statusBreakdown.rejected,
      percentage: stats.percentages.rejected,
      icon: XCircle,
      color: COLORS.rejected,
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Suspicious',
      value: stats.statusBreakdown.suspicious,
      percentage: stats.percentages.suspicious,
      icon: AlertTriangle,
      color: COLORS.suspicious,
      bgColor: 'bg-orange-500/10',
    },
  ];

  const pieChartData = [
    { name: 'Pending', value: stats.statusBreakdown.pending, color: COLORS.pending },
    { name: 'Verified', value: stats.statusBreakdown.verified, color: COLORS.verified },
    { name: 'Rejected', value: stats.statusBreakdown.rejected, color: COLORS.rejected },
    { name: 'Suspicious', value: stats.statusBreakdown.suspicious, color: COLORS.suspicious },
  ];

  const barChartData = [
    {
      name: 'Last 30 Days',
      Validations: stats.recentActivity.validationsLast30Days,
      Rejections: stats.recentActivity.rejectionsLast30Days,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-arcane-darkBorder hover:border-arcane-accent/30 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal text-arcane-grey uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-arcane-grey">
                      {stat.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-arcane-darkBorder">
            <CardHeader>
              <CardTitle className="text-lg font-ananstonExpanded uppercase">
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1425',
                      border: '1px solid #1B2133',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-arcane-darkBorder">
            <CardHeader>
              <CardTitle className="text-lg font-ananstonExpanded uppercase">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1B2133" />
                  <XAxis dataKey="name" stroke="#9FA1A9" />
                  <YAxis stroke="#9FA1A9" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1425',
                      border: '1px solid #1B2133',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Validations" fill={COLORS.verified} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Rejections" fill={COLORS.rejected} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Total Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-arcane-darkBorder bg-gradient-to-r from-arcane-darkCard to-arcane-darkAlt">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-arcane-grey uppercase tracking-wider mb-2">
                  Total Public Players
                </div>
                <div className="text-4xl font-bold text-arcane-accent">
                  {stats.totalPublicPlayers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-arcane-grey mb-2">Last 30 Days Activity</div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      +{stats.recentActivity.validationsLast30Days}
                    </div>
                    <div className="text-xs text-arcane-grey">Validated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      -{stats.recentActivity.rejectionsLast30Days}
                    </div>
                    <div className="text-xs text-arcane-grey">Rejected</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
