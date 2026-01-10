import os
from fastapi import FastAPI
from pymongo import MongoClient
from dotenv import load_dotenv # <--- Add this

# 1. Load the .env file
load_dotenv() 

app = FastAPI()

# 2. Get the URI and add a debug print
uri = os.getenv("MONGO_URI")
print(f"Connecting to: {uri}") # This should NOT say 'None' or 'localhost'

if not uri:
    raise ValueError("MONGO_URI is missing! Check your .env file.")

client = MongoClient(uri)
db = client.AcademicPlanner

@app.post("/ingest")
async def ingest_data(data: dict):
    result = db.Raw_Artifacts.insert_one(data)
    return {"status": "success", "id": str(result.inserted_id)}