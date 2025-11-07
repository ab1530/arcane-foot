'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Player, VerificationStatus, FilterOptions } from '../types';
import { validationService } from '@/services/validationService';
import { PlayerDetailModal } from './PlayerDetailModal';

interface PlayerValidationListProps {
  initialStatus?: VerificationStatus;
}

export const PlayerValidationList: React.FC<PlayerValidationListProps> = ({ initialStatus }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: initialStatus,
    search: '',
    page: 1,
    limit: 20,
  });

  // Fetch players
  const { data, isLoading, error } = useQuery({
    queryKey: ['players', filters],
    queryFn: () => {
      if (filters.status) {
        return validationService.getPlayersByStatus(
          filters.status,
          filters.page,
          filters.limit
        );
      }
      return validationService.getPendingPlayers(filters.page, filters.limit);
    },
  });

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case VerificationStatus.VERIFIED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case VerificationStatus.REJECTED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case VerificationStatus.SUSPICIOUS:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    const statusConfig = {
      [VerificationStatus.PENDING]: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-500',
        label: 'Pending',
      },
      [VerificationStatus.VERIFIED]: {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        label: 'Verified',
      },
      [VerificationStatus.REJECTED]: {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        label: 'Rejected',
      },
      [VerificationStatus.SUSPICIOUS]: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-500',
        label: 'Suspicious',
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1 ${config.bg} ${config.text}`}
      >
        {getStatusIcon(status)}
        {config.label}
      </span>
    );
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status?: VerificationStatus) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <Card className="border-arcane-darkBorder">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-ananstonExpanded uppercase">
              Player List
            </CardTitle>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-arcane-grey" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 bg-arcane-darkBorder border border-arcane-darkBorder rounded-lg text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={!filters.status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter(undefined)}
            >
              All Pending
            </Button>
            {Object.values(VerificationStatus).map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-arcane-darkBorder/30 rounded-lg">
                  <div className="w-12 h-12 bg-arcane-darkBorder rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-arcane-darkBorder rounded w-1/4"></div>
                    <div className="h-3 bg-arcane-darkBorder rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-arcane-darkBorder rounded w-20"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-semibold mb-2">Failed to load players</p>
              <p className="text-arcane-grey text-sm">{(error as Error).message}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!data?.data || data.data.length === 0) && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-arcane-grey mx-auto mb-4" />
              <p className="text-arcane-grey font-semibold">No players found</p>
              <p className="text-arcane-grey text-sm mt-2">
                Try adjusting your filters or search query
              </p>
            </div>
          )}

          {/* Player List */}
          {!isLoading && !error && data?.data && data.data.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-arcane-darkBorder">
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Player
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Position
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Nationality
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-arcane-grey uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((player, index) => (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-arcane-darkBorder hover:bg-arcane-darkBorder/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {player.avatarUrl ? (
                              <img
                                src={player.avatarUrl}
                                alt={`${player.firstName} ${player.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-arcane-darkBorder flex items-center justify-center">
                                <User className="w-5 h-5 text-arcane-grey" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">
                                {player.firstName} {player.lastName}
                              </div>
                              <div className="text-xs text-arcane-grey">{player.playerType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-arcane-grey text-sm">{player.email}</td>
                        <td className="py-4 px-4 text-white text-sm font-semibold">
                          {player.position}
                        </td>
                        <td className="py-4 px-4 text-arcane-grey text-sm">
                          {player.nationality}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(player.verificationStatus)}</td>
                        <td className="py-4 px-4 text-arcane-grey text-sm">
                          {new Date(player.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlayer(player)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {data.data.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-arcane-darkBorder/30 rounded-lg border border-arcane-darkBorder hover:border-arcane-accent/30 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={`${player.firstName} ${player.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-arcane-darkBorder flex items-center justify-center">
                          <User className="w-6 h-6 text-arcane-grey" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-white">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-sm text-arcane-grey">{player.email}</div>
                      </div>
                      {getStatusBadge(player.verificationStatus)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <span className="text-arcane-grey">Position:</span>
                        <span className="text-white ml-1 font-semibold">{player.position}</span>
                      </div>
                      <div>
                        <span className="text-arcane-grey">Nationality:</span>
                        <span className="text-white ml-1">{player.nationality}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {data.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-arcane-darkBorder">
                  <div className="text-sm text-arcane-grey">
                    Showing {(data.meta.page - 1) * data.meta.limit + 1} to{' '}
                    {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{' '}
                    {data.meta.total} players
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.meta.page - 1)}
                      disabled={data.meta.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          const current = data.meta.page;
                          return (
                            page === 1 ||
                            page === data.meta.totalPages ||
                            (page >= current - 1 && page <= current + 1)
                          );
                        })
                        .map((page, index, array) => {
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <React.Fragment key={`ellipsis-${page}`}>
                                <span className="text-arcane-grey px-2">...</span>
                                <Button
                                  variant={data.meta.page === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            );
                          }
                          return (
                            <Button
                              key={page}
                              variant={data.meta.page === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.meta.page + 1)}
                      disabled={data.meta.page === data.meta.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
};
