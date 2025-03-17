import React, { useState } from 'react';
import { View, FlatList, TextInput, Button, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { searchSpotify } from '../spotify';
import { addSong, getExistingRating } from '../database';
import SongItem from '../components/SongItem';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
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
        setError('No songs found. Try different keywords!');
      }
    } catch (err) {
      setError('Search failed. Check your connection and try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search songs..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        <Button 
          title="Search" 
          onPress={handleSearch} 
          disabled={isSearching}
          color="#1EB1FC"
        />
      </View>

      {isSearching && <ActivityIndicator size="large" style={styles.loader} />}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : results.length === 0 && !isSearching ? (
        <Text style={styles.prompt}>Search for songs to rate!</Text>
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
                    initialScore: await getExistingRating(item.id)
                  });
                } catch (err) {
                  console.error("Error:", err);
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
  container: { flex: 1, padding: 20 },
  searchBox: { flexDirection: 'row', marginBottom: 15 },
  input: { 
    flex: 1, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 5, 
    padding: 10,
    marginRight: 10
  },
  loader: { marginVertical: 20 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  prompt: { textAlign: 'center', marginTop: 20, color: '#666' }
});

export default SearchScreen;