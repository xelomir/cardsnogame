const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// User stats storage
const userStatsFile = path.join(__dirname, 'user-stats.json');

// Initialize user stats storage
let userStats = {};
try {
  if (fs.existsSync(userStatsFile)) {
    userStats = JSON.parse(fs.readFileSync(userStatsFile, 'utf8'));
  }
} catch (error) {
  console.error('Error loading user stats:', error);
}

// Save user stats periodically
function saveUserStats() {
  try {
    fs.writeFileSync(userStatsFile, JSON.stringify(userStats, null, 2));
    console.log('User stats saved to disk');
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'card-battle-game/dist')));

// API endpoint to save game statistics
app.post('/api/save-stats', (req, res) => {
  const userId = req.query.user_id || 'default';
  const stats = req.body;

  userStats[userId] = {
    ...stats,
    lastPlayed: new Date().toISOString()
  };

  // Save stats to file
  saveUserStats();

  res.json({ success: true });
});

// API endpoint to get user statistics
app.get('/api/get-stats', (req, res) => {
  const userId = req.query.user_id || 'default';

  if (userStats[userId]) {
    res.json(userStats[userId]);
  } else {
    // Return default stats if user does not exist
    const defaultStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalDamageDealt: 0,
      totalCardsPlayed: 0,
      totalTurns: 0,
      lastPlayed: new Date().toISOString(),
      favoriteCards: {}
    };

    userStats[userId] = defaultStats;
    res.json(defaultStats);
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'card-battle-game/dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Save stats on exit
process.on('SIGINT', () => {
  console.log('Saving user stats before exit...');
  saveUserStats();
  process.exit();
});
