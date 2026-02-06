"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page (settings is now part of profile)
    router.replace("/profile");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4FF3B] mx-auto"></div>
        <p className="mt-4 text-gray-400">Redirecting to profile...</p>
      </div>
    </div>
  );
}
