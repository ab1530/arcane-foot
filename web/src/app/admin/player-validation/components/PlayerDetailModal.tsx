'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Activity,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Player, VerificationStatus, ValidationHistory } from '../types';
import { validationService } from '@/services/validationService';

interface PlayerDetailModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspiciousReason, setSuspiciousReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showSuspiciousForm, setShowSuspiciousForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);

  // Fetch validation history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['validation-history', player.id],
    queryFn: () => validationService.getValidationHistory(player.id),
    enabled: isOpen,
  });

  // Mutations
  const validateMutation = useMutation({
    mutationFn: (notes: string) => validationService.validatePlayer(player.id, { notes }),
    onSuccess: () => {
      toast.success('Player validated successfully!');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to validate player');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { reason: string; notes?: string }) =>
      validationService.rejectPlayer(player.id, data),
    onSuccess: () => {
      toast.success('Player rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] });
      setShowRejectForm(false);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject player');
    },
  });

  const suspiciousMutation = useMutation({
    mutationFn: (reason: string) => validationService.markAsSuspicious(player.id, reason),
    onSuccess: () => {
      toast.warning('Player marked as suspicious');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] });
      setShowSuspiciousForm(false);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark player as suspicious');
    },
  });

  const convertMutation = useMutation({
    mutationFn: (notes: string) => validationService.convertToAgency(player.id, { notes }),
    onSuccess: () => {
      toast.success('Player converted to AGENCY successfully!');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to convert player');
    },
  });

  const handleValidate = () => {
    if (player.verificationStatus === VerificationStatus.VERIFIED) {
      toast.info('Player is already verified');
      return;
    }
    validateMutation.mutate(notes);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ reason: rejectionReason, notes });
  };

  const handleMarkSuspicious = () => {
    if (!suspiciousReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    suspiciousMutation.mutate(suspiciousReason);
  };

  const handleConvert = () => {
    if (player.verificationStatus !== VerificationStatus.VERIFIED) {
      toast.error('Player must be verified before converting to AGENCY');
      return;
    }
    convertMutation.mutate(notes);
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
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-arcane-darkCard border border-arcane-darkBorder rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-arcane-darkBorder">
              <div className="flex items-center gap-4">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-arcane-darkBorder flex items-center justify-center">
                    <User className="w-8 h-8 text-arcane-grey" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold font-ananstonExpanded text-white">
                    {player.firstName} {player.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(player.verificationStatus)}
                    <span className="text-sm text-arcane-grey">{player.playerType}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player Information */}
                <Card className="border-arcane-darkBorder">
                  <CardHeader>
                    <CardTitle className="text-lg font-ananstonExpanded uppercase">
                      Player Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-arcane-grey" />
                      <div>
                        <div className="text-xs text-arcane-grey">Email</div>
                        <div className="text-white">{player.email}</div>
                      </div>
                    </div>
                    {player.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-arcane-grey" />
                        <div>
                          <div className="text-xs text-arcane-grey">Phone</div>
                          <div className="text-white">{player.phone}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-arcane-grey" />
                      <div>
                        <div className="text-xs text-arcane-grey">Date of Birth</div>
                        <div className="text-white">
                          {new Date(player.dateOfBirth).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-arcane-grey" />
                      <div>
                        <div className="text-xs text-arcane-grey">Nationality</div>
                        <div className="text-white">{player.nationality}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-arcane-grey" />
                      <div>
                        <div className="text-xs text-arcane-grey">Position</div>
                        <div className="text-white">{player.position}</div>
                      </div>
                    </div>
                    {player.currentClub && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-arcane-grey" />
                        <div>
                          <div className="text-xs text-arcane-grey">Current Club</div>
                          <div className="text-white">{player.currentClub}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Physical Stats */}
                <Card className="border-arcane-darkBorder">
                  <CardHeader>
                    <CardTitle className="text-lg font-ananstonExpanded uppercase">
                      Physical Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {player.height && (
                      <div>
                        <div className="text-xs text-arcane-grey mb-1">Height</div>
                        <div className="text-2xl font-bold text-white">{player.height} cm</div>
                      </div>
                    )}
                    {player.weight && (
                      <div>
                        <div className="text-xs text-arcane-grey mb-1">Weight</div>
                        <div className="text-2xl font-bold text-white">{player.weight} kg</div>
                      </div>
                    )}
                    {player.preferredFoot && (
                      <div>
                        <div className="text-xs text-arcane-grey mb-1">Preferred Foot</div>
                        <div className="text-xl font-bold text-white">{player.preferredFoot}</div>
                      </div>
                    )}
                    {player.marketValue && (
                      <div>
                        <div className="text-xs text-arcane-grey mb-1">Market Value</div>
                        <div className="text-2xl font-bold text-arcane-accent">
                          €{player.marketValue.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Validation History */}
                <Card className="border-arcane-darkBorder lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-ananstonExpanded uppercase">
                      Validation History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? (
                      <div className="text-center py-8 text-arcane-grey">Loading history...</div>
                    ) : history && history.length > 0 ? (
                      <div className="space-y-4">
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-4 p-4 bg-arcane-darkBorder/30 rounded-lg"
                          >
                            <div className="mt-1">
                              {entry.status === VerificationStatus.VERIFIED && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {entry.status === VerificationStatus.REJECTED && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              {entry.status === VerificationStatus.SUSPICIOUS && (
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                              )}
                              {entry.status === VerificationStatus.PENDING && (
                                <Award className="w-5 h-5 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white">
                                  {entry.status.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-arcane-grey">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm text-arcane-grey mb-1">
                                By: {entry.performedBy.firstName} {entry.performedBy.lastName}
                              </div>
                              {entry.reason && (
                                <div className="text-sm text-white mt-2">
                                  <span className="font-semibold">Reason:</span> {entry.reason}
                                </div>
                              )}
                              {entry.notes && (
                                <div className="text-sm text-arcane-grey mt-1">
                                  <span className="font-semibold">Notes:</span> {entry.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-arcane-grey">No history available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-arcane-darkBorder bg-arcane-darkAlt">
              {!showRejectForm && !showSuspiciousForm && !showNotesForm && (
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowSuspiciousForm(true)}
                    disabled={player.verificationStatus === VerificationStatus.SUSPICIOUS}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark Suspicious
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={
                      player.verificationStatus === VerificationStatus.REJECTED ||
                      rejectMutation.isPending
                    }
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNotesForm(true)}
                    disabled={
                      player.verificationStatus !== VerificationStatus.VERIFIED ||
                      convertMutation.isPending
                    }
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Convert to Agency
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNotesForm(true);
                    }}
                    disabled={
                      player.verificationStatus === VerificationStatus.VERIFIED ||
                      validateMutation.isPending
                    }
                    loading={validateMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                </div>
              )}

              {/* Reject Form */}
              {showRejectForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-arcane-grey mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-arcane-darkBorder border border-arcane-darkBorder rounded-lg p-3 text-white focus:border-arcane-accent focus:outline-none"
                      rows={3}
                      placeholder="Enter rejection reason..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-arcane-grey mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-arcane-darkBorder border border-arcane-darkBorder rounded-lg p-3 text-white focus:border-arcane-accent focus:outline-none"
                      rows={2}
                      placeholder="Optional notes..."
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      loading={rejectMutation.isPending}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Suspicious Form */}
              {showSuspiciousForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-arcane-grey mb-2">
                      Reason *
                    </label>
                    <textarea
                      value={suspiciousReason}
                      onChange={(e) => setSuspiciousReason(e.target.value)}
                      className="w-full bg-arcane-darkBorder border border-arcane-darkBorder rounded-lg p-3 text-white focus:border-arcane-accent focus:outline-none"
                      rows={3}
                      placeholder="Why is this player suspicious?"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setShowSuspiciousForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMarkSuspicious} loading={suspiciousMutation.isPending}>
                      Mark as Suspicious
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes Form (for validate/convert) */}
              {showNotesForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-arcane-grey mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-arcane-darkBorder border border-arcane-darkBorder rounded-lg p-3 text-white focus:border-arcane-accent focus:outline-none"
                      rows={3}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setShowNotesForm(false)}>
                      Cancel
                    </Button>
                    {player.verificationStatus === VerificationStatus.VERIFIED ? (
                      <Button onClick={handleConvert} loading={convertMutation.isPending}>
                        Convert to Agency
                      </Button>
                    ) : (
                      <Button onClick={handleValidate} loading={validateMutation.isPending}>
                        Validate Player
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
