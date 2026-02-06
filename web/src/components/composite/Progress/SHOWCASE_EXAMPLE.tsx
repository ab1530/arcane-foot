/**
 * Progress Components Showcase
 * Arcane Design System - Tier 2 Components
 *
 * This file demonstrates usage of all Progress components
 */

import React, { useState, useEffect } from 'react';
import { ProgressBar, CircularProgress, Skeleton, Spinner } from './index';

export function ProgressShowcase() {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12 p-8 bg-arcane-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-arcane-yellow mb-2">
          Progress Components
        </h1>
        <p className="text-arcane-gray-400 mb-8">
          Showcase of all Tier 2 progress and loading components
        </p>

        {/* ProgressBar Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">ProgressBar</h2>
          <p className="text-arcane-gray-400 mb-6">
            Linear progress indicator with animations and gradient support
          </p>

          <div className="space-y-6 bg-arcane-charcoal rounded-xl p-6">
            {/* Default */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Default (Animated)
              </h3>
              <ProgressBar value={progress} showPercentage gradient />
            </div>

            {/* With Label */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                With Label
              </h3>
              <ProgressBar
                value={75}
                label="Upload Progress"
                showPercentage
                gradient
              />
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">Sizes</h3>
              <div className="space-y-3">
                <ProgressBar value={60} size="sm" showPercentage />
                <ProgressBar value={60} size="md" showPercentage />
                <ProgressBar value={60} size="lg" showPercentage />
              </div>
            </div>

            {/* Indeterminate */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Indeterminate (Loading)
              </h3>
              <ProgressBar indeterminate label="Processing..." />
            </div>

            {/* Without Gradient */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                No Gradient
              </h3>
              <ProgressBar value={45} showPercentage gradient={false} />
            </div>
          </div>
        </section>

        {/* CircularProgress Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">CircularProgress</h2>
          <p className="text-arcane-gray-400 mb-6">
            Circular progress indicator with gradient stroke and center label
          </p>

          <div className="bg-arcane-charcoal rounded-xl p-6">
            <div className="flex flex-wrap gap-8 items-center justify-center">
              {/* Default Animated */}
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={progress} size="md" showLabel gradient />
                <span className="text-arcane-gray-400 text-sm">Animated</span>
              </div>

              {/* Sizes */}
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={75} size="sm" showLabel />
                <span className="text-arcane-gray-400 text-sm">Small</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={75} size="md" showLabel />
                <span className="text-arcane-gray-400 text-sm">Medium</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={75} size="lg" showLabel />
                <span className="text-arcane-gray-400 text-sm">Large</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={75} size="xl" showLabel />
                <span className="text-arcane-gray-400 text-sm">Extra Large</span>
              </div>

              {/* Indeterminate */}
              <div className="flex flex-col items-center gap-2">
                <CircularProgress indeterminate size="md" showLabel={false} />
                <span className="text-arcane-gray-400 text-sm">Loading</span>
              </div>

              {/* Custom Thickness */}
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={85} size="lg" thickness={12} showLabel />
                <span className="text-arcane-gray-400 text-sm">Thick</span>
              </div>

              {/* No Gradient */}
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={90} size="md" gradient={false} showLabel />
                <span className="text-arcane-gray-400 text-sm">No Gradient</span>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Skeleton</h2>
          <p className="text-arcane-gray-400 mb-6">
            Loading placeholders with shimmer animation
          </p>

          <div className="space-y-6 bg-arcane-charcoal rounded-xl p-6">
            {/* Text Skeleton */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Text (Single Line)
              </h3>
              <Skeleton type="text" />
            </div>

            {/* Text Skeleton Multiple Lines */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Text (Multiple Lines)
              </h3>
              <Skeleton type="text" lines={3} />
            </div>

            {/* Card Skeleton */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">Card</h3>
              <Skeleton type="card" />
            </div>

            {/* Avatar Skeletons */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Avatars
              </h3>
              <div className="flex gap-4">
                <Skeleton type="avatar" width="40px" height="40px" />
                <Skeleton type="avatar" width="64px" height="64px" />
                <Skeleton type="avatar" width="96px" height="96px" />
              </div>
            </div>

            {/* Custom Skeletons */}
            <div>
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">Custom</h3>
              <div className="space-y-3">
                <Skeleton type="custom" width="100%" height="40px" rounded="sm" />
                <Skeleton type="custom" width="75%" height="60px" rounded="lg" />
                <Skeleton type="custom" width="50%" height="20px" rounded="full" />
              </div>
            </div>
          </div>
        </section>

        {/* Spinner Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Spinner</h2>
          <p className="text-arcane-gray-400 mb-6">
            Loading spinner with smooth rotation animation
          </p>

          <div className="bg-arcane-charcoal rounded-xl p-6">
            <div className="grid grid-cols-3 gap-8">
              {/* Sizes */}
              <div className="flex flex-col items-center gap-3">
                <Spinner size="sm" />
                <span className="text-arcane-gray-400 text-sm">Small</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Spinner size="md" />
                <span className="text-arcane-gray-400 text-sm">Medium</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <span className="text-arcane-gray-400 text-sm">Large</span>
              </div>

              {/* Colors */}
              <div className="flex flex-col items-center gap-3">
                <Spinner color="yellow" size="md" />
                <span className="text-arcane-gray-400 text-sm">Yellow</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Spinner color="white" size="md" />
                <span className="text-arcane-gray-400 text-sm">White</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Spinner color="gray" size="md" />
                <span className="text-arcane-gray-400 text-sm">Gray</span>
              </div>
            </div>

            {/* Centered */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-arcane-gray-300 mb-3">
                Centered in Container
              </h3>
              <div className="bg-arcane-anthracite rounded-lg h-32">
                <Spinner size="lg" centered />
              </div>
            </div>
          </div>
        </section>

        {/* Combined Usage Example */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Combined Usage</h2>
          <p className="text-arcane-gray-400 mb-6">
            Real-world example combining multiple progress components
          </p>

          <div className="bg-arcane-charcoal rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Progress */}
              <div className="bg-arcane-anthracite rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">File Upload</h3>
                  <CircularProgress value={progress} size="sm" showLabel={false} />
                </div>
                <ProgressBar
                  value={progress}
                  label="Uploading player data..."
                  showPercentage
                  gradient
                />
                <p className="text-arcane-gray-400 text-xs mt-2">
                  {progress < 100 ? 'Processing...' : 'Upload complete!'}
                </p>
              </div>

              {/* Loading Content */}
              <div className="bg-arcane-anthracite rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Spinner size="sm" />
                  <h3 className="text-lg font-semibold text-white">Loading Players</h3>
                </div>
                <Skeleton type="text" lines={4} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
