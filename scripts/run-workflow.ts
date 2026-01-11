import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runAgentWorkflow } from '../lib/agent-workflow';
import { startBackgroundJob } from '../lib/background-job';

const args = process.argv.slice(2);

if (args[0] === '--cron') {
  // Start background job scheduler
  console.log('Starting background job scheduler...\n');
  startBackgroundJob();
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n⏸️  Shutting down scheduler...');
    process.exit(0);
  });
} else {
  // Run workflow once for testing
  console.log('Testing Architect → Manager workflow...\n');

  runAgentWorkflow('default_user')
    .then((result) => {
      console.log('\n✅ Test complete!');
      console.log('\nTo start the daily background job, run:');
      console.log('  npm run workflow -- --cron');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}
