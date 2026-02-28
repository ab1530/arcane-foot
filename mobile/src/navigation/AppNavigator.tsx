import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../design/theme';
import type { AppStackParamList } from '../types/navigation';
import MainTabNavigator from './MainTabNavigator';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import ClubNeedsScreen from '../screens/admin/ClubNeedsScreen';
import ScoutsDirectoryScreen from '../screens/admin/ScoutsDirectoryScreen';
import ScoutAdminDetailScreen from '../screens/admin/ScoutAdminDetailScreen';
import { CampsListScreen } from '../screens/camps/CampsListScreen';
import { CampDetailScreen } from '../screens/camps/CampDetailScreen';
import { MyCampsScreen } from '../screens/camps/MyCampsScreen';
import { AIScreen } from '../screens/ai/AIScreen';
import { ArcaneGPTScreen } from '../screens/ai/ArcaneGPTScreen';
import { ArcaneIndexScreen } from '../screens/ai/ArcaneIndexScreen';
import { ArkaneMatchScreen } from '../screens/ai/ArkaneMatchScreen';
import { SmartScoutScreen } from '../screens/ai/SmartScoutScreen';
import { AutoScoutScreen } from '../screens/ai/AutoScoutScreen';
import { AutoScoutHistoryScreen } from '../screens/ai/AutoScoutHistoryScreen';
import { MarketValueScreen } from '../screens/ai/MarketValueScreen';
import { MarketValueDetailScreen } from '../screens/ai/MarketValueDetailScreen';
import { PlayerDetailScreen } from '../screens/players/PlayerDetailScreen';
import KanbanScreen from '../screens/kanban/KanbanScreen';
import ClubDetailScreen from '../screens/clubs/ClubDetailScreen';
import ClubsListScreen from '../screens/clubs/ClubsListScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';
import CreateReportScreen from '../screens/reports/CreateReportScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { CalendarScreenNew } from '../screens/calendar/CalendarScreenNew';
import { MatchDetailScreen } from '../screens/calendar/MatchDetailScreen';
import MissionRequestsScreen from '../screens/calendar/MissionRequestsScreen';
import MembershipScreen from '../screens/membership/MembershipScreen';
import AboutScreen from '../screens/info/AboutScreen';
import ContactScreen from '../screens/info/ContactScreen';
import ServicesScreen from '../screens/info/ServicesScreen';
import PassportScreen from '../screens/passport/PassportScreen';
import PassportPreviewScreen from '../screens/passport/PassportPreviewScreen';
import { PlayerPassport } from '../screens/players/PlayerPassport';
import PlayerHighlightsScreen from '../screens/players/PlayerHighlightsScreen';
import PlayerComparisonScreen from '../screens/players/PlayerComparisonScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import ScoutProfileScreen from '../screens/profile/ScoutProfileScreen';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import ScoutDetailScreen from '../screens/marketplace/ScoutDetailScreen';
import { PlayersScreen } from '../screens/players/PlayersScreen';
import ScoutQuickImportScreen from '../screens/players/ScoutQuickImportScreen';
import AgentRequestsScreen from '../screens/agent/AgentRequestsScreen';
import VoiceToReportScreen from '../screens/reports/VoiceToReportScreen';
import GlobalSearchScreen from '../screens/search/GlobalSearchScreen';
import LoggingTestScreen from '../screens/debug/LoggingTestScreen';
import LogConsoleScreen from '../screens/debug/LogConsoleScreen';
import { PlayerHardwareSessionsScreen } from '../screens/hardware/PlayerHardwareSessionsScreen';
import { PlayerHardwareSessionDetailScreen } from '../screens/hardware/PlayerHardwareSessionDetailScreen';
import { ConnectGpsTrackerScreen } from '../screens/hardware/ConnectGpsTrackerScreen';
import { ImportGpsSessionScreen } from '../screens/hardware/ImportGpsSessionScreen';
import { QCBandScreen } from '../screens/hardware/QCBandScreen';
import { isFeatureEnabled } from '../constants/features';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const scoutProfileEnabled = isFeatureEnabled('scoutProfileScreen');

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
        name="GlobalSearch"
        component={GlobalSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Market"
        component={MarketplaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClubNeeds"
        component={ClubNeedsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutsDirectory"
        component={ScoutsDirectoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutAdminDetail"
        component={ScoutAdminDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camps"
        component={CampsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CampDetail"
        component={CampDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyCamps"
        component={MyCampsScreen}
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
        name="AutoScout"
        component={AutoScoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AutoScoutHistory"
        component={AutoScoutHistoryScreen}
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
        name="Players"
        component={PlayersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutQuickImport"
        component={ScoutQuickImportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerPassport"
        component={PlayerPassport}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerHighlights"
        component={PlayerHighlightsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerComparison"
        component={PlayerComparisonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HardwareSessions"
        component={PlayerHardwareSessionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HardwareSessionDetail"
        component={PlayerHardwareSessionDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConnectGpsTracker"
        component={ConnectGpsTrackerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ImportGpsSession"
        component={ImportGpsSessionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QCBand"
        component={QCBandScreen}
        options={{ headerShown: false }}
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
        name="VoiceToReport"
        component={VoiceToReportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreenNew}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MissionRequests"
        component={MissionRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
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
      {scoutProfileEnabled ? (
        <Stack.Screen
          name="ScoutProfile"
          component={ScoutProfileScreen}
          options={{ headerShown: false }}
        />
      ) : null}
      <Stack.Screen
        name="PassportPreview"
        component={PassportPreviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AgentRequests"
        component={AgentRequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScoutDetail"
        component={ScoutDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoggingTest"
        component={LoggingTestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LogConsole"
        component={LogConsoleScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
