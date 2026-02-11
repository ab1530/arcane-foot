'use client';

/**
 * ARCANE DESIGN SYSTEM - Feedback Components Showcase
 *
 * This file demonstrates all 5 feedback components with real-world examples.
 * Use this as a reference for implementation.
 */

import React, { useState } from 'react';
import {
  toast,
  useToast,
  ToastContainer,
  Modal,
  AlertDialog,
  Tooltip,
  Popover,
} from './index';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { IconButton } from '@/components/primitives/Button/IconButton';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Edit,
  Trash,
  Eye,
  Settings,
  Star,
  TrendingUp,
} from 'lucide-react';

export function FeedbackShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertVariant, setAlertVariant] = useState<'info' | 'warning' | 'danger'>('info');
  const toastHook = useToast();

  return (
    <div className="min-h-screen bg-arcane-black p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Feedback Components
          </h1>
          <p className="text-xl text-gray-400">
            Arcane Design System - Tier 2 Composite Components
          </p>
        </div>

        {/* Toast Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">1. Toast Notifications</h2>
            <p className="text-gray-400">
              Interactive notifications with auto-dismiss and stacking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Success Toast */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-green-500/20">
              <CheckCircle className="text-green-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Success</h3>
              <p className="text-sm text-gray-400 mb-4">
                Confirmation messages
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() =>
                  toast.success('Player saved successfully!', {
                    description: 'John Doe has been added to the database',
                  })
                }
              >
                Show Success
              </ArcaneButton>
            </div>

            {/* Error Toast */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-red-500/20">
              <AlertCircle className="text-red-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Error</h3>
              <p className="text-sm text-gray-400 mb-4">
                Failure notifications
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() =>
                  toast.error('Failed to save changes', {
                    description: 'Please check your internet connection',
                    action: {
                      label: 'Retry',
                      onClick: () => console.log('Retrying...'),
                    },
                  })
                }
              >
                Show Error
              </ArcaneButton>
            </div>

            {/* Warning Toast */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-amber-500/20">
              <AlertTriangle className="text-amber-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Warning</h3>
              <p className="text-sm text-gray-400 mb-4">
                Important alerts
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() =>
                  toast.warning('Low storage space', {
                    description: 'Consider upgrading your plan',
                    duration: 5000,
                  })
                }
              >
                Show Warning
              </ArcaneButton>
            </div>

            {/* Info Toast */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-blue-500/20">
              <Info className="text-blue-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Info</h3>
              <p className="text-sm text-gray-400 mb-4">
                General information
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() =>
                  toastHook.info('New feature available', {
                    description: 'Check out AI-powered player analysis',
                  })
                }
              >
                Show Info
              </ArcaneButton>
            </div>
          </div>

          {/* Advanced Toast Examples */}
          <div className="p-6 rounded-xl bg-arcane-charcoal border border-arcane-yellow/20">
            <h3 className="text-white font-semibold mb-4">Advanced Examples</h3>
            <div className="flex flex-wrap gap-3">
              <ArcaneButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.show('Custom duration', {
                    variant: 'info',
                    duration: 10000,
                    description: 'This toast will stay for 10 seconds',
                  })
                }
              >
                Long Duration
              </ArcaneButton>
              <ArcaneButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.show('No auto-dismiss', {
                    variant: 'warning',
                    duration: 0,
                    description: 'This toast stays until you close it',
                  })
                }
              >
                No Auto-Dismiss
              </ArcaneButton>
              <ArcaneButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  for (let i = 1; i <= 3; i++) {
                    setTimeout(() => {
                      toast.success(`Toast ${i}`, {
                        description: `Stacked notification ${i}`,
                      });
                    }, i * 300);
                  }
                }}
              >
                Stacked Toasts
              </ArcaneButton>
            </div>
          </div>
        </section>

        {/* Modal Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">2. Modal</h2>
            <p className="text-gray-400">
              Premium modal dialog with glassmorphism
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(['sm', 'md', 'lg', 'xl', 'fullscreen'] as const).map((size) => (
              <ArcaneButton
                key={size}
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setModalOpen(true)}
              >
                {size.toUpperCase()}
              </ArcaneButton>
            ))}
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            size="md"
            title="Edit Player Profile"
            footer={
              <>
                <ArcaneButton
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </ArcaneButton>
                <ArcaneButton
                  variant="primary"
                  onClick={() => {
                    toast.success('Changes saved');
                    setModalOpen(false);
                  }}
                >
                  Save Changes
                </ArcaneButton>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-4 py-2 rounded-lg bg-arcane-anthracite border border-arcane-slate text-white focus:border-arcane-yellow focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position
                </label>
                <select className="w-full px-4 py-2 rounded-lg bg-arcane-anthracite border border-arcane-slate text-white focus:border-arcane-yellow focus:outline-none">
                  <option>Forward</option>
                  <option>Midfielder</option>
                  <option>Defender</option>
                  <option>Goalkeeper</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  defaultValue="Professional football player with 5 years of experience..."
                  className="w-full px-4 py-2 rounded-lg bg-arcane-anthracite border border-arcane-slate text-white focus:border-arcane-yellow focus:outline-none"
                />
              </div>
            </div>
          </Modal>
        </section>

        {/* AlertDialog Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">3. AlertDialog</h2>
            <p className="text-gray-400">
              Confirmation dialogs with variants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-blue-500/20">
              <Info className="text-blue-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Info Dialog</h3>
              <p className="text-sm text-gray-400 mb-4">
                General confirmations
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() => {
                  setAlertVariant('info');
                  setAlertOpen(true);
                }}
              >
                Show Info
              </ArcaneButton>
            </div>

            <div className="p-6 rounded-xl bg-arcane-charcoal border border-amber-500/20">
              <AlertTriangle className="text-amber-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Warning Dialog</h3>
              <p className="text-sm text-gray-400 mb-4">
                Important actions
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() => {
                  setAlertVariant('warning');
                  setAlertOpen(true);
                }}
              >
                Show Warning
              </ArcaneButton>
            </div>

            <div className="p-6 rounded-xl bg-arcane-charcoal border border-red-500/20">
              <AlertCircle className="text-red-400 mb-3" size={32} />
              <h3 className="text-white font-semibold mb-2">Danger Dialog</h3>
              <p className="text-sm text-gray-400 mb-4">
                Destructive actions
              </p>
              <ArcaneButton
                size="sm"
                fullWidth
                onClick={() => {
                  setAlertVariant('danger');
                  setAlertOpen(true);
                }}
              >
                Show Danger
              </ArcaneButton>
            </div>
          </div>

          <AlertDialog
            isOpen={alertOpen}
            onClose={() => setAlertOpen(false)}
            variant={alertVariant}
            title={
              alertVariant === 'info'
                ? 'Confirm Action'
                : alertVariant === 'warning'
                ? 'Archive Player'
                : 'Delete Player'
            }
            description={
              alertVariant === 'info'
                ? 'Are you sure you want to proceed with this action?'
                : alertVariant === 'warning'
                ? 'This player will be moved to the archive. You can restore them later.'
                : 'Are you sure you want to delete this player? This action cannot be undone and all associated data will be permanently removed.'
            }
            confirmLabel={
              alertVariant === 'info'
                ? 'Confirm'
                : alertVariant === 'warning'
                ? 'Archive'
                : 'Delete'
            }
            onConfirm={() => {
              toast.success('Action completed');
              setAlertOpen(false);
            }}
          />
        </section>

        {/* Tooltip Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">4. Tooltip</h2>
            <p className="text-gray-400">
              Accessible tooltips with positioning
            </p>
          </div>

          <div className="p-8 rounded-xl bg-arcane-charcoal border border-arcane-yellow/20">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <Tooltip content="Edit player profile" placement="top">
                <IconButton icon={<Edit />} aria-label="Edit" />
              </Tooltip>

              <Tooltip content="View detailed statistics" placement="bottom">
                <IconButton icon={<Eye />} aria-label="View" />
              </Tooltip>

              <Tooltip content="Delete player permanently" placement="left">
                <IconButton icon={<Trash />} variant="danger" aria-label="Delete" />
              </Tooltip>

              <Tooltip content="Player settings and preferences" placement="right">
                <IconButton icon={<Settings />} aria-label="Settings" />
              </Tooltip>

              <Tooltip
                content="Add to favorites for quick access"
                placement="top"
                delay={500}
              >
                <IconButton icon={<Star />} aria-label="Favorite" />
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Popover Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">5. Popover</h2>
            <p className="text-gray-400">
              Rich content in floating containers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Click Popover */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-arcane-yellow/20">
              <h3 className="text-white font-semibold mb-4">Click Trigger</h3>
              <Popover
                trigger="click"
                placement="bottom"
                content={
                  <div className="p-4 w-64">
                    <h4 className="font-bold text-white mb-3">Player Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Goals</span>
                        <span className="text-arcane-yellow font-semibold">23</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Assists</span>
                        <span className="text-arcane-yellow font-semibold">15</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Matches</span>
                        <span className="text-arcane-yellow font-semibold">38</span>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between text-gray-300">
                          <span className="font-semibold">Rating</span>
                          <span className="text-arcane-yellow font-bold">8.5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                <ArcaneButton variant="secondary">View Stats</ArcaneButton>
              </Popover>
            </div>

            {/* Hover Popover */}
            <div className="p-6 rounded-xl bg-arcane-charcoal border border-arcane-yellow/20">
              <h3 className="text-white font-semibold mb-4">Hover Trigger</h3>
              <Popover
                trigger="hover"
                placement="bottom"
                content={
                  <div className="p-4 max-w-xs">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="text-green-400" size={20} />
                      <h4 className="font-bold text-white">AI Analysis</h4>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      This feature uses advanced machine learning algorithms to
                      analyze player performance and predict future trends.
                    </p>
                  </div>
                }
              >
                <span className="inline-flex items-center gap-2 text-blue-400 cursor-help border-b border-dashed border-blue-400">
                  What is AI Analysis?
                  <Info size={16} />
                </span>
              </Popover>
            </div>
          </div>
        </section>

        {/* Toast Container (required) */}
        <ToastContainer position="top-right" maxToasts={5} />
      </div>
    </div>
  );
}
