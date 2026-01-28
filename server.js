'use strict';

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const healthz = require('./routes/healthz');
const pastes = require('./routes/pastes');
const view = require('./routes/view');

app.get('/api/healthz', healthz.get);
app.post('/api/pastes', pastes.create);
app.get('/api/pastes/:id', pastes.get);
app.get('/p/:id', view.get);

const publicDir = path.join(__dirname, 'public');
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(publicDir, 'app.js')));
app.use(express.static(publicDir));

const port = Number(process.env.PORT) || 3000;
const maxPort = port + 10;

function tryListen(p) {
  const server = app.listen(p, () => console.log(`Listening on port ${p}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && p < maxPort) {
      tryListen(p + 1);
    } else {
      throw err;
    }
  });
}

if (require.main === module) {
  tryListen(port);
}

module.exports = app;
