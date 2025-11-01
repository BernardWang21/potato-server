import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { createClient } from "@libsql/client";
import Database from "better-sqlite3";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

let db;
let isTurso = false;

// 🧱 Initialize database
async function initDatabase() {
  try {
    if (process.env.TURSO_URL && process.env.TURSO_TOKEN) {
      console.log("🔗 Connecting to Turso...");
      db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_TOKEN,
      });
      await db.execute("SELECT 1;");
      isTurso = true;
      console.log("✅ Connected to Turso cloud database!");
    } else {
      throw new Error("Turso not configured");
    }
  } catch (err) {
    console.log("⚠️ Turso unavailable, using local SQLite...");
    db = new Database("./fallback.sqlite");

    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER,
        username TEXT,
        content TEXT,
        created_at TEXT
      )
    `).run();

    // Default channels if none exist
    const count = db.prepare("SELECT COUNT(*) AS c FROM channels").get().c;
    if (count === 0) {
      ["welcome", "announcements", "chatting"].forEach((name) =>
        db.prepare("INSERT INTO channels (name) VALUES (?)").run(name)
      );
    }

    console.log("✅ Local SQLite database ready.");
  }
}
await initDatabase();

// 🔑 Auth middleware
function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not logged in" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
}

// 🧍 Sign up
app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing username or password" });

  try {
    const hashed = await bcrypt.hash(password, 10);

    if (isTurso) {
      await db.execute({
        sql: "INSERT INTO users (username, password) VALUES (?, ?)",
        args: [username, hashed],
      });
    } else {
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
        username,
        hashed
      );
    }

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Username already exists or DB error" });
  }
});

// 🔐 Log in
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing username or password" });

  let user;
  if (isTurso) {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username],
    });
    user = result.rows?.[0];
  } else {
    user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true });
  res.json({ message: "Login successful" });
});

// 💬 Get messages for a channel
app.get("/api/messages/:channel", auth, async (req, res) => {
  const channel = req.params.channel;
  try {
    let rows;
    if (isTurso) {
      const result = await db.execute({
        sql: `
          SELECT * FROM messages
          WHERE channel_id = (SELECT id FROM channels WHERE name = ?)
          ORDER BY created_at ASC
        `,
        args: [channel],
      });
      rows = result.rows || [];
    } else {
      rows = db
        .prepare(
          `
        SELECT * FROM messages
        WHERE channel_id = (SELECT id FROM channels WHERE name = ?)
        ORDER BY created_at ASC
      `
        )
        .all(channel);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages", error: err });
  }
});

// 📨 Post message
app.post("/api/messages/:channel", auth, async (req, res) => {
  const { content } = req.body;
  const channel = req.params.channel;
  const username = req.user.username;
  const createdAt = new Date().toISOString();

  if (!content)
    return res.status(400).json({ message: "Message content required" });

  try {
    if (isTurso) {
      await db.execute({
        sql: `
          INSERT INTO messages (channel_id, username, content, created_at)
          VALUES ((SELECT id FROM channels WHERE name = ?), ?, ?, ?)
        `,
        args: [channel, username, content, createdAt],
      });
    } else {
      db.prepare(
        `
        INSERT INTO messages (channel_id, username, content, created_at)
        VALUES ((SELECT id FROM channels WHERE name = ?), ?, ?, ?)
      `
      ).run(channel, username, content, createdAt);
    }

    res.json({ message: "Sent!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err });
  }
});

// 🏠 Serve main page
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// 🚀 Start
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
