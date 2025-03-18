import React, { useState } from 'react';
import { View, FlatList, TextInput, Button, ActivityIndicator, Text, StyleSheet, Keyboard } from 'react-native';
import { searchSpotify } from '../spotify';
import { addSong, getExistingRating } from '../database';
import SongItem from '../components/SongItem';

const COLORS = {
    primary: '#2A9D8F',  // Sanftes Türkis
    secondary: '#264653', // Tiefes Blau-Grau
    accent: '#E9C46A',   // Warmes Senfgelb
    background: '#F8F9FA', // Sehr helles Grau
    text: '#2B2D42',      //Dunkles Grau-Blau
    error: '#E76F51',    // Warmes Korallenrot
  };

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    
    try {
      setIsSearching(true);
      setError('');
      const data = await searchSpotify(query);
      
      if (data.tracks?.items?.length > 0) {
        setResults(data.tracks.items.map(item => ({
          id: item.id,
          title: item.name,
          artist: item.artists[0].name,
          album: item.album.name,
          duration: item.duration_ms,
          image: item.album.images[0]?.url
        })));
      } else {
        setResults([]);
        setError('Keine Songs gefunden. Versuch mal andere Keywords!');
      }
    } catch (err) {
      setError('Suche fehlgeschlagen. Check mal deine Verbindung.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Songs suchen..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
        {/* <Button 
        style={styles.searchButton}
          title="Suche" 
          onPress={handleSearch} 
          disabled={isSearching}
          color={COLORS.primary}
        /> */}
      </View>

      {isSearching && <ActivityIndicator size="large" style={styles.loader} />}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : results.length === 0 && !isSearching ? (
        <Text style={styles.prompt}>Suche nach Songs, um ihnen ein Rating zu verpassen!</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongItem 
              song={item}
              onPress={async () => {
                try {
                  await addSong(item);
                  navigation.navigate('Rate', { 
                    songId: item.id,
                    initialScore: await getExistingRating(item.id),
                    title: item.title,
                    artist: item.artist,
                    album: item.album,
                    image: item.image,
                  });
                } catch (err) {
                  console.error("Navigation error:", err);
                  Alert.alert("Error", "Could not load song details");
                }
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
      backgroundColor: COLORS.background,
    },
    searchBox: { 
      flexDirection: 'row', 
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    input: { 
      flex: 1,
      backgroundColor: 'white',
      borderColor: COLORS.primary + '20', // 20% Transparenz
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      marginRight: 10,
      fontSize: 16,
      color: COLORS.text,
    },
    loader: { marginVertical: 20 },
    error: { 
      color: COLORS.error,
      textAlign: 'center',
      marginTop: 20,
      fontWeight: '500',
    },
    prompt: {
      textAlign: 'center',
      marginTop: 20,
      color: COLORS.text + '90', // 90% Opazität
      fontSize: 16,
      lineHeight: 24,
    },
    searchButton: {
        borderRadius: 10,
        alignItems: 'center',
        textAlign: 'center',
      },
  });

export default SearchScreen;