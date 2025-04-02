import React, { useState, useRef, useMemo } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import { addSong, addRating } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useTheme } from '../ThemeContext';


// Lokales Bild (Pfad anpassen)
const DEFAULT_IMAGE = require('../assets/dog_icon.jpeg'); 

const CustomRatingScreen = () => {
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState(5);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const sliderValue = useRef(score);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleSubmit = async () => {
    try {
      const profile = await AsyncStorage.getItem('currentProfile');
      if (!profile) throw new Error('Bitte erstelle oder wähle ein Profil aus');

      if (!title || !album || !artist) throw new Error('Bitte fülle alle Felder aus');

      // Generiere eine "unique" ID für den custom Song
      const customId = `custom-${Date.now()}`;

      // Song zur Datenbank hinzufügen
      await addSong({
        id: customId,
        title,
        artist,
        album,
        album_id: album,
        album_tracks: 0,
        duration: 0,
        image: "local:dog_icon.jpeg"
      });

      // Rating hinzufügen
      await addRating(customId, Math.round(score), notes);

      // Formular zurücksetzen
      setTitle('');
      setAlbum('');
      setArtist('')
      setScore(5);
      setError('');
      setSuccess('Rating erfolgreich gespeichert!');
      
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={[styles.container, {paddingBottom: 30}]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={DEFAULT_IMAGE} style={styles.image} resizeMode="cover"/>
        
        <TextInput
          placeholder="Songtitel"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor={COLORS.text + '90'}
        />

        <TextInput
          placeholder="Interpret"
          value={artist}
          onChangeText={setArtist}
          style={styles.input}
          placeholderTextColor={COLORS.text + '90'}
        />
        
        <TextInput
          placeholder="Album"
          value={album}
          onChangeText={setAlbum}
          style={styles.input}
          placeholderTextColor={COLORS.text + '90'}
          
        />

        <TextInput
          placeholder="Notizen"
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { height: 100 }]}
          multiline
          blurOnSubmit={false}
          textAlignVertical="top" // Text startet oben bei Android
          returnKeyType="done"
          placeholderTextColor={COLORS.text + '90'}
        />

        <Text style={styles.scoreText}>{Math.round(score)}/10</Text>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={sliderValue.current}
        onValueChange={setScore}
        style={styles.slider}
        minimumTrackTintColor={ COLORS.primary }
        maximumTrackTintColor={ COLORS.primary + '90'}
        thumbTintColor={ COLORS.primary }
      />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <View style={{ marginTop: 20 }}>
          <Button 
            title="Rating speichern" 
            onPress={handleSubmit} 
            color={ COLORS.primary }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
  slider: {
    width: '100%',
    height: 12,
    marginVertical: 15,
  },
  scoreText: {
    fontWeight: '800',
    fontSize: 54,
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: COLORS.primary + '40',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: COLORS.error + '20',
    padding: 10,
    borderRadius: 8,
  },
  success: {
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: COLORS.primary + '20',
    padding: 10,
    borderRadius: 8,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default CustomRatingScreen;