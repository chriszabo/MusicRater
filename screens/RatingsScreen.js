import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { getAllRatings } from '../database';

const RatingsScreen = ({ navigation }) => {
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setIsLoading(true);
        const results = await getAllRatings();
        setRatings(results);
        setError('');
      } catch (err) {
        setError('Failed to load ratings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Try Again" onPress={() => loadRatings()} />
      </View>
    );
  }

  if (ratings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No ratings yet!</Text>
        <Text style={styles.subMessage}>Rate songs to see them here.</Text>
        <Button
          title="Search Songs"
          onPress={() => navigation.navigate('Search')}
          color="#1EB1FC"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ratings}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.ratingItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>Rating: {item.score}/10</Text>
            <Text>Rated on: {new Date(item.created_at).toLocaleDateString()}</Text>
            <Button
              title="Edit Rating"
              onPress={() => navigation.navigate('Rate', {
                songId: item.song_id,
                initialScore: item.score
              })}
              color="#1EB1FC"
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  ratingItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  title: { fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 20 },
  message: { fontSize: 18, marginBottom: 10 },
  subMessage: { color: '#666', marginBottom: 20 }
});

export default RatingsScreen;