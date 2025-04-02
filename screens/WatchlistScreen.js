import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image, ScrollView, TextInput } from 'react-native';
import { getWatchlistItems, removeFromWatchlist, saveGlobalWatchlistNote, getGlobalWatchlistNote, getExistingRating } from '../database';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

const WatchlistScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [globalNote, setGlobalNote] = useState('');
  const isFocused = useIsFocused();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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
      style={styles.list}
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

const createStyles = (COLORS) => StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  details: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    backgroundColor: COLORS.error + '20',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 30,
    color: COLORS.error,
    lineHeight: 28,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: COLORS.textSecondary,
    fontSize: 16,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  noteInput: {
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    marginBottom: 15,
    backgroundColor: COLORS.surface,
    textAlignVertical: 'top',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
});

export default WatchlistScreen;