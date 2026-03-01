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

interface DNARadarChartProps {
  dnaProfile: DNAProfile;
  playerName: string;
  color?: string;
  className?: string;
}

export function DNARadarChart({
  dnaProfile,
  playerName,
  color = '#e6ff3c',
  className = ''
}: DNARadarChartProps) {
  const data = useMemo(() => ({
    labels: DNA_DIMENSIONS as unknown as string[],
    datasets: [
      {
        label: playerName,
        data: DNA_DIMENSIONS.map(dim => dnaProfile[dim] || 0),
        backgroundColor: `${color}33`, // 20% opacity
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [dnaProfile, playerName, color]);

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
          padding: 8,
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
  }), []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Radar data={data} options={options} />
    </div>
  );
}
