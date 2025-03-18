import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
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
          song_id TEXT UNIQUE,
          score INTEGER CHECK(score BETWEEN 0 AND 10),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(song_id) REFERENCES songs(id)
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
    await database.runAsync(
      `INSERT INTO ratings (song_id, score)
       VALUES (?, ?)
       ON CONFLICT(song_id) 
       DO UPDATE SET score = excluded.score, created_at = CURRENT_TIMESTAMP`,
      [songId, Math.round(score)]
    );
  };

  export const getAllRatings = async (filters = {}, sort = {}) => {
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
  
    const whereClauses = [];
    const params = {};
  
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
db = null;
};

export const deleteRating = async (songId) => {
    const database = await initDatabase();
    await database.runAsync(
      'DELETE FROM ratings WHERE song_id = ?',
      [songId]
    );
  };