"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedPageProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingFallback?: React.ReactNode;
}

export function ProtectedPage({
  children,
  redirectTo = "/login",
  loadingFallback,
}: ProtectedPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectParam = pathname
        ? `?redirect=${encodeURIComponent(pathname)}`
        : "";
      router.replace(`${redirectTo}${redirectParam}`);
    }
  }, [isLoading, isAuthenticated, redirectTo, pathname, router]);

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-arcane-black">
          <div className="text-arcane-gray-400 text-sm">Connexion...</div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
