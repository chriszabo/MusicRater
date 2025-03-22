import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, 
  ActivityIndicator, StyleSheet, TouchableOpacity 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAllRatings, getArtistStats2, getAlbumStats } from '../database';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2A9D8F',
  secondary: '#264653',
  background: '#F8F9FA',
  text: '#2B2D42',
  error: '#E76F51',
};

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
      console.log("Hey")
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

  const renderItem = ({ item }) => {
    switch(mode) {
      case 'songs':
        return (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Rate', {
              songId: item.song_id,
              initialScore: item.score,
              title: item.title,
              artist: item.artist,
              album: item.album,
              image: item.image,
              created_at: item.created_at,
              initialNotes: item.notes
            })}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.artist}</Text>
              {item.album && <Text style={styles.detail}>{item.album}</Text>}
            </View>
            <Text style={styles.score}>{item.score}</Text>
          </TouchableOpacity>
        );
      
      case 'artists':
        return (
          <View style={styles.item}>
            <Text style={styles.title}>{item.artist}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.detail}>Ø {(item.avgScore || 0).toFixed(1)}</Text>
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
              <Text style={styles.detail}>Ø {(item.avgScore || 0).toFixed(1)}</Text>
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
          />
          <TextInput
            style={styles.input}
            placeholder="Interpret..."
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
          keyExtractor={(item, index) => {
            if (!item) return `loading_${index}`; // Fallback für leere Items
            
            // Generiere dynamischen Key basierend auf Modus und Inhalt
            const baseKey = mode === 'songs' 
              ? `song_${item.song_id}_${item.created_at}`
              : mode === 'artists'
              ? `artist_${item.artist}_${item.songCount}`
              : `album_${item.album}_${item.artist}`;
          
            // Füge Sicherheitschecks für undefined Werte hinzu
            const safeKey = baseKey
              .replace(/undefined/g, 'unknown')
              .replace(/\s+/g, '_');
          
            return `${safeKey}_${Date.now()}`; // Eindeutigkeit durch Timestamp
          }}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF9',
    padding: 10,
    borderRadius: 8,
  },
  modeText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sortControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 40,
  },
  picker: {
    flex: 1,
  },
  sortOrderButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.secondary,
    marginTop: 4,
  },
  detail: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  score: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
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
  filterToggle: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  filterToggleText: {
    color: 'white',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  pickerItem: {
    fontSize: 14, // Kleinere Schriftgröße
    fontWeight: '500',
    color: COLORS.text,
    numberOfLines: 1,
    ellipsizeMode: 'tail', // Text kürzen mit ...
  },
});

export default RatingsScreen;