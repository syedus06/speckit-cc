# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spec Workflow MCP is a Model Context Protocol (MCP) server for spec-driven development with real-time dashboard and VSCode extension. The project enables AI assistants to work with structured specifications, track implementation progress, and manage approval workflows. It supports both traditional spec-workflow projects and spec-kit projects through a unified dashboard interface.

**Key Technology Stack:**
- TypeScript 5.x with Node.js 18+
- MCP SDK (@modelcontextprotocol/sdk)
- Fastify for dashboard server with WebSocket support
- React + Vite for dashboard frontend
- Vitest for testing

## Build and Development Commands

```bash
# Development
npm run dev                    # Start MCP server in development mode with auto-reload
npm run dev:dashboard          # Start dashboard frontend in development mode

# Building
npm run build                  # Full build: validate i18n, clean, compile TypeScript, build dashboard, copy static files
npm run clean                  # Remove dist/ directory
npm run build:dashboard        # Build React dashboard frontend only

# Testing
npm test                       # Run test suite with Vitest
npm test:watch                 # Run tests in watch mode
npm test:coverage              # Run tests with coverage report

# Utilities
npm run validate:i18n          # Validate i18n translation files (runs before build)
npm run copy-static            # Copy static files to dist/

# Running
npm start                      # Run production server from dist/
```

**Dashboard-Only Mode:**
```bash
# Start unified multi-project dashboard (typically run once)
npm run dev -- --dashboard
npm run dev -- --dashboard --port 8080
```

**Test a single test file:**
```bash
npx vitest src/tools/__tests__/projectPath.test.ts
```

## Architecture

### Dual-Mode Operation

The server operates in two distinct modes:

1. **MCP Server Mode** (default): Connects to AI clients via stdio, serves MCP tools for a specific project
2. **Dashboard-Only Mode** (`--dashboard` flag): Runs unified multi-project dashboard server on port 5000

### Core Components

**MCP Server Layer** (`src/server.ts`, `src/index.ts`):
- Handles MCP protocol via stdio transport
- Registers project with global ProjectRegistry
- Provides tools and prompts to AI clients
- Each project runs its own MCP server instance

**Dashboard Server** (`src/dashboard/multi-server.ts`):
- Single Fastify server serving all registered projects
- WebSocket-based real-time updates
- Serves React frontend from `src/dashboard_frontend/`
- REST API for project data, approvals, settings, automation jobs

**Project Management**:
- `ProjectRegistry` (`src/core/project-registry.ts`): Global registry tracking all MCP server instances
- `ProjectManager` (`src/dashboard/project-manager.ts`): Manages project discovery, scanning, and caching
- `DashboardSessionManager` (`src/core/dashboard-session.ts`): Tracks dashboard process lifetime

**Parser Layer**:
- `SpecParser` (`src/core/parser.ts`): Parses spec-workflow projects (`.spec-workflow/`)
- `SpecKitParser` (`src/core/parser.ts`): Parses spec-kit projects (`.speckit/`)
- Unified task parsing via `task-parser.ts`

**Tools** (`src/tools/`):
- Each tool is self-contained with schema definition and handler
- `spec-workflow-guide.ts`: Main workflow guidance
- `spec-status.ts`: Status queries for specs
- `approvals.ts`: Approval workflow management
- `log-implementation.ts`: Implementation logging
- `speckit-tools.ts`: Spec-kit specific tools (agents, constitution, templates, scripts)

### Project Type Detection

The system automatically detects and supports two project types:

- **Spec-Workflow**: Projects with `.spec-workflow/` directory (specs, steering, approvals, templates)
- **Spec-Kit**: Projects with `.speckit/` directory (agents, constitution, templates, scripts)

Detection logic in `src/types.ts`:
```typescript
function isWorkflowProject(project: ProjectDTO): boolean {
  return project.type === 'spec-workflow';
}
```

### WebSocket Communication

Dashboard uses WebSocket for real-time updates:
- Connection at `/ws?projectId=<id>`
- Broadcast messages: `project-update`, `projects-list`, `dashboard-update`
- Project-specific and global message routing

### Performance Optimizations

- **Caching**: Project type cache (1 hour TTL), negative result cache (5 minutes)
- **Concurrency Control**: Max 10 concurrent file operations via `p-limit`
- **Job Scheduling**: Automated cleanup jobs with cron (approvals, specs, archives)
- **File Watching**: Chokidar-based file system watching for real-time updates

## Directory Structure

```
.spec-workflow/          # Spec-workflow project data directory
  specs/                 # Individual spec directories
  steering/              # Project steering documents
  approvals/             # Approval requests and history
  templates/             # Document templates
  archive/               # Archived specs
  config.toml            # Project configuration

src/
  index.ts               # Entry point and CLI argument parsing
  server.ts              # SpecWorkflowMCPServer class
  config.ts              # Configuration loading (TOML, CLI args)
  types.ts               # Shared TypeScript types

  core/                  # Core business logic
    parser.ts            # SpecParser and SpecKitParser
    task-parser.ts       # Task markdown parsing
    project-registry.ts  # Global project tracking
    workspace-initializer.ts
    path-utils.ts        # Path resolution utilities
    dashboard-session.ts # Dashboard lifecycle management

  tools/                 # MCP tool implementations
    index.ts             # Tool registration and routing
    spec-workflow-guide.ts
    spec-status.ts
    speckit-tools.ts     # Spec-kit specific tools
    approvals.ts
    log-implementation.ts

  prompts/               # MCP prompt templates
    index.ts             # Prompt registration

  dashboard/             # Dashboard backend
    multi-server.ts      # Main Fastify server
    project-manager.ts   # Project scanning and management
    job-scheduler.ts     # Automation job scheduler
    watcher.ts           # File system watching
    approval-storage.ts  # Approval persistence
    settings-manager.ts  # Global settings
    implementation-log-manager.ts

  dashboard_frontend/    # React dashboard UI
    src/
      components/        # React components
      modules/           # Feature modules (API, router, etc.)
      locales/           # i18n translation files
    vite.config.ts

vscode-extension/        # VSCode extension for embedded dashboard
```

