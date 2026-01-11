#!/bin/bash

# Activate the virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
    echo "Current Python: $(which python)"
    echo ""
    echo "To run the workflow:"
    echo "  python run_workflow.py"
    echo ""
    echo "To deactivate:"
    echo "  deactivate"
else
    echo "❌ Virtual environment not found!"
    echo "Run './setup_venv.sh' first to create it"
    exit 1
fi
