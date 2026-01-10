import { StateGraph, START, END } from '@langchain/langgraph';
import { synthesisArchitectAgent, ConceptExtraction, ProjectSuggestion } from './synthesis-architect-agent';
import { projectManagerAgent, ProjectRanking } from './project-manager-agent';
import mongoose from 'mongoose';
import dbConnect from './mongodb';

// Workflow State
export interface AgentWorkflowState {
  userId: string;
  timestamp: Date;
  concepts: ConceptExtraction;  // Will come from Librarian Agent (mocked for now)
  suggestedProjects?: ProjectSuggestion[];
  ranking?: ProjectRanking;
  error?: string;
}

// Mock Librarian Agent output (your team is building the real one)
export function getMockLibrarianOutput(): ConceptExtraction {
  return {
    concepts: [
      'Data Visualization',
      'Python',
      'Linear Algebra',
      'Graph Theory',
      'Traffic Optimization',
      'TypeScript',
      'React',
      'Machine Learning'
    ],
    knowledgeGaps: [
      'Matplotlib advanced features',
      'Matrix operations',
      'Algorithm complexity analysis'
    ],
    learningPatterns: {
      highEngagement: ['Data Visualization', 'Python', 'Traffic Optimization'],
      strugglingWith: ['Linear Algebra', 'Matrix operations'],
      recentFocus: ['TypeScript', 'React', 'Data Visualization']
    },
    suggestedTopics: [
      'Interactive visualizations',
      'Applied linear algebra',
      'Real-time data processing'
    ]
  };
}

// MongoDB Checkpoint Schema
const CheckpointSchema = new mongoose.Schema({
  threadId: { type: String, required: true, index: true },
  step: String,
  state: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

const WorkflowCheckpoint = mongoose.models.WorkflowCheckpoint || 
  mongoose.model('WorkflowCheckpoint', CheckpointSchema);

// Save checkpoint to MongoDB
async function saveCheckpoint(threadId: string, step: string, state: any) {
  await dbConnect();
  await WorkflowCheckpoint.create({
    threadId,
    step,
    state,
    timestamp: new Date(),
  });
  console.log(`   💾 Checkpoint saved: ${step}`);
}

// Architect Node
async function architectNode(state: AgentWorkflowState): Promise<Partial<AgentWorkflowState>> {
  const threadId = `workflow-${state.userId}-${state.timestamp.getTime()}`;
  
  console.log('\n🏗️ SYNTHESIS ARCHITECT AGENT - STARTING');
  console.log('-'.repeat(80));
  
  try {
    const suggestedProjects = await synthesisArchitectAgent.generateProjects(
      state.concepts,
      5,
      console.log
    );
    
    await saveCheckpoint(threadId, 'architect_complete', { suggestedProjects });
    
    console.log('✓ Architect Agent complete');
    return { suggestedProjects };
  } catch (error: any) {
    console.error('❌ Architect Agent failed:', error.message);
    return { error: `Architect failed: ${error.message}` };
  }
}

// Manager Node
async function managerNode(state: AgentWorkflowState): Promise<Partial<AgentWorkflowState>> {
  const threadId = `workflow-${state.userId}-${state.timestamp.getTime()}`;
  
  console.log('\n📊 PROJECT MANAGER AGENT - STARTING');
  console.log('-'.repeat(80));
  
  if (!state.suggestedProjects || state.suggestedProjects.length === 0) {
    return { error: 'No projects from Architect' };
  }

  try {
    // Convert suggestions to project format
    const projects = state.suggestedProjects.map(p => ({
      title: p.title,
      description: p.description,
      dueDate: new Date(p.suggestedDueDate),
      complexity: p.complexity,
      estimatedHours: p.estimatedHours,
      tags: p.tags,
      status: 'proposed' as const,
    }));

    const ranking = await projectManagerAgent.rankProjects(projects, undefined, console.log);
    
    await saveCheckpoint(threadId, 'manager_complete', { ranking });
    
    console.log('✓ Project Manager Agent complete');
    return { ranking };
  } catch (error: any) {
    console.error('❌ Manager Agent failed:', error.message);
    return { error: `Manager failed: ${error.message}` };
  }
}

// Conditional routing
function shouldContinue(state: AgentWorkflowState): string {
  if (state.error) {
    console.log(`❌ Stopping workflow due to error: ${state.error}`);
    return END;
  }
  return 'continue';
}

// Build workflow
export function createAgentWorkflow() {
  const workflow = new StateGraph<AgentWorkflowState>({
    channels: {
      userId: null,
      timestamp: null,
      concepts: null,
      suggestedProjects: null,
      ranking: null,
      error: null,
    },
  })
    .addNode('architect', architectNode)
    .addNode('manager', managerNode)
    .addEdge(START, 'architect')
    .addConditionalEdges('architect', shouldContinue, {
      continue: 'manager',
      [END]: END,
    })
    .addEdge('manager', END);

  return workflow.compile();
}

// Main execution
export async function runAgentWorkflow(
  userId: string = 'default_user',
  mockConcepts?: ConceptExtraction
): Promise<AgentWorkflowState> {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 AGENT WORKFLOW: Architect → Manager');
  console.log('='.repeat(80));
  console.log(`User: ${userId}`);
  console.log(`Time: ${new Date().toISOString()}`);

  await dbConnect();

  const app = createAgentWorkflow();
  
  // Use mock Librarian data (your team is building the real one)
  const concepts = mockConcepts || getMockLibrarianOutput();
  
  console.log('\n📚 INPUT (Mock Librarian Output):');
  console.log(`   Concepts: ${concepts.concepts.join(', ')}`);
  console.log(`   Knowledge Gaps: ${concepts.knowledgeGaps.join(', ')}`);
  console.log(`   High Engagement: ${concepts.learningPatterns.highEngagement.join(', ')}`);

  const initialState: AgentWorkflowState = {
    userId,
    timestamp: new Date(),
    concepts,
  };

  try {
    const result = await app.invoke(initialState);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ WORKFLOW COMPLETE');
    console.log('='.repeat(80));
    console.log(`Projects Generated: ${result.suggestedProjects?.length || 0}`);
    console.log(`Top Priority: ${result.ranking?.topProjects[0]?.project.title || 'N/A'}`);
    console.log('='.repeat(80) + '\n');
    
    return result as AgentWorkflowState;
  } catch (error: any) {
    console.error('\n❌ Workflow failed:', error);
    throw error;
  }
}
