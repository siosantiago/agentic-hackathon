import { differenceInDays, getWeek, getYear, addDays } from 'date-fns';
import { IProject, ISprintTask, IUserContext, UserContext, SprintTask } from './models';
import dbConnect from './mongodb';

// Types for the agent's output
export interface AgentAnalysis {
  decision: 'EXECUTE_NOW' | 'BREAK_DOWN' | 'DEFER';
  reasoning: string;
  priorityScore: number; // 0-100 score based on interest and difficulty
  scoreBreakdown: {
    interestScore: number; // How much user engages with related topics
    difficultyScore: number; // How much user struggles with this area
    urgencyScore: number; // Time-based urgency
    contextRelevanceScore: number; // Alignment with recent activity
  };
  feasibility: {
    isDoable: boolean;
    timeAvailable: number;
    timeRequired: number;
    daysUntilDue: number;
  };
  contextualInsights: {
    relatedConcepts: string[];
    recentActivity: string[];
    upcomingDeadlines: Array<{ title: string; dueDate: string; daysAway: number }>;
  };
  breakdown?: SprintTaskBreakdown[];
  recommendation: string;
}

export interface ProjectRanking {
  topProjects: Array<{
    project: Partial<IProject>;
    analysis: AgentAnalysis;
    rank: number;
  }>;
  reasoning: string;
}

export interface SprintTaskBreakdown {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  sprintWeek: number;
  sprintYear: number;
  orderInSprint: number;
}

export interface StudentBoardPayload {
  timestamp: string;
  currentWeek: {
    week: number;
    year: number;
    availableHours: number;
    allocatedHours: number;
  };
  projectAnalysis: {
    projectId?: string;
    title: string;
    dueDate: string;
    complexity: string;
    estimatedHours: number;
    decision: string;
    reasoning: string;
    feasibility: AgentAnalysis['feasibility'];
    contextualInsights: AgentAnalysis['contextualInsights'];
  };
  sprintTasks: Array<{
    title: string;
    description: string;
    priority: string;
    estimatedHours: number;
    sprintWeek: number;
    sprintYear: number;
    status: string;
  }>;
  recommendations: string[];
  warnings: string[];
}

/**
 * PROJECT MANAGER AGENT
 * =====================
 * The Pragmatic Guardian of Student Time
 * 
 * Role: Take ambitious project ideas from the Synthesis Architect and ground them in reality.
 * This agent has continuous access to MongoDB Atlas (Long-Term Memory) with the user_context 
 * collection containing browser history, LMS assignments, video transcripts, and detected due dates.
 * 
 * Responsibilities:
 * - Read contextual signals from MongoDB to understand student's current workload
 * - Detect upcoming due dates and potential conflicts
 * - Analyze project feasibility based on available time and complexity
 * - Break down large projects into actionable sprint tasks
 * - Generate structured JSON output for the Student Board dashboard
 * 
 * Behavior: Pragmatic and protective of the student's time. Will defer or break down
 * projects that are too ambitious for the current sprint capacity.
 */
export class ProjectManagerAgent {
  private readonly WEEKLY_HOURS_AVAILABLE = 20; // Configurable based on student's schedule
  private readonly MAX_PROJECT_HOURS_PER_WEEK = 15; // Leave buffer time
  private userId: string;

  constructor(userId: string = 'default_user') {
    this.userId = userId;
  }

  /**
   * Fetch contextual signals from MongoDB (The Long-Term Memory)
   * This reads from the user_context collection that contains:
   * - Browser tabs (with duration tracking)
   * - LMS assignments (Canvas, etc.)
   * - PDF text extractions
   * - YouTube video transcripts
   */
  async fetchContextualSignals(limit: number = 50): Promise<IUserContext[]> {
    await dbConnect();
    
    // Get recent contextual signals from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const contexts = await UserContext.find({
      userId: this.userId,
      timestamp: { $gte: sevenDaysAgo },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return contexts as any[] as IUserContext[];
  }

