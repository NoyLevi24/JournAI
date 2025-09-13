## JournAI - Smart Trip Planner

Requirements: Node 18+, npm

Setup:

```bash
# 1) Backend
cd backend
cp env.example .env # then edit JWT_SECRET and OPENAI_API_KEY (optional)
npm run dev
```

```bash
# 2) Frontend (in a second terminal)
cd frontend
npm run dev
```

Place `logo.png` and `background.jpg` in `frontend/public/`.

Build frontend and serve from backend:

```bash
cd frontend && npm run build
cd ../backend && npm start
```

API base: `/api`
# JournAI
# JournAI
