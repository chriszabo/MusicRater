import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, Image } from 'react-native';
import { getAllAchievements, checkAchievements } from '../database';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

const AchievementScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const load = async () => {
      if (isFocused) {
        await checkAchievements();
        const data = await getAllAchievements();
        const sortedData = data.sort((a, b) => {
          if (a.unlocked && b.unlocked) {
            return new Date(b.unlocked_at) - new Date(a.unlocked_at); // Neueste zuerst
          }
          if (a.unlocked) return -1; // Freigeschaltete nach oben
          if (b.unlocked) return 1;  // Nicht freigeschaltete nach unten
          return 0;
        });
  
        setAchievements(sortedData);
      }
    };
    load();
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <FlatList
        data={achievements}
        renderItem={({ item }) => (
          <View style={[
            styles.item, 
            !item.unlocked && styles.lockedItem,
            { borderLeftWidth: 5, borderLeftColor: item.color } // Farbiger Rand
          ]}>
            <Ionicons
              name={item.unlocked ? item.icon : 'lock-closed'}
              size={32}
              color={item.unlocked ? item.color : '#ccc'} // Farbe an Achievement-Level
              style={styles.icon}
            />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>
                  {item.description}
                </Text>
                {!item.unlocked && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {item.currentCount}/{item.threshold}
                    </Text>
                  </View>
                )}
                {item.unlocked && (
                  <Text style={styles.date}>
                      Freigeschaltet am {new Date(item.unlocked_at).toLocaleDateString()}
                  </Text>
                )}
            </View>
          </View>
        )}
        keyExtractor={item => item.name}
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
      borderLeftWidth: 5,
    marginLeft: 10,
    marginRight: 15,
    },
    lockedItem: {
        opacity: 0.6,
        backgroundColor: '#f9f9f9'
      },
      textContainer: {
        flex: 1,
      },
      progressContainer: {
        marginTop: 8,
      },
      progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        backgroundColor: '#2A9D8F',
        borderRadius: 3,
      },
      progressText: {
        marginTop: 4,
        fontSize: 12,
        color: '#666',
      },
      icon: {
        marginRight: 15,
      },
  });

export default AchievementScreen;