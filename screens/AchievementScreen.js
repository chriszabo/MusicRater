import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, Image } from 'react-native';
import { getAllAchievements, checkAchievements } from '../database';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

const AchievementScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const isFocused = useIsFocused();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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
              color={item.unlocked ? item.color : COLORS.background} // Farbe an Achievement-Level
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

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 5,
  },
  lockedItem: {
    opacity: 0.7,
    backgroundColor: COLORS.surfaceVariant,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.albumBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  icon: {
    marginRight: 15,
  },
});

export default AchievementScreen;