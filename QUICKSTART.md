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

# Quick Start Guide

## 1. Setup Virtual Environment

```bash
# Make scripts executable
chmod +x setup_venv.sh activate.sh run_with_logging.sh

# Run setup (creates venv and installs dependencies)
./setup_venv.sh
```

## 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
# or
code .env
```

Add your DeepSeek API key:
```
DEEPSEEK_API_KEY=sk-your-actual-key-here
```

## 3. Activate Virtual Environment

```bash
# Activate venv
source venv/bin/activate

# Or use the helper script
./activate.sh
```

You should see `(venv)` in your terminal prompt.

## 4. Run the Workflow

### Option A: Direct execution
```bash
python run_workflow.py
```

### Option B: With log file
```bash
./run_with_logging.sh
```

### Option C: Test without DeepSeek (for debugging)
```bash
export DEEPSEEK_API_KEY="sk-test"
python run_workflow.py
```

## 5. View Results

Logs are saved to `logs/` directory:

```bash
# View latest log
ls -lt logs/ | head -n 2

# Read log file
cat logs/agent-ranking-*.log

# Follow in real-time
tail -f logs/agent-ranking-*.log

# Search for specific patterns
grep "DEEPSEEK" logs/agent-ranking-*.log
grep "RANK" logs/agent-ranking-*.log
grep "Priority Score" logs/agent-ranking-*.log
```

## 6. Deactivate When Done

```bash
deactivate
```

## Expected Output

You should see logs similar to this:

```
================================================================================
PROJECT MANAGER AGENT - MULTI-PROJECT RANKING
================================================================================
✓ Connected to MongoDB

📥 INPUT: 3 projects to rank
   1. Traffic Simulator (medium, due: 2026-01-14)
   2. Data Viz Course (medium, due: 2026-01-24)
   3. AI Essay (medium, due: 2026-01-18)

🧠 DEEPSEEK STRATEGIC ANALYSIS - INVOKED BY PROJECT MANAGER
...

🥇 RANK 1: Traffic Simulator (Score: 75/100)
🥈 RANK 2: Data Viz Course (Score: 58/100)
🥉 RANK 3: AI Essay (Score: 14/100)

✅ RANKING SESSION COMPLETE
```

## Troubleshooting

### "command not found: python3"
Install Python 3:
```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt-get install python3 python3-pip python3-venv
```

### "Permission denied"
Make scripts executable:
```bash
chmod +x setup_venv.sh activate.sh run_with_logging.sh
```

### "ModuleNotFoundError"
Make sure venv is activated:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### "DeepSeek API error"
Check your API key:
```bash
echo $DEEPSEEK_API_KEY
```

If empty, set it:
```bash
export DEEPSEEK_API_KEY="your-key-here"
```

## What's Next?

1. Check the generated logs in `logs/` directory
2. Explore the LangGraph workflow in `src/agents/langgraph_workflow.py`
3. Customize the scoring logic in `calculate_priority_scores()`
4. Add your own MongoDB connection in the helper functions
