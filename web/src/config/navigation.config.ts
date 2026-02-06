import {
  Home,
  Users,
  BarChart3,
  Shield,
  FileText,
  Search,
  Calendar,
  Target,
  Brain,
  Briefcase,
  Trophy,
  Settings,
  Database,
  Server,
  Activity,
  Cloud,
  Wifi,
  CreditCard,
  User,
  UserCheck,
  Building,
  Map,
  MessageSquare,
  Layers,
  TrendingUp,
  DollarSign,
  GitBranch,
  BookOpen,
  Award,
  Video,
  ClipboardList,
  Flag,
  Compass
} from 'lucide-react';
import { DEFAULT_ROLE } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

export interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  badge?: string;
  children?: NavItem[];
  requiredRole?: UserRole[];
}

export interface NavigationConfig {
  mainNav: NavItem[];
  quickActions: NavItem[];
}

// SUPER_ADMIN Navigation
export const superAdminNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: Home,
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      title: 'Validation Queue',
      href: '/admin/validation',
      icon: UserCheck,
      badge: 'new',
    },
    {
      title: 'System',
      icon: Settings,
      children: [
        {
          title: 'Roles & Permissions',
          href: '/admin/roles',
          icon: Shield,
        },
        {
          title: 'Subscriptions',
          href: '/admin/subscriptions',
          icon: CreditCard,
        },
        {
          title: 'Data Sync',
          href: '/admin/data-sync',
          icon: Database,
        },
        {
          title: 'Cache Monitor',
          href: '/admin/cache',
          icon: Server,
        },
        {
          title: 'Firebase Config',
          href: '/admin/firebase',
          icon: Cloud,
        },
        {
          title: 'Supabase Admin',
          href: '/admin/supabase',
          icon: Database,
        },
        {
          title: 'WebSocket Monitor',
          href: '/admin/websocket',
          icon: Wifi,
        },
      ],
    },
    {
      title: 'Audit Logs',
      href: '/admin/audit',
      icon: Activity,
    },
    {
      title: 'Reports Overview',
      href: '/admin/reports',
      icon: FileText,
    },
    {
      title: 'Marketplace Admin',
      href: '/admin/marketplace',
      icon: Building,
    },
  ],
  quickActions: [
    {
      title: 'View System Health',
      href: '/admin/health',
      icon: Activity,
    },
    {
      title: 'Clear Cache',
      href: '/admin/cache/clear',
      icon: Server,
    },
    {
      title: 'Export Data',
      href: '/admin/export',
      icon: Database,
    },
  ],
};

// ADMIN (Club) Navigation
export const adminNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/club',
      icon: Home,
    },
    {
      title: 'Squad Manager',
      href: '/club/squad',
      icon: Users,
    },
    {
      title: 'Transfer Requests',
      href: '/club/requests',
      icon: GitBranch,
      badge: '3',
    },
    {
      title: 'Scouting',
      icon: Search,
      children: [
        {
          title: 'Scout Network',
          href: '/club/scouts',
          icon: Compass,
        },
        {
          title: 'Reports',
          href: '/club/reports',
          icon: FileText,
        },
        {
          title: 'Marketplace',
          href: '/club/marketplace',
          icon: Building,
        },
      ],
    },
    {
      title: 'Operations',
      icon: Settings,
      children: [
        {
          title: 'Camps',
          href: '/club/camps',
          icon: Flag,
        },
        {
          title: 'Events',
          href: '/club/events',
          icon: Calendar,
        },
        {
          title: 'Matches',
          href: '/club/matches',
          icon: Trophy,
        },
      ],
    },
    {
      title: 'Analytics',
      href: '/club/analytics',
      icon: BarChart3,
    },
    {
      title: 'Transfer Pipeline',
      href: '/club/kanban',
      icon: Layers,
    },
  ],
  quickActions: [
    {
      title: 'Create Camp',
      href: '/club/camps/create',
      icon: Flag,
    },
    {
      title: 'Scout Report',
      href: '/club/reports/create',
      icon: FileText,
    },
    {
      title: 'Squad Analysis',
      href: '/club/squad/analysis',
      icon: BarChart3,
    },
  ],
};

