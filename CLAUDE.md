# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3003
- `npm run build` - Build application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI

### Database Operations
- `npm run db:generate` - Generate database migrations with Drizzle Kit
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

### Agent System
- `npm run agent:research` - Run research agent for technology exploration
- `npm run agent:qa` - Run QA agent for code quality assessment
- `npm run agent:memory` - Update memory context agent

## Architecture Overview

### Multi-Agent Development System
This project uses a sophisticated agent-based development workflow with specialized agents:
- **Coordinator Agent** (`lib/agents/coordinator.ts`) - Task delegation and orchestration
- **Coding Agent** (`lib/agents/coding-agent.ts`) - Primary code implementation
- **Frontend Agent** (`lib/agents/frontend-agent.ts`) - UI/UX implementation
- **Backend Agent** (`lib/agents/backend-agent.ts`) - API and server logic
- **Research Agent** (`lib/agents/research-agent.ts`) - Technology research
- **QA Agent** (`lib/agents/qa-agent.ts`) - Code quality and testing
- **Debugging Agent** (`lib/agents/debugging-agent.ts`) - Error analysis and fixing
- **Memory Context Agent** (`lib/agents/memory-context-agent.ts`) - Project state tracking

### Core Technology Stack
- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API routes, Drizzle ORM, PostgreSQL (Supabase)
- **AI Integration**: Google Gemini AI models (`lib/gemini/client.ts`)
- **Authentication**: NextAuth.js v5 with OAuth
- **Database**: Supabase PostgreSQL with comprehensive schema (`lib/db/schema.ts`)
- **Queue System**: BullMQ with Redis for video processing

### Key Application Structure
- `app/` - Next.js App Router with API routes and pages
- `lib/gemini/` - Gemini API integration and video processing logic
- `lib/db/` - Database schema, migrations, and utilities
- `lib/agents/` - Multi-agent development system
- `lib/templates/` - Content generation templates
- `components/` - Reusable React components

### Database Schema
The application uses a comprehensive PostgreSQL schema with tables for:
- `users` - User accounts with OAuth and subscription management
- `videos` - YouTube video metadata and processing status
- `processing_results` - Generated content from video processing
- `notes` - User-created notes linked to videos
- `templates` - Content generation templates
- `processing_queue` - Background job processing

### Video Processing Workflow
1. User submits YouTube URL with selected template
2. Request queued via `GeminiClient` (`lib/gemini/client.ts`)
3. Video processed using Gemini AI models
4. Results stored in database with cost tracking
5. Content available for export in multiple formats

## Development Patterns

### Agent Workflow Process
1. Coordinator Agent analyzes tasks and delegates to appropriate specialized agents
2. Multiple agents work in parallel when beneficial
3. All code passes through QA Agent evaluation
4. Debugging Agent handles error resolution with Research Agent integration
5. Memory Context Agent maintains project documentation and context

### Authentication System
- Uses NextAuth.js v5 with Google OAuth
- Session management with Supabase integration
- User subscription tiers and usage tracking

### Content Templates
Templates are defined in `lib/templates/` and include:
- Basic Summary - Concise video overview
- Study Notes - Structured learning content
- Presentation Slides - Key points for presentations
- Tutorial Guide - Step-by-step instructions
- Quick Reference - Bullet-point format

### Cost Management
- Token usage tracking for all Gemini API calls
- Cost calculation based on input/output token ratios
- User limits enforced via subscription tiers

## Environment Variables Required
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3003
REDIS_URL=your_redis_url
DATABASE_URL=your_postgresql_url
```

## Important Notes
- Development server runs on port 3003 (not default 3000)
- Uses Drizzle ORM with PostgreSQL - always run `npm run db:generate` after schema changes
- Gemini API processes video content directly - ensure proper error handling for large files
- Agent system maintains development context - check `lib/agents/memory-context-agent.ts` for project state