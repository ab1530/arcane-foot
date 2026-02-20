import React from 'react';
import { ProtectedPage } from '@/components/guards/ProtectedPage';
import { CATEGORY_A_ROLES } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage allowedRoles={CATEGORY_A_ROLES} unauthorizedRedirectTo="/dashboard">
      {children}
    </ProtectedPage>
  );
}
