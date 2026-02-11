import type { UserRole } from '../../lib/roles';
import { DEFAULT_ROLE } from '../../lib/roles';

export interface TabConfig {
  name: string;
  component: string;
  label: string;
  icon: string;
  badge?: number;
}

export interface NavigationConfig {
  tabs: TabConfig[];
  initialRoute: string;
}

// SUPER_ADMIN Tabs
export const superAdminTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'AdminDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Users',
      component: 'UserManagement',
      label: 'Users',
      icon: 'users',
    },
    {
      name: 'Analytics',
      component: 'AdminAnalytics',
      label: 'Analytics',
      icon: 'bar-chart',
    },
    {
      name: 'System',
      component: 'SystemSettings',
      label: 'System',
      icon: 'settings',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Dashboard',
};

// ADMIN (Club) Tabs
export const adminTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'ClubDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Squad',
      component: 'SquadManager',
      label: 'Squad',
      icon: 'users',
    },
    {
      name: 'Reports',
      component: 'ClubReports',
      label: 'Reports',
      icon: 'file-text',
      badge: 3,
    },
    {
      name: 'Analytics',
      component: 'ClubAnalytics',
      label: 'Analytics',
      icon: 'bar-chart',
    },
    {
      name: 'More',
      component: 'ClubMore',
      label: 'More',
      icon: 'more-horizontal',
    },
  ],
  initialRoute: 'Dashboard',
};

// SCOUT Tabs
export const scoutTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'ScoutDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Players',
      component: 'PlayerDatabase',
      label: 'Players',
      icon: 'users',
    },
    {
      name: 'Reports',
      component: 'ScoutReports',
      label: 'Reports',
      icon: 'file-text',
      badge: 2,
    },
    {
      name: 'Calendar',
      component: 'ScoutCalendar',
      label: 'Calendar',
      icon: 'calendar',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Dashboard',
};

// ANALYST Tabs
export const analystTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'AnalystDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Analytics',
      component: 'PlayerAnalytics',
      label: 'Analytics',
      icon: 'bar-chart',
    },
    {
      name: 'Predictions',
      component: 'AIPredictions',
      label: 'AI',
      icon: 'cpu',
    },
    {
      name: 'Compare',
      component: 'ComparisonTool',
      label: 'Compare',
      icon: 'git-branch',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Dashboard',
};

// AGENT Tabs
export const agentTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Portfolio',
      component: 'AgentPortfolio',
      label: 'Portfolio',
      icon: 'briefcase',
    },
    {
      name: 'Transfers',
      component: 'TransferBoard',
      label: 'Transfers',
      icon: 'git-branch',
      badge: 5,
    },
    {
      name: 'Network',
      component: 'ClubNetwork',
      label: 'Network',
      icon: 'globe',
    },
    {
      name: 'Calendar',
      component: 'AgentCalendar',
      label: 'Calendar',
      icon: 'calendar',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Portfolio',
};

// PLAYER Tabs
export const playerTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'PlayerDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Passport',
      component: 'PlayerPassport',
      label: 'Passport',
      icon: 'shield',
    },
    {
      name: 'Coaching',
      component: 'CoachingHub',
      label: 'Coaching',
      icon: 'book-open',
    },
    {
      name: 'Camps',
      component: 'PlayerCamps',
      label: 'Camps',
      icon: 'flag',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Dashboard',
};

// CLUB_CONTACT Tabs
export const clubContactTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Dashboard',
      component: 'OperationsDashboard',
      label: 'Dashboard',
      icon: 'home',
    },
    {
      name: 'Camps',
      component: 'CampManagement',
      label: 'Camps',
      icon: 'flag',
    },
    {
      name: 'Events',
      component: 'EventManagement',
      label: 'Events',
      icon: 'calendar',
    },
    {
      name: 'Calendar',
      component: 'OperationsCalendar',
      label: 'Calendar',
      icon: 'calendar',
    },
    {
      name: 'Profile',
      component: 'ProfileScreen',
      label: 'Profile',
      icon: 'user',
    },
  ],
  initialRoute: 'Dashboard',
};

