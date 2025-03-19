import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { searchArtists, getArtistTopTracks } from '../spotify';
import { getRatedSongsByArtist, addSong } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache-Objekt
const artistCache = {};

const TopTrackScreen = ({ navigation }) => {
  const { artist } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countTracks, setCountTracks] = useState(-1)
  const [tracks, setTracks] = useState([])

  useEffect(() => {
    const loadTopTracks = async () => {
      if (!artist.trim()) {
        setError('Bitte einen Interpreten eingeben');
        return;
      }

      try {
        setLoading(true);
        setError('');
  
        // 1. Künstler-ID finden
        const artistData = await searchArtists(artist);
        if (!artistData) throw new Error('Interpret nicht gefunden');
  
        // 2. Tracks aus Cache oder API holen
        let tracks = artistCache[artistData.id];
        if (!tracks) {
          tracks = await getArtistTopTracks(artistData.id);
          artistCache[artistData.id] = tracks;
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    loadTopTracks();
  }, [artist]);

  useEffect(() => {
    // 3. Bereits bewertete Songs holen
    //const profile = await AsyncStorage.getItem('currentProfile');
    //const ratedSongs = await getRatedSongsByArtist(artistData.name, profile);

    // 4. Nicht bewertete Songs filtern
    const unratedTracks = tracks.filter(track => !ratedSongs.some(rated => rated.song_id === track.id))
    setTracks(unratedTracks)
    
    if (unratedTracks.length === 0) {
      setError('Keine ungehörten Top-Songs mehr von diesem Interpreten');
      return;
    }
    setCountTracks(unratedTracks.length);
  })
        
  
  const handleRandomSong = async () => {
    
    

    // 5. Zufälligen Song auswählen
    const randomTrack = unratedTracks[0];
    // 5.5 Song hinzufügen
    await addSong({
            id: randomTrack.id,
            title: randomTrack.name,
            artist: artistData.name,
            album: randomTrack.album.name,
            duration: randomTrack.duration_ms,
            image: randomTrack.album.images[0]?.url,
          });
    
    // 6. Zum RateScreen navigieren
    navigation.navigate('Rate', {
      songId: randomTrack.id,
      title: randomTrack.name,
      artist: artistData.name,
      album: randomTrack.album.name,
      image: randomTrack.album.images[0]?.url,
    });
  };

  return (
    <View style={styles.container}>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {(countTracks > -1) ? <Text style={styles.count}>{countTracks} Top-Tracks noch übrig für {artist}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button
          title="Nächster Top-Track"
          onPress={handleRandomSong}
          color="#2A9D8F"
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
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  error: {
    color: '#E76F51',
    textAlign: 'center',
    marginBottom: 15,
  },
  count: {
    color: 'grey',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default TopTrackScreen;