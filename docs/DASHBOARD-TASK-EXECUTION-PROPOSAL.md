# Dashboard Task Execution Proposal

## Problem Statement

**User Request:**
> "If I use dashboard only, can I run the task with a specific agent just like we did from the CLI?"

**Current Limitation:**
- Dashboard can only **copy prompts to clipboard**
- No direct task execution from dashboard
- Requires manual copy-paste to AI assistant
- No agent selection or automation

## Proposed Solution: Dashboard Task Orchestrator

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard UI (Browser)                                  │
│  - Select task                                           │
│  - Choose agent (Claude, Codex, Gemini, etc.)          │
│  - Click "Execute Task"                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST /api/tasks/execute
┌──────────────────▼──────────────────────────────────────┐
│  Task Orchestrator (Backend)                            │
│  - Queue management                                      │
│  - Agent routing                                         │
│  - Execution tracking                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌──────▼──────────┐
│  Script Runner  │  │  AI Agent API   │
│  - Bash scripts │  │  - Claude API   │
│  - Environment  │  │  - Local LLM    │
│  - Validation   │  │  - MCP Client   │
└─────────────────┘  └─────────────────┘
         │                   │
         └─────────┬─────────┘
                   │ WebSocket updates
┌──────────────────▼──────────────────────────────────────┐
│  Dashboard UI (Real-time Updates)                       │
│  - Execution progress                                    │
│  - Live output streaming                                │
│  - Task completion status                               │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Script Execution

#### 1.1 Backend API Endpoint

**File**: `src/dashboard/multi-server.ts`

```typescript
// Execute a bash script
this.app.post('/api/scripts/execute', async (request, reply) => {
  const { projectId, scriptPath, args } = request.body;

  // Validate project
  const project = this.projectManager.getProject(projectId);
  if (!project || project.projectType !== 'spec-kit') {
    return reply.status(404).send({ error: 'Spec-kit project not found' });
  }

  // Validate script path (security check)
  const scriptsDir = path.join(project.projectPath, '.specify', 'scripts', 'bash');
  const fullScriptPath = path.resolve(scriptsDir, scriptPath);
  if (!fullScriptPath.startsWith(scriptsDir)) {
    return reply.status(403).send({ error: 'Invalid script path' });
  }

  // Check if script exists
  if (!fs.existsSync(fullScriptPath)) {
    return reply.status(404).send({ error: 'Script not found' });
  }

  // Create execution ID
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Execute script in background
  this.executeScript(executionId, projectId, fullScriptPath, args);

  return reply.send({
    executionId,
    status: 'started',
    message: 'Script execution started'
  });
});

// Get execution status
this.app.get('/api/scripts/execution/:executionId', async (request, reply) => {
  const { executionId } = request.params;
  const execution = this.scriptExecutions.get(executionId);

  if (!execution) {
    return reply.status(404).send({ error: 'Execution not found' });
  }

  return reply.send(execution);
});
```

#### 1.2 Script Executor

**New File**: `src/dashboard/script-executor.ts`

```typescript
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface ScriptExecution {
  id: string;
  projectId: string;
  scriptPath: string;
  status: 'running' | 'completed' | 'failed';
  exitCode?: number;
  output: string[];
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

export class ScriptExecutor extends EventEmitter {
  private executions: Map<string, ScriptExecution> = new Map();

  async executeScript(
    executionId: string,
    projectId: string,
    scriptPath: string,
    args: string[] = [],
    workingDir: string
  ): Promise<void> {
    const execution: ScriptExecution = {
      id: executionId,
      projectId,
      scriptPath,
      status: 'running',
      output: [],
      errors: [],
      startTime: new Date()
    };

    this.executions.set(executionId, execution);
    this.emit('execution-started', execution);

    try {
      // Make script executable
      await fs.chmod(scriptPath, 0o755);

      // Spawn process
      const process = spawn('bash', [scriptPath, ...args], {
        cwd: workingDir,
        env: { ...process.env, PROJECT_ROOT: workingDir }
      });

      // Capture stdout
      process.stdout.on('data', (data) => {
        const line = data.toString();
        execution.output.push(line);
        this.emit('execution-output', executionId, line);
      });

      // Capture stderr
      process.stderr.on('data', (data) => {
        const line = data.toString();
        execution.errors.push(line);
        this.emit('execution-error', executionId, line);
      });

      // Handle completion
      process.on('close', (code) => {
        execution.exitCode = code;
        execution.status = code === 0 ? 'completed' : 'failed';
        execution.endTime = new Date();
        this.emit('execution-completed', execution);
      });

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error.message);
      execution.endTime = new Date();
      this.emit('execution-failed', execution);
    }
  }

  getExecution(executionId: string): ScriptExecution | undefined {
    return this.executions.get(executionId);
  }
}
```

