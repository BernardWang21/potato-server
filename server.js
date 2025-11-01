// server.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { createClient } from "@libsql/client"; // Turso client
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// --- Setup Turso Cloud SQLite connection ---
// 1️⃣ Sign up free at https://turso.tech
// 2️⃣ Create a DB and get connection URL + auth token
// 3️⃣ Add them to your Render environment vars
const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

// --- Express setup ---
app.use(express.json());
app.use(cookieParser());

// Static frontend
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

// --- Database initialization ---
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      channel TEXT,
      text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default channels
  const channels = ["welcome", "announcements", "chat"];
  for (const c of channels) {
    await db.execute("INSERT OR IGNORE INTO channels (name) VALUES (?)", [c]);
  }
}
initDB();

// --- Helper: Verify JWT ---
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

// --- Routes ---

// 🧩 Sign up
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ error: "Username and password required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hash,
    ]);
    res.json({ success: true });
  } catch {
    res.json({ error: "Username already exists" });
  }
});

// 🔐 Log in
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await db.execute("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  const user = result.rows[0];
  if (!user) return res.json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ error: "Invalid password" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// 💬 Get all messages
app.get("/messages", verifyToken, async (req, res) => {
  const msgs = await db.execute(
    "SELECT username, channel, text, created_at FROM messages ORDER BY id ASC"
  );
  res.json(msgs.rows);
});

// ✉️ Post a new message
app.post("/message", verifyToken, async (req, res) => {
  const { text } = req.body;
  const user = req.user.username;
  await db.execute("INSERT INTO messages (username, channel, text) VALUES (?, ?, ?)", [
    user,
    "chat",
    text,
  ]);
  res.json({ success: true });
});

// 📢 Get all channels
app.get("/channels", verifyToken, async (req, res) => {
  const result = await db.execute("SELECT * FROM channels");
  res.json(result.rows);
});

// 🧠 Add new channel (admin only)
app.post("/channels/add", verifyToken, async (req, res) => {
  if (req.user.username !== "very-fried-potato")
    return res.status(403).json({ error: "Not allowed" });

  const { name } = req.body;
  if (!name) return res.json({ error: "Channel name required" });
  await db.execute("INSERT OR IGNORE INTO channels (name) VALUES (?)", [name]);
  res.json({ success: true });
});

// ❌ Remove channel (admin only)
app.post("/channels/remove", verifyToken, async (req, res) => {
  if (req.user.username !== "very-fried-potato")
    return res.status(403).json({ error: "Not allowed" });

  const { name } = req.body;
  await db.execute("DELETE FROM channels WHERE name = ?", [name]);
  res.json({ success: true });
});

// 🚪 Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
