# ⚒️ The Forge
**The Software Engineering Flight Simulator** — A professional-grade training environment where junior engineers resolve real production incidents before they ever face them in the wild.

![Status: Early Alpha](https://img.shields.io/badge/Status-Early_Alpha-orange)
![Tech: Next.js](https://img.shields.io/badge/Tech-Next.js_15-black)
![DB: Prisma + SQLite](https://img.shields.io/badge/DB-Prisma%20%2B%20SQLite-blue)
![AI: Gemini](https://img.shields.io/badge/AI-Gemini_1.5_Pro-orange)

---

## 🚩 The Problem

CS graduates know syntax but fail in real-world chaos. Companies spend 6+ months and ~$50k onboarding juniors who've never seen legacy code, messy logs, or production outages. Static tutorials don't prepare engineers for that.

## 🎯 The Solution

The Forge replaces passive learning with **live-fire missions**: time-pressured incidents pulled from real FAANG postmortems. Engineers debug a running system, interact with an AI senior, and submit fixes — just like on the job.

---

## ✨ Features

- **Interactive Terminal** — Full CLI with file persistence (`save`, `cat`, `rm`, `submit`)
- **Real FAANG Incidents** — Scenarios based on actual postmortems (Cloudflare BGP outage, Facebook backbone failure, GitHub data loss, Amazon S3 typo, etc.)
- **GitHub-style Interface** — Commit timeline, PR review, SEV-1/2/3 incidents correlated to code changes
- **AI Mentor** — Gemini 1.5 Pro provides senior-level hints and code reviews
- **Chaos Engine** — Random system failures: network latency, memory leaks, CPU spikes
- **Scoring & Progression** — Time-to-resolve, correctness, and quality tracking
- **Auth System** — Email/password authentication with session management

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth v5 |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) |
| AI | Google Gemini 1.5 Pro |
| Terminal | xterm.js + WebContainers |
| State | Zustand |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/the-forge-simulator.git
cd the-forge-simulator
npm install
```

### 2. Environment Variables

```bash
cp .env.local.template .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret"        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_GENERATIVE_AI_API_KEY="your-key"    # console.cloud.google.com
```

### 3. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma db seed          # creates demo user: demo@forge.dev / demo1234
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📊 Roadmap to YC S26

- [x] **Phase 0** — Interactive terminal + AI mentor + first mission
- [x] **Phase 0.5** — Auth system, scenario selector, scoring, real FAANG scenarios
- [ ] **Phase 1** — Chaos engine live integration + post-mortem generator
- [ ] **Phase 2** — Multi-player incident rooms + leaderboard
- [ ] **Phase 3** — Public demo + YC S26 application

---

© 2026 Yosra Ben Taarit. All Rights Reserved.
