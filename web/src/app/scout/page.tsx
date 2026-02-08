'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useDashboardStats, useReports, useMatches } from '@/hooks/useData';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/composite/Progress/Skeleton';

// SCOUT Dashboard
export default function ScoutDashboard() {
  const { data: dashboardData } = useDashboardStats();
  const reportsQuery = useReports({ limit: 5 });
  const matchesQuery = useMatches({ limit: 5 });
  const marketplaceQuery = useQuery({
    queryKey: ['marketplace', 'scout-dashboard'],
    queryFn: () => apiClient.searchScoutListings({ limit: 3 }),
    staleTime: 60000,
  });

  const analytics = dashboardData || {};
  const reportsData = reportsQuery.data?.data ?? [];
  const matchesData = matchesQuery.data?.data ?? [];
  const marketplaceData = marketplaceQuery.data?.data ?? [];

  const stats = useMemo(() => {
    const totalReports =
      analytics.totalReports ??
      analytics.totalScoutingReports ??
      analytics.overview?.totalScoutingReports ??
      0;
    const reportsLast30Days = analytics.reportsLast30Days ?? totalReports;
    const completionRate =
      totalReports === 0
        ? 0
        : Math.min(
            100,
            Math.round(((analytics.reportsLast7Days ?? reportsLast30Days) / totalReports) * 100),
          );
    return {
      reportsThisMonth: reportsLast30Days ?? 0,
      reportsTotal: totalReports,
      playersTracked: analytics.totalPlayers ?? analytics.overview?.totalPlayers ?? 0,
      upcomingMatches: matchesData.length,
      pendingAssignments: analytics.recentActivity?.newClubRequestsLast7Days ?? 0,
      marketplaceOffers: marketplaceData.length,
      completionRate,
      averageRating:
        reportsData.length > 0
          ? reportsData.reduce((sum: number, report: any) => sum + (report.overallRating || 0), 0) /
            reportsData.length
          : 0,
    };
  }, [analytics, matchesData.length, marketplaceData.length, reportsData]);

  const upcomingAssignments = matchesData.slice(0, 3).map((match: any, index: number) => ({
    id: match.id ?? index,
    match: `${match.homeClub?.name || 'TBD'} vs ${match.awayClub?.name || 'TBD'}`,
    date: match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString() : '—',
    time: match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString() : '—',
    venue: match.venue || match.stadium || 'TBD',
    targetPlayer: match.targetPlayer || 'Multiple targets',
    status: 'scheduled',
  }));

  const recentReports = reportsData.slice(0, 3).map((report: any, index: number) => ({
    id: report.id ?? index,
    player: report.player?.fullName || report.playerName || 'Unknown player',
    club: report.player?.club?.name || report.club?.name || 'N/A',
    position: report.player?.position || report.position || 'N/A',
    rating: report.overallRating || 0,
    status: report.status || 'submitted',
    date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—',
  }));

  const marketplaceOffers = marketplaceData.map((listing: any) => ({
    id: listing.id,
    club: listing.club?.name || listing.clientName || 'Club',
    type: listing.serviceType || 'Assignment',
    budget: listing.budget ? `€${listing.budget.toLocaleString()}` : 'N/A',
    deadline: listing.deadline ? new Date(listing.deadline).toLocaleDateString() : 'Flexible',
    status: listing.status || 'new',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scout Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your scouting overview
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/scout/reports/create">
          <Button variant="default">
            <FileText className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </Link>
        <Link href="/scout/reports/voice">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Voice Note
          </Button>
        </Link>
        <Link href="/scout/players/search">
          <Button variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Find Player
          </Button>
        </Link>
        <Link href="/scout/calendar">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reportsTotal} total reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players Tracked</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.playersTracked}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.floor(stats.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Upcoming Assignments */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Your scheduled match observations</CardDescription>
              </div>
              <Badge variant="secondary">{stats.pendingAssignments} pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{assignment.match}</h4>
                      {assignment.status === 'pending' && (
                        <Badge variant="outline" className="text-yellow-600">
                          Pending
                        </Badge>
                      )}
                      {assignment.status === 'confirmed' && (
                        <Badge variant="outline" className="text-green-600">
                          Confirmed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                    <p className="text-sm mt-1">
                      <span className="font-medium">Target:</span> {assignment.targetPlayer}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Offers */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Marketplace Offers</CardTitle>
                <CardDescription>New opportunities</CardDescription>
              </div>
              <Badge variant="default">{stats.marketplaceOffers} new</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketplaceOffers.map((offer) => (
                <div key={offer.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{offer.club}</p>
                        {offer.status === 'new' && (
                          <Badge variant="destructive" className="h-5 px-1">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{offer.type}</p>
                      <p className="text-sm font-semibold mt-1">{offer.budget}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-xs font-medium">{offer.deadline}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/scout/offers">
              <Button variant="outline" className="w-full mt-4">
                View All Offers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest scouting reports</CardDescription>
            </div>
            <Link href="/scout/reports">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold">{report.position}</span>
                  </div>
                  <div>
                    <p className="font-medium">{report.player}</p>
                    <p className="text-sm text-muted-foreground">{report.club}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Rating: {report.rating}/10</p>
                    <p className="text-xs text-muted-foreground">{report.date}</p>
                  </div>
                  <Badge
                    variant={
                      report.status === 'approved'
                        ? 'default'
                        : report.status === 'submitted'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