  /**
   * Detect upcoming due dates from user context
   * Scans the detectedDueDate field from LMS assignments and browser signals
   */
  async detectUpcomingDueDates(): Promise<Array<{ title: string; dueDate: Date; daysAway: number }>> {
    await dbConnect();
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const contextsWithDueDates = await UserContext.find({
      userId: this.userId,
      detectedDueDate: { 
        $gte: now,
        $lte: thirtyDaysFromNow,
      },
    })
      .sort({ detectedDueDate: 1 })
      .lean();

    return contextsWithDueDates.map((ctx) => ({
      title: ctx.metadata?.tabTitle || ctx.source,
      dueDate: ctx.detectedDueDate!,
      daysAway: differenceInDays(ctx.detectedDueDate!, now),
    }));
  }

  /**
   * Extract concepts from recent activity
   * These come from The Librarian Agent's categorization work
   */
  extractRecentConcepts(contexts: IUserContext[]): string[] {
    const conceptSet = new Set<string>();
    
    contexts.forEach((ctx) => {
      ctx.concepts?.forEach((concept) => conceptSet.add(concept));
    });

    return Array.from(conceptSet).slice(0, 10); // Top 10 concepts
  }

  /**
   * Get recent activity summary
   * Focus on high-duration tabs (>5 mins) and LMS assignments
   */
  getRecentActivity(contexts: IUserContext[]): string[] {
    return contexts
      .filter((ctx) => {
        return (
          ctx.signalType === 'lms_assignment' ||
          (ctx.signalType === 'browser_tab' && (ctx.duration || 0) > 300) // >5 mins
        );
      })
      .slice(0, 5)
      .map((ctx) => {
        const duration = ctx.duration ? `(${Math.round(ctx.duration / 60)}m)` : '';
        return `${ctx.metadata?.tabTitle || ctx.source} ${duration}`;
      });
  }

  /**
   * Calculate interest score based on contextual engagement
   * Higher score = more time spent on related concepts
   */
  calculateInterestScore(projectConcepts: string[], contextSignals: IUserContext[]): number {
    let totalEngagement = 0;
    let matchCount = 0;

    // Extract concepts from project description and title
    const projectText = projectConcepts.join(' ').toLowerCase();

    contextSignals.forEach((signal) => {
      // Check if signal relates to project concepts
      const signalText = (signal.rawContent + ' ' + signal.concepts?.join(' ')).toLowerCase();
      const hasOverlap = projectConcepts.some(concept => 
        signalText.includes(concept.toLowerCase())
      );

      if (hasOverlap) {
        matchCount++;
        // Weight by duration (browser tabs) or recency
        const daysOld = differenceInDays(new Date(), signal.timestamp);
        const recencyWeight = Math.max(0, 1 - (daysOld / 7)); // Decay over 7 days
        const duration = signal.duration || 300; // Default 5 mins
        totalEngagement += (duration / 60) * recencyWeight; // Minutes * recency
      }
    });

    // Normalize to 0-100 scale
    const rawScore = Math.min(100, (totalEngagement / 10) * 100); // 10 mins = 100 score
    return Math.round(rawScore);
  }

  /**
   * Calculate difficulty score based on struggle indicators
   * Higher score = more struggling with this topic (should prioritize)
   */
  calculateDifficultyScore(projectConcepts: string[], contextSignals: IUserContext[]): number {
    let struggleIndicators = 0;

    contextSignals.forEach((signal) => {
      const signalText = (signal.rawContent + ' ' + (signal.metadata?.tabTitle || '')).toLowerCase();
      const hasOverlap = projectConcepts.some(concept => 
        signalText.includes(concept.toLowerCase())
      );

      if (hasOverlap) {
        // Look for struggle indicators
        const hasHelpKeywords = /help|tutorial|how to|learn|guide|beginner|stuck|error/i.test(signalText);
        const hasHighEngagement = (signal.duration || 0) > 600; // >10 mins

        if (hasHelpKeywords) struggleIndicators += 3;
        if (hasHighEngagement) struggleIndicators += 2;
      }
    });

    // Normalize to 0-100 scale
    const rawScore = Math.min(100, (struggleIndicators / 7) * 100);
    return Math.round(rawScore);
  }

