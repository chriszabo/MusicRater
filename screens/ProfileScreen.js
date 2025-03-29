import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllRatings, addSong, addRating, resetDatabase, getAllAchievements, initDatabase, printSongTable, migrateAlbumInfo } from '../database';
import { COLORS } from '../config/colors';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [profileName, setProfileName] = useState('');
  const [currentProfile, setCurrentProfile] = useState('');
  const [topArtistsLimit, setTopArtistsLimit] = useState('');
  const [topAlbumsLimit, setTopAlbumsLimit] = useState('');
  const [showIncompleteAlbums, setShowIncompleteAlbums] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const name = await AsyncStorage.getItem('currentProfile');
    if (name) {
      setCurrentProfile(name);
      const db = await initDatabase();
      const profileData = await db.getFirstAsync(
        'SELECT top_artists_limit, top_albums_limit, show_incomplete_albums FROM profiledata WHERE profile_name = ?',
        [name]
      );
      setTopArtistsLimit(profileData?.top_artists_limit?.toString() || '5');
      setTopAlbumsLimit(profileData?.top_albums_limit?.toString() || '10');
      setShowIncompleteAlbums(profileData?.show_incomplete_albums !== 0);
    }
  };

  const updateLimits = async () => {
    const db = await initDatabase();
    await db.runAsync(
      `INSERT OR IGNORE INTO profiledata (
        profile_name
      ) VALUES (?)`,
      [currentProfile]
    );
    await db.runAsync(
      `UPDATE profiledata SET
        top_artists_limit = ?,
        top_albums_limit = ?,
        show_incomplete_albums = ?
      WHERE profile_name = ?`,
      [
        parseInt(topArtistsLimit) || 5,
        parseInt(topAlbumsLimit) || 10,
        showIncompleteAlbums ? 1 : 0,
        currentProfile
      ]
    );
    console.log("Limits angepasst.", showIncompleteAlbums ? 1 : 0)
    Alert.alert("Erfolg", "Einstellungen gespeichert!");
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

      // const profileData = await database.getFirstAsync(
      //   'SELECT top_artists_limit, top_albums_limit, show_incomplete_albums FROM profiledata WHERE profile_name = ?',
      //   [currentProfile]
      // );

      console.log("Export", profileData)
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
          album_id: r.album_id,
          album_tracks: r.album_tracks,
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
              top_tracks_opened, songs_searched, artist_mode_opened, top_artists_limit, top_albums_limit, show_incomplete_albums) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              data.profile_name,
              data.spotify_links_opened,
              data.artist_statistics_opened,
              data.top_tracks_opened,
              data.songs_searched,
              data.artist_mode_opened,
              data?.top_artists_limit || 5,
              data?.top_albums_limit || 10,
              data?.show_incomplete_albums ?? 1
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

      await migrateAlbumInfo();
      await loadProfile();

      Alert.alert("Erfolg", `Profil "${profileName}" importiert!`);
    } catch (error) {
      Alert.alert("Import fehlgeschlagen", error.message);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Profilverwaltung</Text>
        
        <Text style={styles.currentProfile}>
          <Ionicons name="person" size={18} color={COLORS.primary} /> 
          {' '}Aktuelles Profil: {currentProfile || "Kein Profil ausgewählt"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Profil setzen..."
          placeholderTextColor={COLORS.text + '90'}
          value={profileName}
          onChangeText={setProfileName}
        />
        <TouchableOpacity
          style={[styles.button, , styles.primaryButton]}
          onPress={saveProfile}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Profil setzen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Daten Export/Import</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleExport}
        >
          <Ionicons name="download" size={20} color="white" />
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Exportieren</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleImport}
        >
          <Ionicons name="cloud-upload" size={20} color="white" />
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Importieren</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Statistik-Einstellungen</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Top Interpreten Limit</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={topArtistsLimit}
            onChangeText={setTopArtistsLimit}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Top Alben Limit</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            value={topAlbumsLimit}
            onChangeText={setTopAlbumsLimit}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Unvollständige Alben anzeigen?</Text>
          <Switch
            value={showIncompleteAlbums}
            onValueChange={setShowIncompleteAlbums}
            trackColor={{ true: COLORS.primary }}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={updateLimits}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Einstellungen speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Gefahrenzone</Text>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Ionicons name="warning" size={20} color="white" />
          <Text style={[styles.buttonText, styles.dangerButtonText]}>Datenbank löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  currentProfile: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  dangerButtonText: {
    color: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  }
});

export default ProfileScreen;