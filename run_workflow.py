"""
Run the Multi-Agent Project Ranking Workflow with DeepSeek via Fireworks.ai
"""
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from agents.langgraph_workflow import create_ranking_workflow, logger

def check_environment():
    """Check if environment is properly configured"""
    logger.log_separator("ENVIRONMENT CHECK")
    
    # Check Fireworks API Key
    fireworks_key = os.getenv("FIREWORKS_API_KEY")
    if fireworks_key:
        logger.log(f"✓ FIREWORKS_API_KEY set ({fireworks_key[:10]}...)", "SUCCESS")
    else:
        logger.log("✗ FIREWORKS_API_KEY not set", "ERROR")
        logger.log("  Add to .env file: FIREWORKS_API_KEY=fw_your_key_here", "INFO")
        return False
    
    # Check Python packages
    try:
        import langchain_fireworks
        logger.log("✓ langchain_fireworks installed", "SUCCESS")
    except ImportError:
        logger.log("✗ langchain_fireworks not installed", "ERROR")
        logger.log("  Run: pip install langchain-fireworks", "INFO")
        return False
    
    try:
        import langgraph
        logger.log("✓ langgraph installed", "SUCCESS")
    except ImportError:
        logger.log("✗ langgraph not installed", "ERROR")
        logger.log("  Run: pip install -r requirements.txt", "INFO")
        return False
    
    return True

def main():
    """Run the project ranking workflow"""
    
    # Check environment first
    if not check_environment():
        logger.log("\n❌ Environment check failed. Please fix issues above.", "ERROR")
        return None
    
    # Create sample projects
    projects = [
        {
            "name": "Learn Data Visualization with Python Complexity",
            "complexity": "medium",
            "due_date": "2026-01-24",
            "estimated_hours": 8
        },
        {
            "name": "Write a Long-Form Essay on AI & Education",
            "complexity": "medium",
            "due_date": "2026-01-18",
            "estimated_hours": 8
        },
        {
            "name": "Build a Traffic Flow Simulator",
            "complexity": "medium",
            "due_date": "2026-01-14",
            "estimated_hours": 8
        }
    ]
    
    logger.log_separator("MULTI-AGENT PROJECT RANKING SYSTEM")
    logger.log(f"Framework: LangGraph + DeepSeek (via Fireworks.ai)", "INFO")
    logger.log(f"Timestamp: {datetime.now().isoformat()}", "INFO")
    logger.log(f"Projects to analyze: {len(projects)}", "INFO")
    
    # Create workflow
    logger.log("\nBuilding workflow...", "INFO")
    app = create_ranking_workflow()
    
    # Initial state
    initial_state = {
        "projects": projects,
        "sprint_context": {},
        "analyzed_projects": [],
        "ranked_results": [],
        "metadata": {}
    }
    
    # Execute workflow
    logger.log_separator("STARTING WORKFLOW EXECUTION")
    
    try:
        final_state = app.invoke(initial_state)
        
        logger.log_separator("FINAL RESULTS")
        logger.log("Top 3 Projects:", "SUCCESS")
        for result in final_state['ranked_results']:
            logger.log(
                f"Rank {result['rank']}: {result['project']['name']} "
                f"(Score: {result['priority_score']:.1f})", 
                "SUCCESS"
            )
        
        # Show metadata
        if 'metadata' in final_state and 'deepseek_invoked_at' in final_state['metadata']:
            logger.log(f"\n📊 Metadata:", "INFO")
            logger.log(f"  Model: {final_state['metadata'].get('deepseek_model', 'N/A')}", "INFO")
            logger.log(f"  Invoked at: {final_state['metadata'].get('deepseek_invoked_at', 'N/A')}", "INFO")
        
        return final_state
        
    except Exception as e:
        logger.log(f"Workflow failed: {e}", "ERROR")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    main()
