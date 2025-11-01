const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Database = require("better-sqlite3");
const { v4: uuid } = require("uuid");
const path = require("path");

const app = express();
const db = new Database("data.sqlite");
const PORT = process.env.PORT || 3000;
const SECRET = "supersecret"; // change in production
const ADMIN = "very-fried-potato";

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// --- DB Setup ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  hash TEXT
);
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  channel TEXT,
  user TEXT,
  content TEXT,
  created INTEGER
);
`);
const defaultChannels = ["welcome", "announcements", "chatting"];
const exists = db.prepare("SELECT 1 FROM channels WHERE name=?").get(defaultChannels[0]);
if (!exists) {
  const insert = db.prepare("INSERT INTO channels VALUES (?, ?)");
  for (const name of defaultChannels) insert.run(uuid(), name);
}

// --- Middleware ---
function auth(req, res, next) {
  const token = req.cookies?.token;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}
app.use(auth);

// --- Auth Routes ---
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users VALUES (?,?,?)").run(uuid(), username, hash);
    const token = jwt.sign({ username }, SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ username });
  } catch {
    res.status(400).json({ error: "username taken" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.hash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const token = jwt.sign({ username }, SECRET);
  res.cookie("token", token, { httpOnly: true });
  res.json({ username });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

// --- API Routes ---
app.get("/channels", (req, res) => {
  res.json(db.prepare("SELECT * FROM channels").all());
});

app.post("/channels", (req, res) => {
  if (req.user?.username !== ADMIN) return res.status(403).end();
  const { name } = req.body;
  const id = uuid();
  db.prepare("INSERT INTO channels VALUES (?,?)").run(id, name);
  res.json({ id, name });
});

app.delete("/channels/:id", (req, res) => {
  if (req.user?.username !== ADMIN) return res.status(403).end();
  db.prepare("DELETE FROM channels WHERE id=?").run(req.params.id);
  db.prepare("DELETE FROM messages WHERE channel=?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/messages", (req, res) => {
  const channel = req.query.channel;
  const msgs = db
    .prepare("SELECT * FROM messages WHERE channel=? ORDER BY created ASC")
    .all(channel);
  res.json(msgs);
});

app.post("/messages", (req, res) => {
  if (!req.user) return res.status(401).end();
  const { channel, content } = req.body;
  db.prepare("INSERT INTO messages VALUES (?,?,?,?,?)").run(
    uuid(),
    channel,
    req.user.username,
    content,
    Date.now()
  );
  res.json({ ok: true });
});

app.get("/members", (req, res) => {
  res.json(db.prepare("SELECT username FROM users").all());
});

app.delete("/members/:name", (req, res) => {
  if (req.user?.username !== ADMIN) return res.status(403).end();
  db.prepare("DELETE FROM users WHERE username=?").run(req.params.name);
  db.prepare("DELETE FROM messages WHERE user=?").run(req.params.name);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`✅ Chat running at http://localhost:${PORT}`));
