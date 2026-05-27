# Life OS — Backend

Serverless backend for the Life OS app, deployed on Vercel.  
Connects to Supabase (Postgres) and OpenAI for AI-powered task generation.

---

## Project Structure

```
/api/
  user.js              GET /api/user, PATCH /api/user
  domains.js           GET /api/domains, POST /api/domains, PATCH /api/domains/:id
  pathways.js          GET /api/pathways
  tasks/
    today.js           GET /api/tasks/today
    complete.js        POST /api/tasks/complete

/lib/
  supabaseClient.js    Supabase singleton
  openaiClient.js      OpenAI singleton
  taskEngine.js        AI task generation + DB persistence
  scoring.js           Domain scoring algorithm

/utils/
  cors.js              CORS headers for frontend origin
```

---

## Setup

### 1. Supabase

1. Create a Supabase project at https://supabase.com
2. In the **SQL Editor**, run `schema.sql` to create tables and seed data
3. Copy your **Project URL** and **anon key**

### 2. OpenAI

1. Create an API key at https://platform.openai.com/api-keys

### 3. Environment Variables

Create `.env.local` for local dev:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

For Vercel deployment, add these in **Project Settings → Environment Variables**.

---

## Local Development

```bash
npm install
npx vercel dev
```

API will be available at `http://localhost:3000/api/...`

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Or connect the repo to Vercel via the dashboard for automatic deploys.

---

## API Reference

### GET /api/user
Returns current user profile.

```json
{
  "id": 1,
  "name": "Haifa",
  "xp": 120,
  "streak": 5,
  "timeAvailability": "10min",
  "lastActiveDate": "2026-05-27"
}
```

### PATCH /api/user
Update user preferences.
```json
{ "timeAvailability": "15min" }
```

### GET /api/domains
Returns all domains for the user.

### POST /api/domains
Create a custom domain.
```json
{ "name": "Public Speaking", "icon": "🎤" }
```

### PATCH /api/domains/:id
Update domain priority or stage.
```json
{ "priority": "high", "stage": "skill" }
```

### GET /api/tasks/today
Returns today's AI-generated task (cached if already generated today).

```json
{
  "id": 42,
  "type": "general",
  "domain": "Fitness",
  "title": "Do 10 push-ups before breakfast",
  "why": "Builds morning momentum and upper body strength.",
  "how": ["Get into push-up position", "Do 10 reps with good form", "Log it done"],
  "xp": 10,
  "time": "10 min"
}
```

### POST /api/tasks/complete
Mark a task complete and award XP.
```json
{ "taskId": 42 }
```

Response:
```json
{
  "success": true,
  "taskId": 42,
  "xpAwarded": 10,
  "message": "Task completed! +10 XP"
}
```

### GET /api/pathways
Returns all pathways (general always included first).

---

## Domain Scoring Algorithm

```
score = daysSinceLastDone × priorityWeight × stageWeight + (streak × 0.2)
```

Priority weights: High=2, Medium=1, Low=0.5  
Stage weights: Foundation=1.5, Skill=1.2, Mastery=1

The domain that hasn't been addressed longest (weighted by importance) gets the task.  
The last used domain is never repeated back-to-back.
