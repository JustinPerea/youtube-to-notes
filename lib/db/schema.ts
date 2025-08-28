/**
 * Database Schema for YouTube-to-Notes
 * 
 * Uses Drizzle ORM with PostgreSQL (Supabase)
 */

import { pgTable, text, timestamp, integer, boolean, json, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// USERS TABLE (Updated with OAuth fields)
// =============================================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  oauthId: text('oauth_id'),
  oauthProvider: text('oauth_provider').default('google'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Subscription and usage tracking
  subscriptionTier: text('subscription_tier', { enum: ['free', 'basic', 'pro', 'enterprise'] }).default('free'),
  subscriptionStatus: text('subscription_status', { enum: ['active', 'canceled', 'past_due', 'incomplete'] }).default('active'),
  monthlyVideoLimit: integer('monthly_video_limit').default(3),
  videosProcessedThisMonth: integer('videos_processed_this_month').default(0),
  resetDate: timestamp('reset_date'),
  
  // Settings
  preferences: json('preferences').$type<{
    defaultTemplate?: string;
    autoProcess?: boolean;
    notifications?: boolean;
  }>(),
});

// =============================================================================
// VIDEOS TABLE
// =============================================================================
export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  videoId: text('video_id').notNull(), // Extracted from YouTube URL
  title: text('title'),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'), // in seconds
  channelName: text('channel_name'),
  
  // Processing status
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
  processingStarted: timestamp('processing_started'),
  processingCompleted: timestamp('processing_completed'),
  errorMessage: text('error_message'),
  
  // Cost tracking
  tokensUsed: integer('tokens_used'),
  costEstimate: integer('cost_estimate'), // in cents
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROCESSING RESULTS TABLE
// =============================================================================
export const processingResults = pgTable('processing_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  templateId: text('template_id').notNull(),
  content: text('content').notNull(), // Generated content
  format: text('format', { enum: ['markdown', 'html', 'json', 'text'] }).default('markdown'),
  
  // Processing metadata
  processingTime: integer('processing_time'), // in milliseconds
  tokensUsed: integer('tokens_used'),
  costInCents: integer('cost_in_cents'),
  
  // Export options
  exportedAt: timestamp('exported_at'),
  exportFormat: text('export_format', { enum: ['pdf', 'md', 'html', 'docx'] }),
  exportUrl: text('export_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// NOTES TABLE (New table for storing user notes)
// =============================================================================
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  templateId: text('template_id'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROCESSING QUEUE TABLE
// =============================================================================
export const processingQueue = pgTable('processing_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  templateId: text('template_id').notNull(),
  
  // Queue management
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  
  // Status tracking
  status: text('status', { enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'] }).default('queued'),
  queuedAt: timestamp('queued_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  
  // Job data
  jobData: json('job_data'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TEMPLATES TABLE
// =============================================================================
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  
  // Template configuration
  isActive: boolean('is_active').default(true),
  category: text('category'),
  tags: text('tags').array(),
  
  // Usage tracking
  usageCount: integer('usage_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// USER USAGE HISTORY TABLE
// =============================================================================
export const userUsageHistory = pgTable('user_usage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => templates.id),
  
  // Usage tracking
  action: text('action', { enum: ['process', 'export', 'download', 'share'] }).notNull(),
  tokensUsed: integer('tokens_used'),
  costInCents: integer('cost_in_cents'),
  
  // Metadata
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// EXPORTS TABLE
// =============================================================================
export const exports = pgTable('exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  processingResultId: uuid('processing_result_id').references(() => processingResults.id, { onDelete: 'cascade' }).notNull(),
  
  // Export configuration
  format: text('format', { enum: ['pdf', 'md', 'html', 'docx'] }).notNull(),
  filename: text('filename').notNull(),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'), // in bytes
  
  // Export status
  status: text('status', { enum: ['pending', 'completed', 'failed'] }).default('pending'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// =============================================================================
// RELATIONS
// =============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  usageHistory: many(userUsageHistory),
  exports: many(exports),
  notes: many(notes),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  processingResults: many(processingResults),
  processingQueue: many(processingQueue),
  usageHistory: many(userUsageHistory),
  notes: many(notes),
}));

export const processingResultsRelations = relations(processingResults, ({ one, many }) => ({
  video: one(videos, {
    fields: [processingResults.videoId],
    references: [videos.id],
  }),
  exports: many(exports),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  processingResults: many(processingResults),
  usageHistory: many(userUsageHistory),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [notes.videoId],
    references: [videos.id],
  }),
}));

// =============================================================================
// TYPES
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type ProcessingResult = typeof processingResults.$inferSelect;
export type NewProcessingResult = typeof processingResults.$inferInsert;

export type ProcessingQueue = typeof processingQueue.$inferSelect;
export type NewProcessingQueue = typeof processingQueue.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type UserUsageHistory = typeof userUsageHistory.$inferSelect;
export type NewUserUsageHistory = typeof userUsageHistory.$inferInsert;

export type Export = typeof exports.$inferSelect;
export type NewExport = typeof exports.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
