import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert, View } from 'react-native';
import { searchArtists, getArtistAlbums, getAlbum } from '../spotify';
import { updateGameHighscore, getHighscoreForArtist } from '../database';
import { levenshteinSimilarity } from '../utils';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

const GameScreen = () => {
  const [artistInput, setArtistInput] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [jokers, setJokers] = useState({
    showMore: 5,
    showCover: 3,
    showInitial: 3,
    showDuration: 5,
    skip: 3
  });
  const [usedJokers, setUsedJokers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleLines, setVisibleLines] = useState(5);
  const [showCover, setShowCover] = useState(false);
  const [showInitial, setShowInitial] = useState(false);
  const [discography, setDiscography] = useState([]);
  const [usedSongs, setUsedSongs] = useState([]);
  const [currentArtist, setCurrentArtist] = useState(null);
  const [showDuration, setShowDuration] = useState(false);
  const [currentArtistHighscore, setCurrentArtistHighscore] = useState(0);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);


  useEffect(() => {
    if (discography.length > 0 && usedSongs.length >= discography.length) {
      Alert.alert('Info', 'Alle Songs dieses Künstlers wurden durchgespielt!');
      setDiscography([]);
      setUsedSongs([]);
    }
  }, [usedSongs]);

  const skipSong = () => {
    startGame(false);
  };

  const fetchDiscography = async (artist) => {
    try {
      const albums = await getArtistAlbums(artist.id, "");
      const album_aggregate = [];
      
      for (const album of albums.items) {
        if (album.album_type === "album") {
          const album_data = await getAlbum(album.id);
          const formattedTracks = album_data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            normalizedName: normalizeTitle(track.name),
            artist: track.artists[0]?.name || artist.name,
            album: album_data.name,
            duration: track.duration_ms,
            cover: album_data.images[0]?.url,
          }));
          album_aggregate.push(...formattedTracks);
        }
      }
      return album_aggregate; // Direkte Rückgabe der Tracks
    } catch (error) {
      console.error('Error fetching discography:', error);
      return [];
    }
  };
  
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRandomSong = (availableDiscography) => {
    if (!availableDiscography.length) return null;
    const availableSongs = availableDiscography.filter(song => !usedSongs.includes(song.id));
    return availableSongs[Math.floor(Math.random() * availableSongs.length)];
  };

  const fetchLyrics = async (artist, title) => {
    try {
      const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
      if (!response.ok) throw new Error('Lyrics not found');
      const data = await response.json();
      return normalizeLyrics(data.lyrics);
    } catch (error) {
      console.log('Lyrics fetch error:', artist, title);
      return null;
    }
  };

  const similarityPercentage = (str1, str2) => {
    return levenshteinSimilarity(str1, str2) * 100;
  };

  const normalizeTitle = (title) => {
    const removePatterns = title
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .trim();
  
    // Trenne am ersten Bindestrich
    const parts = removePatterns.split(/ - (.*)/);
    let mainTitle = parts[0];
    const suffix = parts[1] || '';
  
    // Überprüfe auf unerwünschte Schlüsselwörter
    const unwantedKeywords = ['remaster', 'remastered', 'live', 'special', 'edition', 'version', 'mix', 'edit'];
    const hasUnwanted = unwantedKeywords.some(keyword => 
      suffix.toLowerCase().includes(keyword)
    );
  
    // Füge Suffix nur hinzu wenn keine unerwünschten Wörter
    const cleanTitle = hasUnwanted ? mainTitle : `${mainTitle} ${suffix}`;
  
    return cleanTitle
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/-/g, ' ') // Bindestriche durch Leerzeichen ersetzen
      .replace(/\s+/g, ' '); // Mehrfache Leerzeichen reduzieren
  };

  const normalizeLyrics = (lyricsText) => {
    if (!lyricsText) return null;
    if (lyricsText.toLowerCase().includes("instrumental") || lyricsText.toLowerCase().includes("instrutmental"))
        return "[instrumental]"

    return lyricsText
      .replace(/\[[^\]]*\]/g, '') // Entferne alles in eckigen Klammern
  };

  const resetGameState = (fullReset = false) => {
    setAttempts(3);
    setGuess('');
    setVisibleLines(5);
    setShowCover(false);
    setShowInitial(false);
    setShowDuration(false);
    
    // Nur bei vollständigem Reset
    if(fullReset) {
      setCorrectGuesses(0);
      setJokers({
        showMore: 5,
        showCover: 3,
        showInitial: 3,
        showDuration: 5,
        skip: 3
      });
      setUsedSongs([]);
      setUsedJokers([]); // Reset der verwendeten Joker-Liste
    }
  };

  const startGame = async (isNewGame = true) => {
    console.log("Start Game");
    let reset_flag = null;
    let artist = null;
    setIsLoading(true);
    
    try {
      
      if(isNewGame) {
        if (!artistInput){
          Alert.alert("Interpret-Feld muss ausgefüllt sein, um ein neues Spiel zu starten.")
          setIsLoading(false)
          return;
        }
        artist = await searchArtists(artistInput);
        if (!artist) throw new Error(`Interpret '${artist.name} nicht gefunden`);
        const artist_highscore = await getHighscoreForArtist(artist.id);
        setCurrentArtistHighscore(artist_highscore);
        resetGameState(true); // Vollständiger Reset
        console.log("Current artist", currentArtist)
        console.log("New artist", artist)
        
        if(currentArtist?.id !== artist.id) {
            console.log("Resetting disco")
          setDiscography([]);
          setCurrentArtist(artist);
          reset_flag = true;

        }
      } else {
        // Teilreset: Behalte Joker-Zustand
        artist = currentArtist
        setAttempts(3);
        setGuess('');
        setVisibleLines(5);
        setShowCover(false);
        setShowInitial(false);
        setShowDuration(false);
    }
    
    let availableDiscography = (reset_flag) ? []: discography;
      
      if (!availableDiscography.length) {
        availableDiscography = await fetchDiscography(artist);
        setDiscography(availableDiscography);
      }

      // Songauswahl-Logik
      let localUsedSongs = isNewGame ? [] : [...usedSongs];
      let availableSongs = availableDiscography.filter(song => 
        !localUsedSongs.includes(song.id)
      );
      let song = getRandomSong(availableSongs);
      let retries = 30;
      let lyricsText = null;
  
      while (retries > 0 && !lyricsText) {
        if (!song) break;
        
        lyricsText = await fetchLyrics(artist.name, normalizeTitle(song.name));
        
        if (!lyricsText || lyricsText.toLowerCase().includes("instrumental") || lyricsText.toLowerCase().includes("instrutmental") || lyricsText == "[instrumental]") {
            console.log("Skipping lyrics:", lyricsText)
            lyricsText = null
          localUsedSongs.push(song.id); // Mark as used locally
          availableSongs = availableDiscography.filter(s => 
            !localUsedSongs.includes(s.id)
          );
          song = getRandomSong(availableSongs);
          retries--;
        } else {
          localUsedSongs.push(song.id); // Mark successful song as used
        }
      }
  
      // Update global used songs state
      if(!isNewGame) {
        setUsedSongs([...localUsedSongs]);
      } else {
        setUsedSongs(localUsedSongs);
      }
  
      if (!song || !lyricsText) throw new Error('Keine spielbaren Songs gefunden');
      console.log("Dieser Song:", song)
      setCurrentSong(song);
      setShowDuration(false)
      setLyrics(lyricsText);
      setVisibleLines(5);
      setShowCover(false);
      setShowInitial(false);
      setAttempts(3);
      setGuess('');
      setUsedJokers([]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setIsLoading(false);
  };

  const handleGuess = async () => {
    if (!currentSong) return;
    
    const userGuess = normalizeTitle(guess.trim());
    const correctAnswer = normalizeTitle(currentSong.name);
    const similarity = similarityPercentage(userGuess, correctAnswer);

    if (similarity >= 80) {
      const newScore = correctGuesses + 1;
      setCorrectGuesses(newScore);
      
      if (currentArtist?.id && newScore > currentArtistHighscore) {
        await updateGameHighscore(currentArtist, newScore);
      }
      
      // Nur neuen Song laden, kein vollständiger Reset
      startGame(false);
    } else {
      if (attempts === 1) {
        Alert.alert('Verloren!', `Der Song war: ${currentSong.name}`);
        startGame(true); // Vollständiger Reset bei Game Over
      } else {
        setAttempts(prev => prev - 1);
        setGuess('');
      }
    }
  };

  const useJoker = (type) => {
    if (!jokers[type]) return;

    
    switch(type) {
      case 'showMore':
        setVisibleLines(prev => prev + 5);
        break;
        case 'showCover':
          if (showCover) return;
          setShowCover(true);
          break;
          case 'showInitial':
            if (showInitial) return;
            setShowInitial(true);
            break;
            case 'showDuration':
              if (showDuration) return;
              setShowDuration(true);
              break;
              case 'skip':
                skipSong();
                break;
    }
    setJokers(prev => ({ 
      ...prev, 
      [type]: prev[type] - 1 
    }));
    };
            
  const getLyricsPreview = () => {
    const lines = lyrics.split('\n').filter(l => l.trim() !== '');
    return lines.slice(0, visibleLines).join('\n');
  };

  const renderJokerButton = (type, icon) => {
    if (jokers[type] <= 0) return null;
    
    return (
      <TouchableOpacity 
        onPress={() => useJoker(type)}
        style={styles.jokerButton}
      >
        <Ionicons name={icon} size={30} color={ COLORS.primary } />
        <Text style={styles.jokerCount}>{jokers[type]}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.score}>Korrekt: {correctGuesses} | Alter Highscore: {currentArtistHighscore}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Interpreten eingeben"
        value={artistInput}
        onChangeText={setArtistInput}
        placeholderTextColor={COLORS.text + '90'}
      />
      <TouchableOpacity
        style={styles.startButton}
        onPress={startGame}
      >
        <Text style={styles.buttonText}>Neues Spiel starten</Text>
      </TouchableOpacity>

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
            <Text style={styles.initialHint}>Anfangsbuchstabe: {currentSong.name[0]}</Text>
          )}
          {showDuration && (
            <Text style={styles.durationHint}>
              Länge: {formatDuration(currentSong.duration)}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Deine Vermutung"
            value={guess}
            onChangeText={setGuess}
            onSubmitEditing={handleGuess}
            placeholderTextColor={COLORS.text + '90'}
          />

          <View style={styles.stats}>
            <Text style={styles.attempts}>Verbleibende Versuche: {attempts}</Text>
            <View style={styles.jokerContainer}>
                {renderJokerButton('showMore', 'document-text-outline')}
                {renderJokerButton('showCover', 'image')}
                {renderJokerButton('showInitial', 'text-outline')}
                {renderJokerButton('showDuration', 'time-outline')}
                {renderJokerButton('skip', 'play-skip-forward')}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gameArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 20,
    marginTop: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lyricsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 15,
    minHeight: 150,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  cover: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
  },
  stats: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  jokerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: COLORS.primary,
  },
  loader: {
    marginTop: 20,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
  },
  attempts: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  initialHint: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 5,
  },
  durationHint: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 5,
  },
  jokerButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    width: 60,
  },
  jokerCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default GameScreen;