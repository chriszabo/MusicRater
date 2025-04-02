import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllRatings, addSong, addRating, resetDatabase, getAllAchievements, initDatabase, printSongTable, migrateAlbumInfo } from '../database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, THEMES } from '../ThemeContext';

const ProfileScreen = () => {
  const [profileName, setProfileName] = useState('');
  const [currentProfile, setCurrentProfile] = useState('');
  const [topArtistsLimit, setTopArtistsLimit] = useState('');
  const [topAlbumsLimit, setTopAlbumsLimit] = useState('');
  const [showIncompleteAlbums, setShowIncompleteAlbums] = useState(true);
  const { COLORS, themeName, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  

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

      const watchlist = await database.getAllAsync(
        'SELECT * FROM watchlist WHERE profile_name = ?',
        [currentProfile]
      );
      
      const albums = await database.getAllAsync(
        'SELECT * FROM albums WHERE id IN (SELECT id FROM watchlist WHERE type = "album")'
      );
  
      const globalNotes = await database.getAllAsync(
        'SELECT * FROM global_watchlist_notes WHERE profile_name = ?',
        [currentProfile]
      );
  
      const ignored = await database.getAllAsync(
        'SELECT * FROM ignored_songs WHERE profile_name = ?',
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
          game_highscores: gameHighscores,
          watchlist,
          albums,
          global_watchlist_notes: globalNotes,
          ignored_songs: ignored
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
        if (result.canceled) return;
        
        const asset = result.assets[0];
        const json = await FileSystem.readAsStringAsync(asset.uri);
        const { 
          profileName: importedProfile, 
          songs, 
          ratings, 
          achievements,
          profiledata,
          game_highscores,
          watchlist,
          albums,
          global_watchlist_notes,
          ignored_songs
        } = JSON.parse(json);
    
        const database = await initDatabase();
        await database.execAsync('BEGIN TRANSACTION');
    
        try {
          // 1. Profil setzen
          await AsyncStorage.setItem('currentProfile', importedProfile);
          setCurrentProfile(importedProfile);
    
          // 2. Songs in Batch importieren
          const songValues = songs.map(s => [
            s.id, s.title, s.artist, s.album, s.duration, 
            s.image_url, s.album_id, s.album_tracks
          ]);
          await database.execAsync(`
            INSERT OR REPLACE INTO songs 
            (id, title, artist, album, duration, image_url, album_id, album_tracks)
            VALUES ${songs.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')}
          `, songValues.flat());
    
          // 3. Ratings in Batch importieren
          const ratingValues = ratings.map(r => [
            r.song_id, r.score, importedProfile, r.notes || ""
          ]);
          await database.execAsync(`
            INSERT OR REPLACE INTO ratings 
            (song_id, score, profile_name, notes)
            VALUES ${ratings.map(() => '(?, ?, ?, ?)').join(',')}
          `, ratingValues.flat());
    
          // 4. Parallel unabhängige Tabellen importieren
          await Promise.all([
            // Achievements
            database.execAsync(
              `INSERT OR REPLACE INTO achievements 
              (name, profile_name, unlocked_at)
              VALUES ${achievements.map(() => '(?, ?, ?)').join(',')}`,
              achievements.flatMap(a => [a.name, importedProfile, a.unlocked_at])
            ),
          
            // Profiledata
            profiledata && database.execAsync(
              `INSERT OR REPLACE INTO profiledata 
              (profile_name, spotify_links_opened, artist_statistics_opened, 
               top_tracks_opened, songs_searched, artist_mode_opened, 
               top_artists_limit, top_albums_limit, show_incomplete_albums)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                importedProfile,
                profiledata.spotify_links_opened,
                profiledata.artist_statistics_opened,
                profiledata.top_tracks_opened,
                profiledata.songs_searched,
                profiledata.artist_mode_opened,
                profiledata?.top_artists_limit || 5,
                profiledata?.top_albums_limit || 10,
                profiledata?.show_incomplete_albums ?? 1
              ]
            ),
          
            // Game highscores
            game_highscores && database.execAsync(
              `INSERT OR REPLACE INTO game_highscores 
              (profile_name, artist, artist_id, score, created_at)
              VALUES ${game_highscores.map(() => '(?, ?, ?, ?, ?)').join(',')}`,
              game_highscores.flatMap(h => [
                importedProfile, h.artist, h.artist_id, h.score, h.created_at
              ])
            ),
          
            // Watchlist
            watchlist && database.execAsync(
              `INSERT OR REPLACE INTO watchlist 
              (id, type, profile_name)
              VALUES ${watchlist.map(() => '(?, ?, ?)').join(',')}`,
              watchlist.flatMap(w => [w.id, w.type, importedProfile])
            ),
          
            // Albums
            albums && database.execAsync(
              `INSERT OR REPLACE INTO albums 
              (id, title, artist, image_url, total_tracks, release_date)
              VALUES ${albums.map(() => '(?, ?, ?, ?, ?, ?)').join(',')}`,
              albums.flatMap(a => [
                a.id, a.title, a.artist, a.image_url, a.total_tracks, a.release_date
              ])
            ),
          
            // Ignored songs
            ignored_songs && database.execAsync(
              `INSERT OR IGNORE INTO ignored_songs 
              (id, profile_name)
              VALUES ${ignored_songs.map(() => '(?, ?)').join(',')}`,
              ignored_songs.flatMap(i => [i.id, importedProfile])
            )
          ]);
    
          await database.execAsync('COMMIT');
          await migrateAlbumInfo();
          await loadProfile();
    
          Alert.alert("Erfolg", `Profil "${importedProfile}" importiert!`);
        } catch (error) {
          await database.execAsync('ROLLBACK');
          throw error;
        }
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
          <Ionicons name="download" size={20} color={COLORS.surface} />
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Exportieren</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleImport}
        >
          <Ionicons name="cloud-upload" size={20} color={COLORS.surface} />
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
            placeholderTextColor={COLORS.text + '90'}
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
            placeholderTextColor={COLORS.text + '90'}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Unvollständige Alben anzeigen?</Text>
          <Switch
            value={showIncompleteAlbums}
            onValueChange={setShowIncompleteAlbums}
            trackColor={{ true: COLORS.primary }}
            thumbColor={COLORS.background}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={updateLimits}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Einstellungen speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section,]}>
        <Text style={[styles.sectionHeader, { color: COLORS.text }]}>Farbschema</Text>
        
        {Object.keys(THEMES).map((themeKey) => (
          <TouchableOpacity
            key={themeKey}
            onPress={() => setTheme(themeKey)}
            style={[
              styles.themeButton,
              { 
                backgroundColor: COLORS.primary + '20',
                borderColor: themeKey === themeName ? COLORS.primary : 'transparent'
              }
            ]}
          >
            <Text style={[styles.themeButtonText, { color: COLORS.text }]}>
              {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
            </Text>
            {themeKey === themeName && (
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Gefahrenzone</Text>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Ionicons name="warning" size={20} color={COLORS.surface} />
          <Text style={[styles.buttonText, styles.dangerButtonText]}>Datenbank löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles =  (COLORS) =>  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
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
    borderColor: COLORS.albumBorder,
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
    color: COLORS.surface,
  },
  dangerButtonText: {
    color: COLORS.surface,
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
  },
  themeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 10,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;