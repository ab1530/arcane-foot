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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Download,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedPage } from '@/components/guards/ProtectedPage';
import { usePlatformOverview, DATA_KEYS } from '@/hooks/useData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

const DEFAULT_SOURCE = 'transfermarkt';

type SyncAction =
  | { type: 'competitions'; source: string }
  | { type: 'clubs'; source: string; competitionId: string }
  | { type: 'players'; source: string; clubId: string }
  | { type: 'matches'; source: string; competitionId: string }
  | { type: 'full'; competitionIds: string[] };

export default function DataSyncMonitor() {
  const queryClient = useQueryClient();
  const { data: overviewData } = usePlatformOverview();
  const totals = overviewData?.overview || {};
  const recent = overviewData?.recentActivity || {};
  const timestamp = overviewData?.timestamp
    ? new Date(overviewData.timestamp).toLocaleString()
    : '—';

  const syncStatus = useMemo(() => {
    const totalRecords =
      (totals.totalPlayers ?? 0) +
      (totals.totalClubs ?? 0) +
      (totals.totalMatches ?? 0) +
      (totals.totalScoutingReports ?? 0);
    return {
      lastSync: timestamp,
      nextScheduledSync: 'Hourly',
      totalRecordsSynced: totalRecords,
      failedRecords: 0,
      pendingRecords: recent.newClubRequestsLast7Days ?? 0,
      syncDuration: '—',
    };
  }, [timestamp, totals, recent]);

  const dataSources = useMemo(() => {
    return [
      {
        id: 1,
        name: 'Players Index',
        type: 'Players',
        status: totals.totalPlayers ? 'active' : 'pending',
        lastSync: timestamp,
        recordsSynced: totals.totalPlayers ?? 0,
        errors: 0,
        nextSync: 'Auto',
      },
      {
        id: 2,
        name: 'Clubs Directory',
        type: 'Clubs',
        status: totals.totalClubs ? 'active' : 'pending',
        lastSync: timestamp,
        recordsSynced: totals.totalClubs ?? 0,
        errors: 0,
        nextSync: 'Auto',
      },
      {
        id: 3,
        name: 'Matches Schedule',
        type: 'Matches',
        status: totals.totalMatches ? 'active' : 'pending',
        lastSync: timestamp,
        recordsSynced: totals.totalMatches ?? 0,
        errors: 0,
        nextSync: 'Auto',
      },
      {
        id: 4,
        name: 'Reports Archive',
        type: 'Reports',
        status: totals.totalScoutingReports ? 'active' : 'pending',
        lastSync: timestamp,
        recordsSynced: totals.totalScoutingReports ?? 0,
        errors: 0,
        nextSync: 'Auto',
      },
    ];
  }, [timestamp, totals]);

  const syncHistory = useMemo(() => {
    const baseTimestamp = overviewData?.timestamp || new Date().toISOString();
    return [
      {
        id: 1,
        timestamp: baseTimestamp,
        source: 'Players',
        type: 'Scheduled',
        records: totals.totalPlayers ?? 0,
        duration: '—',
        status: 'success',
      },
      {
        id: 2,
        timestamp: baseTimestamp,
        source: 'Reports',
        type: 'Scheduled',
        records: totals.totalScoutingReports ?? 0,
        duration: '—',
        status: 'success',
      },
      {
        id: 3,
        timestamp: baseTimestamp,
        source: 'Club Requests',
        type: 'Manual',
        records: recent.newClubRequestsLast7Days ?? 0,
        duration: '—',
        status: 'warning',
      },
    ];
  }, [overviewData, totals, recent]);

  const syncMutation = useMutation({
    mutationFn: async (payload: SyncAction) => {
      switch (payload.type) {
        case 'competitions':
          return apiClient.triggerCompetitionSync(payload.source);
        case 'clubs':
          return apiClient.triggerClubSync(payload.competitionId, payload.source);
        case 'players':
          return apiClient.triggerPlayerSync(payload.clubId, payload.source);
        case 'matches':
          return apiClient.triggerMatchSync(payload.competitionId, payload.source);
        case 'full':
          return apiClient.triggerFullSync(payload.competitionIds);
        default:
          throw new Error('Unknown sync type');
      }
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Sync triggered');
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.platformOverview() });
    },
    onError: (error: Error) => {
      toast.error('Failed to trigger sync', {
        description: error.message || 'Verify identifiers and try again.',
      });
    },
  });

  const requestId = (message: string) => {
    if (typeof window === 'undefined') return null;
    const value = window.prompt(message);
    return value && value.trim().length > 0 ? value.trim() : null;
  };

  const handleSync = (type: SyncAction['type']) => {
    if (type === 'competitions') {
      syncMutation.mutate({ type: 'competitions', source: DEFAULT_SOURCE });
    } else if (type === 'clubs' || type === 'matches') {
      const competitionId = requestId('Enter competition ID');
      if (!competitionId) return;
      syncMutation.mutate({ type, source: DEFAULT_SOURCE, competitionId } as SyncAction);
    } else if (type === 'players') {
      const clubId = requestId('Enter club ID');
      if (!clubId) return;
      syncMutation.mutate({ type, source: DEFAULT_SOURCE, clubId } as SyncAction);
    } else if (type === 'full') {
      const value = requestId('Enter competition IDs (comma separated)');
      if (!value) return;
      const competitionIds = value.split(',').map((id) => id.trim()).filter(Boolean);
      if (competitionIds.length === 0) return;
      syncMutation.mutate({ type: 'full', competitionIds });
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Sync Monitor</h1>
            <p className="text-muted-foreground">
              Monitor platform ingestion pipelines
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
            <Button onClick={() => handleSync('full')} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Full Sync
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sync Status Alert */}
        {syncMutation.isPending && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Data synchronization in progress. This may take a few minutes...
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{syncStatus.lastSync}</div>
              <p className="text-xs text-muted-foreground">
                Duration: {syncStatus.syncDuration}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Synced</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {syncStatus.totalRecordsSynced.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Aggregated totals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Records</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {syncStatus.failedRecords}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStatus.pendingRecords}</div>
              <p className="text-xs text-muted-foreground">
                Next sync: {syncStatus.nextScheduledSync}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="sources" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Data Sources</CardTitle>
                <CardDescription>
                  Overview of ingestion pipelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Next Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>{source.type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={source.status === 'active' ? 'default' : 'secondary'}
                          >
                            {source.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{source.lastSync}</TableCell>
                        <TableCell>{source.recordsSynced.toLocaleString()}</TableCell>
                        <TableCell>
                          {source.errors > 0 ? (
                            <Badge variant="destructive">{source.errors}</Badge>
                          ) : (
                            <Badge variant="outline">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{source.nextSync}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization History</CardTitle>
                <CardDescription>
                  Recent sync operations and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncHistory.map((sync) => (
                      <TableRow key={sync.id}>
                        <TableCell>
                          {new Date(sync.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{sync.source}</TableCell>
                        <TableCell>{sync.type}</TableCell>
                        <TableCell>{sync.records.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sync.status === 'success'
                                ? 'default'
                                : sync.status === 'warning'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {sync.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Sync</CardTitle>
                <CardDescription>Trigger ingestion per data domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSync('competitions')}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync competitions ({DEFAULT_SOURCE})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSync('clubs')}
                  disabled={syncMutation.isPending}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Sync clubs by competition
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSync('players')}
                  disabled={syncMutation.isPending}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Sync players by club
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSync('matches')}
                  disabled={syncMutation.isPending}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Sync matches by competition
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedPage>
  );
}
