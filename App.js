import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initDatabase } from './database';
import SearchScreen from './screens/SearchScreen';
import RatingsScreen from './screens/RatingsScreen';
import RateScreen from './screens/RateScreen';

const Stack = createStackNavigator();

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
      <Stack.Navigator>
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen 
          name="Rate" 
          component={RateScreen}
          options={{ title: 'Rate Song' }}
        />
        <Stack.Screen 
          name="Ratings" 
          component={RatingsScreen}
          options={{ title: 'My Ratings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}