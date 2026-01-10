import mongoose, { Schema, Document, Model } from 'mongoose';

// User Context Interface (Long-Term Memory from browser signals)
export interface IUserContext extends Document {
  userId: string;
  signalType: 'browser_tab' | 'lms_assignment' | 'pdf_text' | 'video_transcript' | 'manual_input';
  source: string; // URL or source identifier
  rawContent: string;
  processedContent?: string;
  subject?: string; // e.g., "Linear Algebra", "Macroeconomics"
  concepts: string[]; // e.g., ["Eigenvectors", "Matrix decomposition"]
  timestamp: Date;
  duration?: number; // For browser tabs - how long it was active (seconds)
  detectedDueDate?: Date; // Extracted from LMS or content
  embedding?: number[]; // Vector embedding for semantic search
  relevanceScore?: number;
  metadata: {
    tabTitle?: string;
    domain?: string;
    wordCount?: number;
    language?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Project Interface
export interface IProject extends Document {
  title: string;
  description: string;
  dueDate: Date;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  estimatedHours: number;
  status: 'proposed' | 'planning' | 'in-progress' | 'completed' | 'deferred';
  tags: string[];
  sourceContextIds?: mongoose.Types.ObjectId[]; // Links to UserContext documents
  createdAt: Date;
  updatedAt: Date;
}

// Sprint Task Interface
export interface ISprintTask extends Document {
  projectId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  dueDate: Date;
  status: 'todo' | 'in-progress' | 'blocked' | 'completed';
  sprintWeek: number; // Week number in the year
  sprintYear: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Context Schema (Long-Term Memory)
const UserContextSchema = new Schema<IUserContext>(
  {
    userId: { type: String, required: true, index: true },
    signalType: {
      type: String,
      enum: ['browser_tab', 'lms_assignment', 'pdf_text', 'video_transcript', 'manual_input'],
      required: true,
    },
    source: { type: String, required: true },
    rawContent: { type: String, required: true },
    processedContent: { type: String },
    subject: { type: String, index: true },
    concepts: [{ type: String }],
    timestamp: { type: Date, required: true, default: Date.now },
    duration: { type: Number },
    detectedDueDate: { type: Date, index: true },
    embedding: [{ type: Number }], // For vector search
    relevanceScore: { type: Number },
    metadata: {
      tabTitle: { type: String },
      domain: { type: String },
      wordCount: { type: Number },
      language: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Project Schema
const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high', 'very-high'],
      default: 'medium',
    },
    estimatedHours: { type: Number, required: true },
    status: {
      type: String,
      enum: ['proposed', 'planning', 'in-progress', 'completed', 'deferred'],
      default: 'proposed',
    },
    tags: [{ type: String }],
    sourceContextIds: [{ type: Schema.Types.ObjectId, ref: 'UserContext' }],
  },
  {
    timestamps: true,
  }
);

// Sprint Task Schema
const SprintTaskSchema = new Schema<ISprintTask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    estimatedHours: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'blocked', 'completed'],
      default: 'todo',
    },
    sprintWeek: { type: Number, required: true },
    sprintYear: { type: Number, required: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
UserContextSchema.index({ userId: 1, timestamp: -1 });
UserContextSchema.index({ userId: 1, detectedDueDate: 1 });
UserContextSchema.index({ userId: 1, subject: 1 });
UserContextSchema.index({ concepts: 1 });

ProjectSchema.index({ dueDate: 1, status: 1 });
SprintTaskSchema.index({ sprintWeek: 1, sprintYear: 1, status: 1 });
SprintTaskSchema.index({ projectId: 1 });

// Model exports with proper typing
export const UserContext: Model<IUserContext> =
  mongoose.models.UserContext || mongoose.model<IUserContext>('UserContext', UserContextSchema);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export const SprintTask: Model<ISprintTask> =
  mongoose.models.SprintTask || mongoose.model<ISprintTask>('SprintTask', SprintTaskSchema);
