# Project Manager Agent - Execution & Feasibility

An AI-powered project management system that breaks down ambitious ideas into actionable sprint tasks based on MongoDB-tracked due dates.

## Features

- **Project Manager Agent**: Analyzes project complexity and due dates
- **Sprint Task Breakdown**: Automatically splits large projects into manageable tasks
- **MongoDB Integration**: Tracks projects, tasks, and due dates
- **Student Board Dashboard**: Real-time visualization of your work
- **JSON API**: Structured output ready for UI consumption

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your MongoDB URI and OpenAI/Anthropic API key
   ```

3. **Run MongoDB** (if using local):
   ```bash
   # macOS with Homebrew:
   brew services start mongodb-community
   
   # Or with Docker:
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the dashboard:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Input**: Submit an ambitious project idea
2. **Agent Analysis**: The Project Manager checks:
   - Project complexity and scope
   - Due dates from MongoDB
   - Available time in the current week
3. **Task Breakdown**: If too large, splits into sprint tasks
4. **Output**: Structured JSON rendered on the Student Board

## API Endpoints

- `POST /api/analyze-project` - Submit a project for analysis
- `GET /api/projects` - Get all projects
- `GET /api/sprint-tasks` - Get current sprint tasks

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT-4 or Anthropic Claude

# Agentic Multi-Agent Project Ranking System

Multi-agent system using LangGraph and DeepSeek for intelligent project prioritization.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```
DEEPSEEK_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/agentic-system
```

Or export them directly:

```bash
export DEEPSEEK_API_KEY="your_key_here"
export MONGODB_URI="mongodb://localhost:27017/agentic-system"
```

## Running the Workflow

### Option 1: Direct Python Execution

```bash
python run_workflow.py
```

This will output logs directly to the console.

### Option 2: With Log File (Recommended)

```bash
chmod +x run_with_logging.sh
./run_with_logging.sh
```

This will:
- Save logs to `logs/agent-ranking-YYYY-MM-DDTHH-MM-SS.log`
- Display output in console simultaneously

### Option 3: View Logs Only (No Console Output)

```bash
python run_workflow.py > logs/output.log 2>&1
```

## Viewing Logs

```bash
# View most recent log
cat logs/agent-ranking-*.log | tail -n 100

# Follow log in real-time
tail -f logs/agent-ranking-*.log

# Search for specific events
grep "DEEPSEEK" logs/agent-ranking-*.log
grep "LANGGRAPH" logs/agent-ranking-*.log
```

## What the Logs Show

The workflow logs will display:

1. **LangGraph Orchestration**
   - Workflow initialization
   - Node execution flow
   - State transitions

2. **DeepSeek Invocations**
   - Strategic analysis by Project Manager
   - Synthesis reasoning by Ranking Agent
   - Timing and token usage

3. **Agent Communication**
   - Inter-agent message passing
   - State updates
   - Decision reasoning

4. **Project Analysis**
   - Priority score calculations
   - Context relevance
   - Final rankings

## Example Log Output

```
[2026-01-10T21:47:05.698Z] ================================================================================
[2026-01-10T21:47:05.698Z] 🔀 LANGGRAPH WORKFLOW INITIALIZATION
[2026-01-10T21:47:05.698Z] ================================================================================
[2026-01-10T21:47:05.698Z] 🔀 Building state graph...
[2026-01-10T21:47:05.698Z] 🔀 Adding nodes:
[2026-01-10T21:47:05.698Z] 🔀    • coordinator (Project Manager Agent)
[2026-01-10T21:47:05.698Z] 🔀    • analyzer (Project Analyzer Agent)
...
[2026-01-10T21:47:05.698Z] 🧠 DEEPSEEK STRATEGIC ANALYSIS - INVOKED BY PROJECT MANAGER
[2026-01-10T21:47:05.698Z] 🧠 Model: deepseek-reasoner
[2026-01-10T21:47:05.698Z] 🧠 Purpose: Strategic portfolio analysis
...
```

## Troubleshooting

### No logs appearing?
```bash
# Check if Python is finding the modules
python -c "from src.agents.langgraph_workflow import create_ranking_workflow; print('OK')"
```

### DeepSeek API errors?
```bash
# Verify your API key
echo $DEEPSEEK_API_KEY

# Test connection
curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" https://api.deepseek.com/v1/models
```

### MongoDB connection issues?
```bash
# Check MongoDB is running
mongosh --eval "db.version()"

# Or start MongoDB
mongod --dbpath ./data/db
```

## 🎓 Frappe LMS Integration

**NEW!** Display your AI agent's top 3 ranked projects as courses in Frappe LMS!

### Quick Start

```bash
cd demo
./start_with_agents.sh
```

This will:
1. Start Frappe LMS Docker container
2. Run the AI agent workflow
3. Sync top 3 projects to LMS as courses
4. Start real-time auto-sync monitor

### Access Points

- **Frappe LMS:** http://localhost:8000/lms
- **Next.js UI:** http://localhost:3000
- **Login:** Administrator / admin

### What You Get

Each of your top 3 projects becomes a complete course with:
- Course title with project name
- Priority scores and complexity
- Due dates and time estimates
- AI-generated rationale and first steps
- Auto-generated course structure with lessons

### Real-time Updates

```bash
# Terminal 1: Auto-sync monitor
cd demo
python auto_sync_lms.py

# Terminal 2: Re-run workflow anytime
python run_integrated_workflow.py
```

Courses update automatically within 5 seconds!

See [demo/README.md](demo/README.md) and [demo/ARCHITECTURE.md](demo/ARCHITECTURE.md) for complete details.

---
