# Setting up DeepSeek via Fireworks.ai

## Why Fireworks.ai?

Fireworks.ai provides optimized access to DeepSeek models with:
- **Faster inference** than direct DeepSeek API
- **Better reliability** and uptime
- **Simple integration** with LangChain
- **Pay-per-use pricing**

## Step 1: Get Fireworks.ai API Key

1. Go to [Fireworks.ai](https://fireworks.ai)
2. Sign up for an account
3. Navigate to **Settings** → **API Keys**
4. Create a new API key
5. Copy the key (starts with `fw_...`)

## Step 2: Set Environment Variable

### Option A: Using .env file (Recommended)
```bash
# Copy the example
cp .env.example .env

# Edit the file
nano .env
# or
code .env
```

Add your Fireworks key:
```
FIREWORKS_API_KEY=fw_your_actual_key_here
```

### Option B: Export directly
```bash
export FIREWORKS_API_KEY="fw_your_actual_key_here"
```

### Option C: Add to your shell profile
```bash
# For bash
echo 'export FIREWORKS_API_KEY="fw_your_actual_key_here"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export FIREWORKS_API_KEY="fw_your_actual_key_here"' >> ~/.zshrc
source ~/.zshrc
```

## Step 3: Verify Installation

```bash
# Activate venv
source venv/bin/activate

# Test Fireworks connection
python -c "
import os
from langchain_fireworks import ChatFireworks

api_key = os.getenv('FIREWORKS_API_KEY')
print(f'API Key set: {bool(api_key)}')

if api_key:
    llm = ChatFireworks(
        model='accounts/fireworks/models/deepseek-r1',
        api_key=api_key
    )
    response = llm.invoke('Say hello!')
    print(f'✓ Connection successful!')
    print(f'Response: {response.content}')
else:
    print('✗ FIREWORKS_API_KEY not set')
"
```

## Step 4: Run the Workflow

```bash
# Make sure venv is activated
source venv/bin/activate

# Run with logs
./run_with_logging.sh

# Or run directly
python run_workflow.py
```

## What Models Are Available?

### DeepSeek R1 (Reasoning) - **Recommended**
```python
model="accounts/fireworks/models/deepseek-r1"
```
- Best for: Strategic analysis, complex reasoning
- Speed: Slower but more thorough
- Use case: Project Manager strategic analysis

### DeepSeek V3 (Fast)
```python
model="accounts/fireworks/models/deepseek-v3"
```
- Best for: Quick responses, simple tasks
- Speed: Very fast
- Use case: Quick scoring, simple classifications

## Expected Logs with DeepSeek

When properly configured, you'll see:

```
[2026-01-10T21:47:05.698Z] 🧠 DEEPSEEK STRATEGIC ANALYSIS - INVOKED BY PROJECT MANAGER
[2026-01-10T21:47:05.698Z] 🧠 Model: accounts/fireworks/models/deepseek-r1
[2026-01-10T21:47:05.698Z] 🧠 Provider: Fireworks.ai
[2026-01-10T21:47:05.698Z] 🧠 Purpose: Strategic portfolio analysis
[2026-01-10T21:47:05.698Z] 🧠 Sending prompt to DeepSeek...
[2026-01-10T21:47:06.234Z] 🧠 DeepSeek processing (thinking deeply)...
[2026-01-10T21:47:08.512Z] ✓ DeepSeek response received (2.28s)
[2026-01-10T21:47:08.512Z] 🧠 Key Insights:
[2026-01-10T21:47:08.512Z] 🧠    • Traffic Simulator has highest urgency...
```

## Troubleshooting

### "FIREWORKS_API_KEY not set"
```bash
# Check if set
echo $FIREWORKS_API_KEY

# If empty, export it
export FIREWORKS_API_KEY="fw_your_key_here"
```

### "ModuleNotFoundError: langchain_fireworks"
```bash
# Reinstall dependencies
pip install --upgrade langchain-fireworks
```

### "API Key Invalid"
- Make sure key starts with `fw_`
- Regenerate key from Fireworks dashboard
- Check for spaces or quotes in the key

### "Model not found"
Try the explicit model name:
```python
model="accounts/fireworks/models/deepseek-r1"
```

## Cost Estimation

Fireworks.ai pricing (as of 2024):
- **DeepSeek R1**: ~$0.15 per 1M tokens
- **DeepSeek V3**: ~$0.05 per 1M tokens

For this workflow (3 projects):
- Estimated tokens: ~2,000-5,000
- Estimated cost: **<$0.01 per run**

Very affordable for testing and development!
