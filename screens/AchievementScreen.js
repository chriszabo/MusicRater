import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, Image } from 'react-native';
import { getAllAchievements } from '../database';
import { Ionicons } from '@expo/vector-icons';

const getAchievementIcon = (achievementName) => {
    const iconMap = {
      pioneer: 'rocket',
      marathon: 'walk',
      collector: 'albums',
      perfectionist: 'star',
      explorer: 'compass',
      specialist: 'musical-notes',
      veteran: 'trophy',
      speedster: 'flash',
      socialite: 'people',
      critic: 'pencil'
    };
  
    return (
      <Ionicons 
        name={iconMap[achievementName] || 'ribbon'} 
        size={40} 
        color="#2A9D8F" 
        style={styles.icon}
      />
    );
  };

const AchievementScreen = () => {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getAllAchievements();
      setAchievements(data);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={achievements}
        renderItem={({ item }) => (
            <View style={[
            styles.item, 
            !item.unlocked && styles.lockedItem
            ]}>
            <Ionicons
                name={item.unlocked ? item.icon : 'lock-closed'}
                size={32}
                color={item.unlocked ? '#2A9D8F' : '#ccc'}
            />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>
                {item.unlocked ? item.description : 'Noch nicht freigeschaltet'}
                </Text>
                {item.unlocked && (
                <Text style={styles.date}>
                    Freigeschaltet am {new Date(item.unlocked_at).toLocaleDateString()}
                </Text>
                )}
            </View>
            </View>
        )}
        />
    </View>
  );
};

const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 15,
      marginVertical: 8,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      elevation: 2,
    },
    icon: {
      marginRight: 15,
      padding: 10,
      backgroundColor: '#F0FAF9',
      borderRadius: 20,
    },
    lockedItem: {
        opacity: 0.6,
        backgroundColor: '#f9f9f9'
      }
  });

export default AchievementScreen;