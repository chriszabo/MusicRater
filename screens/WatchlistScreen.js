import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image, ScrollView, TextInput } from 'react-native';
import { getWatchlistItems, removeFromWatchlist, saveGlobalWatchlistNote, getGlobalWatchlistNote, getExistingRating } from '../database';
import { useIsFocused } from '@react-navigation/native';

const WatchlistScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [globalNote, setGlobalNote] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadData = async () => {
      if (isFocused) {
        const [watchlistItems, savedNote] = await Promise.all([
          getWatchlistItems(),
          getGlobalWatchlistNote()
        ]);
        setItems(watchlistItems);
        setGlobalNote(savedNote);
      }
    };
    loadData();
  }, [isFocused]);

  const handleRemove = async (itemId) => {
    await removeFromWatchlist(itemId);
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleWatchlistToggle = async (item, type) => {
      try {
        if (items.some(w => w.id === item.id)) {
          await removeFromWatchlist(item.id);
        } else {
          await addToWatchlist(item, type);
        }
        // Direkte State-Aktualisierung
        const updatedItems = await getWatchlistItems();
        setItems(updatedItems);
      } catch (error) {
        console.error("Watchlist error:", error);
      }
    };

  const handleNoteChange = async (text) => {
    setGlobalNote(text);
    await saveGlobalWatchlistNote(text);
  };

  const renderItem = ({ item }) => {
    console.log("Renderitem", item);
    return (
    <TouchableOpacity 
      style={styles.item}
      onPress={async () => {
        if (item.type === 'album') {
          navigation.navigate('AlbumTracks', { albumId: item.id, handleWatchlistToggle: handleWatchlistToggle });
        } else {
          const existingRating = await getExistingRating(item.id);
          navigation.navigate('Rate', { 
            songId: item.id,
            title: item.title,
            artist: item.artist,
            album: item.album,
            image: item.image,
            album_id: item.album_id,
            album_tracks: item.album_tracks,
            duration: item.duration,
            initialScore: existingRating?.score ?? null,
            initialNotes: existingRating?.notes ?? null,
          });
        }
      }}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.details}>
          {item.type === 'album' ? `Album von ${item.artist}` : `Song von ${item.artist}`}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleRemove(item.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
    )
  };

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <TextInput
          style={styles.noteInput}
          multiline
          placeholder="Allgemeine Notizen..."
          value={globalNote}
          onChangeText={handleNoteChange}
          onBlur={() => saveGlobalWatchlistNote(globalNote)}
        />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>Keine Einträge in der Merkliste</Text>
      }
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#F8F9FA',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  details: {
    color: '#666',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    fontSize: 24,
    color: '#E76F51',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  noteInput: {
    fontSize: 14,
    color: '#444',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 10,
    backgroundColor: 'white',
  },
});

export default WatchlistScreen;