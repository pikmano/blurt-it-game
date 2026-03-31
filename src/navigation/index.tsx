import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { SetupScreen } from '../screens/SetupScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { useAppSettings } from '../context/AppSettingsContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { strings } = useAppSettings();
  const t = strings;

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#6C63FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Setup"
        component={SetupScreen}
        options={{ title: t.setup.title }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: t.home.title,
          headerBackVisible: false, // no going back mid-game
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          title: t.results.title,
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: t.history.title }}
      />
    </Stack.Navigator>
  );
}
