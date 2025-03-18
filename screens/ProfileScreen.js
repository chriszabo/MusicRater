import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <View style={styles.container}>
      <Text style={styles.currentProfile}>Aktives Profil: {currentProfile || "Kein Profil ausgewählt"}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Neues Profil erstellen"
        value={profileName}
        onChangeText={setProfileName}
      />
      <Button
        title="Profil speichern"
        onPress={saveProfile}
        color="#1EB1FC"
      />
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