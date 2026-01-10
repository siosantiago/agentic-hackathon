"""
Quick test to verify DeepSeek via Fireworks.ai is working
"""
import os
from dotenv import load_dotenv
from langchain_fireworks import ChatFireworks

# Load environment variables from .env.local
load_dotenv('.env.local')

def test_deepseek():
    """Test DeepSeek connection"""
    
    print("=" * 80)
    print("Testing DeepSeek via Fireworks.ai")
    print("=" * 80)
    
    # Check API key
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        print("❌ FIREWORKS_API_KEY not set")
        print("Run: export FIREWORKS_API_KEY='fw_your_key_here'")
        return False
    
    print(f"✓ API Key found: {api_key[:10]}...")
    
    # Test each model
    models_to_test = [
        "accounts/fireworks/models/deepseek-v3",
        "accounts/fireworks/models/deepseek-v3p2",
    ]
    
    for model_name in models_to_test:
        print(f"\n📡 Testing model: {model_name}")
        
        try:
            llm = ChatFireworks(
                model=model_name,
                api_key=api_key,
                temperature=0.7,
                max_tokens=100
            )
            
            response = llm.invoke("Explain what you are in one sentence.")
            
            print(f"✓ {model_name} is working!")
            print(f"   Response: {response.content[:100]}...")
            
        except Exception as e:
            print(f"✗ {model_name} failed: {str(e)[:100]}")
    
    print("\n" + "=" * 80)
    print("✓ Test complete!")
    print("=" * 80)
    
    return True

if __name__ == "__main__":
    test_deepseek()
