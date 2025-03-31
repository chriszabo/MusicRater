import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#2A9D8F',  // Sanftes Türkis
    secondary: '#264653', // Tiefes Blau-Grau
    accent: '#E9C46A',   // Warmes Senfgelb
    background: '#F8F9FA', // Sehr helles Grau
    text: '#2B2D42',      //Dunkles Grau-Blau
    error: '#E76F51',    // Warmes Korallenrot
  };
  
  const SongItem = ({ song, onPress, score, isRated, isInWatchlist, onWatchlistToggle }) => {
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
        <TouchableOpacity onPress={onWatchlistToggle}>
      <Ionicons 
        name={isInWatchlist ? 'bookmark' : 'bookmark-outline'} 
        size={24} 
        color={isInWatchlist ? '#2A9D8F' : '#666'} 
      />
    </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 15,
      marginVertical: 5,
      marginHorizontal: 10,
      backgroundColor: 'white',
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#000',
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
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    rated: {
      backgroundColor: '#F0FAF9',
      borderWidth: 2,
      borderColor: '#2A9D8F40',
    }
  });

export default SongItem;