// Common types for the spec workflow MCP server
import { encode } from '@toon-format/toon';

// Automation job types
export interface AutomationJob {
  id: string;
  name: string;
  type: 'cleanup-approvals' | 'cleanup-specs' | 'cleanup-archived-specs';
  enabled: boolean;
  config: {
    daysOld: number; // Number of days to keep; delete older records
  };
  schedule: string; // Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
  lastRun?: string; // ISO timestamp of last execution
  nextRun?: string; // ISO timestamp of next scheduled execution
  createdAt: string; // ISO timestamp
}

export interface GlobalSettings {
  automationJobs: AutomationJob[];
  createdAt?: string;
  lastModified?: string;
}

export interface JobExecutionHistory {
  jobId: string;
  jobName: string;
  jobType: string;
  executedAt: string;
  success: boolean;
  duration: number; // in milliseconds
  itemsProcessed: number;
  itemsDeleted: number;
  error?: string;
}

export interface JobExecutionLog {
  executions: JobExecutionHistory[];
  lastUpdated?: string;
}

export interface ToolContext {
  projectPath: string;
  dashboardUrl?: string; // Optional for backwards compatibility
  lang?: string; // Language code for i18n (e.g., 'en', 'ja')
}

export interface SpecData {
  name: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  phases: {
    requirements: PhaseStatus;
    design: PhaseStatus;
    tasks: PhaseStatus;
    implementation: PhaseStatus;
  };
  taskProgress?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface PhaseStatus {
  exists: boolean;
  approved?: boolean; // Optional for backwards compatibility  
  lastModified?: string;
  content?: string;
}


export interface SteeringStatus {
  exists: boolean;
  documents: {
    product: boolean;
    tech: boolean;
    structure: boolean;
  };
  lastModified?: string;
}

export interface PromptSection {
  key: string;
  value: string;
}

export interface TaskInfo {
  id: string;
  description: string;
  leverage?: string;
  requirements?: string;
  completed: boolean;
  details?: string[];
  prompt?: string;
  promptStructured?: PromptSection[];
}

export interface ImplementationLogEntry {
  id: string;
  taskId: string;
  timestamp: string;
  summary: string;
  filesModified: string[];
  filesCreated: string[];
  statistics: {
    linesAdded: number;
    linesRemoved: number;
    filesChanged: number;
  };
  artifacts: {
    apiEndpoints?: Array<{
      method: string;           // GET, POST, PUT, DELETE, PATCH
      path: string;             // /api/specs/:name/logs
      purpose: string;          // What this endpoint does
      requestFormat?: string;   // Request body/params format or example
      responseFormat?: string;  // Response format or example
      location: string;         // File path and line number (e.g., "src/server.ts:245")
    }>;
    components?: Array<{
      name: string;             // ComponentName
      type: string;             // "React", "Vue", "Svelte", etc.
      purpose: string;          // What the component does
      location: string;         // File path
      props?: string;           // Props interface or signature
      exports?: string[];       // What it exports
    }>;
    functions?: Array<{
      name: string;             // Function/method name
      purpose: string;          // What it does
      location: string;         // File path and line
      signature?: string;       // Function signature
      isExported: boolean;      // Can it be imported?
    }>;
    classes?: Array<{
      name: string;             // Class name
      purpose: string;          // What it does
      location: string;         // File path
      methods?: string[];       // Public methods
      isExported: boolean;
    }>;
    integrations?: Array<{
      description: string;      // How frontend connects to backend
      frontendComponent: string; // Which component
      backendEndpoint: string;  // Which API endpoint
      dataFlow: string;         // How data flows
    }>;
  };
}

export interface ImplementationLog {
  entries: ImplementationLogEntry[];
  lastUpdated?: string;
}
export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
  nextSteps?: string[]; // Optional for backwards compatibility
  projectContext?: {
    projectPath: string;
    workflowRoot: string;
    specName?: string;
    currentPhase?: string;
    dashboardUrl?: string; // Optional for backwards compatibility
  };
}

// MCP-compliant response format (matches CallToolResult from MCP SDK)
export interface MCPToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}

// Helper function to convert ToolResponse to MCP format
export function toMCPResponse(response: ToolResponse, isError: boolean = false): MCPToolResponse {
  return {
    content: [{
      type: "text",
      text: encode(response)
    }],
    isError
  };
}

// Spec-Kit Dashboard Compatibility Types

export interface SpecKitProject {
  projectId: string; // SHA-1 hash of absolute project path (16 chars)
  projectPath: string; // Absolute path to project directory
  projectName: string; // Directory name (derived from path)
  projectType: 'spec-kit'; // Discriminator for project type
  rootDirectory: string; // Configured root directory this project was found in
  hasConstitution: boolean; // Whether .specify/memory/constitution.md exists
  agentCount: number; // Number of AI agent folders discovered
  specCount: number; // Number of spec directories in specs/ folder
  createdAt: string; // ISO timestamp of first detection
  lastScanned: string; // ISO timestamp of last successful scan
}

