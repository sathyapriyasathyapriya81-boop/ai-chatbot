import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => uuidv4());
  const bottomRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/chat`, {
        message: text,
        session_id: sessionId,
      });
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.response },
      ]);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `⚠️ ${msg}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>🤖 AI Chatbot</h1>
        <span className="session-badge">Session: {sessionId.slice(0, 8)}</span>
      </header>

      <main className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>👋 Hello! Ask me anything.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role} ${msg.isError ? "error" : ""}`}
          >
            <span className="avatar">{msg.role === "user" ? "🧑" : "🤖"}</span>
            <div className="bubble">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="message bot">
            <span className="avatar">🤖</span>
            <div className="bubble loading">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {error && <p className="error-bar">{error}</p>}

      <footer className="chat-input-area">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? "…" : "Send"}
        </button>
      </footer>
    </div>
  );
}

export default App;
