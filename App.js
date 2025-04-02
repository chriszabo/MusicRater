import 'react-native-gesture-handler';
import { gestureHandlerRootHOC, GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './database';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from './ThemeContext';
import MainNavigator from './MainNavigator';
import ThemedStatusBar from './components/ThemedStatusBar';

SplashScreen.preventAutoHideAsync();



function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <ThemeProvider>
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <ThemedStatusBar />
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <MainNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default gestureHandlerRootHOC(() => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));