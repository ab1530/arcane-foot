import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../design/theme';
import type { AppStackParamList } from '../types/navigation';
import MainTabNavigator from './MainTabNavigator';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { MarketScreen } from '../screens/market/MarketScreen';
import { CampsScreen } from '../screens/camps/CampsScreen';
import { AIScreen } from '../screens/ai/AIScreen';
import { ArcaneGPTScreen } from '../screens/ai/ArcaneGPTScreen';
import { ArcaneIndexScreen } from '../screens/ai/ArcaneIndexScreen';
import { ArkaneMatchScreen } from '../screens/ai/ArkaneMatchScreen';
import { SmartScoutScreen } from '../screens/ai/SmartScoutScreen';
import { MarketValueScreen } from '../screens/ai/MarketValueScreen';
import { MarketValueDetailScreen } from '../screens/ai/MarketValueDetailScreen';
import { PlayerDetailScreen } from '../screens/players/PlayerDetailScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import KanbanScreen from '../screens/kanban/KanbanScreen';
import ClubDetailScreen from '../screens/clubs/ClubDetailScreen';
import ClubsListScreen from '../screens/clubs/ClubsListScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';
import CreateReportScreen from '../screens/reports/CreateReportScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { CalendarScreenNew } from '../screens/calendar/CalendarScreenNew';
import MembershipScreen from '../screens/membership/MembershipScreen';
import AboutScreen from '../screens/info/AboutScreen';
import ContactScreen from '../screens/info/ContactScreen';
import ServicesScreen from '../screens/info/ServicesScreen';
import PassportScreen from '../screens/passport/PassportScreen';
import { PlayerPassport } from '../screens/players/PlayerPassport';
import PlayerComparisonScreen from '../screens/players/PlayerComparisonScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ScoutingReportsScreen } from '../screens/scouting/ScoutingReportsScreen';
import { CreateScoutingReportScreen } from '../screens/scouting/CreateScoutingReportScreen';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import ScoutDetailScreen from '../screens/marketplace/ScoutDetailScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background.secondary,
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Market"
        component={MarketScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camps"
        component={CampsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AI"
        component={AIScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArcaneGPT"
        component={ArcaneGPTScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArcaneIndex"
        component={ArcaneIndexScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArkaneMatch"
        component={ArkaneMatchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SmartScout"
        component={SmartScoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MarketValue"
        component={MarketValueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MarketValueDetail"
        component={MarketValueDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerDetail"
        component={PlayerDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerPassport"
        component={PlayerPassport}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerComparison"
        component={PlayerComparisonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'Matches' }}
      />
      <Stack.Screen
        name="Kanban"
        component={KanbanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClubDetail"
        component={ClubDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{ title: 'Create Report' }}
      />
      <Stack.Screen
        name="Clubs"
        component={ClubsListScreen}
        options={{ title: 'Clubs' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreenNew}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Membership"
        component={MembershipScreen}
        options={{ title: 'Abonnement' }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'À propos' }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: 'Contact' }}
      />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: 'Services' }}
      />
      <Stack.Screen
        name="Passport"
        component={PassportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutingReports"
        component={ScoutingReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateScoutingReport"
        component={CreateScoutingReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutDetail"
        component={ScoutDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
