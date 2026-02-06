'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { ProtectedPage } from '@/components/guards/ProtectedPage';

export default function PlayerValidationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
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
    </ProtectedPage>
  );
}
