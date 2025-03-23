import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert, View } from 'react-native';
import { searchArtists, getArtistAlbums, getAlbum } from '../spotify';
import { updateGameHighscore, getHighscoreForArtist } from '../database';
import { Ionicons } from '@expo/vector-icons';

const GameScreen = () => {
  const [artistInput, setArtistInput] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [jokers, setJokers] = useState({
    showMore: 1,
    showCover: 1,
    showInitial: 1,
    showDuration: 1,
    skip: 1
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


  useEffect(() => {
    if (discography.length > 0 && usedSongs.length >= discography.length) {
      Alert.alert('Info', 'Alle Songs dieses Künstlers wurden durchgespielt!');
      setDiscography([]);
      setUsedSongs([]);
    }
  }, [usedSongs]);

  const skipSong = () => {
    startGame();
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
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1 === longer ? str2 : str1;
    const lengthDiff = longer.length - shorter.length;
    
    if (lengthDiff > 3) return 0; // Zu großer Längenunterschied
    
    // Einfache Ähnlichkeitsberechnung
    const matchingChars = [...shorter].filter((c, i) => c === longer[i]).length;
    return (matchingChars / longer.length) * 100;
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

  const startGame = async (isSkip = false) => {
    console.log("Start Game", artistInput)
    if (!artistInput) return;
    setIsLoading(true);
    
    try {
      const artist = await searchArtists(artistInput);
      if (!artist) throw new Error('Artist not found');
      const artist_highscore = await getHighscoreForArtist(artist.id)
      console.log("Artist Highscore", artist_highscore)
      setCurrentArtistHighscore(artist_highscore)
  
      if (currentArtist?.id !== artist.id) {
        setDiscography([]);
        setUsedSongs([]);
        setCurrentArtist(artist);
      }
  
      let availableDiscography = discography;
      
      if (!availableDiscography.length) {
        availableDiscography = await fetchDiscography(artist);
        setDiscography(availableDiscography);
      }
  
      // Create local copy of used songs
      let localUsedSongs = [...usedSongs];
      let availableSongs = availableDiscography.filter(song => 
        !localUsedSongs.includes(song.id)
      );
      let song = getRandomSong(availableSongs);
      let retries = 30;
      let lyricsText = null;
  
      while (retries > 0 && !lyricsText) {
        if (!song) break;
        
        lyricsText = await fetchLyrics(artist.name, song.name);
        
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
      setUsedSongs(localUsedSongs);
  
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

  const handleGuess = async() => {
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
      startGame();
    } else {
      if (attempts === 1) {
        // Reset bei Spielverlust
        setCorrectGuesses(0);
        setJokers({
          showMore: 1,
          showCover: 1,
          showInitial: 1,
          showDuration: 1
        });
        setUsedJokers([]);
        
        Alert.alert('Verloren!', `Der Song war: ${currentSong.name}`);
        startGame();
      } else {
        setAttempts(prev => prev - 1);
        setGuess('');
        //Alert.alert('Falsch!', `Noch ${attempts - 1} Versuche`);
      }
    }
  };

  const useJoker = (type) => {
    if (!jokers[type]) return;

    setJokers(prev => ({ 
      ...prev, 
      [type]: prev[type] - 1 
    }));
    
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
        setShowDuration(true);
        break;
      case 'skip':
        skipSong();
        break;
    }
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
        <Ionicons name={icon} size={30} color="#2A9D8F" />
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
      />
      <TouchableOpacity
        style={styles.startButton}
        onPress={startGame}
      >
        <Text style={styles.buttonText}>Spiel starten</Text>
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
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
    borderRadius: 10,
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
  startButton: {
    backgroundColor: '#2A9D8F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A9D8F',
    marginBottom: 10,
    textAlign: 'center',
  },
  attempts: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  initialHint: {
    fontSize: 16,
    color: '#2A9D8F',
    textAlign: 'center',
    marginVertical: 5,
  },
  disabledJoker: {
    opacity: 0.5,
  },
  durationHint: {
    fontSize: 16,
    color: '#2A9D8F',
    textAlign: 'center',
    marginVertical: 5,
  },
});

export default GameScreen;