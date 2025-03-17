import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RatingItem = ({ rating }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{rating.title}</Text>
      <Text>Score: {rating.score}/10</Text>
      <Text>Rated on: {new Date(rating.created_at).toLocaleDateString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RatingItem;