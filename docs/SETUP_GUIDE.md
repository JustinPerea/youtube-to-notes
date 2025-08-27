# 🚀 YouTube-to-Notes Setup Guide

## Overview

This guide covers the complete setup process for the YouTube-to-Notes project, including all dependencies, configurations, and system requirements.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### Accounts & Services
- **Google Cloud** - For Gemini API key
- **Supabase** - For database and authentication
- **Redis** (optional) - For queue management
- **GitHub** (optional) - For repository integration

## 🔧 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-to-notes

# Run the automated setup
npm run setup
```

### Option 2: Manual Setup
```bash
# Clone and install
git clone <your-repo-url>
cd youtube-to-notes
npm install

# Copy environment file
cp env.example .env

# Edit .env with your credentials
nano .env

# Run health check
npm run health
```

## 🔑 Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```env
# =============================================================================
# GEMINI API CONFIGURATION
# =============================================================================
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# =============================================================================
# NEXTAUTH CONFIGURATION
# =============================================================================
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# =============================================================================
# REDIS CONFIGURATION (Optional)
# =============================================================================
REDIS_URL=redis://localhost:6379

# =============================================================================
# GITHUB INTEGRATION (Optional)
# =============================================================================
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username
GITHUB_REPO=youtube-to-notes
```

### Getting Your API Keys

#### 1. Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new project or select existing
3. Generate an API key
4. Copy to `GOOGLE_GEMINI_API_KEY`

#### 2. Supabase Configuration
1. Visit [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

#### 3. NextAuth Secret
Generate a secure secret:
```bash
openssl rand -base64 32
```

#### 4. GitHub Token (Optional)
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token with `repo` scope
3. Copy to `GITHUB_TOKEN`

## 🗄️ Database Setup

### 1. Supabase Database
The schema is automatically created when you run migrations:

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# View database (optional)
npm run db:studio
```

### 2. Database Schema
The project includes a complete database schema with:

- **Users**: Authentication and subscription management
- **Videos**: YouTube video processing history
- **Processing Results**: Generated content storage
- **Processing Queue**: Background job management
- **Templates**: Content format definitions
- **Usage History**: User activity tracking
- **Exports**: File export management

## 🤖 Agent Workflow System

### Available Agents
The project includes 10 specialized agents:

1. **Coordinator Agent** - Task delegation and orchestration
2. **Coding Agent** - Code generation and implementation
3. **Frontend Agent** - UI/UX with interactive design decisions
4. **Backend Agent** - API development and server-side logic
5. **QA Agent** - Quality assurance and testing
6. **Research Agent** - Technology exploration and solutions
7. **Debugging Agent** - Error analysis and fixing
8. **Memory Context Agent** - Project state tracking and TODO management
9. **Playwright Agent** - Browser automation and UI testing
10. **GitHub Agent** - Repository management and CI/CD automation

### Testing the Agent System
```bash
# Restore project context
npm run context:restore

# Test interactive workflow
npm run demo:interactive

# Test browser automation
npm run demo:playwright

# Test GitHub integration
npm run demo:github
```

## 🧪 Testing & Quality

### Health Check
Run comprehensive health check:
```bash
npm run health
```

This checks:
- Node.js environment
- Environment variables
- Database connection
- Gemini API access
- Redis connection (optional)
- GitHub integration (optional)
- TypeScript compilation
- Agent workflow system
- Dependencies

### Linting
```bash
# Check for issues
npm run lint

# Fix automatically
npm run lint -- --fix
```

### Type Checking
```bash
npm run type-check
```

## 🚀 Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Database Operations
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Agent Workflow
```bash
# Restore project context
npm run context:restore

# Run agent demos
npm run demo:interactive
npm run demo:playwright
npm run demo:github

# Run specific agents
npm run agent:research
npm run agent:qa
npm run agent:memory
```

## 📁 Project Structure

```
youtube-to-notes/
├── app/                    # Next.js App Router (to be built)
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   ├── process/           # Video processing page
│   └── globals.css        # Global styles
├── components/            # Reusable components (to be built)
│   ├── ui/               # Shadcn/ui components
│   ├── forms/            # Form components
│   └── templates/        # Template-specific components
├── lib/                   # Core libraries
│   ├── agents/           # Agent workflow system ✅
│   ├── memory/           # Context and memory management ✅
│   ├── templates/        # Content format definitions ✅
│   ├── gemini/           # AI integration ✅
│   ├── db/               # Database utilities ✅
│   ├── mcp/              # MCP integrations ✅
│   └── utils/            # General utilities
├── scripts/              # Development scripts ✅
│   ├── setup-project.ts  # Automated setup
│   ├── health-check.ts   # System health check
│   ├── demo-*.ts         # Agent demos
│   └── agents/           # Agent scripts
├── docs/                 # Documentation ✅
├── tests/                # Test files (to be built)
├── screenshots/          # Playwright screenshots ✅
├── env.example           # Environment template ✅
├── drizzle.config.ts     # Database configuration ✅
└── package.json          # Dependencies and scripts ✅
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Found
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
npm run health
```

#### 2. Database Connection Failed
```bash
# Check Supabase credentials
npm run health

# Test database connection
npm run db:studio
```

#### 3. Agent Workflow Issues
```bash
# Restore context
npm run context:restore

# Test specific agents
npm run demo:interactive
```

#### 4. TypeScript Errors
```bash
# Check TypeScript
npm run type-check

# Install missing dependencies
npm install
```

### Getting Help

1. **Run Health Check**: `npm run health`
2. **Check Setup**: `npm run setup`
3. **Restore Context**: `npm run context:restore`
4. **View Documentation**: Check the `docs/` folder

## 🎯 Next Steps

After setup, you can:

1. **Start Development**: `npm run dev`
2. **Build Features**: Use the agent workflow system
3. **Test Functionality**: Run the demo scripts
4. **Deploy**: Configure production environment

## 📚 Additional Resources

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Agent Workflow Guide](docs/INTERACTIVE_DECISIONS.md)
- [MCP Reference](docs/MCP_REFERENCE.md)
- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)

---

**Need Help?** Run `npm run health` to diagnose any issues!
