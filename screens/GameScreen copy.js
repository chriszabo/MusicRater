import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert } from 'react-native';
import { searchArtists, getArtistTopTracks } from '../spotify';
import { Ionicons } from '@expo/vector-icons';

const GameScreen = () => {
  const [artistInput, setArtistInput] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [jokers, setJokers] = useState({
    showMore: 1,
    showCover: 1,
    showInitial: 1,
    showDuration: 1
  });
  const [usedJokers, setUsedJokers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleLines, setVisibleLines] = useState(5);
  const [showCover, setShowCover] = useState(false);
  const [showInitial, setShowInitial] = useState(false);

  const getRandomSong = async (artist) => {
    try {
      const tracks = await getArtistTopTracks(artist.id);
      if (!tracks || tracks.length === 0) return null;
      return tracks[Math.floor(Math.random() * tracks.length)];
    } catch (error) {
      console.error('Error fetching songs:', error);
      return null;
    }
  };

  const fetchLyrics = async (artist, title) => {
    try {
      const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
      if (!response.ok) throw new Error('Lyrics not found');
      const data = await response.json();
      return data.lyrics;
    } catch (error) {
      console.error('Lyrics fetch error:', error);
      return null;
    }
  };

  const startGame = async () => {
    if (!artistInput) return;
    setIsLoading(true);
    
    try {
      const artist = await searchArtists(artistInput);
      if (!artist) throw new Error('Artist not found');
      
      const song = await getRandomSong(artist);
      if (!song) throw new Error('No songs found');
      
      const lyricsText = await fetchLyrics(artist.name, song.name);
      if (!lyricsText) throw new Error('No lyrics available');

      setCurrentSong({
        ...song,
        artist: artist.name,
        cover: song.album?.images[0]?.url,
        duration: song.duration_ms
      });
      
      setLyrics(lyricsText);
      setVisibleLines(5);
      setShowCover(false);
      setShowInitial(false);
      setAttempts(3);
      setGuess('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setIsLoading(false);
  };

  const handleGuess = () => {
    if (!currentSong) return;
    
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedTitle = currentSong.name.toLowerCase();

    if (normalizedGuess === normalizedTitle) {
      Alert.alert('Richtig!', 'Nächster Song wird geladen...');
      startGame();
    } else {
      if (attempts === 1) {
        Alert.alert('Verloren!', `Der Song war: ${currentSong.name}`);
        startGame();
      } else {
        setAttempts(prev => prev - 1);
        setGuess('');
        Alert.alert('Falsch!', `Noch ${attempts - 1} Versuche`);
      }
    }
  };

  const useJoker = (type) => {
    if (!jokers[type] || usedJokers.includes(type)) return;

    setUsedJokers([...usedJokers, type]);
    setJokers(prev => ({ ...prev, [type]: prev[type] - 1 }));

    switch(type) {
      case 'showMore':
        setVisibleLines(prev => prev + 5);
        break;
      case 'showCover':
        setShowCover(true);
        break;
      case 'showInitial':
        setShowInitial(true);
        break;
      case 'showDuration':
        Alert.alert('Songlänge', `${Math.floor(currentSong.duration / 60000)} Minuten`);
        break;
    }
  };

  const getLyricsPreview = () => {
    const lines = lyrics.split('\n').filter(l => l.trim() !== '');
    return lines.slice(0, visibleLines).join('\n');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Interpreten eingeben"
        value={artistInput}
        onChangeText={setArtistInput}
      />
      <Button title="Spiel starten" onPress={startGame} color="#2A9D8F" />

      {isLoading && <ActivityIndicator size="large" style={styles.loader} />}

      {currentSong && (
        <View style={styles.gameArea}>
          <Text style={styles.header}>Errate den Song!</Text>
          
          {showCover && currentSong.cover && (
            <Image source={{ uri: currentSong.cover }} style={styles.cover} />
          )}

          <View style={styles.lyricsBox}>
            <Text style={styles.lyricsText}>{getLyricsPreview()}</Text>
          </View>

          {showInitial && (
            <Text>Anfangsbuchstabe: {currentSong.name[0]}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Deine Vermutung"
            value={guess}
            onChangeText={setGuess}
            onSubmitEditing={handleGuess}
          />

          <View style={styles.stats}>
            <Text>Verbleibende Versuche: {attempts}</Text>
            <Text>Verfügbare Joker:</Text>
            <View style={styles.jokerContainer}>
              <TouchableOpacity 
                onPress={() => useJoker('showMore')}
                disabled={!jokers.showMore || usedJokers.includes('showCover') || usedJokers.includes('showInitial')}
              >
                <Ionicons name="text" size={30} color="#2A9D8F" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => useJoker('showCover')}
                disabled={!jokers.showCover || usedJokers.includes('showInitial')}
              >
                <Ionicons name="image" size={30} color="#2A9D8F" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => useJoker('showInitial')}
                disabled={!jokers.showInitial || usedJokers.includes('showCover')}
              >
                <Ionicons name="text-outline" size={30} color="#2A9D8F" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => useJoker('showDuration')}
                disabled={!jokers.showDuration}
              >
                <Ionicons name="time-outline" size={30} color="#2A9D8F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  gameArea: {
    marginTop: 20,
  },
  lyricsBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    minHeight: 150,
    marginVertical: 10,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  cover: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 10,
  },
  stats: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0FAF9',
    borderRadius: 10,
  },
  jokerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2A9D8F',
  },
  loader: {
    marginTop: 20,
  },
});

export default GameScreen;