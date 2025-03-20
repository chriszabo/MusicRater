import { encode } from 'base-64';

const SPOTIFY_CLIENT_ID = 'xxx';
const SPOTIFY_CLIENT_SECRET = 'xxx';

let accessToken = null;

export const getAccessToken = async () => {
    if (accessToken) return accessToken;
    
    const authString = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
    const base64Auth = encode(authString); // Use base-64 instead of btoa
  
    // Add error handling
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`
        },
        body: 'grant_type=client_credentials'
      });
  
      if (!response.ok) throw new Error('Token request failed');
      
      const data = await response.json();
      accessToken = data.access_token;
      return accessToken;
    } catch (error) {
      console.error("Spotify auth error:", error);
      throw error;
    }
  };

export const searchSpotify = async (query) => {
  const token = await getAccessToken();
  console.log("Searching spotify for: ", query)
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

export const searchArtists = async (query) => {
  const token = await getAccessToken();
  console.log("Searching Artist: ", query)
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data.artists?.items[0];
};

export const getArtistAlbums = async (artistId) => {
  const token = await getAccessToken();
  console.log("Getting Artist Albums", artistId)
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

export const getAlbum = async (albumId) => {
  const token = await getAccessToken();
  console.log("Getting Album", albumId)
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};

export const getArtistTopTracks = async (artistId) => {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=DE`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data.tracks;
};