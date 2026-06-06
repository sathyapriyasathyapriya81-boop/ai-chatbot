# 🤖 AI Chatbot — Production Deployment

A full-stack AI chatbot built with **React**, **Node.js/Express**, **PostgreSQL**, deployed on **Vercel** (frontend) and **Railway** (backend + database).

---

## Architecture

```
User Browser
     │
     ▼
┌─────────────┐        HTTPS         ┌──────────────────────┐
│   Vercel    │ ──────────────────►  │   Railway (Express)  │
│  (React)    │                      │   /api/chat          │
└─────────────┘                      │   /api/history/:id   │
                                     │   /api/session       │
                                     │   /health            │
                                     └──────────┬───────────┘
                                                │
                                     ┌──────────▼───────────┐
                                     │  Railway PostgreSQL   │
                                     │  chat_history table  │
                                     └──────────────────────┘
                                                │
                                     ┌──────────▼───────────┐
                                     │   OpenAI API         │
                                     │   gpt-3.5-turbo      │
                                     └──────────────────────┘
```

---

## Git Workflow

```
main              ◄── production releases only
  └── development ◄── integration branch
        └── feature/chat-history   (feature work)
        └── feature/xyz            (other features)
```

1. Branch off `development` → `feature/<name>`
2. Commit with meaningful messages (e.g. `feat: add chat history endpoint`)
3. Open Pull Request into `development`
4. After testing, merge `development` → `main`

---

## Project Structure

```
ai-chatbot/
├── backend/
│   ├── server.js          # Express app + all API routes
│   ├── schema.sql         # PostgreSQL DDL
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── .env.example
├── .github/
│   └── workflows/ci.yml   # GitHub Actions pipeline
├── .gitignore
└── README.md
```

---

## Database Setup

### Railway PostgreSQL

1. Go to [railway.app](https://railway.app) → New Project → Add PostgreSQL
2. Copy the `DATABASE_URL` from the **Variables** tab
3. Run the schema (once):

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

### Schema

```sql
CREATE TABLE chat_history (
  id           SERIAL PRIMARY KEY,
  session_id   VARCHAR(255)  NOT NULL,
  user_message TEXT          NOT NULL,
  bot_response TEXT          NOT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check → `{ "status": "running" }` |
| `POST` | `/api/chat` | Send message, get AI reply, persist to DB |
| `GET` | `/api/history/:session_id` | Retrieve chat history for a session |
| `POST` | `/api/session` | Generate a new session UUID |

### POST /api/chat

**Request**
```json
{ "message": "Hello!", "session_id": "optional-uuid" }
```

**Response**
```json
{ "response": "Hi there! How can I help?", "session_id": "uuid" }
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `FRONTEND_URL` | Vercel frontend URL (for CORS) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Railway backend URL |

---

## Deployment Steps

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
cd backend
railway link

# Set environment variables in Railway dashboard, then deploy
railway up
```

### Frontend → Vercel

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend
vercel

# Set REACT_APP_API_URL in Vercel → Project Settings → Environment Variables
# Redeploy for changes to take effect
vercel --prod
```

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/ai-chatbot.git
cd ai-chatbot

# 2. Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # starts on :5000

# 3. Frontend (new terminal)
cd ../frontend
cp .env.example .env   # set REACT_APP_API_URL=http://localhost:5000
npm install
npm start              # opens http://localhost:3000
```

---

## Error Handling

- All API routes wrapped in `try/catch`; errors return JSON with an `error` key
- Frontend displays a user-friendly error message and an error-styled chat bubble
- DB and OpenAI errors are logged server-side without leaking secrets to the client

---

## Production Checklist

- [ ] `.env` files are **not** committed (covered by `.gitignore`)
- [ ] `.env.example` files committed with placeholder values
- [ ] `FRONTEND_URL` set in Railway to prevent open CORS
- [ ] `DATABASE_URL` uses SSL in production (`rejectUnauthorized: false` for Railway)
- [ ] GitHub Actions secrets configured: `DATABASE_URL`, `OPENAI_API_KEY`, `RAILWAY_TOKEN`
 
