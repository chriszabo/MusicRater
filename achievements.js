export const ACHIEVEMENT_DEFINITIONS = [
    {
      name: 'pioneer',
      title: 'Erster Schritt',
      description: 'Erstes Rating abgegeben',
      icon: 'rocket',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
      threshold: 1,
      color: '#555'
    },
    {
      name: 'rating_bronze',
      title: 'Bewerter-Lehrling',
      description: '25 Songs bewertet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
      threshold: 25,
      color: '#CD7F32' // Bronze
    },
    {
      name: 'rating_silver',
      title: 'Bewerter-Geselle',
      description: '100 Songs bewertet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
      threshold: 100,
      color: '#C0C0C0' // Silber
    },
    {
      name: 'rating_gold',
      title: 'Meister-Bewerter',
      description: '250 Songs bewertet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
      threshold: 250,
      color: '#FFD700' // Gold
    },
    {
      name: 'rating_diamond',
      title: 'Bewertungs-Legende',
      description: '500 Songs bewertet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile`,
      threshold: 500,
      color: '#B9F2FF'
    },
  
    // Perfekte Ratings
    {
      name: 'perfection_first',
      title: 'Erster Hit',
      description: 'Ein perfektes 10/10 Rating',
      icon: 'star',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score = 10`,
      threshold: 1,
      color: '#555'
    },
    {
      name: 'perfection_bronze',
      title: 'Bronzene Perfektion',
      description: '5 perfekte Ratings',
      icon: 'star',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score = 10`,
      threshold: 5,
      color: '#CD7F32'
    },
    {
      name: 'perfection_silver',
      title: 'Silberne Präzision',
      description: '20 perfekte Ratings',
      icon: 'star',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score = 10`,
      threshold: 20,
      color: '#C0C0C0'
    },
    {
      name: 'perfection_gold',
      title: 'Goldene Exzellenz',
      description: '50 perfekte Ratings',
      icon: 'star',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score = 10`,
      threshold: 50,
      color: '#FFD700'
    },
  
    // Interpreten-Vielfalt
    {
      name: 'explorer_bronze',
      title: 'Musik-Entdecker',
      description: '10 verschiedene Interpreten bewertet',
      icon: 'compass',
      checkQuery: `SELECT COUNT(DISTINCT artist) FROM ratings JOIN songs ON ratings.song_id = songs.id WHERE profile_name = $profile`,
      threshold: 10,
      color: '#CD7F32'
    },
    {
      name: 'explorer_silver',
      title: 'Genre-Pionier',
      description: '25 verschiedene Interpreten bewertet',
      icon: 'compass',
      checkQuery: `SELECT COUNT(DISTINCT artist) FROM ratings JOIN songs ON ratings.song_id = songs.id WHERE profile_name = $profile`,
      threshold: 25,
      color: '#C0C0C0'
    },
    {
      name: 'explorer_gold',
      title: 'Musik-Archivar',
      description: '50 verschiedene Interpreten bewertet',
      icon: 'compass',
      checkQuery: `SELECT COUNT(DISTINCT artist) FROM ratings JOIN songs ON ratings.song_id = songs.id WHERE profile_name = $profile`,
      threshold: 50,
      color: '#FFD700'
    },
    {
      name: 'explorer_diamond',
      title: 'Interpreten-Gott',
      description: '75 verschiedene Interpreten bewertet',
      icon: 'compass',
      checkQuery: `SELECT COUNT(DISTINCT artist) FROM ratings JOIN songs ON ratings.song_id = songs.id WHERE profile_name = $profile`,
      threshold: 75,
      color: '#B9F2FF'
    },
  
    // Schlechte Songs
    {
      name: 'disappointment_first',
      title: 'Erste Enttäuschung',
      description: 'Einen Song mit 2 oder weniger Punkten bewertet',
      icon: 'sad',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score <= 2`,
      threshold: 1,
      color: '#555'
    },
    {
      name: 'disappointment_bronze',
      title: 'Bronze der Enttäuschung',
      description: '5 Songs mit niedrigen Ratings bewertet',
      icon: 'trash-bin',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score <= 2`,
      threshold: 5,
      color: '#CD7F32'
    },
    {
      name: 'disappointment_silver',
      title: 'Silberner Frust',
      description: '10 Songs mit niedrigen Ratings bewertet',
      icon: 'trash-bin',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score <= 2`,
      threshold: 10,
      color: '#C0C0C0'
    },
    {
      name: 'disappointment_gold',
      title: 'Goldener Hass',
      description: '20 Songs mit niedrigen Ratings bewertet',
      icon: 'trash-bin',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND score <= 2`,
      threshold: 20,
      color: '#FFD700'
    },
    // Custom-Songs
    {
      name: 'custom_pioneer',
      title: 'Custom-Pionier',
      description: 'Erstes Custom-Song-Rating abgegeben',
      icon: 'create',
      checkQuery: `SELECT COUNT(*) FROM ratings WHERE profile_name = $profile AND song_id LIKE 'custom-%'`,
      threshold: 1,
      color: '#555'
    },
    {
      name: 'custom_creator_bronze',
      title: 'Bronze-Creator',
      description: '5 Custom-Songs erstellt & bewertet',
      icon: 'brush',
      checkQuery: `SELECT COUNT(DISTINCT song_id) FROM ratings WHERE profile_name = $profile AND song_id LIKE 'custom-%'`,
      threshold: 5,
      color: '#CD7F32'
    },
    {
      name: 'custom_creator_silver',
      title: 'Silber-Creator',
      description: '10 Custom-Songs erstellt & bewertet',
      icon: 'brush',
      checkQuery: `SELECT COUNT(DISTINCT song_id) FROM ratings WHERE profile_name = $profile AND song_id LIKE 'custom-%'`,
      threshold: 10,
      color: '#C0C0C0'
    },
    {
      name: 'custom_creator_gold',
      title: 'Gold-Creator',
      description: '20 Custom-Songs erstellt & bewertet',
      icon: 'brush',
      checkQuery: `SELECT COUNT(DISTINCT song_id) FROM ratings WHERE profile_name = $profile AND song_id LIKE 'custom-%'`,
      threshold: 20,
      color: '#FFD700'
    },
    // Tage
    {
      name: 'daily_rater_7_bronze',
      title: 'Wochen-Routine',
      description: 'An 7 unterschiedlichen Tagen bewertet',
      icon: 'calendar',
      checkQuery: `SELECT COUNT(DISTINCT DATE(created_at)) FROM ratings WHERE profile_name = $profile`,
      threshold: 7,
      color: '#CD7F32' // Bronze
    },
    {
      name: 'daily_rater_30_silver',
      title: 'Monatliche Praxis',
      description: 'An 30 unterschiedlichen Tagen bewertet',
      icon: 'calendar',
      checkQuery: `SELECT COUNT(DISTINCT DATE(created_at)) FROM ratings WHERE profile_name = $profile`,
      threshold: 30,
      color: '#C0C0C0' // Silber
    },
    {
      name: 'daily_rater_100_gold',
      title: 'Bewertungs-Hunni',
      description: 'An 100 unterschiedlichen Tagen bewertet',
      icon: 'calendar',
      checkQuery: `SELECT COUNT(DISTINCT DATE(created_at)) FROM ratings WHERE profile_name = $profile`,
      threshold: 100,
      color: '#FFD700' // Gold
    },
    {
      name: 'daily_rater_365_diamond',
      title: 'Jahres-Challenge',
      description: 'An 365 unterschiedlichen Tagen bewertet',
      icon: 'calendar',
      checkQuery: `SELECT COUNT(DISTINCT DATE(created_at)) FROM ratings WHERE profile_name = $profile`,
      threshold: 365,
      color: '#B9F2FF' // Diamant
    },
  
    // Special
    {
      name: 'bronze_collector',
      title: 'Bronze-Sammler',
      description: 'Alle Bronze-Achievements freigeschaltet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM achievements WHERE profile_name = $profile AND name LIKE '%_bronze'`,
      threshold: 9, // Anzahl aller Bronze-Achievements im System
      color: '#8A2BE2' // Bronze
    },
    {
      name: 'silver_collector',
      title: 'Silber-Sammler',
      description: 'Alle Silber-Achievements freigeschaltet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM achievements WHERE profile_name = $profile AND name LIKE '%_silver'`,
      threshold: 9, // Anzahl aller Silber-Achievements im System
      color: '#8A2BE2'
    },
    {
      name: 'gold_collector',
      title: 'Gold-Sammler',
      description: 'Alle Gold-Achievements freigeschaltet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM achievements WHERE profile_name = $profile AND name LIKE '%_gold'`,
      threshold: 9, // Anzahl der Gold-Achievements
      color: '#8A2BE2'
    },
    {
      name: 'diamond_collector',
      title: 'Diamant-Sammler',
      description: 'Alle Diamant-Achievements freigeschaltet',
      icon: 'medal',
      checkQuery: `SELECT COUNT(*) FROM achievements WHERE profile_name = $profile AND name LIKE '%_diamond'`,
      threshold: 3, // Anzahl der Gold-Achievements
      color: '#8A2BE2'
    },
    // Spotify-Link Achievements
  {
    name: 'spotify_link',
    title: 'Spotify-Profi',
    description: '25 Spotify-Links geöffnet',
    icon: 'link',
    checkQuery: `SELECT spotify_links_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 25,
    color: '#555'
  },

  // Artist Stats Achievements
  {
    name: 'artist_stats_bronze',
    title: 'Statistik-Neugier',
    description: '5x einen Interpreten im Statistikscreen gesucht',
    icon: 'stats-chart',
    checkQuery: `SELECT artist_statistics_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 5,
    color: '#CD7F32'
  },
  {
    name: 'artist_stats_silver',
    title: 'Analytiker',
    description: '20x einen Interpreten im Statistikscreen gesucht',
    icon: 'stats-chart',
    checkQuery: `SELECT artist_statistics_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 20,
    color: '#C0C0C0'
  },
  {
    name: 'artist_stats_gold',
    title: 'Detektiv',
    description: '50x einen Interpreten im Statistikscreen gesucht',
    icon: 'stats-chart',
    checkQuery: `SELECT artist_statistics_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 50,
    color: '#FFD700'
  },

  // Top Tracks Achievements
  {
    name: 'top_tracks_bronze',
    title: 'Hit-Listener',
    description: '5x Top-Tracks Modus genutzt',
    icon: 'musical-notes',
    checkQuery: `SELECT top_tracks_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 5,
    color: '#CD7F32'
  },
  {
    name: 'top_tracks_silver',
    title: 'Charts-Junkie',
    description: '15x Top-Tracks Modus genutzt',
    icon: 'musical-notes',
    checkQuery: `SELECT top_tracks_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 15,
    color: '#C0C0C0'
  },
  {
    name: 'top_tracks_gold',
    title: 'Hit-Archivar',
    description: '30x Top-Tracks Modus genutzt',
    icon: 'musical-notes',
    checkQuery: `SELECT top_tracks_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 30,
    color: '#FFD700'
  },

  // Such-Achievements
  {
    name: 'search',
    title: 'Suchmaschine',
    description: '50x nach bestimmten Songs gesucht',
    icon: 'search',
    checkQuery: `SELECT songs_searched FROM profiledata WHERE profile_name = $profile`,
    threshold: 50,
    color: '#555'
  },

  // Künstler-Modus Achievements
  {
    name: 'artist_mode_bronze',
    title: 'Modus-Entdecker',
    description: '10x Interpretensuche genutzt',
    icon: 'person',
    checkQuery: `SELECT artist_mode_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 5,
    color: '#CD7F32'
  },
  {
    name: 'artist_mode_silver',
    title: 'Künstler-Fan',
    description: '50x Interpretensuche genutzt',
    icon: 'person',
    checkQuery: `SELECT artist_mode_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 15,
    color: '#C0C0C0'
  },
  {
    name: 'artist_mode_gold',
    title: 'Künstler-Purist',
    description: '100x Interpretensuche genutzt',
    icon: 'person',
    checkQuery: `SELECT artist_mode_opened FROM profiledata WHERE profile_name = $profile`,
    threshold: 30,
    color: '#FFD700'
  },
  ];