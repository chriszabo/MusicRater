// IgnoredSongsScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { getIgnoredSongsData, removeFromIgnored } from '../database';
import SongItem from '../components/SongItem';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';

const IgnoredSongsScreen = ({ navigation }) => {
  const [ignoredSongs, setIgnoredSongs] = useState([]);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
});

export default IgnoredSongsScreen;