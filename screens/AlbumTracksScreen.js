import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { getAlbum } from '../spotify';
import SongItem from '../components/SongItem';
import { addSong, getAllRatings, getExistingRating, addToWatchlist, removeFromWatchlist, getWatchlistItems } from '../database';
import { useFocusEffect } from '@react-navigation/native';

const AlbumTracksScreen = ({ route, navigation }) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [existingRatings, setExistingRatings] = useState([]);
  const [existingWatchlistItems, setExistingWatchlistItems] = useState([]);

  useEffect(() => {
    const loadAlbum = async () => {
      try {
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
        
        setTracks(formattedTracks);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, []);

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
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
});

export default AlbumTracksScreen;