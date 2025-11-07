'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';

export default function PlayerValidationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F1425',
            border: '1px solid #1B2133',
            color: '#FFFFFF',
          },
        }}
      />
    </QueryProvider>
  );
}
