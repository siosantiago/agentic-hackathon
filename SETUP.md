# Project Manager Agent - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

#### Option A: Local MongoDB (Quick Start)
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify it's running
mongo --eval "db.version()"
```

#### Option B: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `.env.local` with your connection string

### 3. Configure Environment

```bash
# Create your environment file
cp .env.local.example .env.local

# Edit .env.local with your MongoDB connection string
# Minimum required:
MONGODB_URI=mongodb://localhost:27017/project-manager
```

### 4. Seed Sample Data (Optional but Recommended)

This populates MongoDB with sample contextual signals (browser activity, LMS assignments):

```bash
npm run seed
```

Expected output:
```
✅ Seeded 6 contextual signals for user: default_user

Sample signals:
  1. [lms_assignment] Linear Algebra: Eigenvectors, Matrix decomposition, Eigenvalues
  2. [browser_tab] Computer Science: Graph Theory, Data Structures, Algorithms
  3. [video_transcript] Civil Engineering: Traffic Optimization, Graph Algorithms
  ...
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Testing the Project Manager Agent

### Example 1: Simple Project (EXECUTE_NOW)

Submit a project with:
- **Title**: "Fix TypeScript compilation errors"
- **Description**: "Debug and fix all TypeScript errors in the codebase"
- **Due Date**: Tomorrow
- **Complexity**: Low
- **Tags**: coding, typescript

**Expected Decision**: `EXECUTE_NOW` (fits in current sprint)

### Example 2: Large Project (BREAK_DOWN)

Submit a project with:
- **Title**: "Build Traffic Flow Simulator"
- **Description**: "Create a city traffic simulation using graph algorithms, visualize traffic patterns, and analyze optimization strategies"
- **Due Date**: 3 weeks from now
- **Complexity**: Very High
- **Tags**: coding, research, graph-theory

**Expected Decision**: `BREAK_DOWN` into sprint tasks

### Example 3: Conflicting Deadline (DEFER)

Submit a project due in 7 days when you have LMS assignments due sooner (from seed data).

**Expected Decision**: `DEFER` until conflicting deadline is resolved

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Student Board                         │
│                  (Next.js Dashboard)                     │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ JSON Payload
                           │
┌─────────────────────────────────────────────────────────┐
│              PROJECT MANAGER AGENT                       │
│  • Reads contextual signals from MongoDB                │
│  • Detects due dates & conflicts                        │
│  • Analyzes feasibility                                 │
│  • Breaks down large projects                           │
│  • Generates structured output                          │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────┐
│         MongoDB Atlas (Long-Term Memory)                 │
│                                                          │
│  Collections:                                           │
│  • user_context: Browser tabs, LMS assignments, etc.    │
│  • projects: Proposed/active projects                   │
│  • sprint_tasks: Weekly sprint tasks                    │
└─────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### `POST /api/analyze-project`
Submit a project for analysis by the Project Manager agent.

**Request:**
```json
{
  "title": "Project Title",
  "description": "Project description",
  "dueDate": "2026-01-20",
  "complexity": "medium",
  "estimatedHours": 8,
  "tags": ["coding", "research"]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "decision": "EXECUTE_NOW",
    "reasoning": "...",
    "feasibility": { ... },
    "contextualInsights": { ... }
  },
  "studentBoard": { ... }
}
```

### `GET /api/projects`
Get all projects.

### `GET /api/sprint-tasks`
Get current sprint tasks.

### `POST /api/context`
Add contextual signals (for The Librarian Agent).

**Request:**
```json
{
  "signalType": "browser_tab",
  "source": "https://example.com",
  "rawContent": "Page content...",
  "subject": "Computer Science",
  "concepts": ["React", "TypeScript"],
  "duration": 300
}
```

## 🎯 How the Project Manager Agent Works

1. **Fetches Context** from MongoDB:
   - Recent browser activity (tabs open >5 minutes)
   - LMS assignments with due dates
   - Video transcripts and PDFs

2. **Analyzes Feasibility**:
   - Current sprint capacity (20h/week default)
   - Existing task allocations
   - Upcoming deadline conflicts

3. **Makes Decision**:
   - **EXECUTE_NOW**: Fits in current sprint
   - **BREAK_DOWN**: Too large, splits into phases
   - **DEFER**: Conflicts or insufficient time

4. **Generates Output**:
   - Structured JSON for Student Board
   - Sprint tasks with week assignments
   - Contextual recommendations
   - Warnings about capacity/deadlines

## 🔧 Configuration

Edit the agent behavior in [lib/project-manager-agent.ts](lib/project-manager-agent.ts):

```typescript
private readonly WEEKLY_HOURS_AVAILABLE = 20;  // Adjust your availability
private readonly MAX_PROJECT_HOURS_PER_WEEK = 15;  // Max hours per project/week
```

## 🧪 Adding More Contextual Signals

Use the `/api/context` endpoint or MongoDB directly:

```bash
curl -X POST http://localhost:3000/api/context \
  -H "Content-Type: application/json" \
  -d '{
    "signalType": "lms_assignment",
    "source": "https://canvas.edu/assignment/123",
    "rawContent": "Complete data structures homework",
    "subject": "Computer Science",
    "concepts": ["Binary Trees", "Recursion"],
    "detectedDueDate": "2026-01-15"
  }'
```

## 📚 Next Steps

1. **Integrate The Librarian Agent**: Automatically categorize incoming signals
2. **Add The Synthesis Architect**: Find cross-curricular project connections
3. **Browser Extension**: Auto-capture browser activity
4. **LMS Integration**: Pull assignments directly from Canvas/Blackboard
5. **Vector Search**: Enable semantic search across contextual signals

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Regenerate Next.js types
rm -rf .next
npm run dev
```

## 📝 License

MIT
