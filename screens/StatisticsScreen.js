import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { getArtistStats, getOverallStats, incrementProfileData } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

const StatisticsScreen = () => {
    const [artist, setArtist] = useState('');
    const [stats, setStats] = useState(null);
    const [overallStats, setOverallStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentProfile, setCurrentProfile] = useState('');
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
    const loadData = async () => {
      try {
        const profile = await AsyncStorage.getItem('currentProfile');
        setCurrentProfile(profile);
        
        if (profile) {
          const overall = await getOverallStats(profile);
          setOverallStats(overall);
        }
        
        if (artist && profile) {
          const artistStats = await getArtistStats(artist, profile);
          setStats(artistStats);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    };
  
    useFocusEffect(
      React.useCallback(() => {
        loadData();
      }, [])
    );
  
    const handleRefresh = () => {
      setRefreshing(true);
      loadData();
    };
  
    const handleSearch = async () => {
      if (!artist.trim()) return;
      setLoading(true);
      await incrementProfileData("artist_statistics_opened")
      loadData();
    };

  const StatItem = ({ label, value, unit }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const TopList = ({ title, data, renderItem }) => (
    <View style={styles.topList}>
      <Text style={styles.subHeader}>{title}</Text>
      {data?.length > 0 ? (
        data.map((item, index) => (
          <Text key={index} style={styles.listItem}>
            {index + 1}. {renderItem(item)}
          </Text>
        ))
      ) : (
        <Text style={styles.emptyText}>Keine Daten verfügbar</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >

        {loading && <ActivityIndicator size="large" color={COLORS.primary} />}

    <View style={styles.section}>
        <Text style={styles.sectionHeader}>Deine Gesamtstatistiken</Text>
        
        <View style={styles.statsRow}>
          <StatItem 
            label="Bewertete Songs" 
            value={overallStats?.totalSongs || 0}
          />
          <StatItem 
            label="10er Songs" 
            value={overallStats?.perfectRatings || 0}
          />
          <StatItem 
            label="Komplette Alben" 
            value={overallStats?.completedAlbums.length || 0}
          />
          <StatItem 
            label="Ø-Score" 
            value={overallStats?.averageRating?.toFixed(1) || '0.0'}
            unit="/10"
          />
        </View>

        <TopList 
          title={`Top ${overallStats?.topArtists.length} Interpreten`}
          data={overallStats?.topArtists}
          renderItem={(item) => `${item.artist} (${item.avgRating.toFixed(1)})`}
        />

        <TopList 
          title={`Top ${overallStats?.topAlbums.length} Alben`}
          data={overallStats?.topAlbums}
          renderItem={(item) => `${item.album} (${item.avgRating.toFixed(1)})`}
        />
        {overallStats?.profileData?.show_incomplete_albums !== 0 && (
          <TopList 
            title="Unvollständige Alben"
            data={overallStats?.incompleteAlbums}
            renderItem={(item) => `${item.album} (${item.artist})`}
          />
        )}

      </View>

      <TextInput
        placeholder="Gib einen Interpreten ein..."
        value={artist}
        onChangeText={setArtist}
        onSubmitEditing={handleSearch}
        style={styles.input}
      />
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Statistiken für {artist}
          </Text>
          
          <View style={styles.statRow}>
            <Text style={styles.label}>Gesamtdurchschnitt:</Text>
            <Text style={styles.value}>{stats.artistAverage.toFixed(1)}/10</Text>
          </View>

          <Text style={styles.subHeader}>Alben:</Text>
          <FlatList
            data={stats.albums}
            scrollEnabled={false}
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
      </ScrollView>
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 15,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    margin: 10,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  topList: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  listItem: {
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.albumBorder,
  },
  albumItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.albumBorder,
  },
  albumTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  albumStats: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
});

export default StatisticsScreen;