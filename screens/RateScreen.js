import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { addRating } from '../database';

const RateScreen = ({ route, navigation }) => {
  const { songId, initialScore } = route.params;
  const [score, setScore] = useState(initialScore);

  const handleSubmit = async () => {
    try {
      await addRating(songId, Math.round(score));
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Rate this song (0-10)</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={score}
        onValueChange={setScore}
        minimumTrackTintColor="#1EB1FC"
        maximumTrackTintColor="#D3D3D3"
      />
      <Text>Score: {Math.round(score)}</Text>
      <Button title="Submit Rating" onPress={handleSubmit} />
    </View>
  );
};

export default RateScreen;