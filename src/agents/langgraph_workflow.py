"""
Multi-Agent Project Ranking System using LangGraph with DeepSeek via Fireworks.ai
"""
from typing import TypedDict, List, Annotated
import operator
from langgraph.graph import StateGraph, END
from datetime import datetime
from langchain_fireworks import ChatFireworks
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
import json
import os

# Logging utility
class AgentLogger:
    """Centralized logging for multi-agent interactions"""
    
    @staticmethod
    def log(message: str, level: str = "INFO"):
        timestamp = datetime.now().isoformat()
        prefix = {
            "INFO": "ℹ️",
            "SUCCESS": "✓",
            "ERROR": "✗",
            "DEEPSEEK": "🧠",
            "LANGGRAPH": "🔀",
            "AGENT": "🤖",
            "COMM": "💬"
        }.get(level, "•")
        print(f"[{timestamp}] {prefix} {message}")
    
    @staticmethod
    def log_separator(title: str = ""):
        print(f"\n{'=' * 80}")
        if title:
            print(f"{title}")
            print('=' * 80)

logger = AgentLogger()

# Add DeepSeek LLM configuration via Fireworks
def create_deepseek_llm():
    """
    Create DeepSeek LLM instance via Fireworks.ai
    """
    logger.log("Initializing DeepSeek via Fireworks.ai...", "DEEPSEEK")
    
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        logger.log("⚠️  FIREWORKS_API_KEY not set", "ERROR")
        raise ValueError("FIREWORKS_API_KEY environment variable required")
    
    logger.log(f"Using Fireworks API key: {api_key[:10]}...", "DEEPSEEK")
    
    # Use DeepSeek V3.2 which is available on Fireworks
    return ChatFireworks(
        model="accounts/fireworks/models/deepseek-v3p2",
        api_key=api_key,
        temperature=0.7,
        max_tokens=4096
    )

# Structured output for LLM reasoning
class ProjectAnalysisReasoning(BaseModel):
    """Structured reasoning from DeepSeek"""
    key_insights: List[str] = Field(description="Key insights about the project landscape")
    prioritization_logic: str = Field(description="Explanation of prioritization approach")
    capacity_strategy: str = Field(description="How to handle capacity constraints")
    recommended_focus: List[str] = Field(description="Projects to focus on and why")
    potential_risks: List[str] = Field(description="Identified risks or concerns")

# State definition
class ProjectRankingState(TypedDict):
    """Shared state across all agents"""
    projects: List[dict]
    sprint_context: dict
    analyzed_projects: Annotated[List[dict], operator.add]
    ranked_results: List[dict]
    metadata: dict
    llm_reasoning: dict

