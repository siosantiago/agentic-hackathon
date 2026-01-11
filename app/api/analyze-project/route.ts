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
    log('PROJECT MANAGER AGENT - ANALYSIS SESSION START');
    log('='.repeat(80));
    
    await dbConnect();
    log('✓ Connected to MongoDB');

    const body = await request.json();
    const { title, description, dueDate, complexity, estimatedHours, tags } = body;
    
    log(`\n📥 INPUT PROJECT:`);
    log(`   Title: ${title}`);
    log(`   Description: ${description}`);
    log(`   Due Date: ${dueDate}`);
    log(`   Complexity: ${complexity || 'medium (default)'}`);
    log(`   Estimated Hours: ${estimatedHours || 'auto-calculate'}`);
    log(`   Tags: ${tags?.join(', ') || 'none'}`);

    // Validation
    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, dueDate' },
        { status: 400 }
      );
    }

    // Calculate estimated hours if not provided
    const projectComplexity = complexity || 'medium';
    const complexityHours = {
      'low': 3,
      'medium': 8,
      'high': 16,
      'very-high': 30,
    };
    const calculatedHours = estimatedHours || complexityHours[projectComplexity as keyof typeof complexityHours];
    
    if (!estimatedHours) {
      log(`\n🧮 AUTO-CALCULATED HOURS: ${calculatedHours}h (based on ${projectComplexity} complexity)`);
    }

    // Create project document
    log(`\n💾 Creating project in MongoDB...`);
    const project = await Project.create({
      title,
      description,
      dueDate: new Date(dueDate),
      complexity: projectComplexity,
      estimatedHours: calculatedHours,
      tags: tags || [],
      status: 'proposed',
    });
    log(`✓ Project created with ID: ${project._id}`);

    // Get existing sprint tasks
    log(`\n📊 Fetching existing sprint tasks...`);
    const existingTasks = await SprintTask.find({
      status: { $ne: 'completed' },
    }).lean();
    log(`✓ Found ${existingTasks.length} active sprint tasks`);

    // Run the Project Manager Agent analysis
    log(`\n🤖 PROJECT MANAGER AGENT - ANALYZING...`);
    log('-'.repeat(80));
    const analysis = await projectManagerAgent.analyzeProject(
      project.toObject(),
      existingTasks as any[],
      log
    );
    
    log(`\n📊 AGENT ANALYSIS COMPLETE:`);
    log(`   Decision: ${analysis.decision}`);
    log(`   Priority Score: ${analysis.priorityScore}/100`);
    log(`   Score Breakdown:`);
    log(`     - Interest: ${analysis.scoreBreakdown.interestScore}/100`);
    log(`     - Difficulty: ${analysis.scoreBreakdown.difficultyScore}/100`);
    log(`     - Urgency: ${analysis.scoreBreakdown.urgencyScore}/100`);
    log(`     - Context Relevance: ${analysis.scoreBreakdown.contextRelevanceScore}/100`);
    log(`   Feasibility: ${analysis.feasibility.isDoable ? 'YES' : 'NO'}`);
    log(`   Time Available: ${analysis.feasibility.timeAvailable.toFixed(1)}h`);
    log(`   Time Required: ${analysis.feasibility.timeRequired}h`);
    log(`   Days Until Due: ${analysis.feasibility.daysUntilDue}`);
    log(`\n💭 REASONING:`);
    log(`   ${analysis.reasoning}`);
    
    if (analysis.contextualInsights.relatedConcepts.length > 0) {
      log(`\n🧠 CONTEXTUAL INSIGHTS:`);
      log(`   Related Concepts: ${analysis.contextualInsights.relatedConcepts.join(', ')}`);
      log(`   Recent Activity: ${analysis.contextualInsights.recentActivity.length} items`);
      log(`   Upcoming Deadlines: ${analysis.contextualInsights.upcomingDeadlines.length} items`);
    }
    
    if (analysis.breakdown) {
      log(`\n📋 TASK BREAKDOWN:`);
      analysis.breakdown.forEach((task, i) => {
        log(`   ${i + 1}. ${task.title} (${task.estimatedHours}h, ${task.priority})`);
      });
    }

    // Generate Student Board payload
    log(`\n📱 Generating Student Board payload...`);
    const studentBoard = projectManagerAgent.generateStudentBoard(
      project.toObject(),
      analysis,
      existingTasks as any[]
    );
    log(`✓ Student Board generated`);

    // If decision is EXECUTE_NOW or BREAK_DOWN, create sprint tasks
    log(`\n💼 EXECUTING DECISION: ${analysis.decision}`);
    if (analysis.decision === 'EXECUTE_NOW') {
      log(`   Creating single sprint task...`);
      await SprintTask.create({
        projectId: project._id,
        title: project.title,
        description: project.description,
        priority: 'high',
        estimatedHours: project.estimatedHours || analysis.feasibility.timeRequired,
        dueDate: project.dueDate,
        sprintWeek: studentBoard.currentWeek.week,
        sprintYear: studentBoard.currentWeek.year,
        status: 'todo',
      });
      log(`✓ Sprint task created`);

      // Update project status
      project.status = 'planning';
      await project.save();
      log(`✓ Project status updated to: planning`);
    } else if (analysis.decision === 'BREAK_DOWN' && analysis.breakdown) {
      log(`   Creating ${analysis.breakdown.length} sprint tasks...`);
      // Create sprint tasks from breakdown
      const sprintTasks = analysis.breakdown.map((task) => ({
        projectId: project._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dueDate: project.dueDate,
        sprintWeek: task.sprintWeek,
        sprintYear: task.sprintYear,
        status: 'todo' as const,
      }));

      await SprintTask.insertMany(sprintTasks);
      log(`✓ ${sprintTasks.length} sprint tasks created`);

      // Update project status
      project.status = 'planning';
      await project.save();
      log(`✓ Project status updated to: planning`);
    } else if (analysis.decision === 'DEFER') {
      project.status = 'deferred';
      await project.save();
      log(`✓ Project status updated to: deferred`);
    }

    log(`\n${'='.repeat(80)}`);
    log(`✅ ANALYSIS SESSION COMPLETE`);
    log(`${'='.repeat(80)}\n`);
    
    // Write logs to file
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFileName = `agent-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');
    console.log(`📄 Full logs written to: ${logFilePath}`);

    return NextResponse.json({
      success: true,
      project: {
        id: project._id.toString(),
        title: project.title,
        status: project.status,
      },
      analysis,
      studentBoard,
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
    const logFileName = `agent-error-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');
    
    console.error('Error analyzing project:', error);
    console.log(`📄 Error logs written to: ${logFilePath}`);
    
    return NextResponse.json(
      { error: 'Failed to analyze project', details: error.message, logFile: logFileName },
      { status: 500 }
    );
  }
}
