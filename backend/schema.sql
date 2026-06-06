-- ============================================================
--  AI Chatbot  –  PostgreSQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_history (
  id           SERIAL PRIMARY KEY,
  session_id   VARCHAR(255)        NOT NULL,
  user_message TEXT                NOT NULL,
  bot_response TEXT                NOT NULL,
  created_at   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_session
  ON chat_history (session_id);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_chat_history_created
  ON chat_history (created_at DESC);
