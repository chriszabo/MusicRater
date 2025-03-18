import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getArtistStats } from '../database';
import { COLORS } from '../config/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';


const StatisticsScreen = () => {
  const [artist, setArtist] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!artist.trim()) return;
    
    setLoading(true);
    try {
      const profile = await AsyncStorage.getItem('currentProfile');
      if (!profile) throw new Error('Kein Profil ausgewählt');
      
      const result = await getArtistStats(artist, profile);
      setStats(result);
    } catch (error) {
      console.error(error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Artist suchen..."
        value={artist}
        onChangeText={setArtist}
        onSubmitEditing={handleSearch}
        style={styles.input}
      />

      {loading && <ActivityIndicator size="large" />}

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.header}>
            Statistiken für {artist}
          </Text>
          
          <View style={styles.statRow}>
            <Text style={styles.label}>Gesamtdurchschnitt:</Text>
            <Text style={styles.value}>{stats.artistAverage.toFixed(1)}/10</Text>
          </View>

          <Text style={styles.subHeader}>Alben:</Text>
          <FlatList
            data={stats.albums}
            keyExtractor={(item) => item.album}
            renderItem={({ item }) => (
              <View style={styles.albumItem}>
                <Text style={styles.albumTitle}>{item.album}</Text>
                <Text style={styles.albumStats}>
                  {item.avgScore.toFixed(1)}/10 ({item.trackCount} Songs)
                </Text>
              </View>
            )}
          />
        </View>
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
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  albumItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  albumStats: {
    color: COLORS.text + '90',
    marginTop: 4,
  },
});

export default StatisticsScreen;