// SCOUT Navigation
export const scoutNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/scout',
      icon: Home,
    },
    {
      title: 'Player Database',
      href: '/scout/players',
      icon: Users,
    },
    {
      title: 'Reports',
      icon: FileText,
      children: [
        {
          title: 'My Reports',
          href: '/scout/reports',
          icon: FileText,
        },
        {
          title: 'Create Report',
          href: '/scout/reports/create',
          icon: ClipboardList,
        },
        {
          title: 'Voice Report',
          href: '/scout/reports/voice',
          icon: Video,
        },
        {
          title: 'Templates',
          href: '/scout/reports/templates',
          icon: BookOpen,
        },
      ],
    },
    {
      title: 'Assignments',
      href: '/scout/assignments',
      icon: Target,
      badge: '2',
    },
    {
      title: 'Calendar',
      href: '/scout/calendar',
      icon: Calendar,
    },
    {
      title: 'AI Tools',
      icon: Brain,
      children: [
        {
          title: 'Auto Scout',
          href: '/scout/ai/auto-scout',
          icon: Brain,
        },
        {
          title: 'Smart Search',
          href: '/scout/ai/smart-scout',
          icon: Search,
        },
      ],
    },
    {
      title: 'Marketplace',
      icon: Building,
      children: [
        {
          title: 'My Listing',
          href: '/scout/marketplace',
          icon: User,
        },
        {
          title: 'Offers',
          href: '/scout/offers',
          icon: DollarSign,
        },
      ],
    },
    {
      title: 'Media Library',
      href: '/scout/media',
      icon: Video,
    },
  ],
  quickActions: [
    {
      title: 'Quick Report',
      href: '/scout/reports/create',
      icon: FileText,
    },
    {
      title: 'Voice Note',
      href: '/scout/reports/voice',
      icon: Video,
    },
    {
      title: 'Find Player',
      href: '/scout/players/search',
      icon: Search,
    },
  ],
};

// ANALYST Navigation
export const analystNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/analyst',
      icon: Home,
    },
    {
      title: 'Player Analytics',
      href: '/analyst/players',
      icon: Users,
    },
    {
      title: 'Comparison Tool',
      href: '/analyst/compare',
      icon: GitBranch,
    },
    {
      title: 'AI Predictions',
      icon: Brain,
      children: [
        {
          title: 'Performance Predictor',
          href: '/analyst/predictions',
          icon: TrendingUp,
        },
        {
          title: 'Market Valuations',
          href: '/analyst/valuations',
          icon: DollarSign,
        },
        {
          title: 'PlayStyle DNA',
          href: '/analyst/dna',
          icon: Brain,
        },
        {
          title: 'Arkane Index',
          href: '/analyst/index',
          icon: BarChart3,
        },
        {
          title: 'Match Predictor',
          href: '/analyst/match',
          icon: Trophy,
        },
      ],
    },
    {
      title: 'Reports',
      href: '/analyst/reports',
      icon: FileText,
    },
    {
      title: 'Market Trends',
      href: '/analyst/trends',
      icon: TrendingUp,
    },
    {
      title: 'Data Export',
      href: '/analyst/export',
      icon: Database,
    },
    {
      title: 'Arkane GPT',
      href: '/analyst/ai-chat',
      icon: MessageSquare,
    },
  ],
  quickActions: [
    {
      title: 'Quick Analysis',
      href: '/analyst/quick',
      icon: BarChart3,
    },
    {
      title: 'Compare Players',
      href: '/analyst/compare',
      icon: GitBranch,
    },
    {
      title: 'Export Data',
      href: '/analyst/export',
      icon: Database,
    },
  ],
};

// AGENT Navigation
export const agentNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Portfolio',
      href: '/agent',
      icon: Home,
    },
    {
      title: 'My Players',
      href: '/agent/players',
      icon: Users,
    },
    {
      title: 'Transfer Board',
      href: '/agent/transfers',
      icon: GitBranch,
      badge: '5',
    },
    {
      title: 'Negotiations',
      href: '/agent/negotiations',
      icon: Briefcase,
    },
    {
      title: 'Player Showcase',
      href: '/agent/showcase',
      icon: Award,
    },
    {
      title: 'Club Network',
      href: '/agent/network',
      icon: Building,
    },
    {
      title: 'Market Analysis',
      href: '/agent/market',
      icon: TrendingUp,
    },
    {
      title: 'Contracts',
      href: '/agent/contracts',
      icon: FileText,
    },
    {
      title: 'Calendar',
      href: '/agent/calendar',
      icon: Calendar,
    },
    {
      title: 'Deal Pipeline',
      href: '/agent/kanban',
      icon: Layers,
    },
  ],
  quickActions: [
    {
      title: 'New Deal',
      href: '/agent/transfers/new',
      icon: GitBranch,
    },
    {
      title: 'Add Player',
      href: '/agent/players/add',
      icon: Users,
    },
    {
      title: 'Market Report',
      href: '/agent/market/report',
      icon: FileText,
    },
  ],
};

