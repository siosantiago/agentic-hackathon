# Priority-Based Project Ranking System

## What Changed

The Project Manager Agent now uses **interest and difficulty-based prioritization** instead of deferring projects due to conflicts.

### New Scoring System

Each project receives a **Priority Score (0-100)** based on four factors:

1. **Interest Score (30% weight)**: How much time you've spent on related topics
2. **Difficulty Score (35% weight)**: How much you're struggling with this area (detected from help-seeking behavior)
3. **Urgency Score (20% weight)**: Time until deadline
4. **Context Relevance (15% weight)**: Alignment with your recent activity

### Key Features

- **No More DEFER**: Projects are ranked by priority instead of being deferred
- **Top 3 Recommendations**: When analyzing multiple projects, get the best 3 to focus on
- **Intelligent Scoring**: Agent looks at:
  - Browser history duration on related topics
  - Help-seeking keywords (tutorial, how to, guide, stuck)
  - Repeated visits to similar content
  - Recency of engagement

## How to Use

### Single Project Analysis
1. Go to http://localhost:3000
2. Submit a project
3. See priority score breakdown in logs

### Multi-Project Ranking (NEW!)
1. Go to http://localhost:3000/rank
2. Add multiple projects (2+)
3. Click "🎯 Rank Projects"
4. Get your Top 3 prioritized list with scores

## Priority Score Breakdown Example

```
Priority Score: 78/100
├─ Interest: 65/100      (spent 45 mins on Python tutorials)
├─ Difficulty: 82/100    (high help-seeking on visualization)
├─ Urgency: 70/100       (due in 10 days)
└─ Context: 85/100       (aligns with recent Matplotlib activity)
```

## Log Files

All reasoning is saved to `logs/` with timestamps:
- `agent-analysis-*.log` - Single project analysis
- `agent-ranking-*.log` - Multi-project ranking

## API Endpoints

- `POST /api/analyze-project` - Analyze single project (existing, now with scores)
- `POST /api/rank-projects` - Rank multiple projects (NEW!)

## Example: Why Projects Get High Scores

**High Interest + High Difficulty = Top Priority**

If you:
1. Spent 60+ minutes watching Data Visualization tutorials
2. Visited "matplotlib help" pages multiple times
3. Have related concepts in browser history
4. Project is due soon

→ **This project gets 80+ priority score** = Focus on this!

## Development

Test the new system:
```bash
npm run dev
# Visit http://localhost:3000/rank
```
