"use client";

import Navbar from "./Navbar";
import { SkipLinks } from "@/components/accessibility/SkipLinks";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-arcane-dark">
      <SkipLinks />
      <Navbar />
      <main id="main-content" className="pt-16" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
