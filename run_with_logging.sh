#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamp for log file
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S")
LOG_FILE="logs/agent-ranking-${TIMESTAMP}.log"

echo "Starting Multi-Agent Workflow..."
echo "Logs will be saved to: $LOG_FILE"

# Run the workflow and tee output to both console and log file
python run_workflow.py 2>&1 | tee "$LOG_FILE"

echo ""
echo "✓ Workflow complete. Logs saved to: $LOG_FILE"
