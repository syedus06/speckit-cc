# Research: Spec-Kit Dashboard Compatibility

**Feature**: 001-speckit-dashboard-compat  
**Created**: 2025-11-12  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Tasks

### R1: Spec-Kit Project Structure Analysis

**Question**: What are the complete folder patterns and file naming conventions used in spec-kit projects?

**Decision**: Spec-kit projects are identified by `.specify` folder with this structure:
- `.specify/memory/constitution.md` - Project governance
- `.specify/templates/` - Spec, plan, tasks, checklist templates
- `.specify/scripts/bash/` - Helper scripts
- AI agent folders: `.claude/`, `.codex/`, `.gemini/`, `.cursor/` with `/commands` or `/prompts` subdirectories
- Agent files: `speckit.{command}.md` pattern (analyze, clarify, plan, implement, tasks, constitution, checklist)
- Specs folder: `specs/###-feature-name/` with spec.md, plan.md, tasks.md, and subdirectories (checklists/, contracts/, backups/, scripts/, github-issue-templates/)

**Rationale**: Analyzed real project (/home/syedu/code/PharmacyHub) to understand actual structure vs documentation. This ensures accurate detection logic.

**Alternatives Considered**:
- GitHub repository scanning: Rejected - too slow and requires network
- Configuration file parsing: Rejected - spec-kit doesn't use centralized config
- `.git` folder detection: Rejected - not all spec-kit projects use git

### R2: Environment Variable Configuration Pattern

**Question**: How should root directory be configured and validated?

**Decision**: Use environment variable `SPECKIT_ROOT_DIR` with these validation rules:
- Must be absolute path
- Must exist and be readable
- Defaults to user's home directory if not set (with warning)
- Support both forward slashes and backslashes (Windows compatibility)
- Resolve symlinks to canonical paths for project identification

**Rationale**: Environment variables are standard for server configuration, support Docker deployments, and don't require code changes for different environments.

**Alternatives Considered**:
- Command-line argument: Rejected - MCP servers don't use CLI args typically
- Config file: Rejected - adds complexity and file management overhead
- Auto-detect from workspace: Rejected - unclear which workspace when multiple exist

### R3: Project Type Detection Strategy

**Question**: How to reliably differentiate spec-kit from spec-workflow-mcp projects?

**Decision**: Hierarchical detection:
1. Check for `.specify` folder → spec-kit project
2. Check for `.spec-workflow` folder → spec-workflow-mcp project
3. If neither, not a supported project type

Add `projectType` field to ProjectRegistryEntry with enum: 'spec-kit' | 'spec-workflow-mcp'

**Rationale**: Folder-based detection is fast, reliable, and doesn't require parsing file contents. Clear precedence prevents ambiguity.

**Alternatives Considered**:
- File content inspection: Rejected - slower and unreliable
- Project metadata file: Rejected - not all projects have metadata
- Git repo inspection: Rejected - not all projects use git

### R4: AI Agent Folder Detection Patterns

**Question**: How to discover all AI agent folders including future/unknown agents?

**Decision**: Pattern-based detection using regex: `/^\.[a-z]+$/` applied to top-level project directories
Then validate by checking for `/commands` or `/prompts` subdirectories containing `speckit.*.md` files.

**Rationale**: Pattern matching finds both known agents (.claude, .codex, .gemini, .cursor) and future agents without hardcoding names.

**Alternatives Considered**:
- Hardcoded list: Rejected - breaks when new AI agents are added
- All hidden folders: Rejected - too many false positives (.git, .idea, etc.)
- Configuration-based: Rejected - spec-kit doesn't centralize agent config

### R5: File System Watching Strategy

**Question**: How to efficiently watch for changes in root directory and project subdirectories?

**Decision**: Two-tier watching strategy:
- Tier 1: Watch root directory (depth=1) for new/removed project folders - uses existing chokidar
- Tier 2: Watch individual project folders (specs/, .specify/, .{agent}/) - leverage existing SpecWatcher pattern

Use debouncing (500ms) to batch rapid changes and prevent redundant scans.

**Rationale**: Existing codebase already uses chokidar effectively. Two-tier approach minimizes watcher overhead while ensuring timely updates.

**Alternatives Considered**:
- Poll-based: Rejected - higher CPU usage, delayed updates
- Deep recursive watch: Rejected - excessive file handles for large directories
- Event-only (no initial scan): Rejected - misses existing projects on startup

### R6: Performance Optimization for Large Directories

**Question**: How to meet <5 second scan requirement for 100 subdirectories?

