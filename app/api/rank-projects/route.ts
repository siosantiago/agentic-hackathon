import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Project, SprintTask } from '@/lib/models';
import { projectManagerAgent } from '@/lib/project-manager-agent';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  const logEntries: string[] = [];
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    console.log(entry);
    logEntries.push(entry);
  };

  try {
    log('='.repeat(80));
    log('PROJECT MANAGER AGENT - MULTI-PROJECT RANKING');
    log('='.repeat(80));
    
    await dbConnect();
    log('✓ Connected to MongoDB');

    const body = await request.json();
    const { projects } = body;
    
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json(
        { error: 'Missing projects array or empty array' },
        { status: 400 }
      );
    }

    log(`\n📥 INPUT: ${projects.length} projects to rank`);
    projects.forEach((p, i) => {
      log(`   ${i + 1}. ${p.title} (${p.complexity || 'medium'}, due: ${p.dueDate})`);
    });

    // Calculate estimated hours for all projects
    const complexityHours = {
      'low': 3,
      'medium': 8,
      'high': 16,
      'very-high': 30,
    };

    const processedProjects = projects.map((p) => {
      const projectComplexity = p.complexity || 'medium';
      const calculatedHours = p.estimatedHours || complexityHours[projectComplexity as keyof typeof complexityHours];
      
      return {
        title: p.title,
        description: p.description,
        dueDate: new Date(p.dueDate),
        complexity: projectComplexity,
        estimatedHours: calculatedHours,
        tags: p.tags || [],
        status: 'proposed' as const,
      };
    });

    // Get existing sprint tasks
    log(`\n📊 Fetching existing sprint tasks...`);
    const existingTasks = await SprintTask.find({
      status: { $ne: 'completed' },
    }).lean();
    log(`✓ Found ${existingTasks.length} active sprint tasks`);

    // Run the ranking analysis
    log(`\n🤖 PROJECT MANAGER AGENT - RANKING PROJECTS...`);
    log('-'.repeat(80));
    const ranking = await projectManagerAgent.rankProjects(
      processedProjects,
      existingTasks as any[],
      log
    );
    
    log(`\n📊 RANKING COMPLETE`);
    log(`✓ Top 3 projects identified`);

    // Save projects to database
    log(`\n💾 Saving projects to MongoDB...`);
    const savedProjects = [];
    for (const item of ranking.topProjects) {
      const saved = await Project.create(item.project);
      savedProjects.push({
        id: saved._id.toString(),
        title: saved.title,
        rank: item.rank,
        priorityScore: item.analysis.priorityScore,
      });
      log(`✓ Saved: ${saved.title} (Rank ${item.rank}, Score ${item.analysis.priorityScore})`);
    }

    log(`\n${'='.repeat(80)}`);
    log(`✅ RANKING SESSION COMPLETE`);
    log(`${'='.repeat(80)}\n`);
    
    // Write logs to file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFileName = `agent-ranking-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');
    console.log(`📄 Full logs written to: ${logFilePath}`);

    return NextResponse.json({
      success: true,
      ranking: {
        topProjects: ranking.topProjects.map(item => ({
          rank: item.rank,
          title: item.project.title,
          priorityScore: item.analysis.priorityScore,
          scoreBreakdown: item.analysis.scoreBreakdown,
          decision: item.analysis.decision,
          reasoning: item.analysis.reasoning,
          recommendation: item.analysis.recommendation,
        })),
        reasoning: ranking.reasoning,
      },
      savedProjects,
      logFile: logFileName,
    });
  } catch (error: any) {
    log(`\n❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    
    // Write error logs to file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFileName = `agent-ranking-error-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');
    
    console.error('Error ranking projects:', error);
    console.log(`📄 Error logs written to: ${logFilePath}`);
    
    return NextResponse.json(
      { error: 'Failed to rank projects', details: error.message, logFile: logFileName },
      { status: 500 }
    );
  }
}