// PLAYER Navigation
export const playerNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/player',
      icon: Home,
    },
    {
      title: 'My Passport',
      href: '/player/passport',
      icon: Shield,
    },
    {
      title: 'Statistics',
      href: '/player/stats',
      icon: BarChart3,
    },
    {
      title: 'Evaluations',
      href: '/player/reports',
      icon: FileText,
    },
    {
      title: 'Camps',
      href: '/player/camps',
      icon: Flag,
    },
    {
      title: 'Coaching',
      icon: BookOpen,
      children: [
        {
          title: 'Coaching Hub',
          href: '/player/coaching',
          icon: BookOpen,
        },
        {
          title: 'Book Session',
          href: '/player/coaching/book',
          icon: Calendar,
        },
        {
          title: 'My Sessions',
          href: '/player/coaching/history',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: 'Achievements',
      href: '/player/achievements',
      icon: Trophy,
    },
    {
      title: 'Club Interests',
      href: '/player/requests',
      icon: Building,
    },
    {
      title: 'My PlayStyle',
      href: '/player/dna',
      icon: Brain,
    },
    {
      title: 'My Valuation',
      href: '/player/market-value',
      icon: DollarSign,
    },
  ],
  quickActions: [
    {
      title: 'Book Coaching',
      href: '/player/coaching/book',
      icon: BookOpen,
    },
    {
      title: 'Update Passport',
      href: '/player/passport/edit',
      icon: Shield,
    },
    {
      title: 'View Stats',
      href: '/player/stats',
      icon: BarChart3,
    },
  ],
};

// CLUB_CONTACT Navigation
export const clubContactNav: NavigationConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/club-ops',
      icon: Home,
    },
    {
      title: 'Camp Management',
      href: '/club-ops/camps',
      icon: Flag,
    },
    {
      title: 'Event Management',
      href: '/club-ops/events',
      icon: Calendar,
    },
    {
      title: 'Venue Manager',
      href: '/club-ops/venues',
      icon: Map,
    },
    {
      title: 'Communications',
      href: '/club-ops/communications',
      icon: MessageSquare,
    },
    {
      title: 'Participants',
      href: '/club-ops/participants',
      icon: Users,
    },
    {
      title: 'Calendar',
      href: '/club-ops/calendar',
      icon: Calendar,
    },
  ],
  quickActions: [
    {
      title: 'Create Event',
      href: '/club-ops/events/create',
      icon: Calendar,
    },
    {
      title: 'New Camp',
      href: '/club-ops/camps/create',
      icon: Flag,
    },
    {
      title: 'Send Message',
      href: '/club-ops/communications/new',
      icon: MessageSquare,
    },
  ],
};

// Helper function to get navigation by role
export function getNavigationByRole(role: UserRole = DEFAULT_ROLE): NavigationConfig {
  switch (role) {
    case 'SUPER_ADMIN':
      return superAdminNav;
    case 'ADMIN':
      return adminNav;
    case 'SCOUT':
      return scoutNav;
    case 'ANALYST':
      return analystNav;
    case 'AGENT':
      return agentNav;
    case 'PLAYER':
      return playerNav;
    case 'CLUB_CONTACT':
      return clubContactNav;
    default:
      return { mainNav: [], quickActions: [] };
  }
}

// Helper to get dashboard path by role
export function getDashboardPath(role: UserRole = DEFAULT_ROLE): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'ADMIN':
      return '/club';
    case 'SCOUT':
      return '/scout';
    case 'ANALYST':
      return '/analyst';
    case 'AGENT':
      return '/agent';
    case 'PLAYER':
      return '/player';
    case 'CLUB_CONTACT':
      return '/club-ops';
    default:
      return '/';
  }
}

// Helper to check if user can access path
export function canAccessPath(role: UserRole = DEFAULT_ROLE, path: string): boolean {
  const navigation = getNavigationByRole(role);
  const allPaths = extractAllPaths(navigation.mainNav);
  return allPaths.includes(path) || path === '/profile' || path === '/settings';
}

function extractAllPaths(items: NavItem[]): string[] {
  let paths: string[] = [];
  items.forEach(item => {
    if (item.href) {
      paths.push(item.href);
    }
    if (item.children) {
      paths = [...paths, ...extractAllPaths(item.children)];
    }
  });
  return paths;
}
