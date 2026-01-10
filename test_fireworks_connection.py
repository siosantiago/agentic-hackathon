"""
Test Fireworks.ai connection with your API key
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

def test_fireworks():
    """Test Fireworks.ai API connection"""
    
    print("=" * 80)
    print("Testing Fireworks.ai Connection")
    print("=" * 80)
    
    # Check API key
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        print("❌ FIREWORKS_API_KEY not found in .env file")
        print("\nCreate a .env file with:")
        print("FIREWORKS_API_KEY=fw_26UmjthTn51v44oodoK5dK")
        return False
    
    print(f"✓ API Key found: {api_key[:15]}...")
    
    # Test with langchain_fireworks
    try:
        from langchain_fireworks import ChatFireworks
        
        print("\n" + "=" * 80)
        print("Testing DeepSeek V3 Model")
        print("=" * 80)
        
        llm = ChatFireworks(
            model="accounts/fireworks/models/deepseek-v3",
            api_key=api_key,
            temperature=0.7,
            max_tokens=200
        )
        
        print("📡 Sending test prompt to DeepSeek V3...")
        response = llm.invoke("In one sentence, explain what DeepSeek is and why it's useful for coding projects.")
        
        print("\n✅ SUCCESS! DeepSeek V3 is working!")
        print("\n📝 Response:")
        print("-" * 80)
        print(response.content)
        print("-" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        
        # Check if it's a model availability issue
        if "not found" in str(e).lower() or "inaccessible" in str(e).lower():
            print("\n💡 Trying alternative model: deepseek-v3p2...")
            try:
                llm2 = ChatFireworks(
                    model="accounts/fireworks/models/deepseek-v3p2",
                    api_key=api_key,
                    temperature=0.7,
                    max_tokens=200
                )
                response2 = llm2.invoke("Say 'DeepSeek V3.2 works!' in one sentence.")
                print("\n✅ DeepSeek V3.2 works instead!")
                print(f"📝 Response: {response2.content}")
                return True
            except Exception as e2:
                print(f"❌ DeepSeek V3.2 also failed: {str(e2)}")
        
        return False

if __name__ == "__main__":
    success = test_fireworks()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ You're ready to run the full workflow!")
        print("=" * 80)
        print("\nNext steps:")
        print("  python run_workflow.py")
        print("  or")
        print("  ./run_with_logging.sh")
    else:
        print("\n" + "=" * 80)
        print("❌ Please fix the errors above before running the workflow")
        print("=" * 80)
