# Data Model: Spec-Kit Dashboard Compatibility

**Feature**: 001-speckit-dashboard-compat  
**Created**: 2025-11-12  
**Based on**: spec.md, research.md

## Core Entities

### SpecKitProject

Represents a discovered spec-kit project in the root directory.

**Attributes**:
- `projectId: string` - SHA-1 hash of absolute project path (16 chars)
- `projectPath: string` - Absolute path to project directory
- `projectName: string` - Directory name (derived from path)
- `projectType: 'spec-kit'` - Discriminator for project type
- `rootDirectory: string` - Configured root directory this project was found in
- `hasConstitution: boolean` - Whether .specify/memory/constitution.md exists
- `agentCount: number` - Number of AI agent folders discovered
- `specCount: number` - Number of spec directories in specs/ folder
- `createdAt: string` - ISO timestamp of first detection
- `lastScanned: string` - ISO timestamp of last successful scan

**Validation Rules**:
- `projectPath` must be absolute path
- `projectPath` must contain `.specify` directory
- `projectId` must be unique across all projects
- `projectName` must not be empty

**State Transitions**:
- DISCOVERED → SCANNING → ACTIVE (successful scan)
- DISCOVERED → SCANNING → ERROR (scan failed)
- ACTIVE → REFRESHING → ACTIVE (rescan successful)
- ACTIVE → REMOVED (directory deleted)

**Relationships**:
- Has many AIAgent (0..*)
- Has one Constitution (0..1)
- Has many SpecDirectory (0..*)
- Has many Template (0..*)

---

### AIAgent

Represents an AI assistant configured for the project.

**Attributes**:
- `agentId: string` - Unique identifier: `{projectId}-{agentName}`
- `projectId: string` - Foreign key to SpecKitProject
- `agentName: string` - Name without dot (e.g., "claude", "codex")
- `folderPath: string` - Absolute path to agent folder (e.g., `.claude`)
- `subdirectoryType: 'commands' | 'prompts'` - Which subdirectory pattern used
- `commandCount: number` - Number of speckit commands discovered
- `commands: AgentCommand[]` - Array of available commands
- `lastUpdated: string` - ISO timestamp of last scan

**Validation Rules**:
- `agentName` must match pattern `^[a-z]+$`
- `folderPath` must exist and be readable
- `subdirectoryType` must be either 'commands' or 'prompts'
- `commands` array must not be empty for valid agent

**Relationships**:
- Belongs to one SpecKitProject
- Has many AgentCommand (1..*)

---

### AgentCommand

Represents a single slash command file for an AI agent.

**Attributes**:
- `commandId: string` - Unique identifier: `{agentId}-{commandName}`
- `agentId: string` - Foreign key to AIAgent
- `commandName: string` - Command name (e.g., "analyze", "plan")
- `slashCommand: string` - Full slash command (e.g., "/speckit.analyze")
- `filePath: string` - Absolute path to markdown file
- `fileName: string` - File name (e.g., "speckit.analyze.md")
- `description?: string` - Optional description from YAML frontmatter
- `lastModified: string` - ISO timestamp from file mtime

**Validation Rules**:
- `commandName` must match pattern `^[a-z]+$`
- `fileName` must match pattern `^speckit\.[a-z]+\.md$`
- `slashCommand` must equal `/speckit.{commandName}`
- `filePath` file must exist and have content

**Relationships**:
- Belongs to one AIAgent

---

### Constitution

Represents project governance document.

**Attributes**:
- `projectId: string` - Foreign key to SpecKitProject (unique)
- `filePath: string` - Absolute path to constitution.md
- `content: string` - Full markdown content
- `version?: string` - Extracted version number if present
- `lastModified: string` - ISO timestamp from file mtime
- `principleCount: number` - Number of principles parsed

**Validation Rules**:
- `filePath` must equal `{projectPath}/.specify/memory/constitution.md`
- `content` must not be empty
- File must be valid markdown

