import React, { useState } from 'react';
import { View, FlatList, TextInput, Button, ActivityIndicator, Text, StyleSheet, Keyboard, TouchableOpacity, Image } from 'react-native';
import { searchSpotify, searchArtists, getAlbum, getArtistAlbums, getArtistTopTracks } from '../spotify';
import { addSong, getExistingRating, incrementProfileData } from '../database';
import SongItem from '../components/SongItem';
import { Ionicons } from '@expo/vector-icons';

const modeIcons = {
  track: 'person',
  artist: 'trophy',
  topTracks: 'musical-notes'
};

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
  const [mode, setMode] = useState('track'); // 'track', 'artist' oder 'topTracks'

  const modeTitles = {
    track: 'Zur Interpreten-Suche',
    artist: 'Zur Top-Tracks-Suche',
    topTracks: 'Zur Song-Suche'
  };

  const handleModeToggle = () => {
    setMode(prev => modeConfig[prev].next);
    // Zustände zurücksetzen
    setArtistAlbums([]);
    setArtistTracks([]);
    setResults([]);
    setCurrentArtist(null);
    setQuery('');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    
    try {
      setIsSearching(true);
      setError('');

      if (mode === 'artist') {
        // Artist-Modus: Suche nach Interpretenn und Alben
        const artist = await searchArtists(query);
        if (!artist) {
          setError('Keinen Interpreten gefunden');
          return;
        }
        await incrementProfileData("artist_mode_opened")
        const albums = await getArtistAlbums(artist.id);
        setCurrentArtist(artist);
        setArtistAlbums(albums.items);
        setResults([]);
      } 
      else if (mode === 'topTracks') {
        // TopTracks-Modus: Suche nach Interpreten und Top-Tracks
        const artist = await searchArtists(query);
        if (!artist) {
          setError('Keinen Interpreten gefunden');
          return;
        }
        await incrementProfileData("top_tracks_opened")
        const tracks = await getArtistTopTracks(artist.id);
        setCurrentArtist(artist);
        setArtistTracks(tracks);
        setResults([]);
      }
      else {
        // Track-Modus: Normale Song-Suche
        const data = await searchSpotify(query);
        setResults(data.tracks.items.map(validateTrack));
        await incrementProfileData("songs_searched")
      }
    } catch (err) {
      console.log(err)
      setError('Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  };

  const validateTrack = (track) => ({
    id: track.id || '',
    title: track.name || 'Unbekannter Titel',
    artist: track.artists?.[0]?.name || 'Unbekannter Interpret',
    album: track.album?.name || 'Unbekanntes Album',
    duration: track.duration_ms || 0,
    image: track.album?.images?.[0]?.url || '',
  });

  const handleAlbumPress = (albumId) => {
    navigation.navigate('AlbumTracks', { albumId });
  };

  const handleTrackPress = async (track) => {
    await addSong(track);
    const existingRating = await getExistingRating(track.id);
    console.log("Existing Rating: ", existingRating)
    navigation.navigate('Rate', { 
      songId: track.id,
      initialScore: existingRating?.score || null,
      initialNotes: existingRating?.notes || null,
      ...track
    });
  };

  const renderContent = () => {
    if (error) return <Text style={styles.error}>{error}</Text>;
    if (isSearching) return <ActivityIndicator size="large" />;
    
    if (mode === 'artist' && artistAlbums.length > 0) {
      return renderAlbums();
    }
    if (mode === 'topTracks' && artistTracks.length > 0) {
      return renderTopTracks();
    }
    if (results.length > 0) {
      return renderTracks();
    }
    
    return (
      <Text style={styles.prompt}>
        {mode === 'artist' 
          ? "Suche nach Interpreten, um ihre Alben zu sehen"
          : mode === 'topTracks'
          ? "Suche nach Interpreten, um ihre Spotify Top-Tracks zu sehen"
          : "Suche nach Songs, um sie zu bewerten"}
      </Text>
    );
  };

  const renderAlbums = () => (
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
  );

  const renderTopTracks = () => (
    <FlatList
      data={artistTracks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <SongItem
          song={validateTrack(item)}
          onPress={() => handleTrackPress(validateTrack(item))}
        />
      )}
    />
  );

  const renderTracks = () => (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <SongItem
          song={item}
          onPress={() => handleTrackPress(item)}
        />
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          placeholder={
            mode === 'artist' ? "Interpreten suchen..." :
            mode === 'topTracks' ? "Interpreten für Top-Tracks suchen..." :
            "Songs suchen..."
          }
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleModeToggle}
          style={styles.modeButton}
        >
          <Ionicons 
            name={modeConfig[mode].icon} 
            size={28}
            color="#2A9D8F"
          />
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
});

export default SearchScreen;