// PUBLIC Tabs (non-authenticated users)
export const publicTabs: NavigationConfig = {
  tabs: [
    {
      name: 'Home',
      component: 'HomeScreen',
      label: 'Home',
      icon: 'home',
    },
    {
      name: 'Players',
      component: 'PublicPlayers',
      label: 'Players',
      icon: 'users',
    },
    {
      name: 'Clubs',
      component: 'PublicClubs',
      label: 'Clubs',
      icon: 'shield',
    },
    {
      name: 'Pricing',
      component: 'PricingScreen',
      label: 'Pricing',
      icon: 'tag',
    },
    {
      name: 'Login',
      component: 'LoginScreen',
      label: 'Login',
      icon: 'log-in',
    },
  ],
  initialRoute: 'Home',
};

// Helper function to get tabs configuration by role
export function getTabsByRole(role: UserRole = DEFAULT_ROLE): NavigationConfig {
  switch (role) {
    case 'SUPER_ADMIN':
      return superAdminTabs;
    case 'ADMIN':
      return adminTabs;
    case 'SCOUT':
      return scoutTabs;
    case 'ANALYST':
      return analystTabs;
    case 'AGENT':
      return agentTabs;
    case 'PLAYER':
      return playerTabs;
    case 'CLUB_CONTACT':
      return clubContactTabs;
    case 'PUBLIC':
    default:
      return publicTabs;
  }
}

// Stack screens configuration for each tab
export const stackScreens = {
  // Admin stacks
  AdminDashboard: [
    { name: 'AdminHome', component: 'AdminDashboardScreen' },
    { name: 'Validation', component: 'PlayerValidationScreen' },
    { name: 'SystemHealth', component: 'SystemHealthScreen' },
  ],
  UserManagement: [
    { name: 'UsersList', component: 'UsersListScreen' },
    { name: 'UserDetail', component: 'UserDetailScreen' },
    { name: 'CreateUser', component: 'CreateUserScreen' },
  ],

  // Scout stacks
  PlayerDatabase: [
    { name: 'PlayersList', component: 'PlayersListScreen' },
    { name: 'PlayerDetail', component: 'PlayerDetailScreen' },
    { name: 'PlayerSearch', component: 'PlayerSearchScreen' },
  ],
  ScoutReports: [
    { name: 'ReportsList', component: 'ReportsListScreen' },
    { name: 'ReportDetail', component: 'ReportDetailScreen' },
    { name: 'CreateReport', component: 'CreateReportScreen' },
    { name: 'VoiceReport', component: 'VoiceToReportScreen' },
  ],

  // Analyst stacks
  AIPredictions: [
    { name: 'PredictionsHub', component: 'PredictionsHubScreen' },
    { name: 'PerformancePredictor', component: 'PerformancePredictorScreen' },
    { name: 'MarketValue', component: 'MarketValueScreen' },
    { name: 'PlayStyleDNA', component: 'PlayStyleDNAScreen' },
  ],
  ComparisonTool: [
    { name: 'CompareSelect', component: 'CompareSelectScreen' },
    { name: 'CompareResult', component: 'CompareResultScreen' },
  ],

  // Agent stacks
  TransferBoard: [
    { name: 'TransfersList', component: 'TransfersListScreen' },
    { name: 'TransferDetail', component: 'TransferDetailScreen' },
    { name: 'Negotiation', component: 'NegotiationScreen' },
  ],

  // Player stacks
  CoachingHub: [
    { name: 'CoachingHome', component: 'CoachingHubScreen' },
    { name: 'BookSession', component: 'BookSessionScreen' },
    { name: 'MyBookings', component: 'MyBookingsScreen' },
    { name: 'CoachProfile', component: 'CoachProfileScreen' },
  ],
  PlayerCamps: [
    { name: 'CampsList', component: 'CampsListScreen' },
    { name: 'CampDetail', component: 'CampDetailScreen' },
    { name: 'MyCamps', component: 'MyCampsScreen' },
  ],

  // Shared stacks
  ProfileScreen: [
    { name: 'ProfileHome', component: 'ProfileHomeScreen' },
    { name: 'EditProfile', component: 'EditProfileScreen' },
    { name: 'Settings', component: 'SettingsScreen' },
    { name: 'Subscription', component: 'SubscriptionScreen' },
  ],
};

// Helper to get stack screens for a component
export function getStackScreens(componentName: string) {
  return stackScreens[componentName] || [];
}
