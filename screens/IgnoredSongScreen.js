// IgnoredSongsScreen.js
import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { getIgnoredSongsData, removeFromIgnored } from '../database';
import SongItem from '../components/SongItem';
import { useFocusEffect } from '@react-navigation/native';

const IgnoredSongsScreen = ({ navigation }) => {
  const [ignoredSongs, setIgnoredSongs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadIgnored = async () => {
        const ignored = await getIgnoredSongsData();
        setIgnoredSongs(ignored);
      };
      loadIgnored();
    }, [ignoredSongs, navigation])
  );

  const handleUnignore = async (item) => {
    await removeFromIgnored(item.id);
    const updated = await getIgnoredSongsData();
    setIgnoredSongs(updated);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ignoredSongs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SongItem
            song={item}
            onPress={() => {}}
            isIgnored={true}
            onIgnoreToggle={() => handleUnignore(item)}
            showSubButtons={false}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Keine ignorierten Songs</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default IgnoredSongsScreen;