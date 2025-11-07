"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Home,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Palette,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: Calendar, label: "Calendar", href: "/calendar" },
    { icon: TrendingUp, label: "Analytics", href: "/analytics" },
    { icon: Users, label: "Players", href: "/players" },
    { icon: DollarSign, label: "Market Value AI", href: "/market-value", badge: "ML" },
    { icon: Palette, label: "PlayStyle DNA", href: "/playstyle-dna", badge: "ML" },
    { icon: Trophy, label: "Achievements", href: "/achievements" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-50 hidden lg:block">
      <div className="p-6 flex flex-col h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
            <span className="text-arcane-dark font-bold text-xl">A</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={index}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-arcane-accent/10 text-arcane-accent border border-arcane-accent/30"
                    : "text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/30"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded bg-arcane-accent/20 text-arcane-accent border border-arcane-accent/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/30 transition-all mt-auto"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
