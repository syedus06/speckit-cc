import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import { PathUtils } from '../core/path-utils.js';
export class SpecWatcher extends EventEmitter {
    projectPath;
    parser;
    watcher;
    rootWatcher;
    rootDirectory;
    projectRegistry; // Reference to ProjectRegistry for rescanning
    rescanTimeout;
    constructor(projectPath, parser) {
        super();
        this.projectPath = projectPath;
        this.parser = parser;
    }
    /**
     * Set the root directory to watch for project changes
     */
    setRootDirectory(rootDir) {
        this.rootDirectory = rootDir;
    }
    /**
     * Set the project registry reference for triggering rescans
     */
    setProjectRegistry(registry) {
        this.projectRegistry = registry;
    }
    async start() {
        const workflowRoot = PathUtils.getWorkflowRoot(this.projectPath);
        const specsPath = PathUtils.getSpecPath(this.projectPath, '');
        const steeringPath = PathUtils.getSteeringPath(this.projectPath);
        // Watch for changes in specs and steering directories
        this.watcher = chokidar.watch([
            `${specsPath}/**/*.md`,
            `${steeringPath}/*.md`
        ], {
            ignoreInitial: true,
            persistent: true,
            ignorePermissionErrors: true
        });
        this.watcher.on('add', (filePath) => this.handleFileChange('created', filePath));
        this.watcher.on('change', (filePath) => this.handleFileChange('updated', filePath));
        this.watcher.on('unlink', (filePath) => this.handleFileChange('deleted', filePath));
        // Start root directory watching if configured
        if (this.rootDirectory) {
            await this.startRootWatching();
        }
        // File watcher started for workflow directories
    }
    async stop() {
        if (this.watcher) {
            // Remove all listeners before closing to prevent memory leaks
            this.watcher.removeAllListeners();
            await this.watcher.close();
            this.watcher = undefined;
            // File watcher stopped
        }
        // Stop root directory watching
        if (this.rootWatcher) {
            this.rootWatcher.removeAllListeners();
            await this.rootWatcher.close();
            this.rootWatcher = undefined;
        }
        // Clear any pending rescan timeout
        if (this.rescanTimeout) {
            clearTimeout(this.rescanTimeout);
            this.rescanTimeout = undefined;
        }
        // Clean up EventEmitter listeners
        this.removeAllListeners();
    }
    /**
     * Start watching the root directory for project creation/deletion
     */
    async startRootWatching() {
        if (!this.rootDirectory || !this.projectRegistry) {
            return;
        }
        if (this.rootWatcher) {
            await this.stopRootWatching();
        }
        // Watch for directory creation/deletion in root directory
        this.rootWatcher = chokidar.watch(this.rootDirectory, {
            ignoreInitial: true,
            persistent: true,
            ignorePermissionErrors: true,
            depth: 0, // Only watch immediate subdirectories
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });
        this.rootWatcher.on('addDir', () => this.scheduleRootRescan('filesystem-change'));
        this.rootWatcher.on('unlinkDir', () => this.scheduleRootRescan('filesystem-change'));
    }
    /**
     * Stop watching the root directory
     */
    async stopRootWatching() {
        if (this.rootWatcher) {
            this.rootWatcher.removeAllListeners();
            await this.rootWatcher.close();
            this.rootWatcher = undefined;
        }
        if (this.rescanTimeout) {
            clearTimeout(this.rescanTimeout);
            this.rescanTimeout = undefined;
        }
    }
    /**
     * Schedule a root directory rescan with debouncing
     */
    scheduleRootRescan(reason) {
        // Clear any existing timeout
        if (this.rescanTimeout) {
            clearTimeout(this.rescanTimeout);
        }
        // Schedule rescan with 5 second debounce
        this.rescanTimeout = setTimeout(async () => {
            await this.performRootRescan(reason);
            this.rescanTimeout = undefined;
        }, 5000);
    }
    /**
     * Perform the actual root directory rescan
     */
    async performRootRescan(reason) {
        try {
            if (this.projectRegistry && this.projectRegistry.scanRootDirectory) {
                await this.projectRegistry.scanRootDirectory();
            }
            // Emit root scan event
            const event = {
                type: 'root-scan',
                action: 'triggered',
                reason
            };
            this.emit('root-scan', event);
        }
        catch (error) {
            // Error during root directory rescan
        }
    }
    /**
     * Manually trigger a root directory rescan (for API calls)
     */
    async triggerManualRescan() {
        if (this.rootDirectory && this.projectRegistry) {
            await this.scheduleRootRescan('manual');
        }
    }
    async handleFileChange(action, filePath) {
        try {
            const normalizedPath = filePath.replace(/\\/g, '/');
            // Add small delay for file creation/updates to ensure file is fully written
            if (action === 'created' || action === 'updated') {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Determine if this is a spec or steering change
            if (normalizedPath.includes('/specs/')) {
                await this.handleSpecChange(action, normalizedPath);
            }
            else if (normalizedPath.includes('/steering/')) {
                await this.handleSteeringChange(action, normalizedPath);
            }
        }
        catch (error) {
            // Error handling file change
        }
    }
    async handleSpecChange(action, filePath) {
        // Extract spec name from path like: /path/to/.spec-workflow/specs/user-auth/requirements.md
        const pathParts = filePath.split('/');
        const specsIndex = pathParts.findIndex(part => part === 'specs');
        if (specsIndex === -1 || specsIndex + 1 >= pathParts.length)
            return;
        const specName = pathParts[specsIndex + 1];
        const document = pathParts[specsIndex + 2]?.replace('.md', '');
        let specData = null;
        if (action !== 'deleted') {
            specData = await this.parser.getSpec(specName);
        }
        const event = {
            type: 'spec',
            action,
            name: specName,
            data: specData
        };
        // Spec change detected
        this.emit('change', event);
        // Emit specific task update event if this was a tasks.md file
        if (document === 'tasks') {
            this.emit('task-update', {
                specName,
                action
            });
        }
    }
    async handleSteeringChange(action, filePath) {
        // Extract document name from path like: /path/to/.spec-workflow/steering/tech.md
        const pathParts = filePath.split('/');
        const document = pathParts[pathParts.length - 1]?.replace('.md', '');
        const steeringStatus = await this.parser.getProjectSteeringStatus();
        const event = {
            type: 'steering',
            action,
            name: document,
            steeringStatus
        };
        // Steering change detected
        this.emit('steering-change', event);
    }
}
//# sourceMappingURL=watcher.js.map