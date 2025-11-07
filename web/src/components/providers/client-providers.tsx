"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ComparisonProvider } from "@/contexts/comparison-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { UpgradeModalProvider } from "@/components/providers/UpgradeModalProvider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ComparisonProvider>
          <UpgradeModalProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="dark"
            />
          </UpgradeModalProvider>
        </ComparisonProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
