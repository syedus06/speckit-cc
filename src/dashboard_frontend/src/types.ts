export interface AutomationJob {
  id: string;
  name: string;
  type: 'cleanup-approvals' | 'cleanup-specs' | 'cleanup-archived-specs';
  enabled: boolean;
  config: {
    daysOld: number;
  };
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
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
      method: string;
      path: string;
      purpose: string;
      requestFormat?: string;
      responseFormat?: string;
      location: string;
    }>;
    components?: Array<{
      name: string;
      type: string;
      purpose: string;
      location: string;
      props?: string;
      exports?: string[];
    }>;
    functions?: Array<{
      name: string;
      purpose: string;
      location: string;
      signature?: string;
      isExported: boolean;
    }>;
    classes?: Array<{
      name: string;
      purpose: string;
      location: string;
      methods?: string[];
      isExported: boolean;
    }>;
    integrations?: Array<{
      description: string;
      frontendComponent: string;
      backendEndpoint: string;
      dataFlow: string;
    }>;
  };
}

// Spec-Kit Dashboard Compatibility Frontend Types

export interface SpecKitProjectDTO {
  projectId: string;
  projectName: string;
  projectPath: string;
  projectType: 'spec-kit';
  agentCount: number;
  specCount: number;
  hasConstitution: boolean;
  lastScanned: string;
}

export interface WorkflowProjectDTO {
  projectId: string;
  projectName: string;
  projectPath: string;
  projectType: 'spec-workflow-mcp';
  lastScanned: string;
}

export type ProjectDTO = SpecKitProjectDTO | WorkflowProjectDTO;

export interface AIAgentDTO {
  agentId: string;
  agentName: string;
  folderPath: string;
  subdirectoryType: 'commands' | 'prompts';
  commandCount: number;
  commands: AgentCommandDTO[];
  lastUpdated: string;
}

export interface AgentCommandDTO {
  commandId: string;
  commandName: string;
  slashCommand: string;
  filePath: string;
  fileName: string;
  description?: string;
  lastModified: string;
}

export interface ConstitutionDTO {
  projectId: string;
  filePath: string;
  content: string;
  version?: string;
  lastModified: string;
  principleCount: number;
}

export interface SpecDirectoryDTO {
  specId: string;
  featureNumber: string;
  featureName: string;
  directoryName: string;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  subdirectories: string[];
  taskFiles: string[];
  lastModified: string;
}

export interface TemplateDTO {
  templateId: string;
  templateName: string;
  templateType: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other';
  fileName: string;
  lastModified: string;
}

export interface SpecKitProjectDetailDTO {
  projectId: string;
  projectName: string;
  projectPath: string;
  projectType: 'spec-kit';
  rootDirectory: string;
  hasConstitution: boolean;
  createdAt: string;
  lastScanned: string;
  agents: AIAgentDTO[];
  specs: SpecDirectoryDTO[];
  templates: TemplateDTO[];
}

export interface SpecDirectoryDetailDTO {
  specId: string;
  projectId: string;
  featureNumber: string;
  featureName: string;
  directoryPath: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    lastModified: string;
  }>;
  subdirectories: Array<{
    name: string;
    fileCount: number;
  }>;
  taskFiles: string[];
}

export interface ScanResultDTO {
  scanResult: {
    rootDirectory: string;
    subdirectoryCount: number;
    specKitProjectsFound: number;
    scanDuration: number;
    errors: Array<{
      path: string;
      errorCode: string;
      message: string;
      severity: 'warning' | 'error';
    }>;
    timestamp: string;
  };
  newProjects: string[];
  removedProjects: string[];
}

// WebSocket Event Types for Real-time Updates

export interface WebSocketProjectEvent {
  type: 'project.discovered' | 'project.removed' | 'project.updated';
  data: {
    projectId: string;
    projectName?: string;
    projectType?: 'spec-kit' | 'spec-workflow-mcp';
    projectPath?: string;
    changedPaths?: string[];
    timestamp: string;
  };
}

export interface WebSocketAgentEvent {
  type: 'agent.detected';
  data: {
    projectId: string;
    agentName: string;
    commandCount: number;
    timestamp: string;
  };
}

export interface WebSocketProjectsUpdateEvent {
  type: 'projects-update';
  data: {
    projects: SpecKitProjectDTO[];
  };
}

export interface WebSocketSpecUpdateEvent {
  type: 'spec-update';
  projectId: string;
  data: {
    specs: any[];
    archivedSpecs: any[];
  };
}

export interface WebSocketTaskUpdateEvent {
  type: 'task-status-update';
  projectId: string;
  data: {
    specName: string;
    taskList: any[];
    summary: any;
    inProgress: any;
  };
}

export interface WebSocketApprovalUpdateEvent {
  type: 'approval-update';
  projectId: string;
  data: any[];
}

export interface WebSocketSteeringUpdateEvent {
  type: 'steering-update';
  projectId: string;
  data: any;
}

export interface WebSocketImplementationLogUpdateEvent {
  type: 'implementation-log-update';
  projectId: string;
  data: {
    specName: string;
    entries: ImplementationLogEntry[];
  };
}

export type WebSocketEvent =
  | WebSocketProjectEvent
  | WebSocketAgentEvent
  | WebSocketProjectsUpdateEvent
  | WebSocketSpecUpdateEvent
  | WebSocketTaskUpdateEvent
  | WebSocketApprovalUpdateEvent
  | WebSocketSteeringUpdateEvent
  | WebSocketImplementationLogUpdateEvent;
