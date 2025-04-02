import React, {useMemo} from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

  
  const SongItem = ({ song, onPress, score, isRated, isInWatchlist, onWatchlistToggle, isIgnored, onIgnoreToggle, showSubButtons = true }) => {
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);
    return (
      <TouchableOpacity 
        onPress={(e) => {
          e.persist();
          onPress();
        }}
        style={[styles.container, isRated && styles.rated]}
      >
        <Image source={{ uri: song.image }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.artist}>{song.artist}</Text>
          <Text style={styles.album}>{song.album}</Text>
        </View>
        {score !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        )}
        {showSubButtons &&(
        <TouchableOpacity onPress={onWatchlistToggle}>
      <Ionicons 
        name={isInWatchlist ? 'bookmark' : 'bookmark-outline'} 
        size={24} 
        color={isInWatchlist ? COLORS.primary : COLORS.textSecondary} 
      />
    </TouchableOpacity>
    )}
    <TouchableOpacity onPress={onIgnoreToggle} style={styles.ignoreButton}>
        <Ionicons 
          name={isIgnored ? 'eye' : 'eye-off'} 
          size={24} 
          color={isIgnored ? COLORS.textSecondary : COLORS.textSecondary} 
        />
      </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const createStyles =  (COLORS) => StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 15,
      marginVertical: 5,
      marginHorizontal: 10,
      backgroundColor: COLORS.surface,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
    },
    image: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 15,
    },
    title: {
      fontWeight: '600',
      fontSize: 16,
      color: COLORS.text,
      marginBottom: 4,
      flexWrap: 'wrap'
    },
    artist: {
      color: COLORS.secondary,
      fontSize: 14,
      flexWrap: 'wrap'
    },
    album: {
      color: COLORS.text + '90',
      fontSize: 13,
      flexWrap: 'wrap'
    },
    details: {
      flex: 1,
      marginRight: 10,
      maxWidth: '85%',
    },
    scoreContainer: {
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    scoreText: {
      color: COLORS.surface,
      fontSize: 12,
      fontWeight: 'bold',
    },
    rated: {
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
    ignoreButton: {
      marginLeft: 10,
      padding: 5,
    },
  });

export default SongItem;