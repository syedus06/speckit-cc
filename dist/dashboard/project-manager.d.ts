import { EventEmitter } from 'events';
import { ProjectContext } from '../types.js';
export declare class ProjectManager extends EventEmitter {
    private registry;
    private projects;
    private activeProjectId?;
    private registryWatcher?;
    private cleanupInterval?;
    private switchMetrics;
    constructor();
    /**
     * Initialize the project manager
     * Loads projects from registry and starts watching for changes
     */
    initialize(): Promise<void>;
    /**
     * Load all projects from the registry
     */
    private loadProjectsFromRegistry;
    /**
     * Start watching the registry file for changes
     */
    private startRegistryWatcher;
    /**
     * Sync current projects with registry
     * Add new projects, remove deleted ones
     */
    private syncWithRegistry;
    /**
     * Add a project context
     */
    private addProject; /**
     * Remove a project context
     */
    private removeProject;
    /**
     * Clean up stale projects (dead processes)
     */
    private cleanupStaleProjects;
    /**
     * Set the active project
     */
    setActiveProject(projectId: string): boolean;
    /**
     * Record project switching metrics
     */
    private recordProjectSwitch;
    /**
     * Log project switching metrics
     */
    private logSwitchMetrics;
    /**
     * Get project switching metrics (for debugging/monitoring)
     */
    getSwitchMetrics(): {
        totalSwitches: number;
        switchesByProject: Record<string, number>;
        averageSwitchInterval: number;
        recentSwitches: Array<{
            timestamp: number;
            fromProjectId: string | null;
            toProjectId: string | null;
            duration: number;
        }>;
    };
    /**
     * Get the active project ID
     */
    getActiveProjectId(): string | undefined;
    /**
     * Get the active project context
     */
    getActiveProject(): ProjectContext | undefined;
    /**
     * Get a project context by ID
     */
    getProject(projectId: string): ProjectContext | undefined;
    /**
     * Get all project contexts
     */
    getAllProjects(): ProjectContext[];
    /**
     * Get projects list for API
     */
    getProjectsList(): Array<{
        projectId: string;
        projectName: string;
        projectPath: string;
    }>;
    /**
     * Manually add a project by path
     */
    addProjectByPath(projectPath: string): Promise<string>;
    /**
     * Manually remove a project
     */
    removeProjectById(projectId: string): Promise<void>;
    /**
     * Stop the project manager
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=project-manager.d.ts.map