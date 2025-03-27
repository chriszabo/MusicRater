import React, { useState, useRef } from 'react'; // useRef hinzufügen
import { View, Text, StyleSheet, Image, Alert, Button, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating, deleteRating, incrementProfileData } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import PieChartRating from '../components/PieChartRating';


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
  const { songId, initialScore, title, artist, album, image, created_at, initialNotes} = route.params;
  const [score, setScore] = useState(
    initialScore !== undefined && initialScore !== null 
      ? parseFloat(initialScore) 
      : 5.0
  );
  const [notes, setNotes] = useState(initialNotes)
  const sliderValue = useRef(score); // useRef für den Slider-Wert
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleOpenExternalUrl = async () => {
    try {
      const link = "spotify:track:" + songId
      //const link = "https://www.google.com"
      //const supported = await Linking.canOpenURL(link);
      const supported = true;
      if (supported) {
        await Linking.openURL(link);
        await incrementProfileData("spotify_links_opened")
      } else {
        Alert.alert("Fehler", "Die URL kann nicht geöffnet werden.");
      }
    } catch (error) {
      console.error("Fehler beim Öffnen der URL:", error);
      Alert.alert("Fehler", "Ein Fehler ist aufgetreten beim Öffnen der URL.");
    }
  };

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

  const handleText = async() => {
    await handleSaveRating(score);
  };

  const handleSaveRating = async (value) => {
    try {
      const profileName = await AsyncStorage.getItem('currentProfile');
      if (!profileName) {
        Alert.alert("Kein Profil", "Bitte erstelle zuerst ein Profil");
        return;
      }
      
      await addRating(songId, Math.round(value), notes);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  const getImageSource = (value) => {
    if (!value) return { uri: value}
    if (value.startsWith('local:')) {
      const imageKey = value.split(':')[1];
      return LOCAL_IMAGES[imageKey] || require('../assets/dog_icon.jpeg');
    }
    return { uri: value };
  };

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Song Information */}
      <View style={styles.content}>
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
        
        {!songId.startsWith("custom") && (
          <TouchableOpacity onPress={handleOpenExternalUrl}>
            <Text style={styles.externalUrlText}>Öffne auf Spotify</Text>
          </TouchableOpacity>
        )}

        {/* Rating Slider */}
        <Text style={styles.sliderLabel}>{Math.round(score)}/10</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={10}
          step={0.1}
          value={sliderValue.current}
          onValueChange={(value) => setScore(value)}
          onSlidingComplete={handleSaveRating}
          minimumTrackTintColor="#1EB1FC"
          maximumTrackTintColor="#D3D3D3"
          thumbTintColor="#1EB1FC"
        />

        {created_at && (
          <Text style={styles.date}>Zuletzt bewertet am {new Date(created_at).toLocaleDateString()}</Text>
        )}
      </View>

      <TextInput
        placeholder="Notizen..."
        value={notes}
        onChangeText={setNotes}
        onEndEditing={handleText}
        multiline
        style={styles.notesInput}
        blurOnSubmit={false}
      />
    </ScrollView>

    {/* Delete Button */}
    <Button
      title="Löschen"
      onPress={handleDelete}
      color={COLORS.error}
      style={styles.deleteButton}
    />

    {showSavedMessage && (
      <View style={styles.savedMessage}>
        <Text style={styles.savedMessageText}>Rating gespeichert!</Text>
      </View>
    )}
  </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  content: {
    marginBottom: 20,
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
  },
  externalUrlText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 10,
  },
  notesInput: {
    minHeight: 100,
    maxHeight: 200,
    fontSize: 16,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Platz für den Löschen-Button
  },
  deleteButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

export default RateScreen;