import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db = null;

export const initDatabase = async () => {
  //await resetDatabase();
    try {
  if (!db) {
    db = await SQLite.openDatabaseAsync('musicrater.db');
    console.log('Datenbank erfolgreich geöffnet');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration INTEGER,
        image_url TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        score INTEGER CHECK(score BETWEEN 0 AND 10),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(song_id) REFERENCES songs(id),
        UNIQUE(song_id, profile_name)
      );
    `);
  }
  return db;
} catch (error)
{
    console.error('Datenbankfehler:', error);
    throw error;
  }
};

export const addSong = async (song) => {
    const database = await initDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO songs 
      (id, title, artist, album, duration, image_url) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [song.id, song.title, song.artist, song.album, song.duration, song.image]
    );
  };

export const addRating = async (songId, score) => {
  const database = await initDatabase();
  try {
    await database.execAsync('BEGIN TRANSACTION');
    
    const profileName = await AsyncStorage.getItem('currentProfile');
    console.log("Profile:", profileName)
    if (!profileName) throw new Error('No profile selected');

    await database.runAsync(
      `INSERT INTO ratings (song_id, score, profile_name) 
      VALUES (?, ?, ?)
      ON CONFLICT(song_id)
      DO UPDATE SET score = excluded.score, created_at = CURRENT_TIMESTAMP`,
      [songId, Math.round(score), profileName]
    );
    
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    console.error("Error in addRating:", error);
    throw error;
  }
};

  export const getAllRatings = async (filters = {}, sort = {}) => {
    const profileName = await AsyncStorage.getItem('currentProfile');
    if (!profileName) return [];
    
    // Add profile filter
    const whereClauses = ["profile_name = $profileName"];
    const params = { ...filters, $profileName: profileName };
    const database = await initDatabase();
    let query = `
      SELECT ratings.id AS rating_id, 
             ratings.song_id, 
             ratings.score, 
             ratings.created_at,
             songs.title,
             songs.artist,
             songs.album,
             songs.image_url AS image
      FROM ratings 
      JOIN songs ON ratings.song_id = songs.id
    `;
  
    // const whereClauses = [];
    // const params = {};
  
    // Title Filter
    if (filters.title) {
      whereClauses.push("songs.title LIKE '%' || $title || '%'");
      params.$title = filters.title;
    }
  
    // Artist Filter
    if (filters.artist) {
      whereClauses.push("songs.artist LIKE '%' || $artist || '%'");
      params.$artist = filters.artist;
    }
  
    // Album Filter
    if (filters.album) {
      whereClauses.push("songs.album LIKE '%' || $album || '%'");
      params.$album = filters.album;
    }
  
    // Score Range Filter
    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      const min = filters.minScore ?? 0;
      const max = filters.maxScore ?? 10;
      whereClauses.push("ratings.score BETWEEN $minScore AND $maxScore");
      params.$minScore = min;
      params.$maxScore = max;
    }
  
    // Combine WHERE clauses
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
  
    // Sorting
    const validSortColumns = ['title', 'artist', 'album', 'score', 'created_at'];
    if (validSortColumns.includes(sort.by)) {
      query += ` ORDER BY ${sort.by} ${sort.order === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      query += ' ORDER BY created_at DESC'; // Default sorting
    }
  
    return await database.getAllAsync(query, params);
  };

export const getExistingRating = async (songId) => {
    const database = await initDatabase();
    try {
      const results = await database.getAllAsync(
        'SELECT score FROM ratings WHERE song_id = ?',
        [songId]
      );
      return results[0]?.score || null;
    } catch (error) {
      console.error("Error fetching rating:", error);
      return null;
    }
  };

export const resetDatabase = async () => {
if (db) {
    await db.closeAsync();
}
await SQLite.deleteDatabaseAsync('musicrater.db'); // Delete existing DB
console.log("db deleted")
db = null;
};

export const deleteRating = async (songId) => {
    const database = await initDatabase();
    await database.runAsync(
      'DELETE FROM ratings WHERE song_id = ?',
      [songId]
    );
  };

  export const getArtistStats = async (artistName, profileName) => {
    const database = await initDatabase();
    
    // Artist Gesamtdurchschnitt
    const artistAvgResult = await database.getFirstAsync(`
      SELECT AVG(score) as artistAverage 
      FROM ratings 
      JOIN songs ON ratings.song_id = songs.id 
      WHERE LOWER(songs.artist) = LOWER($artist) 
      AND ratings.profile_name = $profile
    `, { $artist: artistName, $profile: profileName });
  
    // Album Statistiken
    const albumsResult = await database.getAllAsync(`
      SELECT 
        album, 
        AVG(score) as avgScore, 
        COUNT(*) as trackCount 
      FROM ratings 
      JOIN songs ON ratings.song_id = songs.id 
      WHERE LOWER(songs.artist) = LOWER($artist) 
      AND ratings.profile_name = $profile
      GROUP BY album
      ORDER BY avgScore DESC
    `, { $artist: artistName, $profile: profileName });
  
    return {
      artistAverage: artistAvgResult.artistAverage || 0,
      albums: albumsResult.map(a => ({
        album: a.album,
        avgScore: a.avgScore,
        trackCount: a.trackCount
      }))
    };
  };