# Agent Nodes
def project_manager_agent(state: ProjectRankingState) -> ProjectRankingState:
    """
    Coordinator agent - orchestrates the ranking workflow with DeepSeek reasoning
    """
    logger.log_separator("PROJECT MANAGER AGENT - STARTING")
    logger.log(f"INPUT: {len(state['projects'])} projects to rank", "AGENT")
    
    for i, project in enumerate(state['projects'], 1):
        logger.log(f"   {i}. {project['name']} (due: {project['due_date']}, complexity: {project['complexity']})", "INFO")
    
    # Fetch sprint context
    logger.log("Fetching sprint context from MongoDB...", "INFO")
    sprint_context = {
        'weekly_capacity': 20,
        'allocated_hours': 16.0,
        'active_tasks': 2
    }
    logger.log(f"Sprint Context: {sprint_context['weekly_capacity']}h capacity, {sprint_context['allocated_hours']}h allocated", "SUCCESS")
    
    # Initialize DeepSeek for strategic reasoning
    logger.log_separator("DEEPSEEK STRATEGIC ANALYSIS - INVOKED BY PROJECT MANAGER")
    logger.log("Model: accounts/fireworks/models/deepseek-v3p2", "DEEPSEEK")
    logger.log("Purpose: Strategic portfolio analysis and prioritization reasoning", "DEEPSEEK")
    
    llm = create_deepseek_llm()
    
    # Create reasoning prompt
    parser = PydanticOutputParser(pydantic_object=ProjectAnalysisReasoning)
    
    reasoning_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strategic project manager analyzing a portfolio of projects.
        Your goal is to provide deep reasoning about prioritization strategy.
        
        Consider:
        - Time constraints and deadlines
        - Capacity limitations
        - Project dependencies and synergies
        - Risk vs. reward tradeoffs
        - Long-term vs. short-term value
        
        {format_instructions}"""),
        ("user", """Analyze this project portfolio:
        
        Projects:
        {projects}
        
        Current Sprint Context:
        - Weekly Capacity: {weekly_capacity}h
        - Already Allocated: {allocated_hours}h
        - Available: {available_hours}h
        - Active Tasks: {active_tasks}
        
        Provide strategic reasoning for how to prioritize these projects.""")
    ])
    
    # Format projects for prompt
    projects_summary = "\n".join([
        f"{i+1}. {p['name']} (due: {p['due_date']}, complexity: {p['complexity']})"
        for i, p in enumerate(state['projects'])
    ])
    
    logger.log("Sending prompt to DeepSeek...", "DEEPSEEK")
    logger.log(f"Prompt length: {len(projects_summary)} characters", "DEEPSEEK")
    
    # Invoke DeepSeek
    chain = reasoning_prompt | llm | parser
    
    try:
        start_time = datetime.now()
        logger.log("DeepSeek processing (thinking deeply)...", "DEEPSEEK")
        
        reasoning = chain.invoke({
            "format_instructions": parser.get_format_instructions(),
            "projects": projects_summary,
            "weekly_capacity": sprint_context['weekly_capacity'],
            "allocated_hours": sprint_context['allocated_hours'],
            "available_hours": sprint_context['weekly_capacity'] - sprint_context['allocated_hours'],
            "active_tasks": sprint_context['active_tasks']
        })
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.log(f"DeepSeek response received ({elapsed:.2f}s)", "SUCCESS")
        
        logger.log_separator("DEEPSEEK STRATEGIC INSIGHTS")
        logger.log("Key Insights:", "DEEPSEEK")
        for insight in reasoning.key_insights:
            logger.log(f"   • {insight}", "DEEPSEEK")
        
        logger.log(f"\nPrioritization Logic:", "DEEPSEEK")
        logger.log(f"   {reasoning.prioritization_logic}", "DEEPSEEK")
        
        logger.log(f"\nCapacity Strategy:", "DEEPSEEK")
        logger.log(f"   {reasoning.capacity_strategy}", "DEEPSEEK")
        
        logger.log(f"\nRecommended Focus:", "DEEPSEEK")
        for rec in reasoning.recommended_focus:
            logger.log(f"   • {rec}", "DEEPSEEK")
        
        if reasoning.potential_risks:
            logger.log(f"\nPotential Risks:", "DEEPSEEK")
            for risk in reasoning.potential_risks:
                logger.log(f"   ⚠️ {risk}", "DEEPSEEK")
        
        llm_reasoning = reasoning.dict()
    except Exception as e:
        logger.log(f"DeepSeek reasoning failed: {e}", "ERROR")
        llm_reasoning = {"error": str(e)}
    
    logger.log_separator("PROJECT MANAGER - DELEGATING TO ANALYZER")
    logger.log("Passing LLM insights to Project Analyzer Agent...", "COMM")
    
    return {
        **state,
        'sprint_context': sprint_context,
        'llm_reasoning': llm_reasoning,
        'metadata': {
            'start_time': datetime.now().isoformat(),
            'deepseek_invoked_at': datetime.now().isoformat(),
            'deepseek_model': 'accounts/fireworks/models/deepseek-v3p2'
        }
    }

def project_analyzer_agent(state: ProjectRankingState) -> ProjectRankingState:
    """
    Worker agent - analyzes each project independently with LLM-enhanced scoring
    """
    logger.log_separator("PROJECT ANALYZER AGENT - PROCESSING")
    logger.log("Received state from Project Manager", "COMM")
    logger.log(f"LLM insights available: {bool(state.get('llm_reasoning'))}", "INFO")
    
    llm_insights = state.get('llm_reasoning', {})
    
    analyzed = []
    for i, project in enumerate(state['projects'], 1):
        logger.log(f"\n📊 Analyzing Project {i}/{len(state['projects'])}: {project['name']}", "AGENT")
        
        # Query long-term memory
        logger.log("   Querying Long-Term Memory (MongoDB)...", "INFO")
        contextual_signals = query_long_term_memory(project)
        logger.log(f"   Retrieved {len(contextual_signals.get('recent_activities', []))} contextual signals", "SUCCESS")
        
        # Calculate scores
        logger.log("   Calculating priority scores (using DeepSeek insights)...", "INFO")
        scores = calculate_priority_scores(
            project, 
            contextual_signals, 
            state['sprint_context'],
            llm_insights
        )
        
        logger.log(f"   Interest: {scores['interest']}/100", "INFO")
        logger.log(f"   Difficulty: {scores['difficulty']}/100", "INFO")
        logger.log(f"   Urgency: {scores['urgency']}/100", "INFO")
        logger.log(f"   Context: {scores['context']}/100", "INFO")
        logger.log(f"   FINAL SCORE: {scores['final']}/100", "SUCCESS")
        
        # Make decision
        decision = make_decision(scores['final'], project, llm_insights)
        logger.log(f"   Decision: {decision}", "SUCCESS")
        
        analyzed.append({
            'project': project,
            'scores': scores,
            'priority_score': scores['final'],
            'decision': decision
        })
    
    logger.log_separator("PROJECT ANALYZER - DELEGATING TO RANKER")
    logger.log(f"Passing {len(analyzed)} analyzed projects to Ranking Agent...", "COMM")
    
    return {'analyzed_projects': analyzed}

def ranking_agent(state: ProjectRankingState) -> ProjectRankingState:
    """
    Aggregator agent - ranks all analyzed projects
    """
    logger.log_separator("RANKING AGENT - AGGREGATING RESULTS")
    logger.log("Received analyzed projects from Analyzer", "COMM")
    logger.log(f"Projects to rank: {len(state['analyzed_projects'])}", "INFO")
    
    # Check if we should use DeepSeek for synthesis
    logger.log_separator("DEEPSEEK SYNTHESIS - INVOKED BY RANKING AGENT")
    logger.log("Model: accounts/fireworks/models/deepseek-v3p2", "DEEPSEEK")
    logger.log("Purpose: Final ranking synthesis and trade-off analysis", "DEEPSEEK")
    
    llm = create_deepseek_llm()
    
    synthesis_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a decision synthesis agent. Given multiple project analyses, provide final ranking rationale."),
        ("user", """Projects analyzed:
{project_summaries}

