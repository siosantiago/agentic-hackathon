# 🎯 PROJECT MANAGER AGENT - COMPLETE & WORKING

## ✅ STATUS: FULLY OPERATIONAL

Your Project Manager Agent is **live and running** at [http://localhost:3000](http://localhost:3000)

---

## 🏗️ What We Built

### **The Project Manager Agent** - The Pragmatic Guardian

A sophisticated AI agent that:

1. **Reads from MongoDB Atlas** (your "Long-Term Memory")
   - Browser history & active tabs
   - LMS assignments (Canvas, etc.)
   - PDF extractions & video transcripts
   - Detected due dates from all sources

2. **Analyzes Feasibility** with contextual awareness
   - Checks current sprint capacity (20h/week default)
   - Detects deadline conflicts
   - Evaluates project complexity
   - Considers recent student activity

3. **Makes Pragmatic Decisions**
   - ✅ **EXECUTE_NOW**: Small projects that fit current sprint
   - 📋 **BREAK_DOWN**: Large projects split into weekly sprint tasks
   - ⏸️ **DEFER**: Conflicts, insufficient time, or past due dates

4. **Generates Structured JSON** for Student Board Dashboard
   - Real-time sprint capacity visualization
   - Sprint tasks with priorities & time estimates
   - Contextual insights from recent activity
   - Warnings & recommendations

---

## 📁 Project Structure

```
agentic-hackathon/
├── app/
│   ├── api/
│   │   ├── analyze-project/route.ts    # Main agent endpoint
│   │   ├── context/route.ts            # Add/fetch contextual signals
│   │   ├── projects/route.ts           # Project CRUD
│   │   └── sprint-tasks/route.ts       # Sprint task management
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Main dashboard page
│   └── globals.css                     # Tailwind styles
│
├── components/
│   ├── StudentBoard.tsx                # Dashboard visualization
│   └── ProjectSubmissionForm.tsx       # Project submission UI
│
├── lib/
│   ├── mongodb.ts                      # MongoDB connection
│   ├── models.ts                       # Mongoose schemas
│   │   - UserContext (contextual signals)
│   │   - Project (proposed projects)
│   │   - SprintTask (weekly tasks)
│   └── project-manager-agent.ts        # 🎯 THE CORE AGENT
│
├── scripts/
│   └── seed.ts                         # Database seeding
│
├── .env.local                          # Environment config
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── tailwind.config.ts                  # Tailwind config
├── README.md                           # Overview
├── SETUP.md                            # Detailed setup guide
└── start.sh                            # Startup script
```

---

## 🚀 Quick Test

### 1. Open the Dashboard
Navigate to [http://localhost:3000](http://localhost:3000)

### 2. Submit a Test Project

**Example: Small Project (EXECUTE_NOW)**
- **Title**: "Debug TypeScript Errors"
- **Description**: "Fix all TypeScript compilation errors in the codebase"
- **Due Date**: Tomorrow
- **Complexity**: Low
- **Tags**: coding, typescript

**Expected Result**: Agent says "EXECUTE_NOW" - fits in current sprint

**Example: Large Project (BREAK_DOWN)**
- **Title**: "Traffic Flow Simulator"
- **Description**: "Build a city traffic simulation using graph algorithms with real-time visualization"
- **Due Date**: 3 weeks from now
- **Complexity**: Very High
- **Tags**: coding, research, graph-theory

**Expected Result**: Agent breaks it into 3-4 weekly sprint tasks

### 3. View the Student Board
You'll see:
- Current week capacity (20h available)
- Project analysis with agent reasoning
- Contextual insights (concepts, recent activity, upcoming deadlines)
- Sprint tasks with priorities and time estimates
- Warnings & recommendations

---

## 🗄️ MongoDB Integration

### Collections

#### `user_contexts` - The Long-Term Memory
Stores all contextual signals:
```javascript
{
  userId: "default_user",
  signalType: "browser_tab" | "lms_assignment" | "pdf_text" | "video_transcript",
  source: "https://example.com",
  rawContent: "Page content...",
  subject: "Computer Science",
  concepts: ["React", "TypeScript"],
  timestamp: ISODate(),
  duration: 300, // seconds
  detectedDueDate: ISODate(),
  metadata: { tabTitle, domain, wordCount }
}
```

#### `projects` - Proposed Work
```javascript
{
  title: "Project Title",
  description: "Description",
  dueDate: ISODate(),
  complexity: "medium",
  estimatedHours: 8,
  status: "proposed" | "planning" | "in-progress" | "completed" | "deferred",
  tags: ["coding"],
  sourceContextIds: [ObjectId()] // Links to user_contexts
}
```

#### `sprinttasks` - Weekly Sprint
```javascript
{
  projectId: ObjectId(),
  title: "Task Title",
  description: "Description",
  priority: "high",
  estimatedHours: 4,
  dueDate: ISODate(),
  sprintWeek: 2,
  sprintYear: 2026,
  status: "todo" | "in-progress" | "blocked" | "completed"
}
```

---

## 📡 API Endpoints

### `POST /api/analyze-project`
**The main agent endpoint** - Submit a project for analysis

**Request:**
```json
{
  "title": "Build Weather App",
  "description": "Create a React weather application",
  "dueDate": "2026-01-20",
  "complexity": "medium",
  "estimatedHours": 8,
  "tags": ["coding", "react"]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "decision": "EXECUTE_NOW",
    "reasoning": "Project requires 8h and you have 15.5h available...",
    "feasibility": {
      "isDoable": true,
      "timeAvailable": 15.5,
      "timeRequired": 8,
      "daysUntilDue": 10
    },
    "contextualInsights": {
      "relatedConcepts": ["React", "TypeScript", "Frontend Development"],
      "recentActivity": [...],
      "upcomingDeadlines": [...]
    }
  },
  "studentBoard": { /* Full dashboard payload */ }
}
```

### `POST /api/context`
Add contextual signals (for The Librarian Agent)

```json
{
  "signalType": "browser_tab",
  "source": "https://react.dev/learn",
  "rawContent": "Learn React documentation...",
  "subject": "Web Development",
  "concepts": ["React", "Hooks", "Components"],
  "duration": 420,
  "metadata": {
    "tabTitle": "Learn React",
    "domain": "react.dev"
  }
}
```

### `GET /api/projects`
Get all projects (with optional status filter)

### `GET /api/sprint-tasks`
Get current sprint tasks

---

## 🧠 How It Works

### Agent Decision Flow

```
1. Fetch Contextual Signals from MongoDB
   └─> Recent browser tabs (>5 min activity)
   └─> LMS assignments with due dates
   └─> Video transcripts & PDFs
   └─> Extract concepts & subjects

2. Analyze Current Sprint Capacity
   └─> Calculate allocated hours
   └─> Determine available time
   └─> Check for deadline conflicts

3. Make Pragmatic Decision
   ├─> EXECUTE_NOW if:
   │   └─> Project fits in current week
   │   └─> No conflicting deadlines
   │
   ├─> BREAK_DOWN if:
   │   └─> Project too large (>15h)
   │   └─> Multiple weeks available
   │   └─> Split into phases (Setup → Implementation → Testing)
   │
   └─> DEFER if:
       └─> Past due date
       └─> Deadline conflicts
       └─> Insufficient capacity

4. Generate Student Board JSON
   └─> Sprint capacity visualization
   └─> Project analysis with reasoning
   └─> Contextual insights from MongoDB
   └─> Sprint tasks with priorities
   └─> Warnings & recommendations
```

### Smart Task Breakdown

For coding projects:
1. Setup & Planning (architecture, scaffolding)
2. Core Implementation (main features)
3. Testing & Refinement (bugs, polish)
4. Documentation & Deploy

For research projects:
1. Research & Exploration
2. Analysis
3. Documentation

---

## 🎨 Student Board Dashboard

The UI shows:

### 📊 Sprint Capacity Card
- Available hours per week (20h default)
- Currently allocated hours
- Remaining capacity
- Visual progress bar (green/yellow/red based on capacity)

### 🎯 Project Analysis
- Agent decision badge (EXECUTE_NOW / BREAK_DOWN / DEFER)
- Complexity indicator
- Estimated hours
- Due date & days remaining
- **Agent reasoning** (explains why)

### 🧠 Contextual Insights (from MongoDB)
- **Related Concepts**: Topics from recent activity
- **Recent Activity**: High-engagement tabs & assignments
- **Upcoming Deadlines**: Conflicts from LMS

### 📋 Sprint Tasks
- Task title & description
- Priority badges (critical/high/medium/low)
- Time estimates
- Sprint week assignment
- Status tracking

### ⚠️ Warnings & Recommendations
- Over-capacity alerts
- Urgent deadlines
- Contextual suggestions

---

## 🔧 Configuration

### Adjust Student Availability
Edit [lib/project-manager-agent.ts](lib/project-manager-agent.ts):

```typescript
private readonly WEEKLY_HOURS_AVAILABLE = 20;  // Your weekly hours
private readonly MAX_PROJECT_HOURS_PER_WEEK = 15;  // Max per project
```

### MongoDB Connection
Edit `.env.local`:

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/project-manager

# Or MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-manager
```

---

## 🌱 Seed Sample Data

Populate MongoDB with realistic contextual signals:

```bash
npm run seed
```

This creates:
- Browser tabs (Graph Theory, TypeScript, Stack Overflow)
- LMS assignments (Linear Algebra, ML Research Paper)
- Video transcripts (Traffic Optimization)
- PDF extractions (Macroeconomics)

All with realistic timestamps, durations, and detected due dates.

---

## 🚀 Next Steps

### For Full Multi-Agent System:

1. **The Librarian Agent** (Perception & Categorization)
   - Auto-categorize incoming signals
   - Extract concepts using NLP/LLM
   - Detect subjects and due dates
   - De-duplicate signals

2. **The Synthesis Architect** (Reasoning & Bridging)
   - Find cross-curricular connections
   - Suggest interdisciplinary projects
   - "Graph Theory + Traffic Engineering → City Simulator"
   - Use vector embeddings for concept similarity

3. **Browser Extension**
   - Capture active tabs automatically
   - Track time spent per page
   - Auto-post to `/api/context`

4. **LMS Integration**
   - Pull assignments from Canvas/Blackboard
   - Extract due dates automatically
   - Sync grades & completion status

5. **Vector Search** (MongoDB Atlas)
   - Generate embeddings for semantic search
   - Find related concepts across signals
   - Enable "Show me similar work" features

---

## 🐛 Troubleshooting

### MongoDB Not Running
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Check status
mongosh --eval "db.version()"
```

### Port 3000 In Use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Clear Database
```bash
mongosh project-manager --eval "db.dropDatabase()"
npm run seed
```

---

## 📖 Documentation

- [README.md](README.md) - Overview
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [lib/project-manager-agent.ts](lib/project-manager-agent.ts) - Core agent logic (heavily commented)

---

## 🎉 You're All Set!

The Project Manager Agent is **fully operational** and ready to analyze projects!

**Dashboard**: [http://localhost:3000](http://localhost:3000)

Try submitting different projects and watch the agent:
- Make pragmatic decisions
- Use contextual insights from MongoDB
- Break down complex projects
- Protect your time with capacity management

---

**Built with**: Next.js 14, TypeScript, MongoDB, Mongoose, Tailwind CSS, date-fns

**Agent Philosophy**: Pragmatic, protective, and context-aware. Your externalized cortex for academic planning.
