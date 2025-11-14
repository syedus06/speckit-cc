# Kiro-Style Task Execution for Dashboard

## Overview

Kiro-style execution means **one-click task execution** directly from the dashboard with minimal setup. No manual copy-paste, no CLI switching - just click and the AI agent runs the task.

## User Experience (Kiro-Style)

### Current Workflow (Manual)
```
1. Open dashboard → View tasks
2. Click "Copy Prompt"
3. Switch to Claude Desktop/CLI
4. Paste prompt
5. Wait for response
6. Switch back to dashboard
7. Manually mark task complete
```
**Total steps: 7 | Manual interventions: 4**

### Kiro-Style Workflow (Automated)
```
1. Open dashboard → View tasks
2. Click "▶ Run with Claude"
3. Watch live output in dashboard
4. Task auto-marks complete
```
**Total steps: 4 | Manual interventions: 1**

## Architecture: Kiro-Style Execution

```
┌─────────────────────────────────────────────────┐
│  Dashboard UI (Browser)                         │
│  ┌───────────────────────────────────────────┐  │
│  │ Task: "Implement user authentication"    │  │
│  │ ┌────────┐ ┌────────┐ ┌────────┐        │  │
│  │ │▶ Claude│ │▶ Codex │ │▶ Gemini│        │  │
│  │ └────────┘ └────────┘ └────────┘        │  │
│  │                                          │  │
│  │ [Live Output Streaming...]               │  │
│  │ > Reading project files...               │  │
│  │ > Analyzing requirements...              │  │
│  │ > Creating auth.ts...                    │  │
│  │ ✓ Task completed successfully            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      │ WebSocket
                      ▼
┌─────────────────────────────────────────────────┐
│  Task Execution Server (Node.js)                │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Agent Router                            │  │
│  │  - Reads .claude/, .codex/, .gemini/     │  │
│  │  - Detects available agents              │  │
│  │  - Routes to appropriate executor        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Execution Engines                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  Claude  │ │  Codex   │ │  Gemini  │ │  │
│  │  │  Runner  │ │  Runner  │ │  Runner  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      │ AI API / MCP / CLI
                      ▼
┌─────────────────────────────────────────────────┐
│  AI Agents                                       │
│  - Anthropic API (Claude)                       │
│  - OpenAI API (GPT-4)                           │
│  - Google Gemini API                            │
│  - Local MCP servers                            │
│  - Ollama (local LLMs)                          │
└─────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: MCP-Based Execution (Fastest - 1 week)

**Use existing MCP servers as execution backend**

```typescript
// src/dashboard/kiro-executor.ts

export class KiroExecutor {
  private mcpConnections: Map<string, MCPConnection> = new Map();

  /**
   * Execute task using MCP client connection
   * This is the Kiro way - simple, direct, works with existing setup
   */
  async executeTaskWithMCP(
    projectPath: string,
    taskPrompt: string,
    agentName: 'claude' | 'codex' | 'gemini'
  ): Promise<AsyncGenerator<string>> {
    // Get or create MCP connection for this agent
    const connection = await this.getMCPConnection(agentName, projectPath);

    // Stream task execution
    return this.streamMCPToolCall(connection, {
      tool: 'spec-workflow-guide',
      arguments: {
        action: 'execute-task',
        prompt: taskPrompt,
        projectPath
      }
    });
  }

  private async getMCPConnection(
    agentName: string,
    projectPath: string
  ): Promise<MCPConnection> {
    const key = `${agentName}-${projectPath}`;

    if (!this.mcpConnections.has(key)) {
      // Spawn MCP server for this project
      const mcpProcess = spawn('npx', [
        '@pimzino/spec-workflow-mcp@latest',
        projectPath
      ]);

      // Create stdio transport connection
      const connection = new MCPConnection(mcpProcess);
      this.mcpConnections.set(key, connection);
    }

    return this.mcpConnections.get(key)!;
  }
}
```

**Frontend: One-Click Button**

```typescript
// src/dashboard_frontend/src/components/TaskCard.tsx

