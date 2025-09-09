# YouTube-to-Notes: AI-Powered Video Content Transformation

## Project Overview

YouTube-to-Notes is an AI-powered web application that converts YouTube videos into various content formats using Google's Gemini AI models (2.0 Flash and 1.5 Flash). The application processes video content and generates summaries, study guides, presentations, and tutorials based on curated templates.

## Agent Workflow System

This project uses a sophisticated multi-agent workflow for development:

### Agent Types
- **Coordinator Agent**: Task delegation and orchestration
- **Coding Agent**: Primary code generation and implementation
- **Frontend Agent**: UI/UX implementation and user experience
- **Backend Agent**: API development and server-side logic
- **Research Agent**: Technology exploration and solution research
- **QA Agent**: Code quality assessment and testing
- **Debugging Agent**: Error analysis and fixing
- **Memory Context Agent**: Project state tracking and documentation

### Workflow Process
1. **Task Delegation**: Coordinator analyzes tasks and delegates to appropriate agents
2. **Parallel Execution**: Multiple agents work simultaneously when needed
3. **Quality Assurance**: All code goes through QA evaluation
4. **Error Handling**: Comprehensive debugging workflow with research integration
5. **Documentation**: Continuous knowledge capture and context preservation

## Phase 1 MVP Features

### Core Functionality
- ✅ YouTube URL processing with Gemini AI models
- ✅ Template-based content generation (no AI chat)
- ✅ Basic summary generation
- ✅ Simple web interface
- ✅ User authentication (basic)
- ✅ Freemium tier system (5 videos/month free)

### Templates Available
1. **Basic Summary**: Concise video overview
2. **Study Notes**: Structured learning content
3. **Presentation Slides**: Key points for slides
4. **Tutorial Guide**: Step-by-step instructions
5. **Quick Reference**: Bullet-point format

## Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini AI models (2.0 Flash, 1.5 Flash)
- **Queue System**: Bull/BullMQ (Redis)
- **File Storage**: Supabase Storage

### DevOps
- **Version Control**: Git
- **Testing**: Playwright (E2E) + Jest (Unit)
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript
- **Monitoring**: Vercel Analytics

## Project Structure

```
youtube-to-notes/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication API
│   │   ├── videos/        # Video processing API
│   │   ├── templates/     # Template management API
│   │   └── webhooks/      # Webhook handlers
│   ├── dashboard/         # User dashboard
│   ├── process/           # Video processing page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   ├── forms/            # Form components
│   └── templates/        # Template-specific components
├── lib/                   # Utility functions
│   ├── agents/           # Agent workflow system
│   ├── gemini/           # Gemini API integration
│   ├── db/               # Database utilities
│   └── utils/            # General utilities
├── types/                 # TypeScript type definitions
├── docs/                  # Documentation
│   ├── agents/           # Agent workflow docs
│   ├── api/              # API documentation
│   └── deployment/       # Deployment guides
└── tests/                # Test files
    ├── e2e/             # End-to-end tests
    └── unit/            # Unit tests
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud account (for Gemini API)
- Supabase account

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Environment Variables
```env
# Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Redis (for Bull/BullMQ)
REDIS_URL=your_redis_url
```

## Agent Workflow Commands

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Run linting

### Agent-Specific Commands
- `npm run agent:research` - Start research agent
- `npm run agent:qa` - Run QA checks
- `npm run agent:memory` - Update memory context

## Development Workflow

1. **Feature Request** → Coordinator Agent delegates to appropriate agents
2. **Implementation** → Coding/Frontend/Backend agents execute
3. **Quality Check** → QA Agent evaluates output
4. **Documentation** → Memory Context Agent updates knowledge base
5. **Testing** → Comprehensive test suite execution

## Contributing

This project uses an agent-based development workflow. All contributions go through:
1. Agent delegation and orchestration
2. Parallel development execution
3. Quality assurance evaluation
4. Automated testing and validation
5. Continuous documentation updates

## License

MIT License - see LICENSE file for details
# Force Vercel redeploy - Fri Aug 29 12:27:40 EDT 2025
