#!/bin/bash
# Complete startup script for Frappe LMS with AI Agent Integration

set -e

echo "================================"
echo "FRAPPE LMS + AI AGENT STARTUP"
echo "================================"

# Step 1: Start Frappe LMS Docker
echo -e "\n📦 Step 1: Starting Frappe LMS Docker..."
cd "$(dirname "$0")"
docker compose up -d

# Wait for LMS to be ready
echo -e "\n⏳ Waiting for Frappe LMS to be ready..."
MAX_WAIT=60
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -s http://localhost:8000/lms > /dev/null 2>&1; then
        echo "✓ Frappe LMS is ready!"
        break
    fi
    echo "  Waiting... ($WAIT_TIME/$MAX_WAIT seconds)"
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "❌ Timeout waiting for Frappe LMS"
    exit 1
fi

# Step 2: Run agent workflow to generate projects
echo -e "\n🤖 Step 2: Running AI Agent Workflow..."
cd ..
python run_integrated_workflow.py

# Step 3: Sync to Frappe LMS
echo -e "\n🔄 Step 3: Syncing projects to Frappe LMS..."
cd demo
python frappe_lms_integration.py

# Step 4: Start auto-sync monitor in background (optional)
echo -e "\n👀 Step 4: Starting auto-sync monitor..."
python auto_sync_lms.py &
SYNC_PID=$!
echo "Auto-sync running in background (PID: $SYNC_PID)"

echo -e "\n================================"
echo "✅ STARTUP COMPLETE!"
echo "================================"
echo ""
echo "Access points:"
echo "  • Frappe LMS:  http://localhost:8000/lms"
echo "  • Login:       Administrator / admin"
echo "  • Next.js UI:  http://localhost:3000"
echo ""
echo "Your top 3 AI-ranked projects are now available as courses!"
echo ""
echo "To stop auto-sync: kill $SYNC_PID"
echo "To stop everything: docker compose down"
echo ""
