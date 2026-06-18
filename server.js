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

// In-memory store: mapping from tag -> stats object
let store = {};

function defaultStats() {
  return {
    trophies: { current: 0, max: 0 },
    elo: { current: 0, max: 0 },
    videos: 0,
    fame: 0,
    created: new Date().getFullYear(),
    soloWins: 0,
    trioWins: 0,
    lastUpdate: new Date().toISOString(),
  };
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      store = JSON.parse(raw) || {};
      console.log('Loaded store from', DATA_FILE);
    }
  } catch (err) {
    console.error('Failed to load store, starting empty:', err);
    store = {};
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

loadStore();

// GET /stats?tag=TAG -> returns stats for tag
// If tag is missing, return availableTags
// If tag exists, return it
// If tag does not exist, create default stats (so user sees something) and return them
app.get('/stats', (req, res) => {
  const tag = (req.query.tag || '').toString().trim();
  if (!tag) {
    return res.json({ availableTags: Object.keys(store) });
  }

  if (!store[tag]) {
    // auto-create default stats for better UX
    store[tag] = defaultStats();
    saveStore();
    console.log(`Auto-created default stats for tag: ${tag}`);
  }

  res.json(store[tag]);
});

// POST /update-stats
// Accepts JSON body with a required `tag` field and stats fields
app.post('/update-stats', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'JSON body expected' });
  const tag = (body.tag || '').toString().trim();
  if (!tag) return res.status(400).json({ error: 'Field "tag" is required in body' });

  // Prepare stats object (remove tag from stored fields)
  const newStats = { ...body };
  delete newStats.tag;
  newStats.lastUpdate = new Date().toISOString();

  // Merge with existing
  store[tag] = { ...(store[tag] || {}), ...newStats };
  saveStore();
  res.json({ ok: true, tag, stats: store[tag] });
});

// POST /create-test-tag
// Body: { tag: 'yourTag' }
// Creates a sample stats object for quicker testing from the UI
app.post('/create-test-tag', (req, res) => {
  const body = req.body || {};
  const tag = (body.tag || '').toString().trim();
  if (!tag) return res.status(400).json({ error: 'Field "tag" is required' });

  const sample = {
    trophies: { current: 6000, max: 6500 },
    elo: { current: 2900, max: 3300 },
    videos: 45,
    fame: 1300,
    created: 2023,
    soloWins: 330,
    trioWins: 600,
    lastUpdate: new Date().toISOString(),
  };

  store[tag] = sample;
  saveStore();
  res.json({ ok: true, tag, stats: sample });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
