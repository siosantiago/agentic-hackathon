# Troubleshooting Guide

## DeepSeek Model Errors

### Error: "Model not found, inaccessible, and/or not deployed"

**Your log shows:**
```
✗ DeepSeek reasoning failed: {"error": {"message": "Model not found, inaccessible, and/or not deployed", "param": "model", "code": "NOT_FOUND"...
```

**Problem**: The model name is incorrect for Fireworks.ai

**Solution**: Use the correct model names

#### Available DeepSeek Models on Fireworks.ai

1. **DeepSeek V3** (Recommended) ✅
   ```python
   model="accounts/fireworks/models/deepseek-v3"
   ```
   - Fast and efficient
   - Good reasoning capabilities
   - Always available

2. **DeepSeek V3.2** ✅
   ```python
   model="accounts/fireworks/models/deepseek-v3p2"
   ```
   - Latest version
   - Enhanced performance

3. **DeepSeek R1** ❓ (May not be available)
   ```python
   model="accounts/fireworks/models/deepseek-r1"
   ```
   - Deep reasoning mode
   - Check Fireworks dashboard for availability

#### How to Check Available Models

```bash
# List all models on Fireworks
curl https://api.fireworks.ai/inference/v1/models \
  -H "Authorization: Bearer $FIREWORKS_API_KEY" | jq '.data[] | select(.id | contains("deepseek"))'
```

Or visit: https://fireworks.ai/models

#### Quick Fix

Change line in `langgraph_workflow.py`:

```python
# ❌ WRONG
model="deepseek-reasoner"  # This doesn't exist

# ✅ CORRECT
model="accounts/fireworks/models/deepseek-v3"  # This exists
```

#### Verify It Works

```bash
# Test the model
python -c "
from langchain_fireworks import ChatFireworks
import os

llm = ChatFireworks(
    model='accounts/fireworks/models/deepseek-v3',
    api_key=os.getenv('FIREWORKS_API_KEY')
)

response = llm.invoke('Explain what you are in one sentence.')
print('✓ Success!')
print(f'Response: {response.content}')
"
```

## Your Current Status

✅ **Working:**
- LangGraph orchestration
- Agent communication
- MongoDB persistence
- Logging system
- Environment setup

❌ **Not Working:**
- DeepSeek LLM calls (wrong model name)

## Fix and Re-run

```bash
# 1. Update the model name (done in code above)

# 2. Re-run the workflow
source venv/bin/activate
python run_workflow.py

# 3. Check for success
grep "DeepSeek response received" logs/agent-ranking-*.log
```

## Expected Output After Fix

```
[2026-01-10T15:27:57.145058] 🧠 Model: accounts/fireworks/models/deepseek-v3
[2026-01-10T15:27:57.206177] 🧠 DeepSeek processing (thinking deeply)...
[2026-01-10T15:27:58.512Z] ✓ DeepSeek response received (1.30s)
[2026-01-10T15:27:58.512Z] 🧠 Key Insights:
[2026-01-10T15:27:58.512Z] 🧠    • Traffic Simulator has highest urgency...
[2026-01-10T15:27:58.512Z] 🧠    • Consider breaking down large projects...
```

## Other Common Issues

### SSL Warning (Can Ignore)
```
NotOpenSSLWarning: urllib3 v2 only supports OpenSSL 1.1.1+
```
**Solution**: This is just a warning, doesn't affect functionality

### Import Errors
```
ModuleNotFoundError: No module named 'langchain_fireworks'
```
**Solution**: 
```bash
pip install --upgrade langchain-fireworks
```

### API Key Not Found
```
✗ FIREWORKS_API_KEY not set
```
**Solution**:
```bash
export FIREWORKS_API_KEY="fw_your_key_here"
```
