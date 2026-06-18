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
app.get('/stats', (req, res) => {
  const tag = (req.query.tag || '').trim();
  if (!tag) {
    // Return list of available tags (for convenience)
    return res.json({ availableTags: Object.keys(store) });
  }

  const stats = store[tag];
  if (!stats) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  res.json(stats);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
