import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllRatings, addSong, addRating } from '../database';

const ProfileScreen = () => {
  const [profileName, setProfileName] = useState('');
  const [currentProfile, setCurrentProfile] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const name = await AsyncStorage.getItem('currentProfile');
    if (name) setCurrentProfile(name);
  };

  const saveProfile = async () => {
    if (!profileName.trim()) return;
    await AsyncStorage.setItem('currentProfile', profileName.trim());
    setCurrentProfile(profileName.trim());
    setProfileName('');
  };

  const handleExport = async () => {
    const currentProfile = await AsyncStorage.getItem('currentProfile');
    if (!currentProfile) {
      Alert.alert("No Profile", "Create or select a profile to export.");
      return;
    }

    try {
      const ratings = await getAllRatings({}, {});
      if (!ratings.length) {
        Alert.alert("No Data", "No ratings to export.");
        return;
      }

      // Extract unique songs
      const songsMap = new Map();
      ratings.forEach(r => {
        songsMap.set(r.song_id, {
          id: r.song_id,
          title: r.title,
          artist: r.artist,
          album: r.album,
          duration: r.duration,
          image_url: r.image,
        });
      });

      const exportData = {
        profileName: currentProfile,
        songs: Array.from(songsMap.values()),
        ratings: ratings.map(r => ({
          song_id: r.song_id,
          score: r.score,
          created_at: r.created_at,
        })),
      };

      const fileUri = FileSystem.documentDirectory + `${currentProfile}_export.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData));
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Export Failed", error.message);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled == 'false') return;
      console.log("success")
      const asset = result.assets[0]
      const json = await FileSystem.readAsStringAsync(asset.uri);
      const { profileName, songs, ratings } = JSON.parse(json);

      await AsyncStorage.setItem('currentProfile', profileName);
      setCurrentProfile(profileName);

      // Import songs
      for (const song of songs) {
        console.log("song", song)
        await addSong(song);
      }

      // Import ratings
      for (const rating of ratings) {
        console.log("rating", rating)
        await addRating(rating.song_id, rating.score);
      }

      Alert.alert("Success", `Profile "${profileName}" imported!`);
    } catch (error) {
      Alert.alert("Import Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentProfile}>Current Profile: {currentProfile || "None"}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="New Profile"
        value={profileName}
        onChangeText={setProfileName}
      />
      <Button title="Save Profile" onPress={saveProfile} color="#1EB1FC" />
      
      <Button title="Export Profile" onPress={handleExport} color="#2A9D8F" />
      <Button title="Import Profile" onPress={handleImport} color="#2A9D8F" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  currentProfile: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
    color: '#2A9D8F',
  }
});

export default ProfileScreen;