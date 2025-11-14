# Unified Mode Proposal: Single MCP Server for Multi-Project Management

## Problem Statement

**Current Architecture Limitation:**
- Dashboard runs separately from MCP server (`--dashboard` mode)
- Each project requires its own MCP server instance
- AI clients must configure multiple MCP servers for multiple projects
- This creates management overhead and defeats the unified dashboard purpose

**User Request:**
> "I want to control everything from the dashboard with a single MCP server instance. AI agents should connect to one MCP server that can access all projects in ~/code/"

## Proposed Solution

### Unified Mode Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Single Process: spec-workflow-mcp --unified            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MCP Server (stdio)                              │  │
│  │  - Multi-project aware tools                     │  │
│  │  - Active project context                        │  │
│  │  - Project switching via set_active_project      │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  Dashboard Server (HTTP + WebSocket)             │  │
│  │  - Port 5000                                      │  │
│  │  - Project list with switcher                    │  │
│  │  - Real-time updates                             │  │
│  │  - Active project indicator                      │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  Project Manager                                  │  │
│  │  - Scans ~/code/ for .specify projects           │  │
│  │  - Maintains project registry                    │  │
│  │  - Tracks active project                         │  │
│  │  - File watching for all projects                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Unified Mode Entry Point

**File**: `src/index.ts`

Add new flag `--unified` that:
- Starts MCP server
- Starts dashboard server in the same process
- Configures root directory scanning
- Does NOT require a specific project path

```typescript
// New command-line usage:
// spec-workflow-mcp --unified [--root ~/code] [--port 5000]

if (isUnifiedMode) {
  const unifiedServer = new UnifiedServer({
    rootDirectory: rootDir || process.env.SPECKIT_ROOT_DIR,
    port: port || 5000,
    lang: lang
  });
  await unifiedServer.start();
}
```

#### 1.2 Unified Server Class

**New File**: `src/unified-server.ts`

```typescript
export class UnifiedServer {
  private mcpServer: SpecWorkflowMCPServer;
  private dashboardServer: MultiProjectDashboardServer;
  private projectManager: ProjectManager;
  private activeProjectId?: string;

  async start() {
    // 1. Initialize project manager with root scanning
    await this.projectManager.initialize();
    await this.projectManager.scanRootDirectory();

    // 2. Start dashboard server
    await this.dashboardServer.start();

    // 3. Initialize MCP server with multi-project context
    const context = {
      projectManager: this.projectManager,
      getActiveProject: () => this.getActiveProject(),
      setActiveProject: (id) => this.setActiveProject(id)
    };
    await this.mcpServer.initializeUnified(context);
  }

  getActiveProject(): ProjectContext | null {
    if (!this.activeProjectId) return null;
    return this.projectManager.getProject(this.activeProjectId);
  }

  setActiveProject(projectId: string): void {
    this.activeProjectId = projectId;
    this.dashboardServer.broadcastActiveProjectChange(projectId);
  }
}
```

### Phase 2: Multi-Project MCP Tools

#### 2.1 Modify Tool Context

**File**: `src/types.ts`

```typescript
export interface ToolContext {
  // Legacy single-project mode
  projectPath?: string;

  // Unified multi-project mode
  projectManager?: ProjectManager;
  activeProjectId?: string;

  // Common
  dashboardUrl?: string;
  lang?: string;
}
```

#### 2.2 Add Project Selection Tool

**New File**: `src/tools/set-active-project.ts`

```typescript
export const setActiveProjectTool: Tool = {
  name: 'set_active_project',
  description: 'Set the active project for subsequent tool calls',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to set as active'
      }
    },
    required: ['projectId']
  }
};

export async function setActiveProjectHandler(
  args: any,
  context: ToolContext
): Promise<ToolResponse> {
  const { projectId } = args;

  if (!context.projectManager) {
    return {
      success: false,
      message: 'Not running in unified mode'
    };
  }

  const project = context.projectManager.getProject(projectId);
  if (!project) {
    return {
      success: false,
      message: `Project ${projectId} not found`
    };
  }

  context.activeProjectId = projectId;

  return {
    success: true,
    message: `Active project set to ${project.projectName}`,
    data: { projectId, projectName: project.projectName }
  };
}
```

#### 2.3 Add List Projects Tool

**New File**: `src/tools/list-projects.ts`

```typescript
export const listProjectsTool: Tool = {
  name: 'list_projects',
  description: 'List all discovered projects (both spec-workflow and spec-kit)',
  inputSchema: {
    type: 'object',
    properties: {
      includeDetails: {
        type: 'boolean',
        description: 'Include detailed metadata for each project',
        default: false
      }
    }
  }
};

export async function listProjectsHandler(
  args: any,
  context: ToolContext
): Promise<ToolResponse> {
  if (!context.projectManager) {
    return {
      success: false,
      message: 'Not running in unified mode'
    };
  }

  const projects = context.projectManager.getAllProjects();

  return {
    success: true,
    message: `Found ${projects.length} projects`,
    data: {
      activeProjectId: context.activeProjectId,
      projects: projects.map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        projectType: p.projectType,
        projectPath: p.projectPath,
        isActive: p.projectId === context.activeProjectId
      }))
    }
  };
}
```

#### 2.4 Update Existing Tools

All existing spec-workflow tools need to support both modes:

