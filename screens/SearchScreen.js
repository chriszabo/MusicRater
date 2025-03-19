import React, { useState } from 'react';
import { View, FlatList, TextInput, Button, ActivityIndicator, Text, StyleSheet, Keyboard, TouchableOpacity, Image } from 'react-native';
import { searchSpotify, searchArtists, getAlbum, getArtistAlbums } from '../spotify';
import { addSong, getExistingRating } from '../database';
import SongItem from '../components/SongItem';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('track'); // 'track' oder 'artist'

  const validateTrack = (track) => {
    return {
      id: track.id || '',
      title: track.name || 'Unbekannter Titel',
      artist: track.artists?.[0]?.name || 'Unbekannter Interpret',
      album: track.album?.name || 'Unbekanntes Album',
      duration: track.duration_ms || 0,
      image: track.album?.images?.[0]?.url || '',
    };
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    
    try {
      setIsSearching(true);
      setError('');

      if (mode === 'artist') {
        // Artist-Modus: Suche nach Künstlern und deren Alben
        const artist = await searchArtists(query);
        console.log("Artist gefunden:", artist)
        if (!artist) {
          setError('Keinen Interpreten gefunden');
          return;
        }
        console.log("schon weiter")
        const albums = await getArtistAlbums(artist.id);
        setCurrentArtist(artist);
        setArtistAlbums(albums.items);
        setResults([]);
      } else {
        // Track-Modus: Normale Song-Suche
        const data = await searchSpotify(query);
        setResults(data.tracks.items.map(item => ({
          id: item.id,
          title: item.name,
          artist: item.artists[0].name,
          album: item.album.name,
          duration: item.duration_ms,
          image: item.album.images[0]?.url,
        })));
      }
    } catch (err) {
      setError('Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAlbumPress = (albumId) => {
    navigation.navigate('AlbumTracks', { albumId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          placeholder={mode === 'artist' ? "Interpreten suchen..." : "Songs suchen..."}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        <Button
          title={mode === 'artist' ? 'Zur Song-Suche' : 'Zur Interpreten-Suche'}
          onPress={() => setMode(mode === 'artist' ? 'track' : 'artist')}
          color="#2A9D8F"
        />
      </View>

      {isSearching && <ActivityIndicator size="large" />}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : artistAlbums.length > 0 ? (
        <FlatList
          data={artistAlbums}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.albumItem}
              onPress={() => handleAlbumPress(item.id)}
            >
              <Image 
                source={{ uri: item.images[0]?.url }} 
                style={styles.albumImage} 
              />
              <View style={styles.albumInfo}>
                <Text style={styles.albumTitle}>{item.name}</Text>
                <Text style={styles.albumDetails}>
                  {item.total_tracks} Songs • {new Date(item.release_date).getFullYear()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : results.length === 0 && !isSearching ? (
        <Text style={styles.prompt}>
          {mode === 'artist' 
            ? "Suche nach Interpreten, um ihre Alben zu sehen" 
            : "Suche nach Songs, um sie zu bewerten"}
        </Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              onPress={async () => {
                await addSong(item);
                navigation.navigate('Rate', { 
                  songId: item.id,
                  initialScore: await getExistingRating(item.id),
                  title: item.title,
                  artist: item.artist,
                  album: item.album,
                  image: item.image,
                });
              }}
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
});

export default SearchScreen;