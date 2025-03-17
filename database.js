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
        song_id TEXT,
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
    'INSERT OR IGNORE INTO songs (id, title, artist, album, duration, image_url) VALUES (?, ?, ?, ?, ?, ?);',
    [song.id, song.title, song.artist, song.album, song.duration, song.image]
  );
};

export const addRating = async (songId, score) => {
  const database = await initDatabase();
  await database.runAsync(
    'INSERT INTO ratings (song_id, score) VALUES (?, ?);',
    [songId, score]
  );
};

export const getAllRatings = async () => {
  const database = await initDatabase();
  return await database.getAllAsync(`
    SELECT songs.title, ratings.score, ratings.created_at 
    FROM ratings 
    JOIN songs ON ratings.song_id = songs.id
    ORDER BY ratings.created_at DESC
  `);
};

export const getExistingRating = async (songId) => {
    const database = await initDatabase();
    try {
      const result = await database.runAsync(
        'SELECT score FROM ratings WHERE song_id = ?',
        [songId]
      );
      return result?.score || null;
    } catch (error) {
      console.error("Error fetching rating:", error);
      return null;
    }
  };