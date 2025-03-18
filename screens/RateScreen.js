import React, { useState, useRef } from 'react'; // useRef hinzufügen
import { View, Text, StyleSheet, Image, Alert, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating, deleteRating } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#2A9D8F',  // Sanftes Türkis
  secondary: '#264653', // Tiefes Blau-Grau
  accent: '#E9C46A',   // Warmes Senfgelb
  background: '#F8F9FA', // Sehr helles Grau
  text: '#2B2D42',      //Dunkles Grau-Blau
  error: '#E76F51',    // Warmes Korallenrot
};

const LOCAL_IMAGES = {
  'dog_icon.jpeg': require('../assets/dog_icon.jpeg'),
};

const RateScreen = ({ route, navigation }) => {
  const { songId, initialScore, title, artist, album, image, created_at } = route.params;
  const [score, setScore] = useState(initialScore ? parseFloat(initialScore) : 5.0);
  const sliderValue = useRef(score); // useRef für den Slider-Wert
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Rating Löschen",
      "Willst du dein Rating wirklich löschen?",
      [
        { text: "Abbrechen", style: "cancel" },
        { 
          text: "Löschen", 
          style: "destructive",
          onPress: async () => {
            await deleteRating(songId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleSaveRating = async (value) => {
    try {
      const profileName = await AsyncStorage.getItem('currentProfile');
      if (!profileName) {
        Alert.alert("Kein Profil", "Bitte erstelle zuerst ein Profil");
        return;
      }
      
      await addRating(songId, Math.round(value));
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  const getImageSource = (value) => {
    if (value.startsWith('local:')) {
      const imageKey = value.split(':')[1];
      return LOCAL_IMAGES[imageKey] || require('../assets/dog_icon.jpeg');
    }
    return { uri: value };
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
      {/* Song Information */}
      <View style={styles.imageContainer}>
      <Image 
        source={getImageSource(image)} 
        style={styles.image} 
        resizeMode="cover"
      />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.artist}>{artist}</Text>
      <Text style={styles.album}>{album}</Text>

      {/* Rating Slider */}
      <Text style={styles.sliderLabel}>{Math.round(score)}/10</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={sliderValue.current} // Verwende den useRef-Wert
        onValueChange={(value) => {
          //sliderValue.current = value; // Aktualisiere den useRef-Wert
          setScore(value); // Aktualisiere den State für die Anzeige
        }}
        onSlidingComplete={handleSaveRating}
        minimumTrackTintColor="#1EB1FC"
        maximumTrackTintColor="#D3D3D3"
        thumbTintColor="#1EB1FC"
      />
      <Text style={styles.date}>Zuletzt bearbeitet am {new Date(created_at).toLocaleDateString()}</Text>

      {showSavedMessage && (
        <View style={styles.savedMessage}>
          <Text style={styles.savedMessageText}>Rating gespeichert!</Text>
        </View>
      )}

    </View>
      {/* Delete Button */}
      <Button style={styles.buttonContainer}
        title="Löschen"
        onPress={handleDelete}
        color={COLORS.error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'space-between', backgroundColor: COLORS.background },
  content: {
    flex: 1,
  },
  artist: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
    textAlign: "center"
  },
  album: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: "center"
  },
  score: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  date: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  container: { 
    flex: 1, 
    padding: 25,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center"
  },
  slider: {
    width: '100%',
    height: 12,
    marginVertical: 25,
  },
  sliderLabel: {
    fontWeight: '800',
    fontSize: 54,
    color: COLORS.primary,
    marginBottom: -10,
    textAlign: "center"
  },
  savedMessage: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12, // 👈 Radius hier anwenden
    overflow: 'hidden', // 👈 Wichtig! Schneidet das Bild ab
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  savedMessageText: {
    color: "white"
  }
});

export default RateScreen;