```typescript
// Example: spec-status tool update
export async function specStatusHandler(
  args: any,
  context: ToolContext
): Promise<ToolResponse> {
  let projectPath: string;

  // Unified mode: use active project or explicit projectId
  if (context.projectManager) {
    const projectId = args.projectId || context.activeProjectId;
    if (!projectId) {
      return {
        success: false,
        message: 'No active project. Use set_active_project or provide projectId'
      };
    }

    const project = context.projectManager.getProject(projectId);
    if (!project) {
      return { success: false, message: `Project ${projectId} not found` };
    }

    projectPath = project.projectPath;
  }
  // Legacy mode: use context projectPath
  else {
    projectPath = context.projectPath;
    if (!projectPath) {
      return { success: false, message: 'Project path required' };
    }
  }

  // Rest of handler logic remains the same
  const parser = new SpecParser(projectPath);
  // ...
}
```

### Phase 3: Dashboard Enhancements

#### 3.1 Active Project Indicator

**Update**: `src/dashboard_frontend/src/components/ProjectList.tsx`

Add visual indicator for active project:
- Highlighted row
- "ACTIVE" badge
- Click to set active

```tsx
<div className="project-row">
  {project.isActive && <Badge>ACTIVE</Badge>}
  <button onClick={() => setActiveProject(project.projectId)}>
    Set Active
  </button>
</div>
```

#### 3.2 Auto-scan on Startup

**Update**: `src/dashboard/multi-server.ts`

```typescript
async start() {
  await this.projectManager.initialize();

  // Auto-scan if root directory configured
  if (this.rootDirectory) {
    console.log(`Scanning ${this.rootDirectory} for projects...`);
    await this.projectManager.scanRootDirectory();
    const projects = this.projectManager.getAllProjects();
    console.log(`Found ${projects.length} projects`);
  }

  // ... rest of start logic
}
```

#### 3.3 WebSocket Events

Add new event types:
- `active-project-changed`: Broadcast when active project changes
- `project-discovered`: When new project is found during scan
- `scan-complete`: When root directory scan completes

### Phase 4: Configuration

#### 4.1 Unified Mode Configuration

**File**: `.spec-workflow/config.toml`

```toml
# Unified mode settings
[unified]
enabled = true
rootDirectory = "~/code"
autoScan = true
scanInterval = 300  # seconds, 0 = disabled

# Dashboard settings
[dashboard]
port = 5000
autoOpen = true

# Default active project (optional)
[defaults]
activeProject = "my-main-project"  # project ID or path
```

#### 4.2 Environment Variables

```bash
# Root directory for scanning
export SPECKIT_ROOT_DIR=~/code

# Enable unified mode by default
export SPEC_WORKFLOW_UNIFIED=true

# Dashboard port
export SPEC_WORKFLOW_DASHBOARD_PORT=5000
```

## Usage Examples

### Starting Unified Mode

```bash
# Basic unified mode (scans ~/code if SPECKIT_ROOT_DIR set)
spec-workflow-mcp --unified

# With explicit root directory
spec-workflow-mcp --unified --root ~/code

# With custom dashboard port
spec-workflow-mcp --unified --root ~/code --port 8080
```

### MCP Client Configuration

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "spec-workflow-unified": {
      "command": "npx",
      "args": [
        "-y",
        "@pimzino/spec-workflow-mcp@latest",
        "--unified",
        "--root",
        "/home/user/code"
      ]
    }
  }
}
```

**Claude Code CLI**:
```bash
claude mcp add spec-workflow npx @pimzino/spec-workflow-mcp@latest -- --unified --root ~/code
```

### AI Workflow

```
User: "List all my projects"
AI: [Calls list_projects tool]
    "Found 5 projects:
     1. project-a (spec-kit)
     2. project-b (spec-workflow)
     ..."

User: "Switch to project-a"
AI: [Calls set_active_project with projectId]
    "Active project is now project-a"

User: "Show me the constitution"
AI: [Calls get_speckit_constitution - uses active project context]
    "Here's the constitution for project-a..."

User: "What specs exist?"
AI: [Calls spec-status or list specs - uses active project]
    "Project-a has 3 specs..."
```

## Migration Path

### For Existing Users

**Option 1: Keep Legacy Mode**
```bash
# Still works exactly as before
spec-workflow-mcp ~/my-project
spec-workflow-mcp --dashboard
```

**Option 2: Migrate to Unified Mode**
```bash
# New unified experience
spec-workflow-mcp --unified --root ~/code
```

### Backward Compatibility

- All existing tools continue to work in legacy mode
- Tools gain optional `projectId` parameter for unified mode
- Dashboard works standalone or embedded in unified mode
- Configuration files remain compatible

## Benefits

1. **Single MCP Server**: One instance for all projects
2. **Simplified Setup**: One command to rule them all
3. **Dashboard Integration**: Built-in, not separate process
4. **Multi-Project Workflows**: Switch projects seamlessly
5. **Better Resource Usage**: No multiple server processes
6. **Unified Configuration**: One config for everything
7. **Automatic Discovery**: Scans ~/code for all projects
8. **Real-Time Updates**: File watching across all projects

## Technical Considerations

### Performance
- Concurrent scanning limited to 10 projects (already implemented)
- Project type caching (already implemented)
- Lazy loading of project metadata
- WebSocket connection pooling

### Error Handling
- Graceful degradation if scan fails
- Per-project error isolation
- Dashboard remains functional if MCP has issues

### Security
- Same security model as existing implementation
- File access limited to configured root directory
- No remote connections, local-only

## Implementation Timeline

- **Week 1**: Core unified server infrastructure
- **Week 2**: Multi-project MCP tools
- **Week 3**: Dashboard enhancements
- **Week 4**: Testing, documentation, polish

## Open Questions

1. Should unified mode be the default in future versions?
2. How to handle project name collisions in different directories?
3. Should we support nested scanning (subdirectories of subdirectories)?
4. What's the UX for switching projects mid-conversation with AI?
