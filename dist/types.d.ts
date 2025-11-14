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
    duration: number;
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
    dashboardUrl?: string;
    lang?: string;
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
    approved?: boolean;
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
export interface ImplementationLog {
    entries: ImplementationLogEntry[];
    lastUpdated?: string;
}
export interface ToolResponse {
    success: boolean;
    message: string;
    data?: any;
    nextSteps?: string[];
    projectContext?: {
        projectPath: string;
        workflowRoot: string;
        specName?: string;
        currentPhase?: string;
        dashboardUrl?: string;
    };
}
export interface MCPToolResponse {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
    _meta?: Record<string, any>;
}
export declare function toMCPResponse(response: ToolResponse, isError?: boolean): MCPToolResponse;
export interface SpecKitProject {
    projectId: string;
    projectPath: string;
    projectName: string;
    projectType: 'spec-kit';
    rootDirectory: string;
    hasConstitution: boolean;
    agentCount: number;
    specCount: number;
    createdAt: string;
    lastScanned: string;
}
export interface AIAgent {
    agentId: string;
    projectId: string;
    agentName: string;
    folderPath: string;
    subdirectoryType: 'commands' | 'prompts';
    commandCount: number;
    commands: AgentCommand[];
    lastUpdated: string;
}
export interface AgentCommand {
    commandId: string;
    agentId: string;
    commandName: string;
    slashCommand: string;
    filePath: string;
    fileName: string;
    description?: string;
    lastModified: string;
}
export interface Constitution {
    projectId: string;
    filePath: string;
    content: string;
    version?: string;
    lastModified: string;
    principleCount: number;
}
export interface SpecDirectory {
    specId: string;
    projectId: string;
    featureNumber: string;
    featureName: string;
    directoryName: string;
    directoryPath: string;
    hasSpec: boolean;
    hasPlan: boolean;
    hasTasks: boolean;
    subdirectories: string[];
    taskFiles: string[];
    createdAt: string;
    lastModified: string;
}
export interface Template {
    templateId: string;
    projectId: string;
    templateName: string;
    fileName: string;
    filePath: string;
    templateType: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other';
    lastModified: string;
}
export type ProjectContext = SpecKitProjectContext | WorkflowProjectContext;
export interface BaseProjectContext {
    projectId: string;
    projectPath: string;
    projectName: string;
    projectType: 'spec-kit' | 'spec-workflow-mcp';
}
export interface SpecKitProjectContext extends BaseProjectContext {
    projectType: 'spec-kit';
    parser: any;
    agents: AIAgent[];
    constitution?: Constitution;
    templates: Template[];
    specs: SpecDirectory[];
}
export interface WorkflowProjectContext extends BaseProjectContext {
    projectType: 'spec-workflow-mcp';
    parser: any;
    watcher: any;
    approvalStorage: any;
    archiveService: any;
}
export declare function isSpecKitProject(context: ProjectContext): context is SpecKitProjectContext;
export declare function isWorkflowProject(context: ProjectContext): context is WorkflowProjectContext;
export interface AIAgentFolder {
    folderName: string;
    folderPath: string;
    subdirectory: 'commands' | 'prompts' | null;
    isValid: boolean;
}
export interface ScanResult {
    rootDirectory: string;
    subdirectoryCount: number;
    specKitProjectsFound: number;
    scanDuration: number;
    errors: ScanError[];
    timestamp: string;
}
export interface ScanError {
    path: string;
    errorCode: string;
    message: string;
    severity: 'warning' | 'error';
}
//# sourceMappingURL=types.d.ts.map