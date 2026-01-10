
import os
import time
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.AcademicPlanner

print("Checking Agent_State:")
for doc in db.Agent_State.find().sort("timestamp", -1).limit(5):
    print(f"- {doc['message']}")

print("\nChecking Project_Proposals:")
for doc in db.Project_Proposals.find().sort("timestamp", -1).limit(2):
    print(f"- Title: {doc.get('title')}")
    print(f"  Rationale: {doc.get('rationale')}")
