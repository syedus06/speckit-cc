import { EventEmitter } from 'events';
import { SpecParser, ParsedSpec } from './parser.js';
export interface SpecChangeEvent {
    type: 'spec' | 'steering';
    action: 'created' | 'updated' | 'deleted';
    name: string;
    data?: ParsedSpec | any;
}
export interface RootDirectoryChangeEvent {
    type: 'root-scan';
    action: 'triggered';
    reason: 'filesystem-change' | 'manual';
}
export declare class SpecWatcher extends EventEmitter {
    private projectPath;
    private parser;
    private watcher?;
    private rootWatcher?;
    private rootDirectory?;
    private projectRegistry?;
    private rescanTimeout?;
    constructor(projectPath: string, parser: SpecParser);
    /**
     * Set the root directory to watch for project changes
     */
    setRootDirectory(rootDir: string): void;
    /**
     * Set the project registry reference for triggering rescans
     */
    setProjectRegistry(registry: any): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * Start watching the root directory for project creation/deletion
     */
    private startRootWatching;
    /**
     * Stop watching the root directory
     */
    private stopRootWatching;
    /**
     * Schedule a root directory rescan with debouncing
     */
    private scheduleRootRescan;
    /**
     * Perform the actual root directory rescan
     */
    private performRootRescan;
    /**
     * Manually trigger a root directory rescan (for API calls)
     */
    triggerManualRescan(): Promise<void>;
    private handleFileChange;
    private handleSpecChange;
    private handleSteeringChange;
}
//# sourceMappingURL=watcher.d.ts.map