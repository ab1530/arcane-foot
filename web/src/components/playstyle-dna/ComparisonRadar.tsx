'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { DNAProfile } from '@/types/playstyle-dna';
import { DNA_DIMENSIONS } from '@/lib/utils/playstyle-colors';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ComparisonRadarProps {
  players: Array<{
    name: string;
    dnaProfile: DNAProfile;
    color: string;
  }>;
  className?: string;
}

export function ComparisonRadar({ players, className = '' }: ComparisonRadarProps) {
  const data = useMemo(() => ({
    labels: [...DNA_DIMENSIONS] as string[],
    datasets: players.map((player) => ({
      label: player.name,
      data: DNA_DIMENSIONS.map(dim => player.dnaProfile[dim] || 0),
      backgroundColor: `${player.color}20`, // 12.5% opacity
      borderColor: player.color,
      borderWidth: 2,
      pointBackgroundColor: player.color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: player.color,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  }), [players]);

  const options: ChartOptions<'radar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          color: '#b3afb2',
          backdropColor: 'transparent',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(228, 255, 59, 0.1)',
          lineWidth: 1,
        },
        pointLabels: {
          color: '#E5E7EB',
          font: {
            size: 13,
            weight: 500,
          },
          padding: 10,
        },
        angleLines: {
          color: 'rgba(228, 255, 59, 0.15)',
          lineWidth: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#353439',
        titleColor: '#e6ff3c',
        bodyColor: '#E5E7EB',
        borderColor: '#353439',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.r.toFixed(1);
            return `${label}: ${value}/10`;
          },
        },
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
  }), []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Radar data={data} options={options} />
    </div>
  );
}
