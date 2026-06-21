# FreeCode AI

AI-powered code editor with VS Code-like IDE, FreeModel integration, and credit system.

## Quick Start

### Local Development

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env   # Edit .env with your config
node src/index.js

# Terminal 2 - Frontend
cd frontend
npm install
npx next dev
```

### VPS Deployment

Full guide: [deploy/VPS_DEPLOY.md](deploy/VPS_DEPLOY.md)

## Architecture

```
User → Next.js App → Express API → Claude Code CLI (FreeModel)
                                     OR
                                  → FreeModel Direct API
```

## Features

- Monaco Editor (VS Code core)
- AI Chat with 9+ models (Claude + GPT)
- File Explorer with CRUD
- Built-in Terminal
- Credit System (50 free requests)
- Razorpay Pro Plan (₹299/mo)

## Tech Stack

| Component | Tech |
|-----------|------|
| Frontend | Next.js 14, Tailwind CSS, Monaco Editor |
| Backend | Node.js, Express, SQLite |
| AI | FreeModel API + Claude Code CLI |
| Auth | JWT + bcrypt |
| Payment | Razorpay |
| Deploy | PM2 + Nginx + Ubuntu |
