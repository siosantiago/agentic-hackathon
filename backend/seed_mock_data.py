
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pymongo import MongoClient
from google import genai
from google.genai import types

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
gemini_key = os.getenv("GEMINI_API_KEY")

if not gemini_key:
    raise ValueError("GEMINI_API_KEY is missing")

client = genai.Client(api_key=gemini_key)
mongo_client = MongoClient(mongo_uri)
db = mongo_client.AcademicPlanner

def get_embedding(text):
    try:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                title="Academic Concept"
            )
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

def seed_demo_data():
    # 1. Clear collections for a clean demo state
    print("🧹 Clearing old data...")
    db.Raw_Artifacts.delete_many({})
    db.Knowledge_Graph.delete_many({})
    db.Project_Proposals.delete_many({})
    db.Agent_State.delete_many({})

    print("Planting new signals...")

    # 2. Raw Artifacts - The "Signals"
    signals = [
        {
            "source": "University Portal",
            "title": "Degree Requirements: Business Administration",
            "content": """
            Prerequisites:
            - Principles of Business: UGBA 10X (UC Berkeley only)
            - Economics: ECON 1 or ECON 2
            - Statistics: STAT 20, STAT 21, or STAT 131A
            - Calculus: MATH 16A + 16B, or MATH 51 + 52
            - English: R&C Part A and Part B
            """,
            "timestamp": datetime.now(timezone.utc) - timedelta(days=1)
        },
        {
            "source": "Canvas",
            "title": "MATH 16A: Analytic Geometry and Calculus",
            "content": "Syllabus: Derivatives, limits, continuity, and applications to business and economics.",
            "timestamp": datetime.now(timezone.utc) - timedelta(hours=2)
        },
        {
            "source": "Email",
            "title": "Advisor Meeting Summary",
            "content": "Focus on finishing the Statistics requirement (STAT 20) and Microeconomics (ECON 1) this semester.",
            "timestamp": datetime.now(timezone.utc)
        }
    ]
    
    db.Raw_Artifacts.insert_many(signals)

    # Mock Knowledge Graph Concepts (Derived from the curriculum)
    concepts = [
        {
            "name": "Calculus",
            "category": "Mathematics",
            "description": "Study of continuous change, limits, derivatives, and integrals.",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "name": "Microeconomics",
            "category": "Economics",
            "description": "Study of individual decision making and resource allocation (ECON 1 material).",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "name": "Descriptive Statistics",
            "category": "Statistics",
            "description": "Methods for summarizing and organizing data (STAT 20 core concept).",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "name": "Business Principles",
            "category": "Business",
            "description": "Foundational concepts of business administration and management (UGBA 10X).",
            "timestamp": datetime.now(timezone.utc)
        }
    ]

    print("Generating embeddings and inserting into Knowledge_Graph...")
    for concept in concepts:
        # Create a rich text representation for the embedding
        text_to_embed = f"{concept['name']}: {concept['description']} Category: {concept['category']}"
        concept['embedding'] = get_embedding(text_to_embed)
        
        if concept['embedding']:
            db.Knowledge_Graph.insert_one(concept)
            print(f"Inserted concept: {concept['name']}")
        else:
            print(f"Skipped {concept['name']} due to embedding error.")

    # 3. Initial Agent State
    state = {
        "session": "curriculum_demo",
        "active_agent": "Synthesis Architect",
        "internal_monologue": "Curriculum data loaded. analyzing prerequisites and potential projects...",
        "last_updated": datetime.now(timezone.utc)
    }
    db.Agent_State.update_one({"session": "curriculum_demo"}, {"$set": state}, upsert=True)

    print("🚀 Student Curriculum Data is live!")

if __name__ == "__main__":
    seed_demo_data()