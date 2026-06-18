# static-account

This repository contains a minimal Node.js/Express server and a static frontend to display per-tag account statistics.

Quickstart (local):

1. Install dependencies

   npm install

2. Start server

   npm start

3. Open http://localhost:3000/ in your browser. Enter a tag (e.g. `sampleTag123`) and click "Показать".

Create/update stats for a tag (example):

curl -X POST http://localhost:3000/update-stats \
  -H "Content-Type: application/json" \
  -d '{"tag":"sampleTag123","trophies":{"current":6000,"max":6500},"elo":{"current":2900,"max":3300},"videos":45,"fame":1300,"created":2023,"soloWins":330,"trioWins":600}'

Create a sample test tag from the UI: enter your tag and click "Создать тест".

Deploy:
- You can deploy this app to Render/Railway/Heroku. The start command is `npm start` and the server listens on `process.env.PORT`.