**Relationships**:
- Belongs to one SpecKitProject (1..1 if exists)

---

### SpecDirectory

Represents a numbered specification directory within specs/ folder.

**Attributes**:
- `specId: string` - Unique identifier: `{projectId}-{featureNumber}`
- `projectId: string` - Foreign key to SpecKitProject
- `featureNumber: string` - Zero-padded number (e.g., "001", "042")
- `featureName: string` - Kebab-case name (e.g., "architecture-refactor")
- `directoryName: string` - Full directory name (e.g., "001-architecture-refactor")
- `directoryPath: string` - Absolute path to spec directory
- `hasSpec: boolean` - Whether spec.md exists
- `hasPlan: boolean` - Whether plan.md exists
- `hasTasks: boolean` - Whether tasks.md exists
- `subdirectories: string[]` - Array of subdirectory names
- `taskFiles: string[]` - Array of task breakdown files (tasks-phase*.md)
- `createdAt: string` - ISO timestamp from directory ctime
- `lastModified: string` - ISO timestamp from most recent file mtime

**Validation Rules**:
- `directoryName` must match pattern `^\d{3}-[a-z0-9-]+$`
- `featureNumber` must be 3-digit zero-padded string
- `directoryPath` must exist and be a directory
- At least one of `hasSpec`, `hasPlan`, `hasTasks` should be true

**State Transitions**:
- CREATED → SPECIFYING (spec.md added)
- SPECIFYING → PLANNING (plan.md added)
- PLANNING → TASKING (tasks.md added)
- TASKING → IMPLEMENTING (implementation begins)

**Relationships**:
- Belongs to one SpecKitProject
- Has many SpecFile (0..*)
- Has many Subdirectory (0..*)

---

### Template

Represents a template file in .specify/templates/ folder.

**Attributes**:
- `templateId: string` - Unique identifier: `{projectId}-{templateName}`
- `projectId: string` - Foreign key to SpecKitProject
- `templateName: string` - Template name without extension
- `fileName: string` - Full file name (e.g., "spec-template.md")
- `filePath: string` - Absolute path to template file
- `templateType: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other'` - Template category
- `lastModified: string` - ISO timestamp from file mtime

**Validation Rules**:
- `fileName` must end with `.md`
- `filePath` must exist within `.specify/templates/` directory
- `templateType` derived from `templateName` (e.g., "spec-template" → 'spec')

**Relationships**:
- Belongs to one SpecKitProject

## Aggregate Roots

### ProjectRegistry (Extended)

Manages all registered projects (both spec-kit and spec-workflow-mcp).

**Extended Attributes**:
- `rootDirectory?: string` - Configured root directory for spec-kit scanning
- `specKitProjects: Map<string, SpecKitProject>` - Spec-kit projects by ID
- `workflowProjects: Map<string, WorkflowProject>` - Existing workflow projects

**New Operations**:
- `scanRootDirectory()` - Scan for spec-kit projects in root directory
- `detectProjectType(path: string)` - Determine if path is spec-kit or workflow project
- `registerSpecKitProject(path: string)` - Add new spec-kit project
- `getProjectsByType(type: ProjectType)` - Filter projects by type

---

### ProjectContext (Extended)

Per-project runtime context.

**Extended as Discriminated Union**:
```typescript
type ProjectContext = BaseProjectContext & (SpecKitProjectContext | WorkflowProjectContext)

interface BaseProjectContext {
  projectId: string;
  projectPath: string;
  projectName: string;
  projectType: 'spec-kit' | 'spec-workflow-mcp';
}

interface SpecKitProjectContext {
  projectType: 'spec-kit';
  parser: SpecKitParser;
  agents: AIAgent[];
  constitution?: Constitution;
  templates: Template[];
  specs: SpecDirectory[];
}

interface WorkflowProjectContext {
  projectType: 'spec-workflow-mcp';
  parser: SpecParser;
  watcher: SpecWatcher;
  approvalStorage: ApprovalStorage;
  archiveService: SpecArchiveService;
}
```

