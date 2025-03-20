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
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS achievements (
        name TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (name, profile_name)
    `);
  }
  return db;
} catch (error)
{
    console.error('Datenbankfehler:', error);
    throw error;
  }
};

const ACHIEVEMENT_DEFINITIONS = [
  {
    name: 'pioneer',
    title: 'Erster Schritt',
    description: 'Erstes Rating abgegeben',
    icon: 'rocket',
    checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
    threshold: 1
  },
  {
    name: 'marathon',
    title: 'Rating-Marathon',
    description: '50 Songs bewertet',
    icon: 'walk',
    checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
    threshold: 50
  },
  {
    name: 'perfectionist',
    title: 'Perfektionist',
    description: '10 perfekte 10/10 Ratings',
    icon: 'star',
    checkQuery: `SELECT COUNT(*) FROM ratings 
                WHERE profile_name = $profile AND score = 10`,
    threshold: 10
  },
  {
    name: 'explorer',
    title: 'Musikexplorer',
    description: '20 verschiedene Künstler bewertet',
    icon: 'compass',
    checkQuery: `SELECT COUNT(DISTINCT artist) FROM ratings 
                JOIN songs ON ratings.song_id = songs.id 
                WHERE profile_name = $profile`,
    threshold: 20
  }
];

export const addSong = async (song) => {
    const database = await initDatabase();
    console.log("Add Song to db: ", song)
    await database.runAsync(
      `INSERT OR REPLACE INTO songs 
      (id, title, artist, album, duration, image_url) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [song.id, song.title, song.artist, song.album, song.duration, song.image]
    );
  };

export const addRating = async (songId, score) => {
  const database = await initDatabase();
  console.log("Add Rating SongID: ", songId)
  console.log("Add Rating Score: ", score)
  try {
    await database.execAsync('BEGIN TRANSACTION');
    
    const profileName = await AsyncStorage.getItem('currentProfile');
    console.log("Profile:", profileName)
    if (!profileName) throw new Error('No profile selected');

    await database.runAsync(
      `INSERT INTO ratings (song_id, score, profile_name) 
      VALUES (?, ?, ?)
      ON CONFLICT(song_id, profile_name)
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

  export const getOverallStats = async (profileName) => {
    const database = await initDatabase();
    
    // Gesamtanzahl und Durchschnitt
    const overallStats = await database.getFirstAsync(`
    SELECT 
      COUNT(*) as totalSongs,
      AVG(score) as averageRating,
      SUM(CASE WHEN score = 10 THEN 1 ELSE 0 END) as perfectRatings
    FROM ratings
    WHERE profile_name = $profile
  `, { $profile: profileName });
  
    // Top 5 Artists
    const topArtists = await database.getAllAsync(`
      SELECT 
        artist,
        AVG(score) as avgRating,
        COUNT(*) as songCount
      FROM ratings
      JOIN songs ON ratings.song_id = songs.id
      WHERE profile_name = $profile
      GROUP BY artist
      ORDER BY avgRating DESC
      LIMIT 5
    `, { $profile: profileName });
  
    // Top 5 Alben
    const topAlbums = await database.getAllAsync(`
      SELECT 
        album,
        AVG(score) as avgRating,
        COUNT(*) as songCount
      FROM ratings
      JOIN songs ON ratings.song_id = songs.id
      WHERE profile_name = $profile
      GROUP BY album
      ORDER BY avgRating DESC
      LIMIT 5
    `, { $profile: profileName });
  
    return {
      totalSongs: overallStats.totalSongs || 0,
      averageRating: overallStats.averageRating || 0,
      perfectRatings: overallStats.perfectRatings || 0,
      topArtists: topArtists.map(a => ({
        artist: a.artist,
        avgRating: a.avgRating,
        songCount: a.songCount
      })),
      topAlbums: topAlbums.map(a => ({
        album: a.album,
        avgRating: a.avgRating,
        songCount: a.songCount
      }))
    };
  };

  export const getRatedSongsByArtist = async (artist, profileName) => {
    const database = await initDatabase();
    return await database.getAllAsync(`
      SELECT song_id 
      FROM ratings 
      JOIN songs ON ratings.song_id = songs.id 
      WHERE songs.artist = $artist 
      AND ratings.profile_name = $profile
    `, { 
      $artist: artist,
      $profile: profileName 
    });
  };

  export const checkAchievements = async () => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) return;
  
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const result = await database.getFirstAsync(
        achievement.checkQuery,
        { $profile: profile }
      );
      
      const count = result ? Object.values(result)[0] : 0;
      if (count >= achievement.threshold) {
        try {
          await database.runAsync(
            `INSERT OR IGNORE INTO achievements 
             (name, profile_name) VALUES (?, ?)`,
            [achievement.name, profile]
          );
        } catch(e) { /* Bereits freigeschaltet */ }
      }
    }
  };

  export const getAllAchievements = async () => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) return [];
  
    try {
      const unlocked = await database.getAllAsync(
        `SELECT name, unlocked_at FROM achievements 
         WHERE profile_name = $profile`,
        { $profile: profile }
      );
  
      return ACHIEVEMENT_DEFINITIONS.map(def => ({
        ...def,
        unlocked: unlocked.some(u => u.name === def.name),
        unlocked_at: unlocked.find(u => u.name === def.name)?.unlocked_at,
        progress: getAchievementProgress(def, unlocked)
      }));
      
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  };