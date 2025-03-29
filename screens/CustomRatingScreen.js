import React, { useState, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import { addSong, addRating } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

const COLORS = {
  primary: '#2A9D8F',  // Sanftes Türkis
  secondary: '#264653', // Tiefes Blau-Grau
  accent: '#E9C46A',   // Warmes Senfgelb
  background: '#F8F9FA', // Sehr helles Grau
  text: '#2B2D42',      //Dunkles Grau-Blau
  error: '#E76F51',    // Warmes Korallenrot
};

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
        />

        <TextInput
          placeholder="Interpret"
          value={artist}
          onChangeText={setArtist}
          style={styles.input}
        />
        
        <TextInput
          placeholder="Album"
          value={album}
          onChangeText={setAlbum}
          style={styles.input}
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
        />

        <Text style={styles.scoreText}>{Math.round(score)}/10</Text>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={sliderValue.current}
        onValueChange={setScore}
        style={styles.slider}
        minimumTrackTintColor="#2A9D8F"
        maximumTrackTintColor="#ddd"
        thumbTintColor="#2A9D8F"
      />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <View style={{ marginTop: 20 }}>
          <Button 
            title="Rating speichern" 
            onPress={handleSubmit} 
            color="#2A9D8F" 
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  image: {
    width: '80%',
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  slider: {
    marginVertical: 15,
  },
  scoreText: {
    fontWeight: '800',
    fontSize: 54,
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: "center"
  },
  error: {
    color: '#E76F51',
    textAlign: 'center',
    marginVertical: 10,
  },
  success: {
    color: '#2A9D8F',
    textAlign: 'center',
    marginVertical: 10,
  }
});

export default CustomRatingScreen;