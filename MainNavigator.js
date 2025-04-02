// MainNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import ProfileScreen from './screens/ProfileScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import CustomRatingScreen from './screens/CustomRatingScreen';
import AchievementScreen from './screens/AchievementScreen';
import GameScreen from './screens/GameScreen';
import AlbumTracksScreen from './screens/AlbumTracksScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import IgnoredSongsScreen from './screens/IgnoredSongScreen';
import SearchScreen from './screens/SearchScreen';
import RatingsScreen from './screens/RatingsScreen';
import RateScreen from './screens/RateScreen';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();
const RatingsStack = createStackNavigator();
const WatchlistStack = createStackNavigator();

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
    <SearchStack.Screen name="AlbumTracks" component={AlbumTracksScreen} />
    <SearchStack.Screen name="Rate" component={RateScreen} />
    <SearchStack.Screen name="Watchlist" component={WatchlistScreen} />
    <SearchStack.Screen name="IgnoredSongs" component={IgnoredSongsScreen} />
  </SearchStack.Navigator>
);

const WatchlistStackScreen = () => (
  <WatchlistStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      animation: 'slide_from_right',
    }}
  >
    <WatchlistStack.Screen name="WatchlistMain" component={WatchlistScreen} />
    <WatchlistStack.Screen name="Rate" component={RateScreen} />
    <WatchlistStack.Screen name="AlbumTracks" component={AlbumTracksScreen} />
  </WatchlistStack.Navigator>
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

const MainNavigator = () => {
  const { COLORS } = useTheme(); // Jetzt innerhalb des ThemeProviders

  return (
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
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
            backgroundColor: COLORS.surface,
        },
        headerShown: false,
        })}
    >
        <Tab.Screen 
        name="Search" 
        component={SearchStackScreen} 
        options={{ 
            title: 'Musik',
            tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
                name={focused ? 'musical-notes' : 'musical-notes-outline'} 
                size={size} 
                color={color} 
            />
            )
        }} 
        />
        <Tab.Screen name="Ratings" component={RatingsStackScreen} options={{ title: 'Ratings' }} />
        <Tab.Screen 
        name="Watchlist" 
        component={WatchlistStackScreen} 
        options={{ 
            title: 'Merkliste',
            tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
            )
        }}
        />
        <Tab.Screen 
            name="Statistics" 
            component={StatisticsScreen} 
            options={{ 
            title: 'Stats',
            tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
            )
            }} 
        />
        <Tab.Screen 
            name="CustomRating" 
            component={CustomRatingScreen} 
            options={{ 
            title: 'Custom',
            tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={size} color={color} />
            )
            }} 
        />
        <Tab.Screen 
            name="Achievements" 
            component={AchievementScreen}
            options={{
            title: 'Erfolge',
            tabBarIcon: ({ color, size }) => (
                <Ionicons name="trophy" size={size} color={color} />
            )
            }}
        />
        <Tab.Screen 
        name="Game" 
        component={GameScreen} 
        options={{ 
            title: 'Game',
            tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
            )
        }}
        />
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
  );
};

export default MainNavigator;