import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, 
  ActivityIndicator, StyleSheet, TouchableOpacity 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAllRatings } from '../database';

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

  return (
    <View style={styles.container}>
      {/* Toggle Filters Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsFiltersVisible(!isFiltersVisible)}
      >
        <Text style={styles.toggleButtonText}>
          {isFiltersVisible ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Filters and Sorting Section */}
      {isFiltersVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterHeader}>Filters</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Song title..."
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
              placeholder="Min score"
              value={minScore}
              onChangeText={setMinScore}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.scoreInput]}
              placeholder="Max score"
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
            />
          </View>

          {/* Sort Controls */}
          <Text style={styles.filterHeader}>Sort By</Text>
          <View style={styles.sortRow}>
            <Picker
              style={styles.picker}
              selectedValue={sortBy}
              onValueChange={setSortBy}
            >
              <Picker.Item label="Date" value="created_at" />
              <Picker.Item label="Title" value="title" />
              <Picker.Item label="Artist" value="artist" />
              <Picker.Item label="Album" value="album" />
              <Picker.Item label="Score" value="score" />
            </Picker>
            
            <Picker
              style={styles.picker}
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
            >
              <Picker.Item label="Ascending" value="asc" />
              <Picker.Item label="Descending" value="desc" />
            </Picker>
          </View>

          <Button 
            title="Apply Filters" 
            onPress={() => setRefreshKey(prev => prev + 1)} 
            color="#1EB1FC"
          />
        </View>
      )}

      {/* Ratings List */}
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : ratings.length === 0 ? (
        <Text style={styles.message}>No matching ratings found.</Text>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => `${item.rating_id}-${item.song_id}`}
          renderItem={({ item }) => (
            <View style={styles.ratingItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>Artist: {item.artist}</Text>
              <Text>Album: {item.album}</Text>
              <Text>Score: {item.score}/10</Text>
              <Text>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
              <Button
                title="Edit"
                onPress={() => navigation.navigate('Rate', {
                  songId: item.song_id,
                  initialScore: item.score
                })}
              />
            </View>
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
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 15,
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
  ratingItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default RatingsScreen;