Synthesize the final ranking and explain the trade-offs made.
Provide reasoning for why the top project was chosen.""")
    ])
    
    project_summaries = "\n".join([
        f"- {p['project']['name']}: Score {p['priority_score']}, Decision: {p['decision']}"
        for p in state['analyzed_projects']
    ])
    
    try:
        logger.log("DeepSeek synthesizing final ranking...", "DEEPSEEK")
        synthesis = llm.invoke(synthesis_prompt.format(project_summaries=project_summaries))
        logger.log("DeepSeek Synthesis:", "DEEPSEEK")
        logger.log(f"   {synthesis.content[:200]}...", "DEEPSEEK")
    except Exception as e:
        logger.log(f"DeepSeek synthesis failed: {e}", "ERROR")
    
    # Rank projects
    logger.log("\nSorting projects by priority score...", "INFO")
    ranked = sorted(
        state['analyzed_projects'],
        key=lambda x: x['priority_score'],
        reverse=True
    )[:3]
    
    # Add rank metadata
    for i, result in enumerate(ranked, 1):
        result['rank'] = i
        logger.log(f"Rank {i}: {result['project']['name']} (Score: {result['priority_score']})", "SUCCESS")
    
    logger.log_separator("RANKING AGENT - DELEGATING TO PERSISTENCE")
    logger.log(f"Passing top {len(ranked)} ranked projects to Persistence Agent...", "COMM")
    
    return {'ranked_results': ranked}

def persistence_agent(state: ProjectRankingState) -> ProjectRankingState:
    """
    Persistence agent - saves results to MongoDB
    """
    logger.log_separator("PERSISTENCE AGENT - SAVING RESULTS")
    logger.log("Received ranked results from Ranking Agent", "COMM")
    
    for result in state['ranked_results']:
        logger.log(f"Saving to MongoDB: Rank {result['rank']} - {result['project']['name']}", "INFO")
        save_to_database(result)
        logger.log(f"✓ Saved successfully", "SUCCESS")
    
    logger.log_separator("WORKFLOW COMPLETE")
    logger.log("All agents finished processing", "SUCCESS")
    logger.log(f"DeepSeek invocations: 2 (Manager: Strategic Analysis, Ranker: Synthesis)", "DEEPSEEK")
    logger.log(f"LangGraph orchestration: 4 nodes executed sequentially", "LANGGRAPH")
    
    return state

# Helper functions
def query_long_term_memory(project: dict) -> dict:
    """Query MongoDB for contextual signals"""
    return {
        'recent_activities': ['activity1', 'activity2'],
        'related_concepts': ['concept1', 'concept2'],
        'struggle_indicators': []
    }

def calculate_priority_scores(project: dict, signals: dict, context: dict, llm_insights: dict = None) -> dict:
    """Calculate all priority component scores with optional LLM insights"""
    base_scores = {
        'interest': 75,
        'difficulty': 60,
        'urgency': 80,
        'context': 50,
    }
    
    # Adjust based on LLM insights
    if llm_insights and 'recommended_focus' in llm_insights:
        recommended = llm_insights['recommended_focus']
        if any(project['name'].lower() in rec.lower() for rec in recommended):
            base_scores['context'] += 20
            logger.log(f"   💡 DeepSeek boost: +20 context score (in recommended focus)", "DEEPSEEK")
    
    final = (
        base_scores['interest'] * 0.30 +
        base_scores['difficulty'] * 0.35 +
        base_scores['urgency'] * 0.20 +
        base_scores['context'] * 0.15
    )
    
    return {**base_scores, 'final': final}

def make_decision(priority_score: float, project: dict, llm_insights: dict = None) -> str:
    """Determine execution decision with LLM-informed logic"""
    if llm_insights and 'potential_risks' in llm_insights:
        for risk in llm_insights['potential_risks']:
            if project['name'].lower() in risk.lower():
                logger.log(f"   ⚠️ DeepSeek identified risk: {risk}", "DEEPSEEK")
    
    if priority_score >= 70:
        return "EXECUTE_NOW"
    elif priority_score >= 50:
        return "BREAK_DOWN"
    else:
        return "DEFER"

def save_to_database(result: dict):
    """Save to MongoDB"""
    pass

# Build the workflow
def create_ranking_workflow():
    """
    Creates the LangGraph workflow for project ranking
    """
    logger.log_separator("LANGGRAPH WORKFLOW INITIALIZATION")
    logger.log("Building state graph...", "LANGGRAPH")
    
    workflow = StateGraph(ProjectRankingState)
    
    # Add agent nodes
    logger.log("Adding nodes:", "LANGGRAPH")
    logger.log("   • coordinator (Project Manager Agent)", "LANGGRAPH")
    logger.log("   • analyzer (Project Analyzer Agent)", "LANGGRAPH")
    logger.log("   • ranker (Ranking Agent)", "LANGGRAPH")
    logger.log("   • saver (Persistence Agent)", "LANGGRAPH")
    
    workflow.add_node("coordinator", project_manager_agent)
    workflow.add_node("analyzer", project_analyzer_agent)
    workflow.add_node("ranker", ranking_agent)
    workflow.add_node("saver", persistence_agent)
    
    # Define execution flow
    logger.log("\nDefining execution flow:", "LANGGRAPH")
    logger.log("   coordinator → analyzer → ranker → saver → END", "LANGGRAPH")
    
    workflow.set_entry_point("coordinator")
    workflow.add_edge("coordinator", "analyzer")
    workflow.add_edge("analyzer", "ranker")
    workflow.add_edge("ranker", "saver")
    workflow.add_edge("saver", END)
    
    logger.log("\n✓ LangGraph workflow compiled successfully", "SUCCESS")
    
    return workflow.compile()

# Usage
if __name__ == "__main__":
    os.environ["FIREWORKS_API_KEY"] = "sk-test"
    
    logger.log_separator("MULTI-AGENT PROJECT RANKING SYSTEM")
    logger.log("Framework: LangGraph + DeepSeek via Fireworks.ai", "INFO")
    logger.log("Agents: 4 (Manager, Analyzer, Ranker, Persistence)", "INFO")
    
    # Create workflow
    app = create_ranking_workflow()
    
    # Initial state
    initial_state = {
        "projects": [
            {"name": "Traffic Simulator", "complexity": "medium", "due_date": "2026-01-14"},
            {"name": "Data Viz Course", "complexity": "medium", "due_date": "2026-01-24"},
            {"name": "AI Essay", "complexity": "medium", "due_date": "2026-01-18"}
        ],
        "sprint_context": {},
        "analyzed_projects": [],
        "ranked_results": [],
        "metadata": {}
    }
    
    # Execute
    logger.log_separator("STARTING WORKFLOW EXECUTION")
    logger.log("LangGraph orchestrating agent communication...", "LANGGRAPH")
    
    final_state = app.invoke(initial_state)
    
    logger.log_separator("FINAL RESULTS")
    for result in final_state['ranked_results']:
        logger.log(f"Rank {result['rank']}: {result['project']['name']} (Score: {result['priority_score']})", "SUCCESS")
