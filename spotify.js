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
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};