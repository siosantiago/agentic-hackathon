import { NextRequest, NextResponse } from 'next/server';
import { runAgentWorkflow, getMockLibrarianOutput } from '@/lib/agent-workflow';
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
    log('AUTO-ANALYZE: Multi-Agent Workflow Starting');
    log('='.repeat(80));

    const body = await request.json();
    const userId = body.userId || 'default_user';
    const mockConcepts = body.concepts || getMockLibrarianOutput();

    log(`User ID: ${userId}`);
    log('Initiating agent workflow: Architect → Manager');

    const result = await runAgentWorkflow(userId, mockConcepts);

    if (result.error) {
      throw new Error(result.error);
    }

    log('\n📊 WORKFLOW RESULTS:');
    log(`   Concepts Used: ${result.concepts.concepts.length}`);
    log(`   Projects Generated: ${result.suggestedProjects?.length || 0}`);
    log(`   Top Priority: ${result.ranking?.topProjects[0]?.project.title} (${result.ranking?.topProjects[0]?.analysis.priorityScore}/100)`);

    // Write logs
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFileName = `workflow-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');

    return NextResponse.json({
      success: true,
      workflow: {
        concepts: result.concepts,
        suggestedProjects: result.suggestedProjects,
        ranking: result.ranking,
      },
      logFile: logFileName,
    });
  } catch (error: any) {
    log(`\n❌ ERROR: ${error.message}`);
    
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFileName = `workflow-error-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf-8');

    return NextResponse.json(
      { error: 'Workflow failed', details: error.message, logFile: logFileName },
      { status: 500 }
    );
  }
}
