// Load environment variables FIRST
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import dbConnect from '../lib/mongodb';
import { UserContext } from '../lib/models';

/**
 * Seed script to populate MongoDB with sample contextual signals
 * This simulates what The Librarian Agent would collect from browser activity
 */
async function seedDatabase() {
  await dbConnect();

  const userId = 'default_user';
  const now = new Date();

  // Clear existing data
  await UserContext.deleteMany({ userId });

  // Sample contextual signals
  const signals = [
    {
      userId,
      signalType: 'lms_assignment' as const,
      source: 'https://canvas.university.edu/courses/12345/assignments/67890',
      rawContent: 'Complete the Linear Algebra problem set covering eigenvectors, matrix decomposition, and eigenvalues. Due: Next Friday.',
      subject: 'Linear Algebra',
      concepts: ['Eigenvectors', 'Matrix decomposition', 'Eigenvalues'],
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      detectedDueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      metadata: {
        tabTitle: 'Linear Algebra Assignment - Canvas',
        domain: 'canvas.university.edu',
      },
    },
    {
      userId,
      signalType: 'browser_tab' as const,
      source: 'https://en.wikipedia.org/wiki/Graph_theory',
      rawContent: 'Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects...',
      subject: 'Computer Science',
      concepts: ['Graph Theory', 'Data Structures', 'Algorithms'],
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      duration: 420, // 7 minutes
      metadata: {
        tabTitle: 'Graph theory - Wikipedia',
        domain: 'en.wikipedia.org',
        wordCount: 3500,
      },
    },
    {
      userId,
      signalType: 'video_transcript' as const,
      source: 'https://www.youtube.com/watch?v=ABC123',
      rawContent: 'In this lecture, we explore traffic flow optimization using graph algorithms. Cities can be modeled as directed graphs where intersections are nodes and roads are edges...',
      subject: 'Civil Engineering',
      concepts: ['Traffic Optimization', 'Graph Algorithms', 'Urban Planning'],
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      duration: 1800, // 30 minutes
      metadata: {
        tabTitle: 'Traffic Flow Optimization - MIT OpenCourseWare',
        domain: 'youtube.com',
        language: 'en',
      },
    },
    {
      userId,
      signalType: 'pdf_text' as const,
      source: 'file:///Users/student/Documents/Macroeconomics_Chapter5.pdf',
      rawContent: 'Supply shocks are unexpected events that suddenly change the supply of a product or commodity, resulting in a sudden change in its price...',
      subject: 'Macroeconomics',
      concepts: ['Supply shocks', 'Market equilibrium', 'Economic models'],
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      duration: 900, // 15 minutes
      metadata: {
        wordCount: 5200,
      },
    },
    {
      userId,
      signalType: 'lms_assignment' as const,
      source: 'https://canvas.university.edu/courses/12346/assignments/67891',
      rawContent: 'Research paper on machine learning applications in healthcare. Minimum 3000 words. Due: Next week.',
      subject: 'Computer Science',
      concepts: ['Machine Learning', 'Healthcare', 'Research'],
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      detectedDueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      metadata: {
        tabTitle: 'ML Research Paper - Canvas',
        domain: 'canvas.university.edu',
      },
    },
    {
      userId,
      signalType: 'browser_tab' as const,
      source: 'https://stackoverflow.com/questions/typescript-react-hooks',
      rawContent: 'How to properly type React hooks with TypeScript? I am trying to create a custom hook...',
      subject: 'Web Development',
      concepts: ['TypeScript', 'React', 'Hooks', 'Frontend Development'],
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      duration: 360, // 6 minutes
      metadata: {
        tabTitle: 'TypeScript React Hooks - Stack Overflow',
        domain: 'stackoverflow.com',
      },
    },
  ];

  // Insert signals
  await UserContext.insertMany(signals);

  console.log(`✅ Seeded ${signals.length} contextual signals for user: ${userId}`);
  console.log('\nSample signals:');
  signals.forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.signalType}] ${s.subject}: ${s.concepts.join(', ')}`);
  });

  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
