import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, TextInput, ActivityIndicator, Text, StyleSheet, Keyboard, TouchableOpacity, Image, Alert } from 'react-native';
import { searchSpotify, searchArtists, getArtistAlbums, getArtistTopTracks } from '../spotify';
import { addSong, getIgnoredCount, getExistingRating, incrementProfileData, getAllRatings, getAlbumStatsById, addToWatchlist, removeFromWatchlist, getWatchlistItems, getIgnoredSongs, addToIgnored, removeFromIgnored } from '../database';
import SongItem from '../components/SongItem';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

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
  const [ignoredSongs, setIgnoredSongs] = useState([]);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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


useFocusEffect(
  useCallback(() => {
    const loadIgnored = async () => {
      const ignored = await getIgnoredSongs();
      setIgnoredSongs(ignored.map(i => i.id));
    };
    loadIgnored();
  }, [])
);

const handleIgnoreToggle = async (item) => {
  try {
    if (ignoredSongs.includes(item.id)) {
      await removeFromIgnored(item.id);
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
                    if (mode === 'topTracks') {
                      setArtistTracks(prev => prev.filter(t => t.id !== item.id));
                    } else {
                      setResults(prev => prev.filter(t => t.id !== item.id));
                    }
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
          // Ignorierte Songs für dieses Album zählen
          const ignoredCount = await getIgnoredCount(album);
          
          const data = await getAlbumStatsById(album.id);
          return {
            id: album.id,
            avg: data?.avgScore || 0,
            rated: data?.ratedSongs || 0,
            total: album.total_tracks,
            ignored: ignoredCount?.count || 0
          };
        } catch (e) {
          console.error(e)
          return { id: album.id, avg: 0, rated: 0, total: album.total_tracks, ignored: 0 };
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
    const isFullyRated = (stats?.rated + stats?.ignored) >= stats?.total;
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
              {`${stats.rated}${stats.ignored > 0 ? `+${stats.ignored}` : ''}/${item.total_tracks} Songs • ${new Date(item.release_date).getFullYear()}`}
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
          color={isInWatchlist ? COLORS.primary : COLORS.text + '90'} 
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
    if (mode === 'topTracks') return artistTracks.filter(item => !ignoredSongs.includes(item.id));
    return results.filter(item => !ignoredSongs.includes(item.id));
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
        isIgnored={ignoredSongs.includes(item.id)}
        onIgnoreToggle={() => handleIgnoreToggle(item)}
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
      <ActivityIndicator size="small" color={ COLORS.primary } />
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
          placeholderTextColor={COLORS.text + '90'}
        />
        <View style={styles.buttonsContainer}>
        <TouchableOpacity 
      onPress={() => navigation.navigate('IgnoredSongs')}
      style={styles.iconButton}
    >
      <Ionicons name="eye-off" size={24} color={ COLORS.primary } />
    </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(prev => modeConfig[prev].next)} style={styles.iconButton}>
          <Ionicons name={modeConfig[mode].icon} size={28} color={ COLORS.primary } />
        </TouchableOpacity>
        </View>
      </View>
      {renderContent()}
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  searchHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
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
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  albumDetails: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  prompt: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textSecondary,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  ratingInfo: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  fullyRatedAlbum: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: COLORS.textSecondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginVertical: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
});

export default SearchScreen;