import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('musicrater.db');
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

export const getAllRatings = async () => {
    const database = await initDatabase();
    return await database.getAllAsync(`
      SELECT ratings.id AS rating_id, 
             ratings.song_id, 
             ratings.score, 
             ratings.created_at,
             songs.title,
             songs.artist,
             songs.album
      FROM ratings 
      JOIN songs ON ratings.song_id = songs.id
      ORDER BY ratings.created_at DESC
    `);
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