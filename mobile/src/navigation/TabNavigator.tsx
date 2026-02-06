import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getTabsByRole, getStackScreens } from './config/navigationConfig';
import {
  Home,
  Users,
  BarChart3,
  FileText,
  Calendar,
  User,
  Settings,
  Shield,
  GitBranch,
  Briefcase,
  Globe,
  BookOpen,
  Flag,
  Tag,
  LogIn,
  MoreHorizontal,
  Cpu,
} from 'lucide-react-native';
import type { UserRole } from '../lib/roles';
import { DEFAULT_ROLE } from '../lib/roles';
import { Badge, Text, View } from 'react-native';

// Import screens (these will be created in Phase D)
// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';

// Club Admin Screens
import ClubDashboardScreen from '../screens/club/ClubDashboardScreen';
import SquadManagerScreen from '../screens/club/SquadManagerScreen';
import ClubReportsScreen from '../screens/club/ClubReportsScreen';
import ClubAnalyticsScreen from '../screens/club/ClubAnalyticsScreen';
import ClubMoreScreen from '../screens/club/ClubMoreScreen';

// Scout Screens
import ScoutDashboardScreen from '../screens/scout/ScoutDashboardScreen';
import PlayerDatabaseScreen from '../screens/scout/PlayerDatabaseScreen';
import ScoutReportsScreen from '../screens/scout/ScoutReportsScreen';
import ScoutCalendarScreen from '../screens/scout/ScoutCalendarScreen';

// Analyst Screens
import AnalystDashboardScreen from '../screens/analyst/AnalystDashboardScreen';
import PlayerAnalyticsScreen from '../screens/analyst/PlayerAnalyticsScreen';
import AIPredictionsScreen from '../screens/analyst/AIPredictionsScreen';
import ComparisonToolScreen from '../screens/analyst/ComparisonToolScreen';

// Agent Screens
import AgentPortfolioScreen from '../screens/agent/AgentPortfolioScreen';
import TransferBoardScreen from '../screens/agent/TransferBoardScreen';
import ClubNetworkScreen from '../screens/agent/ClubNetworkScreen';
import AgentCalendarScreen from '../screens/agent/AgentCalendarScreen';

// Player Screens
import PlayerDashboardScreen from '../screens/player/PlayerDashboardScreen';
import PlayerPassportScreen from '../screens/player/PlayerPassportScreen';
import CoachingHubScreen from '../screens/player/CoachingHubScreen';
import PlayerCampsScreen from '../screens/player/PlayerCampsScreen';

// Club Contact Screens
import OperationsDashboardScreen from '../screens/club-ops/OperationsDashboardScreen';
import CampManagementScreen from '../screens/club-ops/CampManagementScreen';
import EventManagementScreen from '../screens/club-ops/EventManagementScreen';
import OperationsCalendarScreen from '../screens/club-ops/OperationsCalendarScreen';

// Public Screens
import HomeScreen from '../screens/home/HomeScreen';
import PublicPlayersScreen from '../screens/public/PublicPlayersScreen';
import PublicClubsScreen from '../screens/public/PublicClubsScreen';
import PricingScreen from '../screens/pricing/PricingScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Shared Screens
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Map component names to actual components
const componentMap = {
  // Admin
  AdminDashboard: AdminDashboardScreen,
  UserManagement: UserManagementScreen,
  AdminAnalytics: AdminAnalyticsScreen,
  SystemSettings: SystemSettingsScreen,

  // Club Admin
  ClubDashboard: ClubDashboardScreen,
  SquadManager: SquadManagerScreen,
  ClubReports: ClubReportsScreen,
  ClubAnalytics: ClubAnalyticsScreen,
  ClubMore: ClubMoreScreen,

  // Scout
  ScoutDashboard: ScoutDashboardScreen,
  PlayerDatabase: PlayerDatabaseScreen,
  ScoutReports: ScoutReportsScreen,
  ScoutCalendar: ScoutCalendarScreen,

  // Analyst
  AnalystDashboard: AnalystDashboardScreen,
  PlayerAnalytics: PlayerAnalyticsScreen,
  AIPredictions: AIPredictionsScreen,
  ComparisonTool: ComparisonToolScreen,

  // Agent
  AgentPortfolio: AgentPortfolioScreen,
  TransferBoard: TransferBoardScreen,
  ClubNetwork: ClubNetworkScreen,
  AgentCalendar: AgentCalendarScreen,

  // Player
  PlayerDashboard: PlayerDashboardScreen,
  PlayerPassport: PlayerPassportScreen,
  CoachingHub: CoachingHubScreen,
  PlayerCamps: PlayerCampsScreen,

  // Club Contact
  OperationsDashboard: OperationsDashboardScreen,
  CampManagement: CampManagementScreen,
  EventManagement: EventManagementScreen,
  OperationsCalendar: OperationsCalendarScreen,

  // Public
  HomeScreen: HomeScreen,
  PublicPlayers: PublicPlayersScreen,
  PublicClubs: PublicClubsScreen,
  PricingScreen: PricingScreen,
  LoginScreen: LoginScreen,

  // Shared
  ProfileScreen: ProfileScreen,
};

// Icon mapping
const iconMap = {
  'home': Home,
  'users': Users,
  'bar-chart': BarChart3,
  'file-text': FileText,
  'calendar': Calendar,
  'user': User,
  'settings': Settings,
  'shield': Shield,
  'git-branch': GitBranch,
  'briefcase': Briefcase,
  'globe': Globe,
  'book-open': BookOpen,
  'flag': Flag,
  'tag': Tag,
  'log-in': LogIn,
  'more-horizontal': MoreHorizontal,
  'cpu': Cpu,
};

// Create Stack Navigator for each tab
function createTabStack(screens: any[], initialRouteName: string) {
  return function TabStack() {
    return (
      <Stack.Navigator initialRouteName={initialRouteName}>
        {screens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={componentMap[screen.component]}
            options={{ headerShown: false }}
          />
        ))}
      </Stack.Navigator>
    );
  };
}

export default function TabNavigator() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const userRole = (user?.role as UserRole) || DEFAULT_ROLE;

  const navigationConfig = getTabsByRole(userRole);

  return (
    <Tab.Navigator
      initialRouteName={navigationConfig.initialRoute}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      {navigationConfig.tabs.map((tab) => {
        const Icon = iconMap[tab.icon] || Home;
        const Component = componentMap[tab.component];
        const stackScreens = getStackScreens(tab.component);

        // If tab has stack screens, create a stack navigator
        const ScreenComponent = stackScreens.length > 0
          ? createTabStack(stackScreens, stackScreens[0].name)
          : Component;

        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={ScreenComponent}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ focused, color, size }) => (
                <View style={{ position: 'relative' }}>
                  <Icon
                    color={color}
                    size={size}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                  {tab.badge && tab.badge > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: theme.colors.error,
                        borderRadius: 10,
                        width: 18,
                        height: 18,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.background,
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      >
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
