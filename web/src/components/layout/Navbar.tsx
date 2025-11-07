"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Users,
  Trophy,
  Calendar,
  FileText,
  Brain,
  Crown,
  LayoutDashboard,
  TrendingUp,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useFavorites } from "@/contexts/favorites-context";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
  requireAuth?: boolean;
}

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requireAuth: true,
  },
  {
    name: "Joueurs",
    href: "/players",
    icon: Users,
    requireAuth: true,
  },
  {
    name: "Favoris",
    href: "/favorites",
    icon: Heart,
    requireAuth: true,
  },
  {
    name: "Camps",
    href: "/camps",
    icon: Trophy,
    children: [
      { name: "Tous les camps", href: "/camps", icon: Trophy },
      { name: "Mes inscriptions", href: "/my-camps", icon: Calendar, requireAuth: true },
    ],
  },
  {
    name: "Marché",
    href: "/market",
    icon: TrendingUp,
    requireAuth: true,
  },
  {
    name: "Rapports",
    href: "/reports",
    icon: FileText,
    requireAuth: true,
  },
  {
    name: "Arkane AI",
    href: "/ai",
    icon: Brain,
    badge: "NEW",
    children: [
      { name: "Hub IA", href: "/ai", icon: Sparkles },
      { name: "ArkaneIndex", href: "/ai/arkane-index", icon: Zap },
      { name: "ArkaneGPT", href: "/ai/arkane-gpt", icon: Brain },
    ],
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { subscription, getTierName } = useSubscription();
  const { favoritePlayerIds } = useFavorites();

  // Mock authentication - en production, utiliser un vrai context/hook
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("arcane_auth_token");
      setIsAuthenticated(!!token);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("arcane_auth_token");
    setIsAuthenticated(false);
    router.push("/");
  };

  const filteredNav = navigationItems.filter(
    (item) => !item.requireAuth || isAuthenticated
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-arcane-dark/95 backdrop-blur-md border-b border-arcane-darkBorder shadow-lg"
          : "bg-transparent"
      }`}
      aria-label="Navigation principale"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Retour à l'accueil Arcane Football">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-arcane-accent to-yellow-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-arcane-dark" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                Arcane
              </h1>
              <p className="text-xs text-arcane-accent -mt-1">Football</p>
            </div>
          </Link>

          {/* Global Search */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <GlobalSearch />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const hasDropdown = item.children && item.children.length > 0;

              if (hasDropdown) {
                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-arcane-accent/20 text-arcane-accent"
                          : "text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-arcane-accent text-arcane-dark text-xs font-black">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-arcane-dark/95 backdrop-blur-md border border-arcane-darkBorder rounded-lg shadow-xl overflow-hidden"
                        >
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center gap-3 px-4 py-3 transition-all ${
                                  isChildActive
                                    ? "bg-arcane-accent/20 text-arcane-accent"
                                    : "text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50"
                                }`}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">{child.name}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-arcane-accent/20 text-arcane-accent"
                      : "text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-arcane-accent text-arcane-dark text-xs font-black">
                      {item.badge}
                    </span>
                  )}
                  {item.href === "/favorites" && favoritePlayerIds.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {favoritePlayerIds.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationCenter />

                {/* Tier Badge */}
                {subscription && (
                  <Link
                    href="/pricing"
                    className="px-3 py-1.5 rounded-lg bg-arcane-accent/20 border border-arcane-accent/30 hover:bg-arcane-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-arcane-accent" />
                      <span className="text-sm font-bold text-arcane-accent">
                        {getTierName(subscription.tier)}
                      </span>
                    </div>
                  </Link>
                )}

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-arcane-darkBorder/50 transition-all">
                    <div className="h-8 w-8 rounded-full bg-arcane-accent/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-arcane-accent" />
                    </div>
                  </button>

                  <div className="absolute top-full right-0 mt-2 w-48 bg-arcane-dark/95 backdrop-blur-md border border-arcane-darkBorder rounded-lg shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50 transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Mon profil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="border-arcane-darkBorder text-white hover:bg-arcane-darkBorder/50"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                >
                  Inscription
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-arcane-grey hover:text-white transition-colors"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-arcane-darkBorder bg-arcane-dark/95 backdrop-blur-md"
            id="mobile-menu"
            role="navigation"
            aria-label="Menu mobile"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-arcane-accent/20 text-arcane-accent"
                          : "text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-arcane-accent text-arcane-dark text-xs font-black">
                          {item.badge}
                        </span>
                      )}
                      {item.href === "/favorites" && favoritePlayerIds.length > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                          {favoritePlayerIds.length}
                        </span>
                      )}
                    </Link>
                    {item.children && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50 transition-all"
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-arcane-darkBorder space-y-2">
                {isAuthenticated ? (
                  <>
                    {subscription && (
                      <div className="px-4 py-3 rounded-lg bg-arcane-accent/20 border border-arcane-accent/30">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-arcane-accent" />
                          <span className="text-sm font-bold text-arcane-accent">
                            Plan {getTierName(subscription.tier)}
                          </span>
                        </div>
                      </div>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/50 transition-all"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Mon profil</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push("/login");
                        setIsOpen(false);
                      }}
                      className="w-full"
                    >
                      Connexion
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/signup");
                        setIsOpen(false);
                      }}
                      className="w-full bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                    >
                      Inscription
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
