import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import ReportsListScreen from '../screens/reports/ReportsListScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';
import CreateReportScreen from '../screens/reports/CreateReportScreen';

export type ReportsStackParamList = {
  ReportsList: undefined;
  ReportDetail: { reportId: string };
  CreateReport: undefined;
};

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export default function ReportsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ReportsList" component={ReportsListScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
    </Stack.Navigator>
  );
}
