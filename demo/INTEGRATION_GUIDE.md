# Complete Integration Guide: AI Agents → Frappe LMS

## 🎯 What This Does

Your AI agents analyze and rank projects, then automatically create courses in Frappe LMS so you can see your top projects as learning materials!

## 🚀 One-Command Setup

```bash
cd demo
./start_with_agents.sh
```

**That's it!** Visit http://localhost:8000/lms to see your courses.

## 📊 The Complete Flow

```
1. AI AGENTS ANALYZE PROJECTS
   ↓
   Your Python workflow ranks projects
   DeepSeek AI + LangGraph orchestration
   
2. GENERATE JSON OUTPUT
   ↓
   Creates top_3_projects.json
   Contains: names, scores, dates, rationale
   
3. AUTO-SYNC MONITOR WATCHES
   ↓
   Detects file changes every 5 seconds
   Triggers sync automatically
   
4. CREATE COURSES IN LMS
   ↓
   Connects to Frappe LMS API
   Creates courses with full details
   
5. VIEW IN BROWSER
   ↓
   http://localhost:8000/lms
   See [AI Agent] Course 1, 2, 3
```

## 🛠️ Manual Control

### Run Agent Workflow
```bash
python run_integrated_workflow.py
```

### Sync to LMS (Once)
```bash
cd demo
python frappe_lms_integration.py
```

### Auto-Sync (Continuous)
```bash
cd demo
python auto_sync_lms.py
```

### Test Everything
```bash
cd demo
python test_integration.py
```

## 📚 What Each Course Shows

When you open a course in Frappe LMS, you'll see:

### Course Overview
- **Title:** `[AI Agent] Project Name`
- **Priority Score:** 70/100
- **Complexity:** Medium
- **Due Date:** 2026-01-24
- **Estimated Hours:** 8 hours
- **Decision:** EXECUTE_NOW

### Course Content
- **Getting Started Chapter**
  - Project overview lesson
  - First steps from AI agent
  - Full rationale for ranking
  - Key information summary

### Course Tags
- `ai-generated`
- `priority-70`
- `medium`
- `execute_now`

## 🔄 Real-time Demo

### Terminal 1: Start Auto-Sync
```bash
cd demo
python auto_sync_lms.py
```

Output:
```
🔄 AUTO-SYNC MONITOR STARTED
Watching: ../top_3_projects.json
Check interval: 5 seconds
Press Ctrl+C to stop

📊 Initial sync...
✓ Logged in to Frappe LMS as Administrator
✓ Created course: [AI Agent] Learn Data Visualization
✓ Created course: [AI Agent] Write Essay on AI
✓ Created course: [AI Agent] Build Traffic Simulator
```

### Terminal 2: Update Projects
```bash
cd ..
python run_integrated_workflow.py
```

Terminal 1 automatically shows:
```
🔔 [16:30:45] Change detected!
📊 Syncing to Frappe LMS...
✓ Sync complete
```

## 🎨 Course Appearance in LMS

Imagine opening http://localhost:8000/lms and seeing:

```
┌─────────────────────────────────────────────┐
│  📚 My Courses                              │
├─────────────────────────────────────────────┤
│                                             │
│  [AI Agent] Learn Data Visualization       │
│  Priority: 70 | Due: Jan 24 | 8 hours      │
│  ───────────────────────────────────────    │
│                                             │
│  [AI Agent] Write Essay on AI & Education  │
│  Priority: 70 | Due: Jan 18 | 8 hours      │
│  ───────────────────────────────────────    │
│                                             │
│  [AI Agent] Build Traffic Flow Simulator   │
│  Priority: 70 | Due: Jan 14 | 8 hours      │
│  ───────────────────────────────────────    │
└─────────────────────────────────────────────┘
```

Click any course to see:
- Full project description
- AI's reasoning for the ranking
- Step-by-step first actions
- Complete learning outline

## 🏗️ Architecture Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AI Workflow** | `run_integrated_workflow.py` | Ranks projects |
| **JSON Output** | `top_3_projects.json` | Data exchange |
| **Integration** | `demo/frappe_lms_integration.py` | Creates courses |
| **Auto-Sync** | `demo/auto_sync_lms.py` | Real-time updates |
| **Frappe LMS** | Docker @ :8000 | Displays courses |
| **Next.js UI** | Web @ :3000 | Alternative view |

## ⚙️ Configuration

All defaults work out of the box! But you can customize:

### LMS Credentials
Edit `demo/frappe_lms_integration.py`:
```python
FrappeLMSIntegration(
    base_url="http://localhost:8000",
    username="Administrator", 
    password="admin"
)
```

### Sync Interval
Edit `demo/auto_sync_lms.py`:
```python
AutoSyncMonitor(
    json_file="../top_3_projects.json",
    check_interval=5  # seconds
)
```

## 🐛 Common Issues & Solutions

### Issue: LMS not accessible
```bash
# Solution: Check Docker
docker ps
docker compose up -d

# Wait 30 seconds for startup
curl http://localhost:8000/lms
```

### Issue: No courses appearing
```bash
# Solution 1: Run workflow first
python run_integrated_workflow.py

# Solution 2: Check JSON file exists
cat top_3_projects.json

# Solution 3: Run test script
cd demo && python test_integration.py
```

### Issue: Login failed
```bash
# Solution: Wait for LMS to fully start
sleep 30

# Check LMS status
docker compose logs lms | tail -n 20
```

### Issue: Old courses not updating
```bash
# Solution: LMS creates new courses each time
# To avoid duplicates, delete old courses in LMS UI
# Or modify integration to check for existing courses
```

## 📈 Monitoring & Logs

### View Agent Logs
```bash
tail -f logs/agent-ranking-*.log
```

### View Docker Logs
```bash
docker compose logs -f
```

### Check JSON Updates
```bash
watch -n 1 cat top_3_projects.json
```

## 🎓 Learn More

- [demo/README.md](README.md) - Complete setup guide
- [demo/ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [Frappe LMS Docs](https://frappeframework.com/docs) - LMS API reference

## ✅ Success Checklist

- [ ] Docker is running
- [ ] Frappe LMS accessible at :8000
- [ ] Agent workflow completed
- [ ] top_3_projects.json exists
- [ ] Integration script ran successfully
- [ ] Courses visible in LMS UI
- [ ] Auto-sync monitor running
- [ ] Next.js UI shows projects at :3000

## 🎉 You're Done!

Your AI agents are now:
1. ✓ Analyzing projects
2. ✓ Ranking by priority
3. ✓ Creating courses automatically
4. ✓ Updating in real-time

**Visit http://localhost:8000/lms to see your AI-generated learning path!**
