import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { searchArtists, getArtistTopTracks } from '../spotify';
import { getRatedSongsByArtist, addSong } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SongItem from '../components/SongItem';

const TopTrackScreen = ({ route, navigation }) => {
  const { artist } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState([]);
  const [unratedTracks, setUnratedTracks] = useState([]);
  const [artistData, setArtistData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 1. Künstler-ID suchen
        const artistResult = await searchArtists(artist);
        if (!artistResult) throw new Error('Interpret nicht gefunden');
        setArtistData(artistResult);

        // 2. Top-Tracks laden
        const tracks = await getArtistTopTracks(artistResult.id);
        
        // 3. Bewertete Songs des Profils laden
        const profile = await AsyncStorage.getItem('currentProfile');
        const ratedSongs = await getRatedSongsByArtist(artistResult.name, profile);
        
        // 4. Unbewertete Tracks filtern
        const unrated = tracks.filter(track => 
          !ratedSongs.some(song => song.song_id === track.id)
        );
        
        setTracks(tracks);
        setUnratedTracks(unrated);
        
        if (unrated.length === 0) {
          setError('Alle Top-Tracks wurden bereits bewertet!');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [artist]);

  const handleAddTrack = async (track) => {
    try {
      await addSong({
        id: track.id,
        title: track.name,
        artist: artistData.name,
        album: track.album.name,
        duration: track.duration_ms,
        image: track.album.images[0]?.url,
      });
      
      navigation.navigate('Rate', {
        songId: track.id,
        title: track.name,
        artist: artistData.name,
        album: track.album.name,
        image: track.album.images[0]?.url,
      });
      
      // Aktualisiere die unrated-Liste
      setUnratedTracks(prev => prev.filter(t => t.id !== track.id));
    } catch (err) {
      setError('Fehler beim Hinzufügen des Songs');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Lade Top-Tracks für {artist}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <Text style={styles.count}>
            {unratedTracks.length} unbewertete Top-Tracks übrig
          </Text>

          <FlatList
            data={unratedTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SongItem
                song={{
                  ...item,
                  artist: artistData.name,
                  album: item.album.name,
                  image: item.album.images[0]?.url,
                }}
                onPress={() => handleAddTrack(item)}
              />
            )}
          />
        </>
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
  error: {
    color: '#E76F51',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  count: {
    color: '#2A9D8F',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});

export default TopTrackScreen;