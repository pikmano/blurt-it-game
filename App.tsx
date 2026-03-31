import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import { GameProvider } from './src/context/GameContext';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <AppSettingsProvider>
      <GameProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </GameProvider>
    </AppSettingsProvider>
  );
}
