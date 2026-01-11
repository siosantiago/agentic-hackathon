# Frappe LMS Integration - Architecture

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │  1. Run AI Agent Workflow                   │
    │     python run_integrated_workflow.py       │
    │                                              │
    │  DeepSeek AI + LangGraph                   │
    │  • Synthesis Architect Agent                │
    │  • Project Manager Agent                    │
    │  • Priority Ranking System                  │
    └──────────────────┬──────────────────────────┘
                       │ generates
                       ▼
    ┌─────────────────────────────────────────────┐
    │  top_3_projects.json                        │
    │  {                                          │
    │    "top_3_projects": [                      │
    │      {                                      │
    │        "rank": 1,                           │
    │        "name": "Project Name",              │
    │        "priority_score": 70,                │
    │        "complexity": "medium",              │
    │        "due_date": "2026-01-24",            │
    │        "estimated_hours": 8                 │
    │      }                                      │
    │    ]                                        │
    │  }                                          │
    └──────────────────┬──────────────────────────┘
                       │
                       │ watched by
                       ▼
    ┌─────────────────────────────────────────────┐
    │  2. Auto-Sync Monitor                       │
    │     python auto_sync_lms.py                 │
    │                                              │
    │  • Watches for file changes                 │
    │  • Detects updates every 5 seconds          │
    │  • Triggers sync automatically              │
    └──────────────────┬──────────────────────────┘
                       │ calls
                       ▼
    ┌─────────────────────────────────────────────┐
    │  3. LMS Integration                         │
    │     frappe_lms_integration.py               │
    │                                              │
    │  • Login to Frappe LMS                      │
    │  • Parse project data                       │
    │  • Create/update courses                    │
    │  • Add chapters & lessons                   │
    └──────────────────┬──────────────────────────┘
                       │ HTTP POST
                       ▼
    ┌─────────────────────────────────────────────┐
    │  4. Frappe LMS API                          │
    │     http://localhost:8000/api               │
    │                                              │
    │  POST /api/resource/LMS Course              │
    │  POST /api/resource/Course Chapter          │
    │  POST /api/resource/Course Lesson           │
    └──────────────────┬──────────────────────────┘
                       │ stores in
                       ▼
    ┌─────────────────────────────────────────────┐
    │  5. Frappe Database                         │
    │     (Inside Docker Container)               │
    │                                              │
    │  Tables:                                    │
    │  • tabLMS Course                            │
    │  • tabCourse Chapter                        │
    │  • tabCourse Lesson                         │
    └──────────────────┬──────────────────────────┘
                       │ rendered by
                       ▼
    ┌─────────────────────────────────────────────┐
    │  6. Frappe LMS UI                           │
    │     http://localhost:8000/lms               │
    │                                              │
    │  User sees:                                 │
    │  • [AI Agent] Course 1                      │
    │  • [AI Agent] Course 2                      │
    │  • [AI Agent] Course 3                      │
    │                                              │
    │  With full project details, priority        │
    │  scores, and learning materials             │
    └─────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. AI Agent Workflow (`run_integrated_workflow.py`)
- Analyzes student projects
- Ranks by priority, feasibility, learning value
- Outputs structured JSON with top 3 projects

### 2. Auto-Sync Monitor (`auto_sync_lms.py`)
- Monitors `top_3_projects.json` for changes
- Provides real-time sync capability
- Can run continuously in background

### 3. LMS Integration (`frappe_lms_integration.py`)
- Authenticates with Frappe LMS
- Transforms project data into course structure
- Creates courses with chapters and lessons
- Handles errors and retries

### 4. Frappe LMS (Docker)
- Provides Learning Management System
- Exposes REST API for course management
- Renders courses in web UI
- Manages user enrollment and progress

## Course Structure Created

```
LMS Course
├── Title: [AI Agent] Project Name
├── Description: Full AI analysis
├── Tags: priority-70, medium, execute_now
└── Chapter: Getting Started
    └── Lesson: Project Overview & First Steps
        ├── Project details
        ├── Priority score
        ├── Due date
        ├── Estimated hours
        └── First steps
```

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/method/login` | POST | Authenticate |
| `/api/resource/LMS Course` | POST | Create course |
| `/api/resource/Course Chapter` | POST | Add chapter |
| `/api/resource/Course Lesson` | POST | Add lesson |

## File Locations

```
agentic-hackathon/
├── top_3_projects.json              # Generated by agents
├── run_integrated_workflow.py       # AI workflow
└── demo/
    ├── frappe_lms_integration.py    # Sync script
    ├── auto_sync_lms.py             # Monitor
    ├── start_with_agents.sh         # Complete startup
    ├── test_integration.py          # Tests
    └── docker-compose.yml           # LMS container
```

## Timing

| Step | Duration | Description |
|------|----------|-------------|
| Docker build | ~10 min | One-time setup |
| LMS startup | ~30 sec | Each restart |
| Agent workflow | ~10-30 sec | Analyze projects |
| Sync to LMS | ~2-5 sec | Create courses |
| Auto-sync detect | 5 sec | Monitor interval |

## Example Output

When you run the integration, you'll see:

```
📊 Syncing 3 projects to Frappe LMS
Timestamp: 2026-01-10T16:05:12.978636
Model: accounts/fireworks/models/deepseek-v3p2
────────────────────────────────────────────────

📚 Creating course for Rank 1: Learn Data Visualization with Python
  ✓ Created course: [AI Agent] Learn Data Visualization with Python
    ✓ Added chapter to course
      ✓ Added lesson to chapter

📚 Creating course for Rank 2: Write Essay on AI & Education
  ✓ Created course: [AI Agent] Write Essay on AI & Education
    ✓ Added chapter to course
      ✓ Added lesson to chapter

📚 Creating course for Rank 3: Build Traffic Flow Simulator
  ✓ Created course: [AI Agent] Build Traffic Flow Simulator
    ✓ Added chapter to course
      ✓ Added lesson to chapter

════════════════════════════════════════════════
✓ Successfully created 3 courses in Frappe LMS
Visit: http://localhost:8000/lms
════════════════════════════════════════════════
```
