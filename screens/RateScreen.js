import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating, deleteRating } from '../database';

const RateScreen = ({ route, navigation }) => {
  const { songId, initialScore } = route.params;
  const [score, setScore] = useState(initialScore ?? 5); // Float-Wert für Smoothness

  const handleSubmit = async () => {
    try {
      await addRating(songId, Math.round(score)); // Erst hier runden
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Rating",
      "Are you sure you want to delete this rating?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteRating(songId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Rate this song (0-10)</Text>
      
      {/* Verbesserter Slider */}
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={initialScore ?? 5} // Initialwert als Float
        onValueChange={setScore}
        minimumTrackTintColor="#1EB1FC"
        maximumTrackTintColor="#D3D3D3"
        thumbTintColor="#1EB1FC"
      />
      
      <Text>Score: {Math.round(score)}</Text>
      
      <Button 
        title="Submit Rating" 
        onPress={handleSubmit} 
        color="#1EB1FC"
      />
      
      <Button
        title="Delete Rating"
        onPress={handleDelete}
        color="red"
        style={{ marginTop: 10 }}
      />
    </View>
  );
};

export default RateScreen;