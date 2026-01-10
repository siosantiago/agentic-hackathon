import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface ConceptExtraction {
  concepts: string[];
  knowledgeGaps: string[];
  learningPatterns: {
    highEngagement: string[];
    strugglingWith: string[];
    recentFocus: string[];
  };
  suggestedTopics: string[];
}

export interface ProjectSuggestion {
  title: string;
  description: string;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  estimatedHours: number;
  tags: string[];
  crossCurricularLinks: string[];
  learningObjectives: string[];
  suggestedDueDate: string;
}

export class SynthesisArchitectAgent {
  private llm: BaseChatModel;

  constructor() {
    // Priority: Fireworks.ai > Anthropic > OpenAI
    const useFireworks = !!process.env.FIREWORKS_API_KEY;
    const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
    
    if (useFireworks) {
      console.log('🔥 Using Fireworks.ai (DeepSeek v3.2) for project generation');
      this.llm = new ChatOpenAI({
        modelName: 'accounts/fireworks/models/deepseek-v3p2',
        temperature: 0.7,
        openAIApiKey: process.env.FIREWORKS_API_KEY,
        configuration: {
          baseURL: 'https://api.fireworks.ai/inference/v1',
        },
      });
    } else if (useAnthropic) {
      console.log('🤖 Using Claude (Anthropic) for project generation');
      this.llm = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      console.log('🤖 Using GPT-4o-mini (OpenAI) for project generation');
      this.llm = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateProjects(
    conceptExtraction: ConceptExtraction,
    count: number = 5,
    log?: (message: string) => void
  ): Promise<ProjectSuggestion[]> {
    const logger = log || console.log;

    logger('🏗️ Synthesis Architect Agent: Generating project ideas...');
    logger(`   Input: ${conceptExtraction.concepts.length} concepts, ${conceptExtraction.knowledgeGaps.length} gaps`);

    const prompt = `You are a Synthesis Architect Agent designing personalized learning projects for a student.

Student's Learning Profile:
- Core Concepts: ${conceptExtraction.concepts.join(', ')}
- Knowledge Gaps: ${conceptExtraction.knowledgeGaps.join(', ')}
- High Engagement Topics: ${conceptExtraction.learningPatterns.highEngagement.join(', ')}
- Struggling With: ${conceptExtraction.learningPatterns.strugglingWith.join(', ')}
- Recent Focus: ${conceptExtraction.learningPatterns.recentFocus.join(', ')}

Generate ${count} innovative project ideas that:
1. Bridge multiple concepts (cross-curricular connections)
2. Address knowledge gaps through hands-on application
3. Build on high-engagement topics (leverage existing interest)
4. Provide practice in struggling areas (targeted skill development)
5. Are practical and immediately useful (real-world applications)

For each project, provide:
- Title: Engaging and specific (e.g., "Build a Traffic Simulator with Real-Time Visualization")
- Description: 2-3 sentences describing the project and clear deliverables
- Complexity: low (3h) | medium (8h) | high (16h) | very-high (30h)
- Estimated Hours: Realistic time estimate
- Tags: 3-5 related concept tags
- Cross-Curricular Links: How it connects different topics
- Learning Objectives: 2-3 specific skills they'll master
- Suggested Due Date: Format YYYY-MM-DD, between 7-30 days from now (today is ${new Date().toISOString().split('T')[0]})

Return ONLY a valid JSON array with NO markdown formatting, just the raw JSON:
[
  {
    "title": "Project Title",
    "description": "Detailed description with clear deliverables and scope.",
    "complexity": "medium",
    "estimatedHours": 8,
    "tags": ["tag1", "tag2", "tag3"],
    "crossCurricularLinks": ["Links concept A with concept B through practical application"],
    "learningObjectives": ["Master skill X", "Understand concept Y"],
    "suggestedDueDate": "2026-01-20"
  }
]`;

    try {
      logger('   Calling GPT-4 for project generation...');
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      logger('   ✓ Received response from GPT-4');

      // Extract JSON array from response (handle markdown code blocks)
      let jsonText = content;
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }
      
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const projects = JSON.parse(jsonMatch[0]);
        logger(`   ✓ Generated ${projects.length} project suggestions`);
        
        // Log each project
        projects.forEach((p: ProjectSuggestion, i: number) => {
          logger(`   ${i + 1}. ${p.title} (${p.complexity}, ${p.estimatedHours}h)`);
        });
        
        return projects;
      }

      logger('   ⚠️ Could not parse JSON from LLM response, returning empty array');
      return [];
    } catch (error: any) {
      logger(`   ❌ Error generating projects: ${error.message}`);
      throw error;
    }
  }
}

let _instance: SynthesisArchitectAgent | null = null;

export const synthesisArchitectAgent = {
  generateProjects: async (
    conceptExtraction: ConceptExtraction,
    count: number = 5,
    log?: (message: string) => void
  ): Promise<ProjectSuggestion[]> => {
    if (!_instance) {
      _instance = new SynthesisArchitectAgent();
    }
    return _instance.generateProjects(conceptExtraction, count, log);
  }
};