export interface AIAgent {
  agentId: string; // Unique identifier: {projectId}-{agentName}
  projectId: string; // Foreign key to SpecKitProject
  agentName: string; // Name without dot (e.g., "claude", "codex")
  folderPath: string; // Absolute path to agent folder (e.g., .claude)
  subdirectoryType: 'commands' | 'prompts'; // Which subdirectory pattern used
  commandCount: number; // Number of speckit commands discovered
  commands: AgentCommand[]; // Array of available commands
  lastUpdated: string; // ISO timestamp of last scan
}

export interface AgentCommand {
  commandId: string; // Unique identifier: {agentId}-{commandName}
  agentId: string; // Foreign key to AIAgent
  commandName: string; // Command name (e.g., "analyze", "plan")
  slashCommand: string; // Full slash command (e.g., "/speckit.analyze")
  filePath: string; // Absolute path to markdown file
  fileName: string; // File name (e.g., "speckit.analyze.md")
  description?: string; // Optional description from YAML frontmatter
  lastModified: string; // ISO timestamp from file mtime
}

export interface Constitution {
  projectId: string; // Foreign key to SpecKitProject (unique)
  filePath: string; // Absolute path to constitution.md
  content: string; // Full markdown content
  version?: string; // Extracted version number if present
  lastModified: string; // ISO timestamp from file mtime
  principleCount: number; // Number of principles parsed
}

export interface SpecDirectory {
  specId: string; // Unique identifier: {projectId}-{featureNumber}
  projectId: string; // Foreign key to SpecKitProject
  featureNumber: string; // Zero-padded number (e.g., "001", "042")
  featureName: string; // Kebab-case name (e.g., "architecture-refactor")
  directoryName: string; // Full directory name (e.g., "001-architecture-refactor")
  directoryPath: string; // Absolute path to spec directory
  hasSpec: boolean; // Whether spec.md exists
  hasPlan: boolean; // Whether plan.md exists
  hasTasks: boolean; // Whether tasks.md exists
  subdirectories: string[]; // Array of subdirectory names
  taskFiles: string[]; // Array of task breakdown files (tasks-phase*.md)
  createdAt: string; // ISO timestamp from directory ctime
  lastModified: string; // ISO timestamp from most recent file mtime
}

export interface Template {
  templateId: string; // Unique identifier: {projectId}-{templateName}
  projectId: string; // Foreign key to SpecKitProject
  templateName: string; // Template name without extension
  fileName: string; // Full file name (e.g., "spec-template.md")
  filePath: string; // Absolute path to template file
  templateType: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other'; // Template category
  lastModified: string; // ISO timestamp from file mtime
}

// Discriminated Union for Project Context
export type ProjectContext = SpecKitProjectContext | WorkflowProjectContext;

export interface BaseProjectContext {
  projectId: string;
  projectPath: string;
  projectName: string;
  projectType: 'spec-kit' | 'spec-workflow-mcp';
}

export interface SpecKitProjectContext extends BaseProjectContext {
  projectType: 'spec-kit';
  parser: any; // SpecKitParser instance
  agents: AIAgent[];
  constitution?: Constitution;
  templates: Template[];
  specs: SpecDirectory[];
}

export interface WorkflowProjectContext extends BaseProjectContext {
  projectType: 'spec-workflow-mcp';
  parser: any; // SpecParser instance
  watcher: any; // SpecWatcher instance
  approvalStorage: any; // ApprovalStorage instance
  archiveService: any; // SpecArchiveService instance
}

// Type Guards
export function isSpecKitProject(context: ProjectContext): context is SpecKitProjectContext {
  return context.projectType === 'spec-kit';
}

export function isWorkflowProject(context: ProjectContext): context is WorkflowProjectContext {
  return context.projectType === 'spec-workflow-mcp';
}

// Value Objects
export interface AIAgentFolder {
  folderName: string; // Folder name including dot (e.g., ".claude")
  folderPath: string; // Absolute path
  subdirectory: 'commands' | 'prompts' | null; // Which pattern found
  isValid: boolean; // Whether folder contains speckit files
}

export interface ScanResult {
  rootDirectory: string; // Directory that was scanned
  subdirectoryCount: number; // Total subdirectories found
  specKitProjectsFound: number; // Projects with .specify folder
  scanDuration: number; // Milliseconds taken
  errors: ScanError[]; // Errors encountered during scan
  timestamp: string; // ISO timestamp of scan
}

export interface ScanError {
  path: string; // Path where error occurred
  errorCode: string; // Error code (ENOENT, EACCES, etc.)
  message: string; // Human-readable error message
  severity: 'warning' | 'error'; // Error severity
}