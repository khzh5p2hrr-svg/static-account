const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
// Allow cross-origin requests so the game (or another origin) can POST updates
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static files (index.html, CSS, client JS)
app.use(express.static(path.join(__dirname)));

// Load stats from disk (if present)
let stats = {
  trophies: { current: 5420, max: 6150 },
  elo: { current: 2850, max: 3200 },
  videos: 42,
  fame: 1250,
  created: 2023,
  soloWins: 324,
  trioWins: 587,
  lastUpdate: new Date().toISOString(),
};

function loadStats() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      stats = JSON.parse(raw);
      console.log('Loaded stats from', DATA_FILE);
    }
  } catch (err) {
    console.error('Failed to load stats, using defaults:', err);
  }
}

function saveStats() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Failed to save stats:', err);
  }
}

loadStats();

// Endpoint for the client (web page) to read stats
app.get('/stats', (req, res) => {
  res.json(stats);
});

// Endpoint for the game to POST current stats
// The game should POST JSON like:
// {
//   "trophies": { "current": 6000, "max": 6500 },
//   "elo": { "current": 2900, "max": 3300 },
//   "videos": 45,
//   "fame": 1300,
//   "created": 2023,
//   "soloWins": 330,
//   "trioWins": 600
// }
app.post('/update-stats', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'JSON body expected' });

  // Merge incoming fields into stats
  stats = { ...stats, ...body, lastUpdate: new Date().toISOString() };
  saveStats();
  res.json({ ok: true, stats });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
