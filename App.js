import 'react-native-gesture-handler'; // Wichtig für Wischgesten
import { gestureHandlerRootHOC, GestureHandlerRootView } from 'react-native-gesture-handler'; // Import für Android
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initDatabase } from './database';
import SearchScreen from './screens/SearchScreen';
import RatingsScreen from './screens/RatingsScreen';
import RateScreen from './screens/RateScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();
const RatingsStack = createStackNavigator();

// Search Stack
const SearchStackScreen = () => (
  <SearchStack.Navigator 
  screenOptions={{ 
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    // Android-spezifische Einstellungen:
    fullScreenGestureEnabled: true,
    animation: 'slide_from_right', // Für bessere Animation
  }}
  >
    <SearchStack.Screen 
      name="SearchMain" 
      component={SearchScreen} 
    />
    <SearchStack.Screen 
      name="Rate" 
      component={RateScreen}
    />
  </SearchStack.Navigator>
);

// Ratings Stack
const RatingsStackScreen = () => (
  <RatingsStack.Navigator 
  screenOptions={{ 
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    // Android-spezifische Einstellungen:
    fullScreenGestureEnabled: true,
    animation: 'slide_from_right', // Für bessere Animation
  }}
  >
    <RatingsStack.Screen 
      name="RatingsList" 
      component={RatingsScreen} 
    />
    <RatingsStack.Screen 
      name="Rate" 
      component={RateScreen}
    />
  </RatingsStack.Navigator>
);

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    };
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              headerShown: false, // Header für Tabs ausblenden
            })}
          >
            <Tab.Screen 
              name="Search" 
              component={SearchStackScreen} 
              options={{ title: 'Songs suchen' }}
            />
            <Tab.Screen 
              name="Ratings" 
              component={RatingsStackScreen} 
              options={{ title: 'Meine Ratings' }}
            />
          </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default gestureHandlerRootHOC(App); // Wichtig für Android