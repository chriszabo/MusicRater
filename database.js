import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENT_DEFINITIONS } from './achievements';
import { searchAlbums } from './spotify';

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
        album_id TEXT,
        album_tracks INTEGER,
        duration INTEGER,
        image_url TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        notes TEXT,
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
    );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profiledata (
        profile_name PRIMARY KEY,
        spotify_links_opened INTEGER,
        artist_statistics_opened INTEGER,
        top_tracks_opened INTEGER,
        songs_searched INTEGER,
        artist_mode_opened INTEGER
    );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS game_highscores (
        profile_name TEXT NOT NULL,
        artist TEXT NOT NULL,
        artist_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (profile_name, artist_id),
        FOREIGN KEY (profile_name) REFERENCES profiledata(profile_name)
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
    console.log("Add Song to db: ", song)
    await database.runAsync(
      `INSERT OR REPLACE INTO songs 
      (id, title, artist, album, duration, image_url, album_id, album_tracks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [song.id, song.title, song.artist, song.album, song.duration, song.image, song.album_id, song.album_tracks]
    );
  };

export const addRating = async (songId, score, notes) => {
  const database = await initDatabase();
  console.log("Add Rating SongID: ", songId)
  console.log("Add Rating Score: ", score)
  console.log("Add Rating Notes: ", notes)
  try {
    await database.execAsync('BEGIN TRANSACTION');
    
    const profileName = await AsyncStorage.getItem('currentProfile');
    console.log("Profile:", profileName)
    if (!profileName) throw new Error('No profile selected');

    await database.runAsync(
      `INSERT INTO ratings (song_id, score, profile_name, notes) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(song_id, profile_name)
      DO UPDATE SET score = excluded.score, notes = excluded.notes, created_at = CURRENT_TIMESTAMP`,
      [songId, Math.round(score), profileName, notes]
    );
    
    await database.execAsync('COMMIT');
    await checkAchievements();
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
             ratings.notes,
             songs.title,
             songs.artist,
             songs.album,
             songs.image_url AS image,
             songs.album_id,
             songs.album_tracks
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
    const profileName = await AsyncStorage.getItem('currentProfile');
    try {
      const results = await database.getAllAsync(
        'SELECT score, notes FROM ratings WHERE song_id = ? AND profile_name = ?',
        [songId, profileName]
      );
      console.log("Existing", results)
      return results[0];
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
  
    // Top 10 Alben
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
      LIMIT 10
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
  
      const achievements = [];
      for (const def of ACHIEVEMENT_DEFINITIONS) {
        // Execute the checkQuery to get current count
        const result = await database.getFirstAsync(
          def.checkQuery,
          { $profile: profile }
        );
        const count = result ? Object.values(result)[0] : 0;
        const isUnlocked = unlocked.some(u => u.name === def.name);
        const progress = isUnlocked ? 100 : Math.min((count / def.threshold) * 100, 100);
  
        achievements.push({
          ...def,
          unlocked: isUnlocked,
          unlocked_at: unlocked.find(u => u.name === def.name)?.unlocked_at,
          progress: progress,
          currentCount: count,
          threshold: def.threshold
        });
      }
  
      return achievements;
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  };

  export const incrementProfileData = async (columnName) => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) throw new Error('No profile selected');
  
    // Whitelist der erlaubten Spaltennamen
    const allowedColumns = [
      'spotify_links_opened',
      'artist_statistics_opened',
      'top_tracks_opened',
      'songs_searched',
      'artist_mode_opened'
    ];
  
    if (!allowedColumns.includes(columnName)) {
      throw new Error('Invalid column name');
    }
  
    try {
      await database.execAsync('BEGIN TRANSACTION');
  
      // Versuche zu updaten
      const result = await database.runAsync(
        `UPDATE profiledata 
         SET ${columnName} = ${columnName} + 1 
         WHERE profile_name = ?`,
        [profile]
      );
  
      // Wenn kein Eintrag existiert, füge neuen ein
      if (result.changes === 0) {
        const initialValues = {
          spotify_links_opened: 0,
          artist_statistics_opened: 0,
          top_tracks_opened: 0,
          songs_searched: 0,
          artist_mode_opened: 0
        };
        initialValues[columnName] = 1;
  
        await database.runAsync(
          `INSERT INTO profiledata (
            profile_name,
            spotify_links_opened,
            artist_statistics_opened,
            top_tracks_opened,
            songs_searched,
            artist_mode_opened
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            profile,
            initialValues.spotify_links_opened,
            initialValues.artist_statistics_opened,
            initialValues.top_tracks_opened,
            initialValues.songs_searched,
            initialValues.artist_mode_opened
          ]
        );
      }
  
      await database.execAsync('COMMIT');
    } catch (error) {
      await database.execAsync('ROLLBACK');
      throw error;
    }
  };

  export const getArtistStats2 = async (sortBy = 'avgScore', sortOrder = 'desc') => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) throw new Error('No profile selected');
    // Sicherstellen, dass NULL-Werte behandelt werden
    const validSortColumns = ['artist', 'avgScore', 'songCount'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'avgScore';
  
    return await database.getAllAsync(`
      SELECT 
        artist,
        COALESCE(AVG(score), 0) as avgScore,
        COUNT(*) as songCount
      FROM ratings
      JOIN songs ON ratings.song_id = songs.id
      WHERE profile_name = $profile
      GROUP BY artist
      ORDER BY ${safeSortBy} ${sortOrder.toUpperCase()}
    `, { $profile: profile });
  };
  
  export const getAlbumStats = async (sortBy = 'avgScore', sortOrder = 'desc') => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) throw new Error('No profile selected');
    const validSortColumns = ['album', 'artist', 'avgScore', 'songCount'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'avgScore';
  
    return await database.getAllAsync(`
      SELECT 
        album,
        artist,
        COALESCE(AVG(score), 0) as avgScore,
        COUNT(*) as songCount
      FROM ratings
      JOIN songs ON ratings.song_id = songs.id
      WHERE profile_name = $profile
      GROUP BY album, artist
      ORDER BY ${safeSortBy} ${sortOrder.toUpperCase()}
    `, { $profile: profile });
  };

  export const updateGameHighscore = async (artist, score) => {
    const database = await initDatabase();
    console.log("Update Highscore Artist", artist);
    console.log("Update Highscore Score", score);
    const profileName = await AsyncStorage.getItem('currentProfile');
    if (!profileName) throw new Error('No profile selected');
    
    await database.runAsync(
      `INSERT INTO game_highscores (profile_name, artist, artist_id, score)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(profile_name, artist_id) 
       DO UPDATE SET score = MAX(score, excluded.score)`,
      [profileName, artist.name, artist.id, score]
    );
  };
  
  export const getHighscores = async () => {
    const database = await initDatabase();

    const profileName = await AsyncStorage.getItem('currentProfile');
    if (!profileName) throw new Error('No profile selected');

    return await database.getAllAsync(
      `SELECT artist, score 
       FROM game_highscores 
       WHERE profile_name = ? 
       ORDER BY score DESC`,
      [profileName]
    );
  };

  export const getHighscoreForArtist = async (artistId) => {
    const database = await initDatabase();
    
    const profileName = await AsyncStorage.getItem('currentProfile');
    if (!profileName) throw new Error('No profile selected');

    const result =  await database.getAllAsync(
      `SELECT artist_id, score 
       FROM game_highscores 
       WHERE profile_name = ? AND artist_id = ?
       ORDER BY score DESC`,
      [profileName, artistId]
    );
    console.log("Get Highscore for Artist", result)
    const toReturn = result[0]?.score || 0
    console.log("ToReturn", toReturn)
    return toReturn
  };

  export const migrateAlbumInfo = async () => {
    const database = await initDatabase();
    
    // Hole alle Songs, die noch keine Album-ID oder Trackanzahl haben
    const songs = await database.getAllAsync(
      'SELECT id, album FROM songs WHERE album_id IS NULL OR album_tracks IS NULL'
    );
    console.log("Empty album_id/album_tracks songs", songs);
    // Gruppiere Songs nach Albumnamen
    const albumsMap = {};
    songs.forEach(song => {
      const albumName = song.album;
      console.log("hi", albumName)
      if (!albumName) return; // Ignoriere leere Albumnamen
      if (song.id.startsWith("custom-")) return;
      if (!albumsMap[albumName]) albumsMap[albumName] = [];
      albumsMap[albumName].push(song.id);
    });
    console.log("Album map", albumsMap)
    // Verarbeite jedes Album
    for (const [albumName, songIds] of Object.entries(albumsMap)) {
      try {
        // Suche exaktes Album bei Spotify
        const albumData = await searchAlbums(`album:"${albumName}"`);
        
        // Validiere Ergebnis
        if (!albumData || albumData.name.toLowerCase() !== albumName.toLowerCase()) {
          console.log(`Album "${albumName}" nicht gefunden oder Name ungenau`);
          continue;
        }
  
        // Extrahiere benötigte Daten
        const albumId = albumData.id;
        const albumTracks = albumData.total_tracks;
  
        // Update Songs in der Datenbank
        await database.runAsync(
          `UPDATE songs 
           SET album_id = ?, album_tracks = ? 
           WHERE id IN (${songIds.map(() => '?').join(',')})`,
          [albumId, albumTracks, ...songIds]
        );
  
        console.log(`Aktualisiert: ${songIds.length} Songs für Album "${albumName}"`);
        
        // Rate-Limit vermeiden (Spotify: ~300 Anfragen/Minute)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Fehler bei Album "${albumName}":`, error.message);
      }
    }
  };

  export const printSongTable = async () => {
    const database = await initDatabase();
    try {
      const songs = await database.getAllAsync(`
        SELECT id, title, artist, album, album_id, album_tracks, duration 
        FROM songs
        ORDER BY artist, album, title
      `);
      
      console.log('\nSong Table Contents:');
      console.log("Songs", songs)
      console.table(songs.map(song => ({
        ID: song.id,
        Title: song.title,
        Artist: song.artist,
        Album: song.album,
        Spotify_ID: song.album_id || 'NULL',
        Tracks: song.album_tracks || 'NULL',
        Duration: `${Math.floor(song.duration/60000)}:${Math.floor((song.duration%60000)/1000).toString().padStart(2, '0')}`
      })));
    } catch (error) {
      console.error('Error printing song table:', error);
    }
  };

  export const getAlbumStatsById = async (albumId) => {
    const database = await initDatabase();
    const profile = await AsyncStorage.getItem('currentProfile');
    if (!profile) throw new Error('No profile selected');
  
    return await database.getFirstAsync(`
      SELECT 
        COALESCE(AVG(score), 0) as avgScore,
        COUNT(*) as ratedSongs
      FROM ratings
      JOIN songs ON ratings.song_id = songs.id
      WHERE profile_name = $profile
      AND songs.album_id = $albumId
    `, { 
      $profile: profile,
      $albumId: albumId 
    });
  };