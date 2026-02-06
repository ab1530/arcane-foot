"use client";

import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Shield } from "lucide-react";
import { ProtectedPage } from "@/components/guards/ProtectedPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  return (
    <ProtectedPage
      redirectTo={redirectTo}
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
