
import os
import time
import json
import logging
from typing import List, Dict, Any
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv('.env.local')

# Configuration
MONGO_URI = os.getenv("MONGODB_URI")  # Changed from MONGO_URI to MONGODB_URI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_NAME = "AcademicPlanner"
COLLECTION_KG = "Knowledge_Graph"
COLLECTION_STATE = "Agent_State"
COLLECTION_PROPOSALS = "Project_Proposals"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("agent.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is missing.")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is missing.")

# Configure Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

def get_mongo_client():
    """Establishes a connection to MongoDB."""
    return MongoClient(MONGO_URI)

def get_recent_concepts(db, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetches the most recent concepts from the Knowledge Graph."""
    try:
        cursor = db[COLLECTION_KG].find().sort("_id", -1).limit(limit)
        return list(cursor)
    except Exception as e:
        logger.error(f"Error fetching recent concepts: {e}")
        return []

def log_agent_state(db, message: str):
    """Logs the agent's internal monologue to Agent_State."""
    try:
        entry = {
            "timestamp": datetime.now(),
            "message": message,
            "agent": "Synthesis_Architect"
        }
        db[COLLECTION_STATE].insert_one(entry)
        logger.info(f"Agent State: {message}")
    except Exception as e:
        logger.error(f"Error logging agent state: {e}")

def generate_proposal(concepts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates a project proposal using Gemini based on concepts."""
    if not concepts:
        return None

    # Prepare concept summary
    concept_summary = "\n".join([f"- {c.get('name', 'Unknown')}: {c.get('description', '')}" for c in concepts])

    prompt = (
        "You are an academic synthesis architect. Analyze the following concepts and find 'Conceptual Bridges' "
        "connecting them (e.g., how Math relates to CS). Then, propose a 'Unified Weekly Project' "
        "that combines these learnings.\n\n"
        f"Concepts:\n{concept_summary}\n\n"
        "Output strictly valid JSON with the following structure:\n"
        "{\n"
        "  'title': 'Project Title',\n"
        "  'rationale': 'Explanation of connections and value',\n"
        "  'difficulty': 'Easy/Medium/Hard',\n"
        "  'first_step': 'A specific code task to start'\n"
        "}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json'
            )
        )
        
        content = response.text
        logger.info(f"Gemini Response Content: {content}")
        
        return json.loads(content)
        
    except Exception as e:
        logger.error(f"Error generating proposal: {e}")
        # Fallback proposal
        return {
            "title": "Fallback Project: Interdisciplinary Exploration",
            "rationale": f"Unable to access reasoning engine ({e}). Combining available concepts generically.",
            "difficulty": "Medium",
            "first_step": "Review the most recent concepts manually."
        }

def save_proposal(db, proposal: Dict[str, Any]):
    """Saves the generated proposal to Project_Proposals."""
    try:
        proposal["timestamp"] = datetime.now()
        db[COLLECTION_PROPOSALS].insert_one(proposal)
        logger.info(f"Saved proposal: {proposal.get('title')}")
    except Exception as e:
        logger.error(f"Error saving proposal: {e}")

def main():
    """Main loop watching the Knowledge Graph."""
    db_client = get_mongo_client()
    db = db_client[DB_NAME]
    
    logger.info("Synthesis Architect Agent Started (Gemini SDK). Watching for changes...")
    log_agent_state(db, "Synthesis Architect is online and watching.")

    # Watcher loop
    try:
        pipeline = [{"$match": {"operationType": "insert"}}]
        
        with db[COLLECTION_KG].watch(pipeline) as stream:
            for change in stream:
                logger.info("Detected new concept insertion.")
                
                recent_concepts = get_recent_concepts(db, limit=5)
                log_agent_state(db, f"Detected new concept. Analyzing context of last {len(recent_concepts)} concepts...")
                
                proposal = generate_proposal(recent_concepts)
                
                if proposal:
                    log_agent_state(db, "Found a connection! Proposing a unified project.")
                    save_proposal(db, proposal)
                else:
                    log_agent_state(db, "Could not generate a coherent proposal at this time.")

    except PyMongoError as e:
        logger.error(f"MongoDB Watch Error: {e}")
    except KeyboardInterrupt:
        logger.info("Stopping agent...")
    finally:
        db_client.close()

if __name__ == "__main__":
    main()
