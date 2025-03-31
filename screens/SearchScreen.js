import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TextInput, ActivityIndicator, Text, StyleSheet, Keyboard, TouchableOpacity, Image } from 'react-native';
import { searchSpotify, searchArtists, getArtistAlbums, getArtistTopTracks } from '../spotify';
import { addSong, getExistingRating, incrementProfileData, getAllRatings, getAlbumStatsById, addToWatchlist, removeFromWatchlist, getWatchlistItems } from '../database';
import SongItem from '../components/SongItem';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/colors';

const modeConfig = {
  track: {
    icon: 'musical-notes',
    placeholder: 'Songs suchen...',
    next: 'artist'
  },
  artist: {
    icon: 'people',
    placeholder: 'Interpreten suchen...',
    next: 'topTracks'
  },
  topTracks: {
    icon: 'trophy',
    placeholder: 'Interpreten für Top-Tracks...',
    next: 'track'
  }
};

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [artistTracks, setArtistTracks] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('track');
  const [existingRatings, setExistingRatings] = useState([]);
  const [albumStats, setAlbumStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState([]);

  // Daten laden bei Fokus und Änderungen
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadExistingRatings();
        if (artistAlbums.length > 0) await loadAlbumStats();
      };
      loadData();
    }, [artistAlbums, watchlistItems])
  );

  useFocusEffect(
    useCallback(() => {
      const loadWatchlist = async () => {
        const items = await getWatchlistItems();
        setWatchlistItems(items);
      };
      loadWatchlist();
    }, [])
  );

  const handleWatchlistToggle = async (item, type) => {
    try {
      if (watchlistItems.some(w => w.id === item.id)) {
        await removeFromWatchlist(item.id);
      } else {
        await addToWatchlist(item, type);
      }
      // Direkte State-Aktualisierung
      const updatedItems = await getWatchlistItems();
      setWatchlistItems(updatedItems);
    } catch (error) {
      console.error("Watchlist error:", error);
    }
  };

  const validateTrack = (track) => ({
    id: track.id || '',
    title: track.name || 'Unbekannter Titel',
    artist: track.artists?.[0]?.name || 'Unbekannter Interpret',
    album: track.album?.name || 'Unbekanntes Album',
    duration: track.duration_ms || 0,
    image: track.album?.images?.[0]?.url || '',
    album_id: track.album?.id || '',
    album_tracks: track.album?.total_tracks || 0,
  });

  // Album-Statistiken mit Parallelisierung
  const loadAlbumStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const statsPromises = artistAlbums.map(async album => {
        try {
          const data = await getAlbumStatsById(album.id);
          return {
            id: album.id,
            avg: data?.avgScore || 0,
            rated: data?.ratedSongs || 0,
            total: album.total_tracks
          };
        } catch (e) {
          return { id: album.id, avg: 0, rated: 0, total: album.total_tracks };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const newStats = statsResults.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {});
      
      setAlbumStats(newStats);
    } finally {
      setIsLoadingStats(false);
    }
  }, [artistAlbums]);

  // Existierende Bewertungen laden
  const loadExistingRatings = useCallback(async () => {
    const ratings = await getAllRatings({}, {});
    setExistingRatings(ratings);
  }, []);

  // Track-Suche handler
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    
    try {
      setIsSearching(true);
      setError('');

      if (mode === 'artist') {
        const artist = await searchArtists(query);
        if (!artist) throw new Error('Keinen Interpreten gefunden');
        
        await incrementProfileData("artist_mode_opened");
        const albums = await getArtistAlbums(artist.id);
        setArtistAlbums(albums.items);
        setCurrentArtist(artist);
        setResults([]);
      } 
      else if (mode === 'topTracks') {
        const artist = await searchArtists(query);
        if (!artist) throw new Error('Keinen Interpreten gefunden');
        
        await incrementProfileData("top_tracks_opened");
        const tracks = await getArtistTopTracks(artist.id);
        setArtistTracks(tracks.map(validateTrack));
        setCurrentArtist(artist);
        setResults([]);
      } 
      else {
        const data = await searchSpotify(query);
        setResults(data.tracks.items.map(validateTrack));
        await incrementProfileData("songs_searched");
      }
    } catch (err) {
      setError(err.message || 'Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  }, [query, mode]);

  // Track press handler mit aktualisiertem Callback
  const handleTrackPress = useCallback(async (track) => {
    await addSong(track);
    const existingRating = await getExistingRating(track.id);
    
    navigation.navigate('Rate', {
      songId: track.id,
      initialScore: existingRating?.score ?? null,
      initialNotes: existingRating?.notes ?? null,
      ...track,
      onGoBack: async () => {
        await loadExistingRatings();
        if (artistAlbums.length > 0) await loadAlbumStats();
      }
    });
  }, [artistAlbums]);

  // Memoized Komponenten
  const AlbumItem = useCallback(({ item }) => {
    const stats = albumStats[item.id];
    const isFullyRated = stats?.rated === item.total_tracks;
    const isInWatchlist = watchlistItems.some(w => w.id === item.id && w.type === 'album');

    return (
      <TouchableOpacity 
        style={[styles.albumItem, isFullyRated && styles.fullyRatedAlbum]}
        onPress={() => navigation.navigate('AlbumTracks', { albumId: item.id, handleWatchlistToggle: handleWatchlistToggle})}
      >
        <Image source={{ uri: item.images[0]?.url }} style={styles.albumImage} />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{item.name}</Text>
          {stats && (
            <Text style={styles.albumDetails}>
              {`${stats.rated}/${item.total_tracks} Songs • ${new Date(item.release_date).getFullYear()}`}
              <Text style={styles.ratingInfo}>{` • Ø ${stats.avg.toFixed(1)}`}</Text>
            </Text>
          )}
        </View>
        <TouchableOpacity 
        onPress={() => handleWatchlistToggle(item, 'album')}
        style={styles.watchlistButton}
      >
        <Ionicons 
          name={isInWatchlist ? 'bookmark' : 'bookmark-outline'} 
          size={24} 
          color={isInWatchlist ? COLORS.primary : '#666'} 
        />
      </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [albumStats]);

  const renderContent = () => {
    if (error) return <Text style={styles.error}>{error}</Text>;
    if (isSearching) return <ActivityIndicator size="large" />;

    return (
      <FlatList
        data={getCurrentData()}
        keyExtractor={item => item.id}
        ListEmptyComponent={<EmptyState />}
        renderItem={renderItem}
        ListHeaderComponent={isLoadingStats && <LoadingIndicator />}
      />
    );
  };

  // Hilfsfunktionen
  const getCurrentData = () => {
    if (mode === 'artist') return artistAlbums;
    if (mode === 'topTracks') return artistTracks;
    return results;
  };

  const renderItem = ({ item }) => {
    if (mode === 'artist') return <AlbumItem item={item} />;
    return (
      <SongItem
        song={item}
        onPress={() => handleTrackPress(item)}
        score={existingRatings.find(r => r.song_id === item.id)?.score}
        isRated={existingRatings.some(r => r.song_id === item.id)}
        onWatchlistToggle={() => handleWatchlistToggle(item, 'track')}
        isInWatchlist={watchlistItems.some(w => w.id === item.id && w.type === 'track')}
      />
    );
  };

  const EmptyState = () => (
    <Text style={styles.prompt}>
      {mode === 'artist' 
        ? "Suche nach Interpreten, um ihre Alben zu sehen"
        : mode === 'topTracks'
        ? "Suche nach Interpreten, um ihre Spotify Top-Tracks zu sehen"
        : "Suche nach Songs, um sie zu bewerten"}
    </Text>
  );

  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#2A9D8F" />
      <Text style={styles.loadingText}>Lade Daten...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          placeholder={modeConfig[mode].placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setMode(prev => modeConfig[prev].next)} style={styles.modeButton}>
          <Ionicons name={modeConfig[mode].icon} size={28} color="#2A9D8F" />
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  searchHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  albumDetails: {
    color: '#666',
    fontSize: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  error: {
    color: '#E76F51',
    textAlign: 'center',
    marginTop: 20,
  },
  prompt: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  modeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0FAF9',
    marginLeft: 10,
  },
  ratingInfo: {
    color: '#2A9D8F',
    fontWeight: '500',
  },
  fullyRatedAlbum: {
    backgroundColor: '#F0FAF9',
    borderWidth: 2,
    borderColor: '#2A9D8F40',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#2A9D8F',
  },
});

export default SearchScreen;