## Key Patterns and Conventions

### Path Resolution
Always use `PathUtils` for path construction to ensure consistency:
```typescript
PathUtils.getSpecPath(projectPath, specName)
PathUtils.getSteeringPath(projectPath)
PathUtils.getApprovalsPath(projectPath)
```

Supports tilde expansion (`~` → home directory) via `expandTilde()` helper.

### Error Handling in Tools
Tools return `ToolResponse` with `success` boolean:
```typescript
export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

Convert to MCP format using `toMCPResponse(response, isError)`.

### Configuration Merging
Configuration is loaded from multiple sources with priority:
1. CLI arguments (highest priority)
2. Config file (`.spec-workflow/config.toml` or custom path)
3. Environment variables (`SPECKIT_ROOT_DIR`)
4. Defaults (lowest priority)

Merging logic in `src/config.ts`: `mergeConfigs(fileConfig, cliArgs)`.

### Project Registry
Global singleton pattern for cross-project coordination:
```typescript
const projectRegistry = new ProjectRegistry();
await projectRegistry.registerProject(projectPath, process.pid);
```

Registry file: `~/.spec-workflow/registry.json`

### Task Parsing
Unified task parsing supports hierarchical task IDs (1.0, 1.1, 1.2.1):
```typescript
parseTasksFromMarkdown(content)  // Returns TaskInfo[]
parseTaskProgress(content)       // Returns { total, completed, pending }
```

Completed tasks marked with `[x]` checkbox or `✅` emoji.

## Spec-Kit Compatibility

The dashboard provides unified monitoring for spec-kit projects. Spec-kit tools in `src/tools/speckit-tools.ts`:

- `get_speckit_agents`: Lists available agents from `.speckit/agents/`
- `get_speckit_constitution`: Retrieves project constitution
- `get_speckit_templates`: Lists templates from `.speckit/templates/`
- `get_speckit_scripts`: Lists custom scripts from `.speckit/scripts/`
- `get_speckit_projects`: Returns all registered spec-kit projects
- `scan_speckit_root`: Scans a root directory for spec-kit projects

See `docs/SPEC-KIT-COMPATIBILITY.md` for detailed compatibility information.

## Internationalization (i18n)

Dashboard supports 11 languages. Translation files in `src/dashboard_frontend/src/locales/`:
- English (en), Japanese (ja), Chinese (zh), Spanish (es), Portuguese (pt)
- German (de), French (fr), Russian (ru), Italian (it), Korean (ko), Arabic (ar)

Validation: `npm run validate:i18n` ensures all keys exist across all language files (runs before build).

## Testing

Tests use Vitest:
- Test files: `src/**/*.{test,spec}.{js,ts}`
- Excluded: `src/dashboard_frontend/` (frontend has separate testing)
- Run individual test: `npx vitest path/to/test.test.ts`
- Coverage output: `text`, `json`, `html`

Test configuration in `vitest.config.ts`.

## Important Notes

- **Single Dashboard Instance**: Only one dashboard runs at a time (port 5000 default). All MCP servers connect to the same dashboard.
- **Session Management**: Dashboard lifecycle tracked via `~/.spec-workflow/dashboard-session.json`
- **Port Conflict Detection**: Dashboard checks for existing session before starting
- **Graceful Shutdown**: Both MCP server and dashboard handle SIGINT/SIGTERM for cleanup
- **Auto-initialization**: Workspace directories auto-created on first run
- **File Watching**: Dashboard watches project directories for real-time updates
- **Version Checking**: Dashboard fetches latest npm version on startup for update notifications

## Common Development Tasks

**Adding a new MCP tool:**
1. Create tool file in `src/tools/` with schema and handler
2. Register in `src/tools/index.ts`: add to `registerTools()` and `handleToolCall()`
3. Add tests in `src/tools/__tests__/`

**Adding a dashboard API endpoint:**
1. Add route handler in `src/dashboard/multi-server.ts`
2. Update frontend API client in `src/dashboard_frontend/src/modules/api/api.tsx`
3. Add TypeScript types to `src/types.ts` and `src/dashboard_frontend/src/types.ts`

**Modifying project scanning:**
- Core logic in `src/dashboard/project-manager.ts`
- Parser logic in `src/core/parser.ts`
- Caching controlled by `ProjectScanCache` with configurable TTLs

**Dashboard frontend development:**
```bash
# Run dashboard backend
npm run dev -- --dashboard

# In separate terminal, run frontend dev server
cd src/dashboard_frontend
npm run dev
```

Frontend builds into `src/dashboard_frontend/dist/` and gets copied to `dist/public/` during main build.
