import 'react-native-gesture-handler';
import { gestureHandlerRootHOC, GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initDatabase } from './database';
import SearchScreen from './screens/SearchScreen';
import RatingsScreen from './screens/RatingsScreen';
import RateScreen from './screens/RateScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from './ErrorBoundary';
import ProfileScreen from './screens/ProfileScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();
const RatingsStack = createStackNavigator();

const SearchStackScreen = () => (
  <SearchStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      fullScreenGestureEnabled: true,
      animation: 'slide_from_right',
    }}
  >
    <SearchStack.Screen name="SearchMain" component={SearchScreen} />
    <SearchStack.Screen name="Rate" component={RateScreen} />
  </SearchStack.Navigator>
);

const RatingsStackScreen = () => (
  <RatingsStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      fullScreenGestureEnabled: true,
      animation: 'slide_from_right',
    }}
  >
    <RatingsStack.Screen name="RatingsList" component={RatingsScreen} />
    <RatingsStack.Screen name="Rate" component={RateScreen} />
  </RatingsStack.Navigator>
);

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
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;
                  if (route.name === 'Search') {
                    iconName = focused ? 'search' : 'search-outline';
                  } else if (route.name === 'Ratings') {
                    iconName = focused ? 'list' : 'list-outline';
                  }
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#1EB1FC',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
              })}
            >
              <Tab.Screen name="Search" component={SearchStackScreen} options={{ title: 'Songs suchen' }} />
              <Tab.Screen name="Ratings" component={RatingsStackScreen} options={{ title: 'Meine Ratings' }} />
              <Tab.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  options={{ 
                    title: 'Profil',
                    tabBarIcon: ({ focused, color, size }) => (
                      <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                    )
                  }} 
                />
            </Tab.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default gestureHandlerRootHOC(() => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));