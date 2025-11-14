import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import { SpecParser } from './parser.js';
import { SpecWatcher } from './watcher.js';
import { ApprovalStorage } from './approval-storage.js';
import { SpecArchiveService } from '../core/archive-service.js';
import { ProjectRegistry } from '../core/project-registry.js';
import { isWorkflowProject } from '../types.js';
import { SpecKitParser } from '../core/parser.js';
import { detectProjectType } from '../core/path-utils.js';
export class ProjectManager extends EventEmitter {
    registry;
    projects = new Map();
    activeProjectId;
    registryWatcher;
    cleanupInterval;
    // Project switching metrics
    switchMetrics = {
        totalSwitches: 0,
        switchesByProject: new Map(),
        lastSwitchTime: 0,
        switchHistory: []
    };
    constructor() {
        super();
        this.registry = new ProjectRegistry();
    }
    /**
     * Initialize the project manager
     * Loads projects from registry and starts watching for changes
     */
    async initialize() {
        // Clean up stale projects first
        await this.registry.cleanupStaleProjects();
        // Load all projects from registry
        await this.loadProjectsFromRegistry();
        // Watch registry file for changes
        this.startRegistryWatcher();
        // Periodic cleanup every 30 seconds
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupStaleProjects();
        }, 30000);
    }
    /**
     * Load all projects from the registry
     */
    async loadProjectsFromRegistry() {
        const entries = await this.registry.getAllProjects();
        for (const entry of entries) {
            if (!this.projects.has(entry.projectId)) {
                await this.addProject(entry);
            }
        }
    }
    /**
     * Start watching the registry file for changes
     */
    startRegistryWatcher() {
        const registryPath = this.registry.getRegistryPath();
        this.registryWatcher = chokidar.watch(registryPath, {
            ignoreInitial: true,
            persistent: true,
            ignorePermissionErrors: true
        });
        this.registryWatcher.on('change', async () => {
            await this.syncWithRegistry();
        });
        this.registryWatcher.on('add', async () => {
            await this.syncWithRegistry();
        });
    }
    /**
     * Sync current projects with registry
     * Add new projects, remove deleted ones
     */
    async syncWithRegistry() {
        try {
            const entries = await this.registry.getAllProjects();
            const registryIds = new Set(entries.map(e => e.projectId));
            const currentIds = new Set(this.projects.keys());
            // Add new projects
            for (const entry of entries) {
                if (!currentIds.has(entry.projectId)) {
                    await this.addProject(entry);
                }
            }
            // Remove deleted projects
            for (const projectId of currentIds) {
                if (!registryIds.has(projectId)) {
                    await this.removeProject(projectId);
                }
            }
            // Emit projects update event
            this.emit('projects-update', this.getProjectsList());
        }
        catch (error) {
            console.error('Error syncing with registry:', error);
        }
    }
    /**
     * Add a project context
     */
    async addProject(entry) {
        try {
            const projectType = await detectProjectType(entry.projectPath);
            let context;
            if (projectType === 'spec-kit') {
                const parser = new SpecKitParser(entry.projectPath);
                const metadata = await parser.parseProjectMetadata();
                context = {
                    projectId: entry.projectId,
                    projectPath: entry.projectPath,
                    projectName: entry.projectName,
                    projectType: 'spec-kit',
                    parser,
                    agents: metadata.agents,
                    constitution: metadata.constitution,
                    templates: metadata.templates,
                    specs: metadata.specs
                };
            }
            else {
                const parser = new SpecParser(entry.projectPath);
                const watcher = new SpecWatcher(entry.projectPath, parser);
                const approvalStorage = new ApprovalStorage(entry.projectPath);
                const archiveService = new SpecArchiveService(entry.projectPath);
                // Start watchers
                await watcher.start();
                await approvalStorage.start();
                // Forward events with projectId
                watcher.on('change', (event) => {
                    this.emit('spec-change', { projectId: entry.projectId, ...event });
                });
                watcher.on('task-update', (event) => {
                    this.emit('task-update', { projectId: entry.projectId, ...event });
                });
                watcher.on('steering-change', (event) => {
                    this.emit('steering-change', { projectId: entry.projectId, ...event });
                });
                approvalStorage.on('approval-change', () => {
                    this.emit('approval-change', { projectId: entry.projectId });
                });
                context = {
                    projectId: entry.projectId,
                    projectPath: entry.projectPath,
                    projectName: entry.projectName,
                    projectType: 'spec-workflow-mcp',
                    parser,
                    watcher,
                    approvalStorage,
                    archiveService
                };
            }
            this.projects.set(entry.projectId, context);
            console.error(`Project added: ${entry.projectName} (${entry.projectId})`);
            // Emit project added event
            this.emit('project-added', entry.projectId);
        }
        catch (error) {
            console.error(`Failed to add project ${entry.projectName}:`, error);
        }
    } /**
     * Remove a project context
     */
    async removeProject(projectId) {
        const context = this.projects.get(projectId);
        if (!context)
            return;
        try {
            // Stop watchers only for workflow projects
            if (isWorkflowProject(context)) {
                await context.watcher.stop();
                await context.approvalStorage.stop();
                // Remove all listeners
                context.watcher.removeAllListeners();
                context.approvalStorage.removeAllListeners();
            }
            this.projects.delete(projectId);
            console.error(`Project removed: ${context.projectName} (${projectId})`);
            // Emit project removed event
            this.emit('project-removed', projectId);
        }
        catch (error) {
            console.error(`Failed to remove project ${projectId}:`, error);
        }
    }
    /**
     * Clean up stale projects (dead processes)
     */
    async cleanupStaleProjects() {
        const removedCount = await this.registry.cleanupStaleProjects();
        if (removedCount > 0) {
            // Registry changed, sync will be triggered by watcher
            console.error(`Cleaned up ${removedCount} stale project(s)`);
        }
    }
    /**
     * Set the active project
     */
    setActiveProject(projectId) {
        const startTime = Date.now();
        if (!projectId || projectId.trim() === '') {
            // Clear active project
            const previousActiveId = this.activeProjectId;
            this.activeProjectId = undefined;
            // Emit active project changed event if it actually changed
            if (previousActiveId !== undefined) {
                this.recordProjectSwitch(previousActiveId, null, startTime);
                console.error(`[ProjectManager] Active project cleared (was: ${previousActiveId})`);
                this.emit('active-project-changed', {
                    previousProjectId: previousActiveId,
                    newProjectId: null,
                    project: null
                });
            }
            return true;
        }
        const project = this.projects.get(projectId);
        if (!project) {
            console.error(`[ProjectManager] Failed to set active project: project ${projectId} not found`);
            return false;
        }
        const previousActiveId = this.activeProjectId;
        // Only proceed if actually changing
        if (previousActiveId === projectId) {
            console.error(`[ProjectManager] Project ${projectId} is already active`);
            return true;
        }
        this.activeProjectId = projectId;
        // Record the switch
        this.recordProjectSwitch(previousActiveId || null, projectId, startTime);
        console.error(`[ProjectManager] Active project changed: ${previousActiveId || 'none'} → ${projectId} (${project.projectName})`);
        // Emit active project changed event
        this.emit('active-project-changed', {
            previousProjectId: previousActiveId,
            newProjectId: projectId,
            project: {
                projectId: project.projectId,
                projectName: project.projectName,
                projectPath: project.projectPath
            }
        });
        return true;
    }
    /**
     * Record project switching metrics
     */
    recordProjectSwitch(fromProjectId, toProjectId, startTime) {
        const now = Date.now();
        const duration = now - this.switchMetrics.lastSwitchTime;
        // Update metrics
        this.switchMetrics.totalSwitches++;
        this.switchMetrics.lastSwitchTime = now;
        // Track switches by project
        if (toProjectId) {
            const current = this.switchMetrics.switchesByProject.get(toProjectId) || 0;
            this.switchMetrics.switchesByProject.set(toProjectId, current + 1);
        }
        // Add to history (keep last 100 entries)
        this.switchMetrics.switchHistory.push({
            timestamp: now,
            fromProjectId,
            toProjectId,
            duration: duration > 0 ? duration : 0
        });
        if (this.switchMetrics.switchHistory.length > 100) {
            this.switchMetrics.switchHistory.shift();
        }
        // Log metrics periodically (every 10 switches)
        if (this.switchMetrics.totalSwitches % 10 === 0) {
            this.logSwitchMetrics();
        }
    }
    /**
     * Log project switching metrics
     */
    logSwitchMetrics() {
        const metrics = this.switchMetrics;
        const topProjects = Array.from(metrics.switchesByProject.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([projectId, count]) => `${projectId.substring(0, 8)}:${count}`)
            .join(', ');
        console.error(`[ProjectManager] Switch metrics: ${metrics.totalSwitches} total switches, top projects: ${topProjects}`);
    }
    /**
     * Get project switching metrics (for debugging/monitoring)
     */
    getSwitchMetrics() {
        const metrics = this.switchMetrics;
        const history = metrics.switchHistory;
        const averageSwitchInterval = history.length > 1
            ? history.reduce((sum, entry, i) => {
                if (i === 0)
                    return sum;
                return sum + (entry.timestamp - history[i - 1].timestamp);
            }, 0) / (history.length - 1)
            : 0;
        return {
            totalSwitches: metrics.totalSwitches,
            switchesByProject: Object.fromEntries(metrics.switchesByProject),
            averageSwitchInterval,
            recentSwitches: history.slice(-10) // Last 10 switches
        };
    }
    /**
     * Get the active project ID
     */
    getActiveProjectId() {
        return this.activeProjectId;
    }
    /**
     * Get the active project context
     */
    getActiveProject() {
        if (!this.activeProjectId) {
            return undefined;
        }
        return this.projects.get(this.activeProjectId);
    }
    /**
     * Get a project context by ID
     */
    getProject(projectId) {
        return this.projects.get(projectId);
    }
    /**
     * Get all project contexts
     */
    getAllProjects() {
        return Array.from(this.projects.values());
    }
    /**
     * Get projects list for API
     */
    getProjectsList() {
        return Array.from(this.projects.values()).map(p => ({
            projectId: p.projectId,
            projectName: p.projectName,
            projectPath: p.projectPath
        }));
    }
    /**
     * Manually add a project by path
     */
    async addProjectByPath(projectPath) {
        const entry = await this.registry.getProject(projectPath);
        if (entry) {
            // Already registered
            if (!this.projects.has(entry.projectId)) {
                await this.addProject(entry);
            }
            return entry.projectId;
        }
        // Register new project (with dummy PID since it's manual)
        const projectId = await this.registry.registerProject(projectPath, process.pid);
        // Get the entry and add it
        const newEntry = await this.registry.getProjectById(projectId);
        if (newEntry) {
            await this.addProject(newEntry);
        }
        return projectId;
    }
    /**
     * Manually remove a project
     */
    async removeProjectById(projectId) {
        await this.removeProject(projectId);
        await this.registry.unregisterProjectById(projectId);
    }
    /**
     * Stop the project manager
     */
    async stop() {
        // Stop cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        // Stop registry watcher
        if (this.registryWatcher) {
            this.registryWatcher.removeAllListeners();
            await this.registryWatcher.close();
            this.registryWatcher = undefined;
        }
        // Stop all projects
        const projectIds = Array.from(this.projects.keys());
        for (const projectId of projectIds) {
            await this.removeProject(projectId);
        }
        // Remove all listeners
        this.removeAllListeners();
    }
}
//# sourceMappingURL=project-manager.js.map