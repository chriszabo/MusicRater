import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initDatabase } from './database';
import SearchScreen from './screens/SearchScreen';
import RatingsScreen from './screens/RatingsScreen';
import RateScreen from './screens/RateScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();
const RatingsStack = createStackNavigator();

// Search Stack
const SearchStackScreen = () => (
  <SearchStack.Navigator>
    <SearchStack.Screen 
      name="SearchMain" 
      component={SearchScreen} 
      options={{ headerShown: false }}
    />
    <SearchStack.Screen 
      name="Rate" 
      component={RateScreen}
      options={{ title: 'Rate Song' }}
    />
  </SearchStack.Navigator>
);

// Ratings Stack
const RatingsStackScreen = () => (
  <RatingsStack.Navigator>
    <RatingsStack.Screen 
      name="RatingsList" 
      component={RatingsScreen} 
      options={{ headerShown: false }}
    />
    <RatingsStack.Screen 
      name="Rate" 
      component={RateScreen}
      options={{ title: 'Edit Rating' }}
    />
  </RatingsStack.Navigator>
);

export default function App() { // Remove async
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
    <NavigationContainer>
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
        })}
      >
        <Tab.Screen 
          name="Search" 
          component={SearchStackScreen} 
          options={{ title: 'Search Songs' }}
        />
        <Tab.Screen 
          name="Ratings" 
          component={RatingsStackScreen} 
          options={{ title: 'My Ratings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}