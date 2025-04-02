import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, 
  ActivityIndicator, StyleSheet, TouchableOpacity, Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAllRatings, getArtistStats2, getAlbumStats } from '../database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

const modeConfig = {
  songs: {
    icon: 'musical-notes',
    title: 'Songs',
    next: 'artists'
  },
  artists: {
    icon: 'people',
    title: 'Interpreten',
    next: 'albums'
  },
  albums: {
    icon: 'albums',
    title: 'Alben',
    next: 'songs'
  }
};

const RatingsScreen = ({ navigation }) => {
  const [mode, setMode] = useState('songs');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter states
  const [titleFilter, setTitleFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [prevMode, setPrevMode] = useState(null);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setData([]);
      let result;
      
      switch(mode) {
        case 'songs':
          result = await getAllRatings({
            title: titleFilter,
            artist: artistFilter,
            album: albumFilter,
            minScore: minScore ? parseInt(minScore) : undefined,
            maxScore: maxScore ? parseInt(maxScore) : undefined,
          }, { by: sortBy, order: sortOrder });
          break;
        
        case 'artists':
          result = await getArtistStats2(sortBy, sortOrder);
          break;
        
        case 'albums':
          result = await getAlbumStats(sortBy, sortOrder);
          break;
      }
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (prevMode !== mode) {
        setData([]);
        setPrevMode(mode);
      }
      loadData();
    });
  
    loadData();
    return unsubscribe;
  }, [mode, sortBy, sortOrder, navigation]);


  const handleModeToggle = () => {
    const newMode = modeConfig[mode].next;
    setData(prev => ({
      ...prev,
      [newMode]: []
    }));
    
    // Sicherstellen, dass der Standardwert existiert
    const sortOptions = {
      songs: ['created_at', 'title', 'artist', 'album', 'score'],
      artists: ['artist', 'avgScore', 'songCount'],
      albums: ['album', 'artist', 'avgScore', 'songCount']
    };
  
    setMode(newMode);
    
    // Zurücksetzen nur wenn der aktuelle Wert nicht in den Optionen ist
    if (!sortOptions[newMode].includes(sortBy)) {
      setSortBy(sortOptions[newMode][0]);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const SongItem = React.memo(({ item, onPress }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onPress(item)}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.artist}</Text>
        {item.album && <Text style={styles.detail}>{item.album}</Text>}
      </View>
      <Text style={styles.score}>{item.score}</Text>
    </TouchableOpacity>
  ));

  const handleItemPress = (item) => navigation.navigate('Rate', {
    songId: item.song_id,
    initialScore: item.score,
    title: item.title,
    artist: item.artist,
    album: item.album,
    image: item.image,
    created_at: item.created_at,
    initialNotes: item.notes
  })

  const renderItem = ({ item }) => {
    switch(mode) {
      case 'songs':
        return <SongItem item={item} onPress={handleItemPress} />;
      
      case 'artists':
        return (
          <View style={styles.item}>
            <Text style={styles.title}>{item.artist}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.score2}>Ø {(item.avgScore || 0).toFixed(1)}</Text>
              <Text style={styles.detail}>{item.songCount} Songs bewertet</Text>
            </View>
          </View>
        );
      
      case 'albums':
        return (
          <View style={styles.item}>
            <Text style={styles.title}>{item.album}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.detail}>{item.artist}</Text>
              <Text style={styles.score2}>Ø {(item.avgScore || 0).toFixed(1)}</Text>
            </View>
            <Text style={styles.detail}>{item.songCount} Songs bewertet</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header mit Modusauswahl und Sortiersteuerung */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleModeToggle} 
          style={styles.modeButton}
        >
          <Ionicons 
            name={modeConfig[mode].icon} 
            size={24} 
            color={COLORS.primary} 
          />
          <Text style={styles.modeText}>{modeConfig[mode].title}</Text>
        </TouchableOpacity>

        <View style={styles.sortControls}>
          <Picker
            key={mode}
            selectedValue={sortBy}
            onValueChange={setSortBy}
            style={styles.picker}
            dropdownIconColor={COLORS.primary}
            theme={Platform.OS === 'android' ? 'dark' : 'light'}
          >
            {mode === 'songs' && (
              [
                <Picker.Item key="created_at" label="Sortiere: Datum" value="created_at" style={styles.pickerItem} />,
                <Picker.Item key="title" label="Sortiere: Titel" value="title" style={styles.pickerItem}/>,
                <Picker.Item key="artist" label="Sortiere: Interpret" value="artist" style={styles.pickerItem}/>,
                <Picker.Item key="album" label="Sortiere: Album" value="album" style={styles.pickerItem}/>,
                <Picker.Item key="score" label="Sortiere: Rating" value="score" style={styles.pickerItem}/>
              ]
            )}
            {mode === 'artists' && (
              [
                <Picker.Item key="artist" label="Sortiere: Interpret" value="artist" style={styles.pickerItem}/>,
                <Picker.Item key="avgScore" label="Sortiere: Durchschn. Rating" value="avgScore" style={styles.pickerItem}/>,
                <Picker.Item key="songCount" label="Sortiere: Anzahl Songs" value="songCount" style={styles.pickerItem}/>
              ]
            )}
            {mode === 'albums' && (
              [
                <Picker.Item key="album" label="Sortiere: Album" value="album" style={styles.pickerItem}/>,
                <Picker.Item key="artist" label="Sortiere: Interpret" value="artist" style={styles.pickerItem}/>,
                <Picker.Item key="avgScore" label="Sortiere: Durchschn. Rating" value="avgScore" style={styles.pickerItem}/>,
                <Picker.Item key="songCount" label="Sortiere: Anzahl Songs" value="songCount" style={styles.pickerItem}/>
              ]
            )}
          </Picker>

          <TouchableOpacity 
            onPress={toggleSortOrder} 
            style={styles.sortOrderButton}
          >
            <Ionicons 
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={20} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filterbereich für Songs */}
      {mode === 'songs' && (
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setIsFiltersVisible(!isFiltersVisible)}
        >
          <Text style={styles.filterToggleText}>
            {isFiltersVisible ? 'Filter verstecken' : 'Filter anzeigen'}
          </Text>
        </TouchableOpacity>
      )}

      {mode === 'songs' && isFiltersVisible && (
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.input}
            placeholder="Songname..."
            value={titleFilter}
            onChangeText={setTitleFilter}
            placeholderTextColor={COLORS.text + '90'}
          />
          <TextInput
            style={styles.input}
            placeholder="Interpret..."
            value={artistFilter}
            onChangeText={setArtistFilter}
            placeholderTextColor={COLORS.text + '90'}
          />
          <TextInput
            style={styles.input}
            placeholder="Album..."
            value={albumFilter}
            onChangeText={setAlbumFilter}
            placeholderTextColor={COLORS.text + '90'}
          />
          <View style={styles.scoreFilter}>
            <TextInput
              style={[styles.input, styles.scoreInput]}
              placeholder="Min Rating"
              value={minScore}
              onChangeText={setMinScore}
              keyboardType="numeric"
              placeholderTextColor={COLORS.text + '90'}
            />
            <TextInput
              style={[styles.input, styles.scoreInput]}
              placeholder="Max Rating"
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
              placeholderTextColor={COLORS.text + '90'}
            />
          </View>
          <Button title="Filter anwenden" onPress={loadData} color={COLORS.primary} />
        </View>
      )}

      {/* Inhalt */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : data.length === 0 ? (
        <Text style={styles.emptyText}>Keine Einträge gefunden</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => {
            // Einfacher, stabiler Key basierend auf der Datenstruktur
            if (mode === 'songs') return `song_${item.song_id}`;
            if (mode === 'artists') return `artist_${item.artist}`;
            return `album_${item.album}_${item.artist}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  modeText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  sortControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  picker: {
    flex: 1,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  pickerItem: {
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    fontSize: 14,
  },
  sortOrderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  item: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  detail: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  score2: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
    marginBottom: 10,
  },
  scoreFilter: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  scoreInput: {
    flex: 1,
  },
  filterToggle: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  filterToggleText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 30,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default RatingsScreen;