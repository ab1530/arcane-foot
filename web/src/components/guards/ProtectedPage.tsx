"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/lib/roles";

interface ProtectedPageProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingFallback?: React.ReactNode;
  allowedRoles?: readonly UserRole[];
  unauthorizedRedirectTo?: string;
}

export function ProtectedPage({
  children,
  redirectTo = "/login",
  loadingFallback,
  allowedRoles,
  unauthorizedRedirectTo = "/dashboard",
}: ProtectedPageProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userRole = user?.role as UserRole | undefined;
  const hasRoleAccess =
    !allowedRoles || (userRole ? allowedRoles.includes(userRole) : false);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      const redirectParam = pathname
        ? `?redirect=${encodeURIComponent(pathname)}`
        : "";
      router.replace(`${redirectTo}${redirectParam}`);
      return;
    }

    if (!hasRoleAccess) {
      router.replace(unauthorizedRedirectTo);
    }
  }, [isLoading, isAuthenticated, userRole, hasRoleAccess, redirectTo, unauthorizedRedirectTo, pathname, router]);

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-arcane-black">
          <div className="text-arcane-gray-400 text-sm">Connexion...</div>
        </div>
      )
    );
  }

  if (!isAuthenticated || !hasRoleAccess) {
    return null;
  }

  return <>{children}</>;
}