#### 1.3 Frontend Script Execution

**Update**: `src/dashboard_frontend/src/components/ScriptList.tsx`

```typescript
const [executing, setExecuting] = useState<string | null>(null);
const [executionOutput, setExecutionOutput] = useState<string>('');

const executeScript = async (script: ScriptDTO) => {
  setExecuting(script.scriptId);
  setExecutionOutput('Starting script execution...\n');

  try {
    // Start execution
    const response = await fetch(`/api/scripts/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: script.projectId,
        scriptPath: script.fileName,
        args: [] // Could add UI for args
      })
    });

    const { executionId } = await response.json();

    // Poll for updates (or use WebSocket)
    const interval = setInterval(async () => {
      const statusResponse = await fetch(`/api/scripts/execution/${executionId}`);
      const execution = await statusResponse.json();

      setExecutionOutput(execution.output.join(''));

      if (execution.status === 'completed' || execution.status === 'failed') {
        clearInterval(interval);
        setExecuting(null);
      }
    }, 500);

  } catch (error) {
    setExecutionOutput(`Error: ${error.message}`);
    setExecuting(null);
  }
};

// Update button
<button
  onClick={() => executeScript(script)}
  disabled={executing === script.scriptId}
>
  {executing === script.scriptId ? 'Running...' : 'Run'}
</button>
```

### Phase 2: AI Agent Task Execution

#### 2.1 Agent Configuration

**New File**: `.spec-workflow/agents.toml`

```toml
# AI Agent configurations
[[agents]]
name = "claude"
type = "anthropic-api"
api_key_env = "ANTHROPIC_API_KEY"
model = "claude-sonnet-4"
enabled = true

[[agents]]
name = "codex"
type = "openai-api"
api_key_env = "OPENAI_API_KEY"
model = "gpt-4"
enabled = true

[[agents]]
name = "local-llm"
type = "ollama"
model = "codellama:13b"
endpoint = "http://localhost:11434"
enabled = false
```

#### 2.2 Agent Executor

**New File**: `src/dashboard/agent-executor.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

export interface AgentConfig {
  name: string;
  type: 'anthropic-api' | 'openai-api' | 'ollama' | 'mcp-client';
  apiKeyEnv?: string;
  model: string;
  endpoint?: string;
}

export class AgentExecutor {
  private agents: Map<string, AgentConfig> = new Map();

  async executeTask(
    agentName: string,
    projectPath: string,
    taskPrompt: string,
    context: {
      specName: string;
      taskId: string;
      constitution?: string;
      plan?: string;
    }
  ): Promise<AsyncGenerator<string>> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    switch (agent.type) {
      case 'anthropic-api':
        return this.executeWithAnthropic(agent, projectPath, taskPrompt, context);
      case 'openai-api':
        return this.executeWithOpenAI(agent, projectPath, taskPrompt, context);
      case 'mcp-client':
        return this.executeWithMCP(agent, projectPath, taskPrompt, context);
      default:
        throw new Error(`Unsupported agent type: ${agent.type}`);
    }
  }

  private async *executeWithAnthropic(
    agent: AgentConfig,
    projectPath: string,
    taskPrompt: string,
    context: any
  ): AsyncGenerator<string> {
    const apiKey = process.env[agent.apiKeyEnv!];
    if (!apiKey) {
      throw new Error(`API key not found in ${agent.apiKeyEnv}`);
    }

    const client = new Anthropic({ apiKey });

    // Build system prompt with context
    const systemPrompt = `
You are working on a task in a spec-kit project.

Project Path: ${projectPath}
Spec: ${context.specName}
Task ID: ${context.taskId}

${context.constitution ? `Project Constitution:\n${context.constitution}\n` : ''}
${context.plan ? `Implementation Plan:\n${context.plan}\n` : ''}

Your task:
${taskPrompt}
`;

    // Stream response
    const stream = await client.messages.create({
      model: agent.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: systemPrompt }],
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
```

#### 2.3 Task Execution API

**Update**: `src/dashboard/multi-server.ts`

```typescript
// Execute task with AI agent
this.app.post('/api/tasks/execute', async (request, reply) => {
  const { projectId, specName, taskId, agentName } = request.body;

  // Validate
  const project = this.projectManager.getProject(projectId);
  if (!project) {
    return reply.status(404).send({ error: 'Project not found' });
  }

  // Get task details
  const parser = new SpecParser(project.projectPath);
  const spec = await parser.getSpec(specName);
  const tasksContent = await readFile(
    join(project.projectPath, 'specs', specName, 'tasks.md'),
    'utf-8'
  );
  const tasks = parseTasksFromMarkdown(tasksContent);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return reply.status(404).send({ error: 'Task not found' });
  }

  // Create execution
  const executionId = `task-${Date.now()}`;

  // Start execution (async)
  this.taskExecutor.executeTask(executionId, {
    projectId,
    projectPath: project.projectPath,
    specName,
    taskId,
    taskPrompt: task.prompt || task.description,
    agentName
  });

  return reply.send({
    executionId,
    status: 'started'
  });
});

