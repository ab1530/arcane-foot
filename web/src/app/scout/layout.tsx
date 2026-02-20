import React from 'react';
import { ProtectedPage } from '@/components/guards/ProtectedPage';

const SCOUT_ROLES = ['SCOUT'] as const;

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage allowedRoles={SCOUT_ROLES} unauthorizedRedirectTo="/dashboard">
      {children}
    </ProtectedPage>
  );
}
