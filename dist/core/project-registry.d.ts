import { SpecKitProject, ProjectContext } from '../types.js';
export interface ProjectRegistryEntry {
    projectId: string;
    projectPath: string;
    projectName: string;
    pid: number;
    registeredAt: string;
}
/**
 * Generate a stable projectId from an absolute path
 * Uses SHA-1 hash encoded as base64url
 */
export declare function generateProjectId(absolutePath: string): string;
export declare class ProjectRegistry {
    private registryPath;
    private registryDir;
    private needsInitialization;
    private rootDirectory?;
    private specKitProjects;
    private workflowProjects;
    private server?;
    private watcher?;
    private projectTypeCache;
    private negativeResultCache;
    constructor();
    /**
     * Ensure the registry directory exists
     */
    private ensureRegistryDir;
    /**
     * Read the registry file with atomic operations
     * Returns a map keyed by projectId
     */
    private readRegistry;
    /**
     * Write the registry file atomically
     */
    private writeRegistry;
    /**
     * Check if a process is still running
     */
    private isProcessAlive;
    /**
     * Register a project in the global registry
     */
    registerProject(projectPath: string, pid: number): Promise<string>;
    /**
     * Unregister a project from the global registry by path
     */
    unregisterProject(projectPath: string): Promise<void>;
    /**
     * Unregister a project by projectId
     */
    unregisterProjectById(projectId: string): Promise<void>;
    /**
     * Get all active projects from the registry
     */
    getAllProjects(): Promise<ProjectRegistryEntry[]>;
    /**
     * Get a specific project by path
     */
    getProject(projectPath: string): Promise<ProjectRegistryEntry | null>;
    /**
     * Get a specific project by projectId
     */
    getProjectById(projectId: string): Promise<ProjectRegistryEntry | null>;
    /**
     * Clean up stale projects (where the process is no longer running)
     */
    cleanupStaleProjects(): Promise<number>;
    /**
     * Check if a project is registered by path
     */
    isProjectRegistered(projectPath: string): Promise<boolean>;
    /**
     * Get the registry file path for watching
     */
    getRegistryPath(): string;
    /**
     * Set the server reference for WebSocket event emission
     */
    setServer(server: any): void;
    /**
     * Set the root directory for scanning
     */
    setRootDirectory(rootDir: string): void;
    /**
     * Get cached project type with validation
     */
    private getCachedProjectType;
    /**
     * Cache project type result
     */
    private cacheProjectType;
    /**
     * Check if negative result is still valid (within 5 minutes)
     */
    private isNegativeResultValid;
    /**
     * Clear expired cache entries
     */
    private clearExpiredCache;
    /**
     * Scan root directory for spec-kit projects
     */
    scanRootDirectory(): Promise<void>;
    /**
     * Register a spec-kit project
     */
    registerSpecKitProject(projectPath: string): Promise<string>;
    /**
     * Get all project contexts (both spec-kit and workflow)
     */
    getAllProjectContexts(): ProjectContext[];
    /**
     * Get projects by type
     */
    getProjectsByType(type: 'spec-kit' | 'spec-workflow-mcp'): ProjectContext[];
    /**
     * Get spec-kit project by ID
     */
    getSpecKitProject(projectId: string): SpecKitProject | null;
    /**
     * Get project context by ID
     */
    getProjectContext(projectId: string): ProjectContext | null;
    /**
     * Start watching for project directory changes (creation/deletion)
     */
    startWatching(): Promise<void>;
    /**
     * Stop watching for project directory changes
     */
    stopWatching(): Promise<void>;
}
//# sourceMappingURL=project-registry.d.ts.map