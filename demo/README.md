# Frappe LMS + AI Agent Integration

Display your AI agent's top 3 ranked projects as courses in Frappe LMS!

## 🚀 Complete Setup (One Command)

```bash
# Build, start LMS, run agents, and sync courses
./start_with_agents.sh
```

This will:
1. Start Frappe LMS Docker (30 seconds)
2. Run AI agent workflow to rank projects
3. Create courses in LMS from top 3 projects
4. Start auto-sync monitor for real-time updates

## Manual Setup (Step by Step)

### Step 1: Start Frappe LMS

```bash
# Build image once (takes ~10 minutes)
docker compose build

# Start in ~30 seconds!
docker compose up -d

# Access at http://localhost:8000/lms
```

### Step 2: Run AI Agent Workflow

```bash
# From the main project directory
cd ..
python run_integrated_workflow.py
```

This generates `top_3_projects.json` with your ranked projects.

### Step 3: Sync to Frappe LMS

```bash
# Back to demo directory
cd demo

# One-time sync
python frappe_lms_integration.py

# OR auto-sync (watches for changes)
python auto_sync_lms.py
```

### Step 4: View Your Courses!

Open http://localhost:8000/lms and login:
- **Username:** Administrator
- **Password:** admin

Your top 3 AI-ranked projects will appear as courses with:
- Course title with project name
- Priority scores and complexity levels
- Due dates and estimated hours
- First steps and rationale
- Auto-generated course outline

## 🔄 Real-time Sync

The auto-sync monitor watches `top_3_projects.json` and automatically creates/updates courses when your agents re-rank projects:

```bash
# Terminal 1: Auto-sync monitor
python auto_sync_lms.py

# Terminal 2: Re-run workflow anytime
cd .. && python run_integrated_workflow.py
```

Courses update automatically within 5 seconds!

## 📊 What Gets Synced

Each of your top 3 projects becomes a course with:

### Course Information
- **Title:** `[AI Agent] Project Name`
- **Description:** Full project details with AI rationale
- **Tags:** Priority score, complexity, decision status
- **Chapters:** Auto-generated course structure
- **Lessons:** Getting started guide with first steps

### Project Metadata Displayed
- Priority Score (0-100)
- Complexity Level (low/medium/high)
- Due Date
- Estimated Hours
- Agent Decision (EXECUTE_NOW, etc.)
- Rationale from synthesis architect
- First step recommendations

## 🎯 Integration Architecture

```
┌─────────────────────┐
│  AI Agent Workflow  │
│  (Python/LangGraph) │
└──────────┬──────────┘
           │ generates
           ▼
┌─────────────────────┐
│ top_3_projects.json │  ◄─── Watched by auto_sync_lms.py
└──────────┬──────────┘
           │ synced by
           ▼
┌─────────────────────┐
│   Frappe LMS API    │
│  (Course Creation)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Frappe LMS UI     │
│  http://localhost   │
│       :8000/lms     │
└─────────────────────┘
```

## 🛠️ Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `start_with_agents.sh` | Complete startup | `./start_with_agents.sh` |
| `frappe_lms_integration.py` | One-time sync | `python frappe_lms_integration.py` |
| `auto_sync_lms.py` | Real-time monitor | `python auto_sync_lms.py` |
| `test_integration.py` | Test connection | `python test_integration.py` |

## 🧪 Testing the Integration

Run the test suite to verify everything works:

```bash
python test_integration.py
```

This checks:
- ✓ Frappe LMS connectivity
- ✓ Login authentication
- ✓ JSON file validity
- ✓ Course creation capability

## 🐛 Troubleshooting

### LMS Not Accessible

```bash
# Check if Docker is running
docker ps

# Restart LMS
docker compose restart

# View logs
docker compose logs -f
```

### Login Failed

- Default credentials: `Administrator` / `admin`
- Wait 30 seconds after Docker starts
- Check LMS is fully initialized: `curl http://localhost:8000/lms`

### No Projects Found

```bash
# Run the agent workflow first
cd ..
python run_integrated_workflow.py

# Verify JSON was created
cat top_3_projects.json
```

### Courses Not Appearing

- Check Frappe LMS UI at http://localhost:8000/lms
- Look for courses starting with `[AI Agent]`
- Check the console output for errors
- Run test script: `python test_integration.py`

## 📋 Quick Reference

### First Time Setup

```bash
# 1. Build Docker image (once)
docker compose build

# 2. Run complete startup
./start_with_agents.sh
```

### Daily Workflow

```bash
# Start auto-sync in background
python auto_sync_lms.py &

# Re-run agents anytime to update courses
cd .. && python run_integrated_workflow.py
```

### Manual Sync

```bash
# Sync once without monitoring
python frappe_lms_integration.py
```

### View Everything

- **LMS Courses:** http://localhost:8000/lms
- **Next.js UI:** http://localhost:3000
- **API Status:** http://localhost:3000/api/top-projects

## Startup Times

| Action | Time |
|--------|------|
| Build image (one-time) | ~10 minutes |
| First run (after build) | ~30 seconds |
| Subsequent runs | ~30 seconds |

## Login

- Username: `Administrator`
- Password: `admin`

## Rebuilding

To update LMS or force rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

## Standard Setup (Slower, No Build)

If you prefer the standard 5-minute setup without building:

```bash
# Use the original simple setup
mv docker-compose.yml docker-compose.fast.yml
# Download official setup
wget -O docker-compose.yml https://raw.githubusercontent.com/frappe/lms/develop/docker/docker-compose.yml
wget -O init.sh https://raw.githubusercontent.com/frappe/lms/develop/docker/init.sh
docker compose up -d  # Takes ~5 minutes
```

## Performance Tips

See [PERFORMANCE.md](PERFORMANCE.md) for detailed optimization strategies.
