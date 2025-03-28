import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllRatings, addSong, addRating, resetDatabase, getAllAchievements, initDatabase } from '../database';
import { COLORS } from '../config/colors';

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
      Alert.alert("Kein Profil", "Wähle ein Profil, bevor du den Export beginnst");
      return;
    }
    const database = await initDatabase();
    try {
      const ratings = await getAllRatings({}, {});
      const unlockedAchievements = await getAllAchievements();
      
      if (!ratings.length) {
        Alert.alert("Keine Daten", "Du hast keine Ratings auf diesem Profil");
        return;
      }

      const profileData = await database.getAllAsync(
        'SELECT * FROM profiledata WHERE profile_name = ?',
        [currentProfile]
      );
      const gameHighscores = await database.getAllAsync(
        'SELECT * FROM game_highscores WHERE profile_name = ?',
        [currentProfile]
      );

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
          notes: r.notes,
        })),
        achievements: unlockedAchievements
          .filter(a => a.unlocked)
          .map(a => ({
            name: a.name,
            unlocked_at: a.unlocked_at
          })),
          profiledata: profileData,
          game_highscores: gameHighscores
      };

      const fileUri = FileSystem.documentDirectory + `${currentProfile}_export.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData));
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Export fehlgeschlagen", error.message);
    }
  };

  const handleDelete = () => {
      Alert.alert(
        "Datenbank Löschen",
        "Willst du deine Datenbank wirklich löschen? Alle Songs und Ratings gehen verloren. Mach vorher eventuell einen Export.",
        [
          { text: "Abbrechen", style: "cancel" },
          { 
            text: "Löschen", 
            style: "destructive",
            onPress: async () => {
              await resetDatabase();
            }
          }
        ]
      );
    };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled == 'false') return;
      console.log("success")
      const asset = result.assets[0]
      const json = await FileSystem.readAsStringAsync(asset.uri);
      const { profileName, songs, ratings, achievements, profiledata, game_highscores } = JSON.parse(json);

      await AsyncStorage.setItem('currentProfile', profileName);
      setCurrentProfile(profileName);

      // Import songs
      for (const song of songs) {
        song.image = song.image_url;
        console.log("song", song)
        await addSong(song);
      }

      // Import ratings
      for (const rating of ratings) {
        console.log("rating", rating)
        await addRating(rating.song_id, rating.score, rating.notes || "");
      }

      const database = await initDatabase();
      if (achievements) {
        for (const ach of achievements) {
          await database.runAsync(
            `INSERT OR REPLACE INTO achievements (name, profile_name, unlocked_at) 
             VALUES (?, ?, ?)`,
            [ach.name, profileName, ach.unlocked_at]
          );
        }
      }

      if (profiledata) {
        for (const data of profiledata) {
          await database.runAsync(
            `INSERT OR REPLACE INTO profiledata 
             (profile_name, spotify_links_opened, artist_statistics_opened, 
              top_tracks_opened, songs_searched, artist_mode_opened) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              data.profile_name,
              data.spotify_links_opened,
              data.artist_statistics_opened,
              data.top_tracks_opened,
              data.songs_searched,
              data.artist_mode_opened
            ]
          );
        }
      }
  
      // Import game_highscores
      if (game_highscores) {
        for (const hs of game_highscores) {
          await database.runAsync(
            `INSERT OR REPLACE INTO game_highscores 
             (profile_name, artist, artist_id, score, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [hs.profile_name, hs.artist, hs.artist_id, hs.score, hs.created_at]
          );
        }
      }

      Alert.alert("Erfolg", `Profil "${profileName}" importiert!`);
    } catch (error) {
      Alert.alert("Import fehlgeschlagen", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentProfile}>Aktuelles Profil: {currentProfile || "None"}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Profil setzen"
        value={profileName}
        onChangeText={setProfileName}
      />
      <View style={styles.button}>
      <Button title="Profil bestätigen" onPress={saveProfile} color="#1EB1FC" />
      </View>
      <View style={styles.button}>
      <Button title="Profil-Ratings exportieren" onPress={handleExport} color="#2A9D8F" />
      </View>
      <View style={styles.button}>
      <Button title="Profil-Ratings importieren" onPress={handleImport} color="#2A9D8F" />
      </View>
      <View style={styles.button}>
      <Button title="Datenbank löschen" onPress={handleDelete} color={COLORS.error} />
      </View>
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
  },
  button: {
    marginBottom: 10,
  }
});

export default ProfileScreen;