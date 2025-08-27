# MCP Reference & Context System Guide

## 🤖 Available MCPs (Model Context Protocol)

### **Core Development Tools**

#### **File Operations**
```bash
# Read files
read_file - Read file contents with line ranges

# Edit files  
edit_file - Create or modify files with code edits

# Search files
grep_search - Fast regex search across files
file_search - Fuzzy file path search
codebase_search - Semantic code search

# List directories
list_dir - List directory contents
```

#### **Terminal Commands**
```bash
# Execute commands
run_terminal_cmd - Run shell commands with background support

# Examples:
npm install
npm run dev
npm run build
npm test
```

#### **Web Access**
```bash
# Research and documentation
web_search - Search for information online
scrape_webpage - Extract content from web pages
```

### **Agent Workflow System**

#### **Available Agents**
1. **Coordinator Agent** - Task orchestration and delegation
2. **Coding Agent** - Code generation and implementation
3. **Frontend Agent** - UI/UX with interactive design decisions
4. **Backend Agent** - API and server-side development
5. **QA Agent** - Quality assurance and testing
6. **Research Agent** - Technology exploration and solutions
7. **Debugging Agent** - Error analysis and fixing
8. **Memory Context Agent** - Project state and knowledge tracking
9. **Playwright Agent** - Browser automation and UI testing
10. **GitHub Agent** - Repository management and CI/CD automation

#### **Agent Commands**
```bash
# Run agent demonstrations
npm run demo:interactive
npm run demo:playwright
npm run demo:github

# Run specific agent tasks
npm run agent:research
npm run agent:qa  
npm run agent:memory
```

### **Project-Specific Tools**

#### **Template System**
- **6 Content Formats**: Basic Summary, Study Notes, Presentation Slides, Tutorial Guide, Quick Reference, Research Paper
- **Interactive Selection**: Template-based prompts for Gemini 2.5
- **Cost Estimation**: Built-in token and pricing calculation

#### **Gemini Integration**
- **Video Processing**: Direct YouTube URL processing
- **Queue Management**: Handle long video processing
- **Error Handling**: Comprehensive error management
- **Cost Tracking**: Real-time cost monitoring

#### **Browser Automation (Playwright)**
- **Browser Control**: Create, manage, and control browser sessions
- **UI Testing**: Automated testing of web interfaces
- **Screenshots**: Capture visual states for validation
- **Element Interaction**: Click, type, scroll, evaluate JavaScript
- **Page Navigation**: Navigate and wait for page loads
- **Test Validation**: Element existence, text content, URL validation

#### **GitHub Integration**
- **Repository Management**: Create issues, pull requests, releases
- **Issue Tracking**: Automated bug and feature request creation
- **CI/CD Integration**: Check run creation and management
- **Release Automation**: Automated release creation with changelogs
- **Code Quality**: Integration with GitHub checks and status
- **Project Management**: Automated project status updates

## 🧠 Context System & Memory

### **Context Restoration**

When context is lost or starting a new session:

```bash
# Restore project context
npm run context:restore
```

This will display:
- Agent workflow status
- Current project phase
- Design decisions made
- Next steps
- Quick reference commands

### **Memory Persistence**

Our system maintains memory across sessions:

#### **Project Memory**
- Design decisions and preferences
- Agent performance metrics
- User choice patterns
- Task history and results

#### **Learning System**
- Common decision patterns
- User preference tracking
- Agent success rates
- Optimization suggestions

### **Context Generation**

The system automatically generates context for AI:

```typescript
// Generate context summary
const context = projectMemory.generateContext();

// Access project state
const state = projectMemory.getProjectState();

// Get decision history
const decisions = projectMemory.getDecisionHistory('frontend');
```

## 🎯 How to Use the System

### **Starting Development**

1. **Restore Context**
   ```bash
   npm run context:restore
   ```

2. **Check Todo List**
   ```bash
   cat docs/TODO.md
   ```

3. **Run Agent Demo**
   ```bash
   npm run demo:interactive
   ```

### **Using Agents for Development**

