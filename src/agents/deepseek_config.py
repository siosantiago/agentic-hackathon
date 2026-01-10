"""
DeepSeek LLM Configuration via Fireworks.ai for Multi-Agent System
"""
import os
from langchain_fireworks import ChatFireworks
from typing import Literal

def create_deepseek_llm(
    model: Literal["deepseek-v3", "deepseek-r1"] = "deepseek-v3",  # Changed default
    temperature: float = 0.7
) -> ChatFireworks:
    """
    Create DeepSeek LLM instance via Fireworks.ai
    
    Fireworks.ai provides access to DeepSeek models:
    - accounts/fireworks/models/deepseek-v3: Fast general purpose (RECOMMENDED)
    - accounts/fireworks/models/deepseek-r1: Deep reasoning (if available)
    
    Args:
        model: "deepseek-v3" for fast responses with reasoning
        temperature: Controls randomness (0.0-1.0)
    
    Returns:
        Configured ChatFireworks instance
    """
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        raise ValueError("FIREWORKS_API_KEY environment variable not set")
    
    # Map to Fireworks model names - use v3 which is confirmed available
    model_map = {
        "deepseek-v3": "accounts/fireworks/models/deepseek-v3",
        "deepseek-r1": "accounts/fireworks/models/deepseek-r1"  # May not be available
    }
    
    return ChatFireworks(
        model=model_map.get(model, model_map["deepseek-v3"]),
        api_key=api_key,
        temperature=temperature,
        max_tokens=4096
    )

# Example reasoning prompt templates
PROJECT_MANAGER_REASONING_PROMPT = """You are an expert project manager with deep analytical capabilities.

Analyze the following project portfolio and provide strategic reasoning:

PROJECTS:
{projects_summary}

CURRENT CONTEXT:
- Available Capacity: {available_capacity}h this week
- Active Sprint Tasks: {active_tasks}
- Team Focus Areas: {focus_areas}

PROVIDE DEEP REASONING ON:
1. Which projects offer the highest strategic value?
2. What are the hidden dependencies or risks?
3. How should capacity constraints influence prioritization?
4. What is the optimal sequencing strategy?
5. What trade-offs are being made?

Think step-by-step and provide your reasoning chain."""

DECISION_VALIDATION_PROMPT = """Given the following project analysis:

Project: {project_name}
Priority Score: {priority_score}/100
Proposed Decision: {decision}

Context:
{context}

VALIDATE THIS DECISION:
1. Does this align with strategic goals?
2. Are there any overlooked risks?
3. Should the decision be adjusted?
4. What would you recommend instead, if anything?

Provide your reasoning."""
