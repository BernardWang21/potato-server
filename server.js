import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { createClient } from "@libsql/client";
import sqlite3 from "sqlite3";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

let db; // Can be Turso client or local SQLite

// 🧱 Initialize database (Turso + fallback)
async function initDatabase() {
  try {
    console.log("🔗 Connecting to Turso...");
    db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN,
    });

    // test the connection
    await db.execute("SELECT 1;");
    console.log("✅ Connected to Turso cloud database!");
  } catch (err) {
    console.error("⚠️ Turso connection failed:", err.message);
    console.log("🗄️ Falling back to local SQLite database...");

  db = new sqlite3.Database("./fallback.sqlite", (err) => {
    if (err) console.error("❌ Failed to open local SQLite:", err.message);
  });


    // create tables if not exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER,
        username TEXT,
        content TEXT,
        created_at TEXT
      );
    `);
    console.log("✅ Local SQLite database ready.");
  }
}

await initDatabase();

// 🔑 Middleware for authentication
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

// 🧍 Signup
app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  try {
    if (db.execute) {
      await db.execute({
        sql: "INSERT INTO users (username, password) VALUES (?, ?)",
        args: [username, hashed],
      });
    } else {
      await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
        username,
        hashed,
      ]);
    }
    res.json({ message: "Signup successful" });
  } catch {
    res.status(400).json({ message: "Username already exists" });
  }
});

// 🔐 Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing fields" });

  let user;

  if (db.execute) {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username],
    });
    user = result.rows?.[0];
  } else {
    user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
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
    if (db.execute) {
      const result = await db.execute({
        sql: `
          SELECT * FROM messages
          WHERE channel_id = (SELECT id FROM channels WHERE name = ?)
          ORDER BY created_at ASC
        `,
        args: [channel],
      });
      res.json(result.rows || []);
    } else {
      const messages = await db.all(
        `
        SELECT * FROM messages
        WHERE channel_id = (SELECT id FROM channels WHERE name = ?)
        ORDER BY created_at ASC
      `,
        [channel]
      );
      res.json(messages);
    }
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

  if (!content) return res.status(400).json({ message: "Empty message" });

  try {
    if (db.execute) {
      await db.execute({
        sql: `
          INSERT INTO messages (channel_id, username, content, created_at)
          VALUES ((SELECT id FROM channels WHERE name = ?), ?, ?, ?)
        `,
        args: [channel, username, content, createdAt],
      });
    } else {
      await db.run(
        `
        INSERT INTO messages (channel_id, username, content, created_at)
        VALUES ((SELECT id FROM channels WHERE name = ?), ?, ?, ?)
      `,
        [channel, username, content, createdAt]
      );
    }

    res.json({ message: "Sent!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send", error: err });
  }
});

// 🏠 Root route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// 🚀 Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
