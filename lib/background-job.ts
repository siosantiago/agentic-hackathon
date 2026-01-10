import cron from 'node-cron';
import { runAgentWorkflow } from './agent-workflow';
import dbConnect from './mongodb';
import mongoose from 'mongoose';

const WorkflowRunSchema = new mongoose.Schema({
  userId: String,
  startTime: Date,
  endTime: Date,
  status: String,
  projectsGenerated: Number,
  topProject: String,
  topScore: Number,
  error: String,
});

const WorkflowRun = mongoose.models.WorkflowRun || 
  mongoose.model('WorkflowRun', WorkflowRunSchema);

export async function runDailyWorkflow() {
  console.log('\n🌅 Daily Workflow Triggered:', new Date().toISOString());
  
  await dbConnect();
  
  const startTime = new Date();
  const userId = 'default_user';
  
  try {
    const result = await runAgentWorkflow(userId);
    
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    await WorkflowRun.create({
      userId,
      startTime,
      endTime,
      status: result.error ? 'failed' : 'success',
      projectsGenerated: result.suggestedProjects?.length || 0,
      topProject: result.ranking?.topProjects[0]?.project.title,
      topScore: result.ranking?.topProjects[0]?.analysis.priorityScore,
      error: result.error,
    });
    
    console.log(`✅ Workflow completed in ${duration}s`);
    console.log(`   Projects Generated: ${result.suggestedProjects?.length}`);
    console.log(`   Top Priority: ${result.ranking?.topProjects[0]?.project.title} (${result.ranking?.topProjects[0]?.analysis.priorityScore}/100)`);
    
  } catch (error: any) {
    console.error('❌ Workflow failed:', error.message);
    
    await WorkflowRun.create({
      userId,
      startTime,
      endTime: new Date(),
      status: 'failed',
      error: error.message,
    });
  }
}

// Run daily at 7:00 AM
export function startBackgroundJob() {
  console.log('⏰ Background job scheduler started');
  console.log('   Schedule: Daily at 7:00 AM');
  
  cron.schedule('0 7 * * *', runDailyWorkflow, {
    timezone: 'America/New_York'
  });
  
  console.log('✓ Scheduler active');
  console.log('   Press Ctrl+C to stop');
}
