# 🚀 Quick Reference Card

## Start the System
```bash
npm run dev
# Opens at http://localhost:3000
```

## Seed Sample Data
```bash
npm run seed
# Adds browser history, LMS assignments, etc.
```

## Key Files

- **Agent Logic**: `lib/project-manager-agent.ts`
- **MongoDB Models**: `lib/models.ts`
- **Main API**: `app/api/analyze-project/route.ts`
- **Dashboard**: `app/page.tsx` + `components/StudentBoard.tsx`

## API Quick Tests

### Analyze a Project
```bash
curl -X POST http://localhost:3000/api/analyze-project \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Weather App",
    "description": "React weather application with API integration",
    "dueDate": "2026-01-20",
    "complexity": "medium",
    "tags": ["coding", "react"]
  }'
```

### Add Context Signal
```bash
curl -X POST http://localhost:3000/api/context \
  -H "Content-Type: application/json" \
  -d '{
    "signalType": "browser_tab",
    "source": "https://react.dev",
    "rawContent": "React documentation...",
    "subject": "Web Development",
    "concepts": ["React", "Hooks"],
    "duration": 300
  }'
```

### Get Sprint Tasks
```bash
curl http://localhost:3000/api/sprint-tasks
```

## Agent Decisions

- **EXECUTE_NOW** ✅ → Fits in current sprint
- **BREAK_DOWN** 📋 → Split into weekly tasks
- **DEFER** ⏸️ → Conflicts or no capacity

## Configuration
Edit `lib/project-manager-agent.ts`:
- `WEEKLY_HOURS_AVAILABLE = 20` (adjust your capacity)
- `MAX_PROJECT_HOURS_PER_WEEK = 15` (max per project)

## MongoDB Collections
- `user_contexts` - Browser history, LMS, videos, PDFs
- `projects` - Proposed projects
- `sprinttasks` - Weekly sprint tasks

## Troubleshooting
```bash
# MongoDB not running?
brew services start mongodb-community

# Port in use?
lsof -ti:3000 | xargs kill -9

# Clear database
mongosh project-manager --eval "db.dropDatabase()"
```

## Full Docs
- `README.md` - Overview
- `SETUP.md` - Detailed setup
- `COMPLETE.md` - Architecture & API reference
