"use client";

import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Shield } from "lucide-react";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import type { UserRole } from "@/lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  unauthorizedRedirectTo?: string;
  allowedRoles?: readonly UserRole[];
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  unauthorizedRedirectTo,
  allowedRoles,
}: ProtectedRouteProps) {
  return (
    <ProtectedPage
      redirectTo={redirectTo}
      unauthorizedRedirectTo={unauthorizedRedirectTo}
      allowedRoles={allowedRoles}
      loadingFallback={
        <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
          <AnimatedBackground />
          <div className="relative z-10 text-center">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block mb-6"
            >
              <Shield className="h-16 w-16 text-arcane-accent" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-white"
            >
              Verifying access...
            </motion.h2>
          </div>
        </main>
      }
    >
      {children}
    </ProtectedPage>
  );
}