## Value Objects

### AIAgentFolder

Immutable value representing agent folder detection result.

**Attributes**:
- `folderName: string` - Folder name including dot (e.g., ".claude")
- `folderPath: string` - Absolute path
- `subdirectory: 'commands' | 'prompts' | null` - Which pattern found
- `isValid: boolean` - Whether folder contains speckit files

---

### ScanResult

Result of root directory scan operation.

**Attributes**:
- `rootDirectory: string` - Directory that was scanned
- `subdirectoryCount: number` - Total subdirectories found
- `specKitProjectsFound: number` - Projects with `.specify` folder
- `scanDuration: number` - Milliseconds taken
- `errors: ScanError[]` - Errors encountered during scan
- `timestamp: string` - ISO timestamp of scan

---

### ScanError

Error encountered during scanning.

**Attributes**:
- `path: string` - Path where error occurred
- `errorCode: string` - Error code (ENOENT, EACCES, etc.)
- `message: string` - Human-readable error message
- `severity: 'warning' | 'error'` - Error severity

## Domain Events

### SpecKitProjectDiscovered
Fired when a new spec-kit project is found during scan.

**Payload**:
- `projectId: string`
- `projectPath: string`
- `timestamp: string`

---

### AIAgentDetected
Fired when AI agent folder is discovered.

**Payload**:
- `projectId: string`
- `agentName: string`
- `commandCount: number`
- `timestamp: string`

---

### ProjectScanCompleted
Fired when root directory scan finishes.

**Payload**:
- `scanResult: ScanResult`
- `timestamp: string`

---

### ProjectScanFailed
Fired when root directory scan fails.

**Payload**:
- `rootDirectory: string`
- `error: Error`
- `timestamp: string`

## Data Flow

### Project Discovery Flow
1. Application starts → Load `SPECKIT_ROOT_DIR` environment variable
2. ProjectRegistry validates root directory → Emits validation result
3. ProjectRegistry scans immediate subdirectories (depth=1)
4. For each subdirectory:
   - Check for `.specify` folder → SpecKitProject or skip
   - If SpecKitProject → Detect AI agents, parse specs, load constitution
   - Emit ProjectDiscovered event
5. ProjectRegistry updates internal map
6. Dashboard API exposes projects via REST endpoints

### AI Agent Discovery Flow
1. SpecKitParser receives project path
2. List all directories matching `^\.{agentName}$` pattern
3. For each matching directory:
   - Check for `/commands` subdirectory → Set subdirectoryType
   - Check for `/prompts` subdirectory → Set subdirectoryType
   - If neither exists → Skip this directory
4. List files matching `speckit.*.md` pattern in subdirectory
5. For each matching file:
   - Extract command name from filename
   - Build slash command string
   - Create AgentCommand entity
   - Emit AIAgentDetected event
6. Group commands by agent
7. Return AIAgent array

### File System Watching Flow
1. Root directory watcher detects new subdirectory
2. ProjectRegistry checks if subdirectory has `.specify`
3. If yes → Trigger project discovery flow
4. Per-project watchers detect changes in:
   - `.specify/` folder → Reload constitution/templates
   - `.{agent}/` folders → Rescan agent commands
   - `specs/` folder → Rescan spec directories
5. Emit appropriate domain events
6. Dashboard receives events via WebSocket/SSE
7. UI updates in real-time

## Persistence

**Note**: All data is derived from file system - no database persistence needed.

**Caching Strategy**:
- Cache negative results (not a spec-kit project) for 60 seconds
- Cache agent commands until file modification detected
- Cache constitution content until file modification detected
- Cache spec directory lists until directory modification detected

**File System as Source of Truth**:
- All entities reconstructed from disk on demand
- Modifications to files automatically trigger rescans
- No state synchronization issues - FS is single source of truth
