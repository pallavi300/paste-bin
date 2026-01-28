"use strict";

const path = require("path");
const fs = require("fs");
const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envLocalPath = path.join(cwd, ".env.local");

if (fs.existsSync(envPath)) {
  console.log("Loading .env from", envPath);
} else {
  console.warn(".env not found at", envPath);
}
require("dotenv").config({ path: envPath });
if (fs.existsSync(envLocalPath)) {
  require("dotenv").config({ path: envLocalPath });
}

const express = require("express");

const app = express();
app.use(express.json());

const healthz = require("./routes/healthz");
const pastes = require("./routes/pastes");
const view = require("./routes/view");

app.get("/api/healthz", healthz.get);
app.post("/api/pastes", pastes.create);
app.get("/api/pastes/:id", pastes.get);
app.get("/p/:id", view.get);

const publicDir = path.join(__dirname, "public");
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("/app.js", (req, res) => res.sendFile(path.join(publicDir, "app.js")));
app.use(express.static(publicDir));

const port = Number(process.env.PORT) || 3000;
const maxPort = port + 10;

function tryListen(p) {
  const server = app.listen(p, () => console.log(`Listening on port ${p}`));
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && p < maxPort) {
      tryListen(p + 1);
    } else {
      throw err;
    }
  });
}

if (require.main === module) {
  (async () => {
    const { ping, redisStatus } = require("./lib/kv");
    const { urlSet, tokenSet } = redisStatus();
    console.log("Redis URL:", urlSet ? "set" : "NOT SET");
    console.log("Redis token:", tokenSet ? "set" : "NOT SET");
    if (!urlSet || !tokenSet) {
      console.error(
        "  → Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env (no quotes)."
      );
    }
    try {
      await ping();
      console.log("Redis: OK");
    } catch (e) {
      console.error("Redis: FAIL –", e?.message || e);
    }
    tryListen(port);
  })();
}

module.exports = app;