#### **Frontend Development**
```typescript
// The Frontend Agent will ask:
- Design style preferences (Glass Morphism, Modern Minimalist, etc.)
- Layout structure (single-page, multi-page, dashboard, etc.)
- Accessibility requirements
- Performance priorities
- Component interactions
```

#### **Browser Testing & UI Validation**
```typescript
// The Playwright Agent can:
- Test landing page functionality
- Validate video upload interface
- Verify template selection workflow
- Capture screenshots for visual validation
- Run automated UI tests

// Example usage:
const playwrightAgent = new PlaywrightAgent();
await playwrightAgent.testLandingPage('http://localhost:3000');
await playwrightAgent.testVideoUpload('http://localhost:3000/upload');
await playwrightAgent.testTemplateSelection('http://localhost:3000/templates');
```

#### **Backend Development**
```typescript
// The Backend Agent will ask:
- API structure preferences (REST, GraphQL, gRPC)
- Database choices (PostgreSQL, MongoDB, Redis)
- Authentication methods (JWT, OAuth, custom)
- Caching strategies
- Error handling approaches
```

#### **Coding Tasks**
```typescript
// The Coding Agent will ask:
- Architecture patterns (MVC, MVVM, Clean Architecture)
- Testing strategies (unit, integration, E2E)
- Code style preferences
- Documentation requirements
```

### **Interactive Decision Flow**

```
1. Submit Task → Coordinator Agent
2. Agent Generates Questions → User Provides Decisions
3. Agent Validates Decisions → Implementation Begins
4. QA Agent Evaluates → Pass/Fail Decision
5. Memory Context Updates → Knowledge Preserved
```

## 📋 Living Documentation

### **Key Files**
- `docs/TODO.md` - Living todo list (update as we progress)
- `docs/PROJECT_OVERVIEW.md` - Complete project overview
- `docs/INTERACTIVE_DECISIONS.md` - Agent decision system
- `docs/MCP_REFERENCE.md` - This file (MCP reference)

### **Project Structure**
```
youtube-to-notes/
├── lib/
│   ├── agents/          # Agent workflow system
│   ├── memory/          # Context and memory management
│   ├── templates/       # Content format definitions
│   ├── gemini/          # AI integration
│   └── utils/           # Utility functions
├── scripts/             # Development and demo scripts
├── docs/                # Documentation
└── app/                 # Next.js application (to be built)
```

## 🚀 Quick Start Commands

### **Development Setup**
```bash
# Install dependencies
npm install

# Restore context (always run first in new session)
npm run context:restore

# Start development server
npm run dev
```

### **Agent Workflow**
```bash
# View current todo list
cat docs/TODO.md

# Run agent demonstration
npm run demo:interactive

# View project overview
cat docs/PROJECT_OVERVIEW.md

# View interactive decisions guide
cat docs/INTERACTIVE_DECISIONS.md
```

### **Context Management**
```bash
# Restore project context
npm run context:restore

# View project memory
# (Accessible via projectMemory.exportMemory())
```

## 🔄 Context Loss Recovery

If the system loses context during development:

1. **Run Context Restoration**
   ```bash
   npm run context:restore
   ```

2. **Review Current State**
   - Check current phase in todo list
   - Review recent decisions
   - Confirm agent workflow status

3. **Continue Development**
   - Agents will remember previous decisions
   - Memory context preserves learning
   - Workflow continues seamlessly

## 💡 Best Practices

### **Using the Agent System**
- Always let agents ask questions before proceeding
- Provide detailed context for better decisions
- Review and approve agent suggestions
- Use the memory system to track decisions

### **Context Management**
- Run context restoration when starting new sessions
- Update the todo list as tasks are completed
- Document important decisions and reasoning
- Use the memory system for learning patterns

### **Development Workflow**
- Use agents for all development tasks
- Follow the interactive decision process
- Maintain the living todo list
- Update documentation as the project evolves

---

**Remember**: The agent workflow system is designed to ensure quality, maintainability, and user satisfaction. Always use the interactive decision process to avoid assumptions and ensure the implementation matches your vision exactly.
