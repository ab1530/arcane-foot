"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { ComparisonProvider } from "@/contexts/comparison-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { UpgradeModalProvider } from "@/components/providers/UpgradeModalProvider";
import { LanguageProvider } from "@/contexts/language-context";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "sonner";
import { DebugLogPanel } from "@/components/debug/DebugLogPanel";
import { LoggerInitializer } from "@/components/debug/LoggerInitializer";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LanguageProvider>
        <AuthProvider>
          <FavoritesProvider>
            <ComparisonProvider>
              <UpgradeModalProvider>
                {children}
                <LoggerInitializer />
                <DebugLogPanel />
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
      </LanguageProvider>
    </QueryProvider>
  );
}
