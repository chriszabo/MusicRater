import React, { useState, useRef } from 'react'; // useRef hinzufügen
import { View, Text, StyleSheet, Image, Alert, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating, deleteRating } from '../database';

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
      await addRating(songId, Math.round(value));
      setShowSavedMessage(true); // Zeige die Nachricht an
      setTimeout(() => setShowSavedMessage(false), 2000); // Verstecke die Nachricht nach 2 Sekunden
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
      {/* Song Information */}
      <Image 
        source={{ uri: image }} 
        style={styles.image} 
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.artist}>Artist: {artist}</Text>
      <Text style={styles.album}>Album: {album}</Text>

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
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artist: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  album: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  sliderLabel: {
    fontWeight: 'bold',
    fontSize: 64,
    marginBottom: 10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
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
  savedMessage: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  savedMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 20,
  },
});

export default RateScreen;