**Decision**: Parallel scanning with concurrency limit:
- Use Promise.all() with concurrency limit (10 concurrent scans)
- Early exit on `.specify` detection (don't scan entire tree)
- Cache negative results (not a spec-kit project) for 60 seconds
- Skip hidden directories except known agent patterns

**Rationale**: Node.js async I/O allows parallel directory access. Concurrency limit prevents file descriptor exhaustion. Caching reduces redundant checks.

**Alternatives Considered**:
- Sequential scanning: Rejected - too slow for large directories
- Unlimited parallelism: Rejected - can exhaust file descriptors
- Background indexing: Rejected - adds complexity for marginal benefit

### R7: Multi-Project State Management

**Question**: How to maintain separate state for each project type?

**Decision**: Extend existing ProjectContext with discriminated union:
```typescript
type ProjectContext = {
  projectId: string;
  projectPath: string;
  projectType: 'spec-kit' | 'spec-workflow-mcp';
  // ... existing fields
} & (SpecKitContext | SpecWorkflowContext)

interface SpecKitContext {
  projectType: 'spec-kit';
  agents: AIAgent[];
  constitution?: ConstitutionDoc;
  templates: TemplateInfo[];
}

interface SpecWorkflowContext {
  projectType: 'spec-workflow-mcp';
  // ... existing workflow-specific fields
}
```

**Rationale**: Type-safe discrimination prevents mixing project types. Extends existing architecture without breaking changes.

**Alternatives Considered**:
- Separate registries: Rejected - duplicates code and complicates UI
- Duck typing: Rejected - loses type safety
- Single context object: Rejected - unclear which fields apply to which type

### R8: Slash Command Extraction Logic

**Question**: How to reliably extract command names from agent files?

**Decision**: Filename-based extraction with validation:
1. Match pattern: `speckit.{command}.md` → extract `{command}`
2. Build slash command: `/speckit.{command}`
3. Validate file has content (not empty)
4. Store per-agent to handle duplicates across agents

**Rationale**: Filename is canonical source of truth in spec-kit. Simple regex extraction is fast and reliable.

**Alternatives Considered**:
- Parse YAML frontmatter: Rejected - optional and may not contain command name
- Parse file content for command: Rejected - slower, no standard location
- Configuration file lookup: Rejected - spec-kit doesn't centralize this

## Best Practices

### File System Operations
- Always use absolute paths for cross-platform compatibility
- Use path.resolve() and path.join() instead of string concatenation
- Handle ENOENT, EACCES, and EPERM errors gracefully
- Normalize paths for Windows (backslash) vs Unix (forward slash)

### Error Handling
- Log all file system errors with full context (path, operation, error code)
- Differentiate user-fixable errors (permissions, missing dir) from bugs
- Provide actionable error messages (e.g., "Set SPECKIT_ROOT_DIR environment variable")
- Never crash server on project parsing errors - isolate to that project

### Performance
- Use async/await with Promise.all() for parallel I/O
- Implement concurrency limits to prevent resource exhaustion
- Cache negative results to avoid redundant scans
- Use efficient glob patterns (avoid ** when possible)

### Testing
- Mock file system operations using memfs or mock-fs
- Test with various directory structures (0, 1, 10, 100 projects)
- Test cross-platform path handling (Windows, macOS, Linux)
- Test permission errors and missing directories
- Test symlink resolution and circular symlinks

## Technology Decisions

### TypeScript Patterns
- Use discriminated unions for project types
- Leverage existing path utility functions
- Follow existing code style (functional, async/await)
- Use strict type checking for file system operations

### Dependencies
- **chokidar**: Already used - continue for file watching
- **Node.js fs/promises**: Standard library - no new deps needed
- **path module**: Standard library - cross-platform path handling

### Integration Points
- Extend ProjectRegistry with spec-kit detection
- Extend ProjectManager to handle both project types
- Add new SpecKitParser alongside existing SpecParser
- Extend dashboard API endpoints with project type filtering

## Risk Mitigation

### Risk 1: Root Directory Misconfiguration
- **Mitigation**: Validate on startup, provide clear error message, suggest fix
- **Fallback**: Default to home directory with warning

### Risk 2: File System Permission Errors
- **Mitigation**: Catch and log errors per-project, continue scanning others
- **Fallback**: Mark project as inaccessible, retry on next scan

### Risk 3: Performance Degradation with Many Projects
- **Mitigation**: Concurrency limits, caching, early exits
- **Fallback**: Warn user if root contains >100 subdirectories

### Risk 4: Breaking Changes to Existing Features
- **Mitigation**: Extend, don't replace existing code; comprehensive tests
- **Fallback**: Feature flag to disable spec-kit support if issues arise

## Open Questions

*None - all technical unknowns resolved through research.*