  /**
   * Calculate urgency score based on deadline
   */
  calculateUrgencyScore(daysUntilDue: number): number {
    if (daysUntilDue < 0) return 100; // Past due
    if (daysUntilDue <= 3) return 90;
    if (daysUntilDue <= 7) return 70;
    if (daysUntilDue <= 14) return 50;
    if (daysUntilDue <= 30) return 30;
    return 10; // Far in the future
  }

  /**
   * Calculate context relevance score
   * How well does this align with current activities?
   */
  calculateContextRelevanceScore(
    projectConcepts: string[],
    relatedConcepts: string[],
    recentActivity: string[]
  ): number {
    let relevanceScore = 0;

    // Check overlap with detected concepts
    projectConcepts.forEach(concept => {
      if (relatedConcepts.some(rc => rc.toLowerCase().includes(concept.toLowerCase()))) {
        relevanceScore += 20;
      }
    });

    // Check overlap with recent activity
    const recentText = recentActivity.join(' ').toLowerCase();
    projectConcepts.forEach(concept => {
      if (recentText.includes(concept.toLowerCase())) {
        relevanceScore += 15;
      }
    });

    return Math.min(100, relevanceScore);
  }

  /**
   * Extract concepts from project text
   */
  extractProjectConcepts(project: Partial<IProject>): string[] {
    const text = `${project.title} ${project.description} ${project.tags?.join(' ')}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);
    
    // Remove common words
    const stopWords = ['with', 'the', 'and', 'for', 'this', 'that', 'from', 'have', 'will', 'project'];
    return words.filter(w => !stopWords.includes(w)).slice(0, 10);
  }

  /**
   * CORE ANALYSIS FUNCTION
   * Analyze a project with full contextual awareness from MongoDB
   */
  async analyzeProject(
    project: Partial<IProject>,
    existingTasks?: ISprintTask[],
    log?: (message: string) => void
  ): Promise<AgentAnalysis> {
    const logger = log || (() => {});
    
    await dbConnect();
    logger('🔍 Starting project analysis...');

    // Fetch existing tasks if not provided
    if (!existingTasks) {
      logger('   Fetching existing sprint tasks from MongoDB...');
      existingTasks = await SprintTask.find({
        status: { $ne: 'completed' },
      }).lean() as any[] as ISprintTask[];
      logger(`   Found ${existingTasks.length} active tasks`);
    }

    // Fetch contextual signals from Long-Term Memory (MongoDB Atlas)
    logger('   Fetching contextual signals from Long-Term Memory...');
    const contextSignals = await this.fetchContextualSignals();
    logger(`   Retrieved ${contextSignals.length} contextual signals`);
    
    const upcomingDeadlines = await this.detectUpcomingDueDates();
    logger(`   Detected ${upcomingDeadlines.length} upcoming deadlines`);
    
    const relatedConcepts = this.extractRecentConcepts(contextSignals);
    logger(`   Extracted ${relatedConcepts.length} related concepts`);
    
    const recentActivity = this.getRecentActivity(contextSignals);
    logger(`   Identified ${recentActivity.length} recent high-engagement activities`);

    const now = new Date();
    const dueDate = new Date(project.dueDate!);
    const daysUntilDue = differenceInDays(dueDate, now);
    const weeksUntilDue = Math.ceil(daysUntilDue / 7);
    
    logger(`\n📅 TIME ANALYSIS:`);
    logger(`   Current Date: ${now.toISOString().split('T')[0]}`);
    logger(`   Due Date: ${dueDate.toISOString().split('T')[0]}`);
    logger(`   Days Until Due: ${daysUntilDue}`);
    logger(`   Weeks Available: ${weeksUntilDue}`);

    // Calculate current sprint workload
    const currentWeek = getWeek(now);
    const currentYear = getYear(now);
    const currentSprintLoad = this.calculateSprintLoad(existingTasks, currentWeek, currentYear);
    const timeAvailable = this.WEEKLY_HOURS_AVAILABLE - currentSprintLoad;

    const estimatedHours = project.estimatedHours || this.estimateComplexity(project);
    
    logger(`\n⚖️ CAPACITY ANALYSIS:`);
    logger(`   Weekly Capacity: ${this.WEEKLY_HOURS_AVAILABLE}h`);
    logger(`   Already Allocated: ${currentSprintLoad.toFixed(1)}h`);
    logger(`   Available This Week: ${timeAvailable.toFixed(1)}h`);
    logger(`   Project Requires: ${estimatedHours}h`);
    logger(`   Fits in Week: ${estimatedHours <= timeAvailable ? 'YES ✓' : 'NO ✗'}`);

    const contextualInsights = {
      relatedConcepts,
      recentActivity,
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        title: d.title,
        dueDate: d.dueDate.toISOString(),
        daysAway: d.daysAway,
      })),
    };

    // CALCULATE PRIORITY SCORES - Interest & Difficulty based
    logger(`\n🎯 CALCULATING PRIORITY SCORES...`);
    
    const projectConcepts = this.extractProjectConcepts(project);
    logger(`   Extracted ${projectConcepts.length} project concepts: ${projectConcepts.slice(0, 5).join(', ')}`);
    
    const interestScore = this.calculateInterestScore(projectConcepts, contextSignals);
    logger(`   💚 Interest Score: ${interestScore}/100 (based on time spent on related topics)`);
    
    const difficultyScore = this.calculateDifficultyScore(projectConcepts, contextSignals);
    logger(`   🔥 Difficulty Score: ${difficultyScore}/100 (based on struggle indicators)`);
    
    const urgencyScore = this.calculateUrgencyScore(daysUntilDue);
    logger(`   ⏰ Urgency Score: ${urgencyScore}/100 (${daysUntilDue} days until due)`);
    
    const contextRelevanceScore = this.calculateContextRelevanceScore(
      projectConcepts,
      relatedConcepts,
      recentActivity
    );
    logger(`   🧠 Context Relevance: ${contextRelevanceScore}/100 (alignment with recent work)`);

    // Weighted priority calculation
    // Interest (30%) + Difficulty (35%) + Urgency (20%) + Context (15%)
    const priorityScore = Math.round(
      (interestScore * 0.30) +
      (difficultyScore * 0.35) +
      (urgencyScore * 0.20) +
      (contextRelevanceScore * 0.15)
    );
    
    logger(`   ⭐ FINAL PRIORITY SCORE: ${priorityScore}/100`);
    logger(`   📊 Weights: Interest(30%) + Difficulty(35%) + Urgency(20%) + Context(15%)`);

    const scoreBreakdown = {
      interestScore,
      difficultyScore,
      urgencyScore,
      contextRelevanceScore,
    };

    // DECISION LOGIC - Based on priority and capacity
    logger(`\n🤔 MAKING DECISION...`);
    
    // 1. Past due - still score but mark as urgent
    if (daysUntilDue < 0) {
      logger(`   ⚠️ DECISION: EXECUTE_NOW (past due - urgent!)`);
      return {
        decision: 'EXECUTE_NOW',
        reasoning: `🚨 PAST DUE! This project should have been completed. High priority to address immediately.`,
        priorityScore: Math.max(priorityScore, 95), // Boost score for past due
        scoreBreakdown,
        feasibility: {
          isDoable: true,
          timeAvailable,
          timeRequired: estimatedHours,
          daysUntilDue,
        },
        contextualInsights,
        recommendation: 'Address this overdue project immediately or reschedule with instructor.',
      };
    }

    // 2. Can fit in current week - EXECUTE NOW
    if (estimatedHours <= timeAvailable && daysUntilDue >= 1) {
      const conceptsStr = relatedConcepts.length > 0 
        ? ` Your recent activity shows relevant knowledge in: ${relatedConcepts.slice(0, 3).join(', ')}.`
        : '';
      
      logger(`   ✅ DECISION: EXECUTE_NOW (Priority Score: ${priorityScore})`);
      logger(`   Reason: Fits in current sprint capacity and high relevance`);
      
      return {
        decision: 'EXECUTE_NOW',
        reasoning: `✅ High priority project (Score: ${priorityScore}/100). Requires ${estimatedHours}h, you have ${timeAvailable.toFixed(1)}h available.${conceptsStr}`,
        priorityScore,
        scoreBreakdown,
        feasibility: {
          isDoable: true,
          timeAvailable,
          timeRequired: estimatedHours,
          daysUntilDue,
        },
        contextualInsights,
        recommendation: 'Start this project immediately as a single sprint task.',
      };
    }

    // 3. Too large - BREAK DOWN into sprint tasks
    if (estimatedHours > this.MAX_PROJECT_HOURS_PER_WEEK || weeksUntilDue > 1) {
      logger(`   📋 DECISION: BREAK_DOWN (Priority Score: ${priorityScore})`);
      logger(`   Reason: Project too large for single sprint`);
      logger(`   Breaking into weekly tasks...`);
      
      const breakdown = this.breakdownIntoSprints(project, estimatedHours, daysUntilDue, now);
      logger(`   Created ${breakdown.length} sprint tasks`);
      
      const conceptsStr = relatedConcepts.length > 0
        ? ` This aligns with your current focus on: ${relatedConcepts.slice(0, 2).join(', ')}.`
        : '';

      return {
        decision: 'BREAK_DOWN',
        reasoning: `📋 Project scored ${priorityScore}/100 priority. Breaking ${estimatedHours}h into ${breakdown.length} sprint tasks.${conceptsStr}`,
        priorityScore,
        scoreBreakdown,
        feasibility: {
          isDoable: true,
          timeAvailable,
          timeRequired: estimatedHours,
          daysUntilDue,
        },
        contextualInsights,
        breakdown,
        recommendation: `Start with the first sprint task (${breakdown[0]?.title}) this week.`,
      };
    }

    // 4. Not enough time this week - still score but mark as planning
    logger(`   📅 DECISION: EXECUTE_NOW (Priority Score: ${priorityScore})`);
    logger(`   Note: Limited capacity this week, but project is prioritized for inclusion`);
    return {
      decision: 'EXECUTE_NOW',
      reasoning: `📅 Priority Score: ${priorityScore}/100. Limited capacity (${timeAvailable.toFixed(1)}h available), but project should be in your top 3 focus areas.`,
      priorityScore,
      scoreBreakdown,
      feasibility: {
        isDoable: true,
        timeAvailable,
        timeRequired: estimatedHours,
        daysUntilDue,
      },
      contextualInsights,
      recommendation: 'Consider this for your top 3 projects. May need to adjust other commitments.',
    };
  }

  /**
   * RANK MULTIPLE PROJECTS
   * Analyze multiple projects and return top 3 based on priority scores
   */
  async rankProjects(
    projects: Partial<IProject>[],
    existingTasks?: ISprintTask[],
    log?: (message: string) => void
  ): Promise<ProjectRanking> {
    const logger = log || (() => {});
    
    logger(`\n${'='.repeat(80)}`);
    logger(`🏆 MULTI-PROJECT RANKING ANALYSIS`);
    logger(`${'='.repeat(80)}`);
    logger(`Analyzing ${projects.length} projects...`);

    // Analyze all projects
    const analyses = await Promise.all(
      projects.map(project => this.analyzeProject(project, existingTasks, log))
    );

    // Combine projects with their analyses
    const rankedProjects = projects
      .map((project, i) => ({
        project,
        analysis: analyses[i],
        rank: 0, // Will be assigned below
      }))
      .sort((a, b) => b.analysis.priorityScore - a.analysis.priorityScore)
      .map((item, i) => ({
        ...item,
        rank: i + 1,
      }));

    const top3 = rankedProjects.slice(0, 3);

    logger(`\n${'='.repeat(80)}`);
    logger(`🥇 TOP 3 PROJECTS TO FOCUS ON:`);
    logger(`${'='.repeat(80)}`);
    
    top3.forEach((item, i) => {
      const medals = ['🥇', '🥈', '🥉'];
      logger(`\n${medals[i]} RANK ${item.rank}: ${item.project.title}`);
      logger(`   Priority Score: ${item.analysis.priorityScore}/100`);
      logger(`   Interest: ${item.analysis.scoreBreakdown.interestScore} | Difficulty: ${item.analysis.scoreBreakdown.difficultyScore}`);
      logger(`   Urgency: ${item.analysis.scoreBreakdown.urgencyScore} | Context: ${item.analysis.scoreBreakdown.contextRelevanceScore}`);
      logger(`   Reasoning: ${item.analysis.reasoning}`);
    });

    logger(`\n${'='.repeat(80)}`);

    const reasoning = `Based on your interest, difficulty level, and context, focus on: ` +
      `1) ${top3[0]?.project.title} (${top3[0]?.analysis.priorityScore} points), ` +
      `2) ${top3[1]?.project.title} (${top3[1]?.analysis.priorityScore} points), ` +
      `3) ${top3[2]?.project.title} (${top3[2]?.analysis.priorityScore} points)`;

    return {
      topProjects: top3,
      reasoning,
    };
  }

  /**
   * Break down a large project into sprint-sized tasks
   * Uses intelligent phasing based on project type
   */
  private breakdownIntoSprints(
    project: Partial<IProject>,
    totalHours: number,
    daysUntilDue: number,
    startDate: Date
  ): SprintTaskBreakdown[] {
    const weeksAvailable = Math.max(1, Math.ceil(daysUntilDue / 7));
    const hoursPerWeek = Math.min(totalHours / weeksAvailable, this.MAX_PROJECT_HOURS_PER_WEEK);
    
    const tasks: SprintTaskBreakdown[] = [];
    let remainingHours = totalHours;
    let currentDate = startDate;
    let taskNumber = 1;

    // Determine task breakdown strategy based on complexity
    const phases = this.determinePhases(project, totalHours);

    for (let week = 0; week < weeksAvailable && remainingHours > 0; week++) {
      const weekDate = addDays(currentDate, week * 7);
      const sprintWeek = getWeek(weekDate);
      const sprintYear = getYear(weekDate);
      
      const phase = phases[Math.min(week, phases.length - 1)];
      const hoursForThisTask = Math.min(hoursPerWeek, remainingHours);
      
      tasks.push({
        title: `${project.title} - ${phase.name} (Week ${week + 1})`,
        description: phase.description,
        priority: week === 0 ? 'high' : 'medium',
        estimatedHours: Math.round(hoursForThisTask * 10) / 10,
        sprintWeek,
        sprintYear,
        orderInSprint: taskNumber++,
      });

      remainingHours -= hoursForThisTask;
    }

    return tasks;
  }

  /**
   * Determine project phases based on type and complexity
   * Inspired by common academic project patterns
   */
  private determinePhases(
    project: Partial<IProject>,
    totalHours: number
  ): Array<{ name: string; description: string }> {
    const tags = project.tags || [];
    const isCode = tags.some(t => ['coding', 'development', 'programming'].includes(t.toLowerCase()));
    const isResearch = tags.some(t => ['research', 'analysis', 'study'].includes(t.toLowerCase()));

    if (isCode) {
      return [
        { name: 'Setup & Planning', description: 'Project setup, architecture design, and initial scaffolding' },
        { name: 'Core Implementation', description: 'Main feature development and core functionality' },
        { name: 'Testing & Refinement', description: 'Testing, bug fixes, and polish' },
        { name: 'Documentation & Deploy', description: 'Documentation and deployment' },
      ];
    }

    if (isResearch) {
      return [
        { name: 'Research & Exploration', description: 'Initial research and information gathering' },
        { name: 'Analysis', description: 'Deep analysis and synthesis of findings' },
        { name: 'Documentation', description: 'Writing up results and conclusions' },
      ];
    }

    // Generic phases
    return [
      { name: 'Phase 1', description: 'Initial planning and setup' },
      { name: 'Phase 2', description: 'Core work and implementation' },
      { name: 'Phase 3', description: 'Finalization and review' },
    ];
  }

  /**
   * Estimate complexity-based hours if not provided
   */
  private estimateComplexity(project: Partial<IProject>): number {
    const complexity = project.complexity || 'medium';
    const estimates = {
      'low': 3,
      'medium': 8,
      'high': 16,
      'very-high': 30,
    };
    return estimates[complexity];
  }

  /**
   * Calculate total hours allocated in a given sprint week
   */
  private calculateSprintLoad(
    tasks: ISprintTask[],
    week: number,
    year: number
  ): number {
    return tasks
      .filter(
        (t) =>
          t.sprintWeek === week &&
          t.sprintYear === year &&
          t.status !== 'completed'
      )
      .reduce((sum, task) => sum + task.estimatedHours, 0);
  }

  /**
   * Generate the final Student Board payload (JSON for Next.js dashboard)
   * This is the final structured output that the UI will render
   */
  generateStudentBoard(
    project: Partial<IProject>,
    analysis: AgentAnalysis,
    existingTasks: ISprintTask[]
  ): StudentBoardPayload {
    const now = new Date();
    const currentWeek = getWeek(now);
    const currentYear = getYear(now);
    const currentSprintLoad = this.calculateSprintLoad(existingTasks, currentWeek, currentYear);

    const warnings: string[] = [];
    const recommendations: string[] = [analysis.recommendation];

    // Generate warnings based on capacity and deadlines
    if (currentSprintLoad > this.WEEKLY_HOURS_AVAILABLE * 0.8) {
      warnings.push('⚠️ Your current sprint is over 80% capacity. Consider deferring non-critical tasks.');
    }

    if (analysis.feasibility.daysUntilDue < 3 && analysis.feasibility.timeRequired > 5) {
      warnings.push('⚠️ Tight deadline! This project may require extra focus or deadline extension.');
    }

    if (analysis.contextualInsights.upcomingDeadlines.length > 0) {
      const nearestDeadline = analysis.contextualInsights.upcomingDeadlines[0];
      if (nearestDeadline.daysAway < 3) {
        warnings.push(`🚨 Urgent: "${nearestDeadline.title}" due in ${nearestDeadline.daysAway} days!`);
      }
    }

    // Add contextual recommendations from MongoDB signals
    if (analysis.contextualInsights.relatedConcepts.length > 0) {
      recommendations.push(
        `💡 Leverage your recent work in: ${analysis.contextualInsights.relatedConcepts.slice(0, 3).join(', ')}`
      );
    }

    // Build sprint tasks array
    const sprintTasks = analysis.breakdown
      ? analysis.breakdown.map((task) => ({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          sprintWeek: task.sprintWeek,
          sprintYear: task.sprintYear,
          status: 'todo' as const,
        }))
      : analysis.decision === 'EXECUTE_NOW'
      ? [
          {
            title: project.title!,
            description: project.description!,
            priority: 'high' as const,
            estimatedHours: project.estimatedHours || analysis.feasibility.timeRequired,
            sprintWeek: currentWeek,
            sprintYear: currentYear,
            status: 'todo' as const,
          },
        ]
      : [];

    return {
      timestamp: now.toISOString(),
      currentWeek: {
        week: currentWeek,
        year: currentYear,
        availableHours: this.WEEKLY_HOURS_AVAILABLE,
        allocatedHours: currentSprintLoad,
      },
      projectAnalysis: {
        projectId: (project as any)._id?.toString(),
        title: project.title!,
        dueDate: project.dueDate!.toISOString(),
        complexity: project.complexity || 'medium',
        estimatedHours: project.estimatedHours || analysis.feasibility.timeRequired,
        decision: analysis.decision,
        reasoning: analysis.reasoning,
        feasibility: analysis.feasibility,
        contextualInsights: analysis.contextualInsights,
      },
      sprintTasks,
      recommendations,
      warnings,
    };
  }
}

/**
 * Factory function to create agent instances
 * Use this when you need a dedicated agent for a specific user
 */
export function createProjectManagerAgent(userId: string = 'default_user'): ProjectManagerAgent {
  return new ProjectManagerAgent(userId);
}

/**
 * Singleton instance for default user
 * Use this for quick testing or single-user scenarios
 */
export const projectManagerAgent = new ProjectManagerAgent();
