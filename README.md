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