function TaskCard({ task, specName, projectPath }) {
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState('');

  const runWithAgent = async (agentName: string) => {
    setExecuting(true);
    setOutput('Starting execution...\n');

    // Call backend API
    const response = await fetch('/api/kiro/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath,
        specName,
        taskId: task.id,
        agentName
      })
    });

    const { executionId } = await response.json();

    // Stream output via Server-Sent Events
    const eventSource = new EventSource(
      `/api/kiro/stream/${executionId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chunk') {
        setOutput(prev => prev + data.text);
      } else if (data.type === 'complete') {
        setExecuting(false);
        eventSource.close();
        // Auto-refresh task status
        refreshTaskStatus();
      }
    };
  };

  return (
    <div className="task-card">
      <h3>{task.description}</h3>

      <div className="kiro-actions">
        <button
          onClick={() => runWithAgent('claude')}
          disabled={executing}
          className="kiro-btn claude"
        >
          ▶ Run with Claude
        </button>
        <button
          onClick={() => runWithAgent('codex')}
          disabled={executing}
          className="kiro-btn codex"
        >
          ▶ Run with Codex
        </button>
        <button
          onClick={() => runWithAgent('gemini')}
          disabled={executing}
          className="kiro-btn gemini"
        >
          ▶ Run with Gemini
        </button>
      </div>

      {executing && (
        <div className="live-output">
          <div className="output-header">
            <span className="pulse">●</span> Executing...
          </div>
          <pre className="output-console">{output}</pre>
        </div>
      )}
    </div>
  );
}
```

### Phase 2: Direct API Execution (2 weeks)

**For agents that support API (Claude, GPT-4, Gemini)**

```typescript
// src/dashboard/agents/claude-runner.ts

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeRunner {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *executeTask(
    projectPath: string,
    taskPrompt: string,
    context: {
      constitution?: string;
      plan?: string;
      spec?: string;
    }
  ): AsyncGenerator<string> {
    // Build rich context
    const systemPrompt = this.buildSystemPrompt(projectPath, context);

    // Stream response
    const stream = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: taskPrompt
      }],
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    }
  }

  private buildSystemPrompt(projectPath: string, context: any): string {
    return `
You are an expert software engineer working on a spec-kit project.

Project: ${projectPath}

${context.constitution ? `
## Project Constitution (MUST FOLLOW)
${context.constitution}
` : ''}

${context.plan ? `
## Implementation Plan
${context.plan}
` : ''}

${context.spec ? `
## Specification
${context.spec}
` : ''}

Execute the task below. Write clean, tested code that follows the project's constitution and standards.
`;
  }
}
```

### Phase 3: Auto-Agent Selection (3 weeks)

**Kiro-style intelligence: Auto-select best agent for the task**

```typescript
// src/dashboard/kiro-ai.ts

export class KiroAI {
  /**
   * Analyzes task and selects optimal agent
   * - Code generation → Claude Sonnet 4
   * - Bug fixing → GPT-4
   * - Documentation → Claude Opus
   * - Quick edits → Local LLM
   */
  async selectAgent(task: Task, context: ProjectContext): Promise<string> {
    const analysis = await this.analyzeTask(task);

    if (analysis.complexity === 'high' && analysis.requiresReasoning) {
      return 'claude-opus';
    }

    if (analysis.type === 'code-generation') {
      return 'claude-sonnet';
    }

    if (analysis.type === 'bug-fix' && analysis.hasTests) {
      return 'gpt-4';
    }

    if (analysis.type === 'documentation') {
      return 'gemini-pro';
    }

    // Default: fast local model
    return 'local-llm';
  }

  private async analyzeTask(task: Task): Promise<TaskAnalysis> {
    // Use cheap model to analyze task
    const prompt = `Analyze this task and classify it:

Task: ${task.description}
${task.requirements ? `Requirements: ${task.requirements}` : ''}

Respond in JSON:
{
  "type": "code-generation" | "bug-fix" | "refactor" | "documentation" | "testing",
  "complexity": "low" | "medium" | "high",
  "requiresReasoning": boolean,
  "hasTests": boolean
}`;

    // Quick classification
    const response = await this.quickInference(prompt);
    return JSON.parse(response);
  }
}
```

## Configuration

### Agent Setup (One-Time)

**File**: `.spec-workflow/kiro.toml`

```toml
[kiro]
# Enable Kiro-style execution
enabled = true

# Default agent selection
default_agent = "auto"  # or "claude", "codex", "gemini"

# Agent configurations
[agents.claude]
enabled = true
type = "anthropic-api"
api_key_env = "ANTHROPIC_API_KEY"
model = "claude-sonnet-4"
max_tokens = 8192

[agents.codex]
enabled = true
type = "openai-api"
api_key_env = "OPENAI_API_KEY"
model = "gpt-4"
max_tokens = 4096

[agents.gemini]
enabled = true
type = "google-api"
api_key_env = "GOOGLE_API_KEY"
model = "gemini-2.0-flash-exp"
max_tokens = 8192

[agents.local]
enabled = false
type = "ollama"
model = "codellama:13b"
endpoint = "http://localhost:11434"

# Execution settings
[execution]
auto_save = true          # Auto-save files created by agent
auto_commit = false       # Auto-commit changes (requires confirmation)
stream_output = true      # Stream output in real-time
timeout_seconds = 300     # 5 minute timeout

# Safety settings
[safety]
require_confirmation = true        # Confirm before execution
review_changes = true             # Show diff before saving
backup_before_execution = true    # Backup project before running
```

### Environment Setup

```bash
# Create .env file
cat > .env << 'EOF'
# AI Agent API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Kiro Settings
KIRO_ENABLED=true
KIRO_DEFAULT_AGENT=auto
EOF
```

## API Endpoints

### Execute Task (Kiro-Style)

**POST** `/api/kiro/execute`

```json
{
  "projectPath": "/home/user/code/my-project",
  "specName": "user-auth",
  "taskId": "T001",
  "agentName": "claude",  // or "auto" for auto-selection
  "options": {
    "stream": true,
    "autoSave": true,
    "requireConfirmation": false
  }
}
```

**Response:**
```json
{
  "executionId": "kiro-exec-1234567890",
  "status": "started",
  "selectedAgent": "claude-sonnet-4",
  "streamUrl": "/api/kiro/stream/kiro-exec-1234567890"
}
```

### Stream Execution Output

**GET** `/api/kiro/stream/:executionId`

Server-Sent Events stream:

```
data: {"type":"start","agent":"claude-sonnet-4"}

data: {"type":"chunk","text":"I'll help you implement user authentication.\n"}

data: {"type":"chunk","text":"First, let me read the specification...\n"}

data: {"type":"file","action":"create","path":"src/auth.ts"}

data: {"type":"chunk","text":"Creating authentication service...\n"}

data: {"type":"complete","filesChanged":["src/auth.ts","src/types.ts"],"summary":"Created authentication service with JWT support"}
```

## UI Design (Kiro-Style)

### Task Card with Kiro Buttons

```
┌─────────────────────────────────────────────────────────┐
│ T001: Implement user authentication                     │
├─────────────────────────────────────────────────────────┤
│ Create JWT-based authentication with email/password     │
│                                                          │
│ Status: Pending                                          │
│ Estimated: 2 hours                                       │
│                                                          │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│ │ ▶ Claude   │ │ ▶ Codex    │ │ ▶ Gemini   │           │
│ │   Sonnet 4 │ │   GPT-4    │ │   2.0      │           │
│ └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│ 🤖 Recommended: Claude Sonnet 4                         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [●] Executing with Claude Sonnet 4...              │ │
│ │                                                     │ │
│ │ > Analyzing specification...                       │ │
│ │ > Reading project constitution...                  │ │
│ │ > Creating src/auth/jwt.ts...                      │ │
│ │ > Creating src/auth/types.ts...                    │ │
│ │ > Updating src/index.ts...                         │ │
│ │ ✓ Files created: 3                                 │ │
│ │ ✓ Tests added: 8                                   │ │
│ │ ✓ Task completed successfully!                     │ │
│ │                                                     │ │
│ │ [View Changes] [Commit] [Mark Complete]            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Minimal Implementation (Get Started Fast)

### Week 1: Basic Kiro Execution

**Goal**: One-click execution with Claude API

```typescript
// src/dashboard/kiro-simple.ts

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';

export class SimpleKiroExecutor extends EventEmitter {
  private anthropic: Anthropic;

  constructor() {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY required');
    this.anthropic = new Anthropic({ apiKey });
  }

  async executeTask(taskPrompt: string, projectPath: string) {
    const executionId = `exec-${Date.now()}`;

    // Emit start event
    this.emit('start', { executionId });

    try {
      // Stream from Claude
      const stream = await this.anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Project: ${projectPath}\n\n${taskPrompt}`
        }],
        stream: true
      });

      // Forward chunks
      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          this.emit('chunk', { executionId, text: event.delta.text });
        }
      }

      this.emit('complete', { executionId });

    } catch (error) {
      this.emit('error', { executionId, error: error.message });
    }
  }
}
```

**Add to Dashboard Server**:

```typescript
// src/dashboard/multi-server.ts

import { SimpleKiroExecutor } from './kiro-simple.js';

// In registerApiRoutes():
const kiroExecutor = new SimpleKiroExecutor();

this.app.post('/api/kiro/execute', async (request, reply) => {
  const { taskPrompt, projectPath } = request.body;

  const executionId = `exec-${Date.now()}`;
  kiroExecutor.executeTask(taskPrompt, projectPath);

  return { executionId };
});

this.app.get('/api/kiro/stream/:executionId', (request, reply) => {
  const { executionId } = request.params;

  reply.raw.setHeader('Content-Type', 'text/event-stream');

  const onChunk = ({ executionId: id, text }) => {
    if (id === executionId) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
    }
  };

  const onComplete = ({ executionId: id }) => {
    if (id === executionId) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      reply.raw.end();
    }
  };

  kiroExecutor.on('chunk', onChunk);
  kiroExecutor.on('complete', onComplete);

  request.raw.on('close', () => {
    kiroExecutor.off('chunk', onChunk);
    kiroExecutor.off('complete', onComplete);
  });
});
```

## Benefits of Kiro-Style

1. ✅ **One-Click Execution**: No manual steps
2. ✅ **Live Output**: See what the AI is doing
3. ✅ **Agent Choice**: Pick the right AI for the job
4. ✅ **Auto-Complete**: Task status updates automatically
5. ✅ **Context-Aware**: AI has full project context
6. ✅ **Multi-Project**: Works across all your projects
7. ✅ **Fast Iteration**: Run → Review → Iterate

## Cost Optimization

```toml
[kiro.cost]
# Daily limits
max_cost_per_day = 10.00  # $10/day
warn_at_cost = 5.00       # Warning at $5

# Model selection by cost
prefer_cheap_for_simple_tasks = true

# Cache management
cache_prompts = true
reuse_context = true
```

This creates a **true Kiro experience** - intelligent, automated, one-click task execution from your dashboard! 🚀
