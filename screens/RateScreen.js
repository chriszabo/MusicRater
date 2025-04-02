import React, { useState, useRef, useMemo } from 'react'; // useRef hinzufügen
import { View, Text, StyleSheet, Image, Alert, Button, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating, deleteRating, incrementProfileData } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useTheme } from '../ThemeContext';



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
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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
          minimumTrackTintColor={ COLORS.primary }
          maximumTrackTintColor= { COLORS.primary + '90'}
          thumbTintColor={ COLORS.primary }
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
        placeholderTextColor={COLORS.text + '90'}
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

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80,
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  album: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderLabel: {
    fontWeight: '800',
    fontSize: 54,
    color: COLORS.primary,
    marginBottom: -10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 12,
    marginVertical: 25,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  externalUrlText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    maxHeight: 200,
    fontSize: 16,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.albumBorder,
    marginBottom: 15,
    textAlignVertical: 'top',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savedMessage: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  savedMessageText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default RateScreen;