// Stream task execution output
this.app.get('/api/tasks/execution/:executionId/stream', async (request, reply) => {
  const { executionId } = request.params;

  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');

  const execution = this.taskExecutor.getExecution(executionId);
  if (!execution) {
    reply.raw.write(`data: ${JSON.stringify({ error: 'Not found' })}\n\n`);
    reply.raw.end();
    return;
  }

  // Stream existing output
  for (const line of execution.output) {
    reply.raw.write(`data: ${JSON.stringify({ type: 'output', text: line })}\n\n`);
  }

  // Listen for new output
  const outputHandler = (text: string) => {
    reply.raw.write(`data: ${JSON.stringify({ type: 'output', text })}\n\n`);
  };

  const completeHandler = () => {
    reply.raw.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    reply.raw.end();
  };

  this.taskExecutor.on(`output-${executionId}`, outputHandler);
  this.taskExecutor.on(`complete-${executionId}`, completeHandler);

  // Cleanup on close
  request.raw.on('close', () => {
    this.taskExecutor.off(`output-${executionId}`, outputHandler);
    this.taskExecutor.off(`complete-${executionId}`, completeHandler);
  });
});
```

#### 2.4 Frontend Task Execution UI

**New Component**: `src/dashboard_frontend/src/components/TaskExecutor.tsx`

```typescript
export function TaskExecutor({
  projectId,
  specName,
  task
}: TaskExecutorProps) {
  const [selectedAgent, setSelectedAgent] = useState('claude');
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const executeTask = async () => {
    setExecuting(true);
    setOutput([]);

    // Start execution
    const response = await fetch('/api/tasks/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        specName,
        taskId: task.id,
        agentName: selectedAgent
      })
    });

    const { executionId } = await response.json();

    // Subscribe to output stream
    const eventSource = new EventSource(
      `/api/tasks/execution/${executionId}/stream`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'output') {
        setOutput(prev => [...prev, data.text]);
      } else if (data.type === 'complete') {
        setExecuting(false);
        eventSource.close();
      }
    };
  };

  return (
    <div className="task-executor">
      <div className="flex gap-2 mb-4">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          disabled={executing}
        >
          <option value="claude">Claude</option>
          <option value="codex">Codex</option>
          <option value="gemini">Gemini</option>
        </select>

        <button
          onClick={executeTask}
          disabled={executing}
        >
          {executing ? 'Executing...' : 'Execute Task'}
        </button>
      </div>

      {output.length > 0 && (
        <div className="output-console">
          <pre>{output.join('')}</pre>
        </div>
      )}
    </div>
  );
}
```

## Security Considerations

### Script Execution
- ✅ Path validation (prevent directory traversal)
- ✅ Whitelist scripts directory (`.specify/scripts/bash/`)
- ✅ User confirmation before execution
- ✅ Sandboxed environment (optional)
- ✅ Execution timeout limits

### AI Agent Execution
- ✅ API keys stored in environment variables only
- ✅ Rate limiting per agent
- ✅ Cost tracking and limits
- ✅ Audit logging
- ✅ User confirmation for destructive operations

## Benefits

1. **Unified Interface**: Execute everything from dashboard
2. **Agent Selection**: Choose which AI to use per task
3. **Real-Time Feedback**: Stream execution output
4. **No Context Switching**: Stay in dashboard
5. **Execution History**: Track what was run and when
6. **Multi-Project**: Works across all projects

## Timeline

- **Week 1**: Script execution (Phase 1)
- **Week 2**: Agent executor framework
- **Week 3**: AI agent integrations
- **Week 4**: UI polish and testing

## Open Questions

1. How to handle long-running tasks (hours)?
2. Should we queue tasks or run concurrently?
3. How to handle agent failures and retries?
4. Should we support custom agents (plugins)?
5. How to manage API costs and quotas?
