'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  BarChart3,
  Shield,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ProtectedPage } from '@/components/guards/ProtectedPage';
import { usePlatformOverview } from '@/hooks/useData';
import { useLanguage } from '@/contexts/language-context';

// SUPER_ADMIN Dashboard
export default function SuperAdminDashboard() {
  const { data: platformOverview, isLoading } = usePlatformOverview();
  const { language } = useLanguage();
  const overview = platformOverview?.overview || {};
  const recent = platformOverview?.recentActivity || {};

  const stats = {
    totalUsers: overview.totalUsers ?? 0,
    totalPlayers: overview.totalPlayers ?? 0,
    totalMatches: overview.totalMatches ?? 0,
    totalReports: overview.totalScoutingReports ?? 0,
    totalEvents: overview.totalEvents ?? 0,
    totalRequests: overview.totalClubRequests ?? 0,
    systemHealth:
      overview.totalUsers && recent.newUsersLast7Days
        ? Math.min(100, Math.round((recent.newUsersLast7Days / overview.totalUsers) * 100))
        : 75,
  };

  const recentActivities = [
    recent.newUsersLast7Days !== undefined && {
      id: 1,
      type: 'user_signup',
      message:
        language === 'fr'
          ? `${recent.newUsersLast7Days} nouveaux utilisateurs ces 7 derniers jours`
          : `${recent.newUsersLast7Days} new users in the last 7 days`,
      timestamp: new Date().toISOString(),
      status: 'success',
    },
    recent.newPlayersLast7Days !== undefined && {
      id: 2,
      type: 'player_signup',
      message:
        language === 'fr'
          ? `${recent.newPlayersLast7Days} nouveaux joueurs ajoutés`
          : `${recent.newPlayersLast7Days} new players added`,
      timestamp: new Date().toISOString(),
      status: 'success',
    },
    recent.newScoutingReportsLast7Days !== undefined && {
      id: 3,
      type: 'reports',
      message:
        language === 'fr'
          ? `${recent.newScoutingReportsLast7Days} rapports déposés`
          : `${recent.newScoutingReportsLast7Days} scouting reports submitted`,
      timestamp: new Date().toISOString(),
      status: 'info',
    },
    recent.newClubRequestsLast7Days !== undefined && {
      id: 4,
      type: 'club_requests',
      message:
        language === 'fr'
          ? `${recent.newClubRequestsLast7Days} demandes de clubs`
          : `${recent.newClubRequestsLast7Days} club requests`,
      timestamp: new Date().toISOString(),
      status: 'warning',
    },
  ].filter(Boolean) as {
    id: number;
    type: string;
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }[];

  return (
    <ProtectedPage>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground">
          Complete overview of Arcane platform
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/admin/validation">
          <Button variant="default">
            <UserCheck className="mr-2 h-4 w-4" />
            Review Validations
            <Badge className="ml-2" variant="secondary">
              {(recent.newClubRequestsLast7Days ?? 0).toLocaleString()}
            </Badge>
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
            <CardDescription>Academy camps & initiatives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Club Requests</CardTitle>
            <CardDescription>Opportunities awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scouting Reports</CardTitle>
            <CardDescription>Total submitted reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReports.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {activity.status === 'warning' && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {activity.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {activity.status === 'info' && (
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Snapshot */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Platform Snapshot</CardTitle>
            <CardDescription>Key metrics refreshed every few minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Clubs</span>
                <span className="font-semibold">{(overview.totalClubs ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Events</span>
                <span className="font-semibold">{(overview.totalEvents ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kanban Boards</span>
                <span className="font-semibold">{(overview.totalKanbanBoards ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timestamp</span>
                <span className="text-muted-foreground text-xs">
                  {platformOverview?.timestamp
                    ? new Date(platformOverview.timestamp).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')
                    : '--'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedPage>
  );
}
