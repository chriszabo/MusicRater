import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { getAlbum } from '../spotify';
import SongItem from '../components/SongItem';
import { addSong } from '../database';

const AlbumTracksScreen = ({ route, navigation }) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState(null);

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const album = await getAlbum(route.params.albumId);
        setAlbumInfo({
          title: album.name,
          image: album.images[0]?.url
        });
        
        const formattedTracks = album.tracks.items.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: album.name,
          duration: track.duration_ms,
          image: album.images[0]?.url
        }));
        
        setTracks(formattedTracks);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongItem
              song={item}
              onPress={async () => {
                await addSong(item);
                navigation.navigate('Rate', { 
                  songId: item.id,
                  title: item.title,
                  artist: item.artist,
                  album: item.album,
                  image: item.image,
                });
              }}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
});

export default AlbumTracksScreen;