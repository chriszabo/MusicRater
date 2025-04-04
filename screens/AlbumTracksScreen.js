import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { getAlbum } from '../spotify';
import SongItem from '../components/SongItem';
import { addSong, getAllRatings, getExistingRating, addToWatchlist, removeFromWatchlist, getWatchlistItems, getIgnoredSongs, addToIgnored, removeFromIgnored } from '../database';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

const AlbumTracksScreen = ({ route, navigation }) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [existingRatings, setExistingRatings] = useState([]);
  const [existingWatchlistItems, setExistingWatchlistItems] = useState([]);
  const [ignoredSongs, setIgnoredSongs] = useState([]);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const ignored = await getIgnoredSongs();
        const ignoredIds = ignored.map(i => i.id)
        setIgnoredSongs(ignoredIds);

        const album = await getAlbum(route.params.albumId);
        setAlbumInfo({
          title: album.name,
          image: album.images[0]?.url
        });
        
        const formattedTracks = album.tracks.items.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: album.name,
          duration: track.duration_ms,
          image: album.images[0]?.url,
          album_id: album.id,
          album_tracks: album.total_tracks,
        }));
        
        setTracks(formattedTracks.filter(track => !ignoredIds.includes(track.id)));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, [route.params.albumId]);

  useFocusEffect(
    useCallback(() => {
      const loadWatchlist = async () => {
        const items = await getWatchlistItems();
        setExistingWatchlistItems(items);
      };
      loadWatchlist();
    }, [])
  );

  const handleWatchlistToggle = async (item, type) => {
      try {
        if (existingWatchlistItems.some(w => w.id === item.id)) {
          await removeFromWatchlist(item.id);
        } else {
          await addToWatchlist(item, type);
        }
        // Direkte State-Aktualisierung
        const updatedItems = await getWatchlistItems();
        setExistingWatchlistItems(updatedItems);
      } catch (error) {
        console.error("Watchlist error:", error);
      }
    };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const ratings = await getAllRatings({}, {});
      setExistingRatings(ratings);
    });
    return unsubscribe;
  }, [navigation]);

  const getScoreForSong = (songId) => {
    const rating = existingRatings.find(r => r.song_id === songId);
    return rating?.score;
  };

  const handleTrackPress = async (item) => {
    await addSong(item);
    const existingRating = await getExistingRating(item.id);
    navigation.navigate('Rate', { 
      songId: item.id,
      initialScore: existingRating?.score ?? null,
      initialNotes: existingRating?.notes ?? null,
      title: item.title,
      artist: item.artist,
      album: item.album,
      image: item.image
    });
  };

  const handleIgnoreToggle = async (item) => {
    try {
      if (ignoredSongs.includes(item.id)) {
        await removeFromIgnored(item.id);
        setTracks(prev => [...prev, item]);
      } else {
        Alert.alert(
                      "Song ausblenden",
                      "Willst du diesen Song aus zukünftigen Suchen ausblenden?",
                      [
                        { text: "Abbrechen", style: "cancel" },
                        { 
                          text: "Ausblenden", 
                          style: "default",
                          onPress: async () => {
                            await addSong(item);
                            await addToIgnored(item.id);
                            setTracks(prev => prev.filter(track => track.id !== item.id));
                          }
                        }
                      ]
                    );
        
      }
      const updated = await getIgnoredSongs();
      setIgnoredSongs(updated.map(i => i.id));
    } catch (error) {
      console.error("Ignore error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              onPress={() => handleTrackPress(item)}
              score={getScoreForSong(item.id)}
              isRated={existingRatings.some(r => r.song_id === item.id)}
              onWatchlistToggle={() => handleWatchlistToggle(item, 'track')}
              isInWatchlist={existingWatchlistItems.some(w => w.id === item.id && w.type === 'track')}
              isIgnored={ignoredSongs.includes(item.id)}
              onIgnoreToggle={() => handleIgnoreToggle(item)}
            />
          )}
        />
      )}
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
});

export default AlbumTracksScreen;