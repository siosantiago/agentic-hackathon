
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    # The new SDK might expose models via client.models.list() or similar.
    # checking based on common patterns if exact method is unknown, 
    # but google.genai usually maps close to the API.
    # If client.models.list() exists:
    for m in client.models.list():
        print(f"Model: {m.name}")
        # print(f"Supported methods: {m.supported_generation_methods}")

except Exception as e:
    print(f"Error listing models: {e}")
