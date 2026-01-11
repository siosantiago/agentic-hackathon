# Multi-Agent Communication Architecture

## Overview
Based on the log analysis, here's how the agents communicate:

## Agent Communication Flow

```
┌─────────────────────┐
│   User Input        │
│  (3 Projects)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  PROJECT MANAGER AGENT              │
│  • Receives project list            │
│  • Fetches sprint context          │
│  • Coordinates analysis             │
└──────────┬──────────────────────────┘
           │
           ├──────────┬──────────┬──────────┐
           ▼          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Project  │ │ Project  │ │ Project  │
    │ Analyzer │ │ Analyzer │ │ Analyzer │
    │    1     │ │    2     │ │    3     │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         │  For Each Project:     │
         │  • Query Long-Term     │
         │    Memory (MongoDB)    │
         │  • Calculate Scores    │
         │  • Make Decision       │
         │                        │
         └────────┬───────────────┘
                  ▼
         ┌────────────────┐
         │  Aggregator    │
         │  • Rank by     │
         │    Priority    │
         │  • Return Top 3│
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │  Save Results  │
         │  to MongoDB    │
         └────────────────┘
```

## LangChain/LangGraph Implementation

### 1. Agent Definitions

```python
from langgraph.graph import StateGraph, END
from langchain.agents import AgentExecutor
from langchain.chat_models import ChatAnthropic
from typing import TypedDict, List, Annotated
import operator

class ProjectAnalysisState(TypedDict):
    projects: List[dict]
    analyzed_projects: Annotated[List[dict], operator.add]
    ranked_results: List[dict]
    sprint_context: dict

# Project Manager Agent (Coordinator)
def project_manager_node(state: ProjectAnalysisState):
    """Coordinates the multi-project ranking workflow"""
    print(f"📥 INPUT: {len(state['projects'])} projects to rank")
    
    # Fetch sprint context from MongoDB
    sprint_context = fetch_sprint_tasks()
    state['sprint_context'] = sprint_context
    
    return state

# Project Analyzer Agent (Worker)
def project_analyzer_node(state: ProjectAnalysisState):
    """Analyzes a single project and calculates priority score"""
    results = []
    
    for project in state['projects']:
        # Query Long-Term Memory
        contextual_signals = query_ltm(project)
        
        # Calculate scores
        scores = {
            'interest': calculate_interest_score(project, contextual_signals),
            'difficulty': calculate_difficulty_score(project, contextual_signals),
            'urgency': calculate_urgency_score(project),
            'context': calculate_context_relevance(project, state['sprint_context'])
        }
        
        # Calculate final priority
        priority_score = (
            scores['interest'] * 0.30 +
            scores['difficulty'] * 0.35 +
            scores['urgency'] * 0.20 +
            scores['context'] * 0.15
        )
        
        # Make decision
        decision = make_decision(priority_score, project, state['sprint_context'])
        
        results.append({
            'project': project,
            'scores': scores,
            'priority_score': priority_score,
            'decision': decision
        })
    
    return {'analyzed_projects': results}

# Ranking Agent (Aggregator)
def ranking_aggregator_node(state: ProjectAnalysisState):
    """Aggregates and ranks all analyzed projects"""
    ranked = sorted(
        state['analyzed_projects'],
        key=lambda x: x['priority_score'],
        reverse=True
    )[:3]
    
    return {'ranked_results': ranked}

# Persistence Agent
def save_results_node(state: ProjectAnalysisState):
    """Saves ranked results to MongoDB"""
    for rank, result in enumerate(state['ranked_results'], 1):
        save_to_mongodb(result, rank)
    
    print("✅ RANKING SESSION COMPLETE")
    return state
```

### 2. LangGraph Workflow

```python
# Build the graph
workflow = StateGraph(ProjectAnalysisState)

# Add nodes
workflow.add_node("project_manager", project_manager_node)
workflow.add_node("analyzer", project_analyzer_node)
workflow.add_node("ranker", ranking_aggregator_node)
workflow.add_node("save", save_results_node)

# Define edges
workflow.set_entry_point("project_manager")
workflow.add_edge("project_manager", "analyzer")
workflow.add_edge("analyzer", "ranker")
workflow.add_edge("ranker", "save")
workflow.add_edge("save", END)

# Compile
app = workflow.compile()
```

### 3. Communication Patterns

**Pattern 1: Sequential Processing**
```python
# Project Manager → Analyzer → Ranker → Save
# Used when projects can be analyzed in parallel
```

**Pattern 2: Parallel Analysis (Using LangGraph's map-reduce)**
```python
from langgraph.graph import MapNode

# Analyze each project in parallel
workflow.add_node(
    "parallel_analysis",
    MapNode(project_analyzer_node, input_key="projects")
)
```

**Pattern 3: Tool-Based Communication**
```python
from langchain.tools import Tool

# Define tools for inter-agent communication
mongodb_tool = Tool(
    name="QueryLongTermMemory",
    func=query_ltm,
    description="Query MongoDB for contextual signals"
)

capacity_tool = Tool(
    name="CheckCapacity",
    func=check_sprint_capacity,
    description="Check available sprint capacity"
)
```

## Key Communication Mechanisms

### 1. Shared State (LangGraph)
- All agents read/write to `ProjectAnalysisState`
- Immutable updates using `Annotated[List, operator.add]`

### 2. MongoDB as Long-Term Memory
- Projects query contextual signals
- Sprint tasks provide capacity constraints
- Results persisted for future reference

### 3. Message Passing
```python
# Agent can send messages to coordinator
class AgentMessage(TypedDict):
    agent_id: str
    message_type: str  # "analysis_complete", "error", etc.
    payload: dict

def analyzer_with_messaging(state: ProjectAnalysisState):
    result = analyze_project(state['current_project'])
    
    # Send completion message
    message = AgentMessage(
        agent_id="analyzer_1",
        message_type="analysis_complete",
        payload=result
    )
    
    return {'messages': [message], 'analyzed_projects': [result]}
```

## Running the Multi-Agent System

```python
# Initialize
initial_state = {
    "projects": [
        {"name": "Build Traffic Simulator", "complexity": "medium"},
        {"name": "Learn Data Viz", "complexity": "medium"},
        {"name": "Write Essay", "complexity": "medium"}
    ],
    "analyzed_projects": [],
    "ranked_results": [],
    "sprint_context": {}
}

# Execute
final_state = app.invoke(initial_state)

# Results
print(f"Top project: {final_state['ranked_results'][0]['project']['name']}")
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each agent has a single responsibility
2. **Parallel Execution**: Projects can be analyzed concurrently
3. **Stateful Communication**: Shared state ensures consistency
4. **Extensible**: Easy to add new agents (e.g., risk assessment, resource allocation)
5. **Observable**: Each step logs progress for debugging

## Example Agent Communication Trace

```
[PM Agent] → "Starting analysis of 3 projects"
[PM Agent] → [Analyzer] "Analyze Project 1"
[Analyzer] → [LTM] "Query contextual signals for Project 1"
[LTM] → [Analyzer] "Returned 6 signals"
[Analyzer] → [PM Agent] "Project 1 analyzed: priority=75"
[PM Agent] → [Ranker] "Rank all results"
[Ranker] → [PM Agent] "Top 3 ranked"
[PM Agent] → [Saver] "Persist results"
```
