require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const Groq = require("groq-sdk");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatbot_db",
  waitForConnections: true,
  connectionLimit: 10,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database initialised");
  } catch (err) {
    console.error("❌ DB init error:", err.message);
  }
}

app.get("/health", (_req, res) => res.json({ status: "running" }));

app.post("/api/chat", async (req, res) => {
  const { message, session_id } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  const sid = session_id || uuidv4();
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
    });
    const botResponse = completion.choices[0].message.content;
    await pool.query(
      "INSERT INTO chat_history (session_id, user_message, bot_response) VALUES (?, ?, ?)",
      [sid, message, botResponse]
    );
    res.json({ response: botResponse, session_id: sid });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Failed to process message." });
  }
});

app.get("/api/history/:session_id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC",
      [req.params.session_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve history." });
  }
});

app.post("/api/session", (_req, res) => res.json({ session_id: uuidv4() }));

initDB().then(() =>
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
);