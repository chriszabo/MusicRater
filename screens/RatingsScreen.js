import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, 
  ActivityIndicator, StyleSheet, TouchableOpacity 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAllRatings } from '../database';
//import { white } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

const COLORS = {
    primary: '#2A9D8F',  // Sanftes Türkis
    secondary: '#264653', // Tiefes Blau-Grau
    accent: '#E9C46A',   // Warmes Senfgelb
    background: '#F8F9FA', // Sehr helles Grau
    text: '#2B2D42',      //Dunkles Grau-Blau
    error: '#E76F51',    // Warmes Korallenrot
  };

const RatingsScreen = ({ navigation }) => {
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [titleFilter, setTitleFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Sort states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Collapsible state
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const filters = {
        title: titleFilter,
        artist: artistFilter,
        album: albumFilter,
        minScore: minScore ? parseInt(minScore) : undefined,
        maxScore: maxScore ? parseInt(maxScore) : undefined,
      };
      const sort = { by: sortBy, order: sortOrder };
      const results = await getAllRatings(filters, sort);
      setRatings(results);
      setError('');
    } catch (err) {
      setError('Failed to load ratings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [refreshKey]);

  // Add to existing focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // Apply filters and hide the filter section
  const applyFilters = () => {
    setRefreshKey(prev => prev + 1); // Refresh ratings
    setIsFiltersVisible(false); // Hide filters
  };

  return (
    <View style={styles.container}>
      {/* Toggle Filters Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsFiltersVisible(!isFiltersVisible)}
      >
        <Text style={styles.toggleButtonText}>
          {isFiltersVisible ? 'Filter verstecken' : 'Filter anzeigen'}
        </Text>
      </TouchableOpacity>

      {/* Filters and Sorting Section */}
      {isFiltersVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterHeader}>Filter</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Songname..."
            value={titleFilter}
            onChangeText={setTitleFilter}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Artist..."
            value={artistFilter}
            onChangeText={setArtistFilter}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Album..."
            value={albumFilter}
            onChangeText={setAlbumFilter}
          />
          
          <View style={styles.scoreFilter}>
            <TextInput
              style={[styles.input, styles.scoreInput]}
              placeholder="Min Rating"
              value={minScore}
              onChangeText={setMinScore}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.scoreInput]}
              placeholder="Max Rating"
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
            />
          </View>

          {/* Sort Controls */}
          <Text style={styles.filterHeader}>Sortierung</Text>
          <View style={styles.sortRow}>
            <Picker
              style={styles.picker}
              selectedValue={sortBy}
              onValueChange={setSortBy}
            >
              <Picker.Item label="Datum" value="created_at" />
              <Picker.Item label="Songname" value="title" />
              <Picker.Item label="Artist" value="artist" />
              <Picker.Item label="Album" value="album" />
              <Picker.Item label="Rating" value="score" />
            </Picker>
            
            <Picker
              style={styles.picker}
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
            >
              <Picker.Item label="Aufsteigend" value="asc" />
              <Picker.Item label="Absteigend" value="desc" />
            </Picker>
          </View>

          <Button 
            title="FILTER ANWENDEN" 
            onPress={applyFilters} // Use the new applyFilters function
            color="#1EB1FC"
          />
        </View>
      )}

      {/* Ratings List */}
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : ratings.length === 0 ? (
        <Text style={styles.message}>Keine passenden Song-Ratings gefunden.</Text>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => `${item.rating_id}-${item.song_id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ratingItem}
              onPress={() => navigation.navigate('Rate', {
                songId: item.song_id,
                initialScore: item.score,
                title: item.title,
                artist: item.artist,
                album: item.album,
                image: item.image,
                created_at: item.created_at
              })}
            >
                <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
              </View>
              <Text style={styles.score}>{item.score}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  toggleButton: {
    backgroundColor: '#1EB1FC',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  artist: {
    color: '#666',
    marginTop: 4,
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingItem: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between', // 👈 Links und rechts ausrichten
    alignItems: 'center',
  },
  filterHeader: {
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  scoreFilter: {
    flexDirection: 'row',
    gap: 10,
  },
  scoreInput: {
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexWrap: 'wrap',
    marginRight: 10, // Platz für Score
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  textContainer: {
    flex: 1, // 👈 Nimmt verfügbaren Platz ein
    marginRight: 10, // 👈 Abstand zum Score
  },
  score: {
    fontSize: 40,
    fontWeight: '600',
    color: '#2A9D8F', // 👈 Akzentfarbe für den Score
    minWidth: 50, // 👈 Verhindert Verschiebung bei kleinen Scores
    textAlign: 'right', // 👈 Rechtsbündig
  },
  toggleButtonText: {
    color: 'white'
  }
});

export default RatingsScreen;