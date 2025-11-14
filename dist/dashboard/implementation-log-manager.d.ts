import { ImplementationLog, ImplementationLogEntry } from '../types.js';
/**
 * Manager for implementation logs using markdown file format
 * Each implementation log entry is stored as an individual markdown file
 * in the spec's "Implementation Logs" directory
 */
export declare class ImplementationLogManager {
    private specPath;
    private logsDir;
    constructor(specPath: string);
    /**
     * Ensure the Implementation Logs directory exists
     */
    private ensureLogsDir;
    /**
     * Parse markdown filename to extract taskId and entry ID
     * Expected format: task-{sanitized-taskId}_{timestamp}_{id-prefix}.md
     */
    private parseFileName;
    /**
     * Parse markdown content to extract metadata and artifacts
     */
    private parseMarkdownContent;
    /**
     * Load all implementation logs from markdown files (new format)
     * Also checks for legacy JSON file and returns empty if found (migration handled separately)
     */
    loadLog(): Promise<ImplementationLog>;
    /**
     * Generate markdown filename for a log entry
     */
    private generateFileName;
    /**
     * Convert an implementation log entry to markdown format
     */
    private entryToMarkdown;
    /**
     * Add a new implementation log entry
     */
    addLogEntry(entry: Omit<ImplementationLogEntry, 'id'>): Promise<ImplementationLogEntry>;
    /**
     * Get all implementation logs
     */
    getAllLogs(): Promise<ImplementationLogEntry[]>;
    /**
     * Get logs for a specific task
     */
    getTaskLogs(taskId: string): Promise<ImplementationLogEntry[]>;
    /**
     * Get logs within a date range
     */
    getLogsByDateRange(startDate: Date, endDate: Date): Promise<ImplementationLogEntry[]>;
    /**
     * Search logs by summary, task ID, files, and artifacts
     * Supports space-separated keywords with AND logic (all keywords must match)
     */
    searchLogs(query: string): Promise<ImplementationLogEntry[]>;
    /**
     * Get statistics for a task
     */
    getTaskStats(taskId: string): Promise<{
        totalImplementations: number;
        totalFilesModified: number;
        totalFilesCreated: number;
        totalLinesAdded: number;
        totalLinesRemoved: number;
        lastImplementation: null;
    } | {
        totalImplementations: number;
        totalFilesModified: number;
        totalFilesCreated: number;
        totalLinesAdded: number;
        totalLinesRemoved: number;
        lastImplementation: ImplementationLogEntry;
    }>;
    /**
     * Get all logs that contain a specific artifact type
     */
    getLogsByArtifactType(artifactType: 'apiEndpoints' | 'components' | 'functions' | 'classes' | 'integrations'): Promise<ImplementationLogEntry[]>;
    /**
     * Search for specific artifacts across all logs
     * Returns logs that contain artifacts matching the search term
     */
    findArtifact(artifactType: string, searchTerm: string): Promise<Array<{
        log: ImplementationLogEntry;
        artifact: any;
    }>>;
    /**
     * Get the logs directory path
     */
    getLogsDir(): string;
    /**
     * Get the log file path (for backwards compatibility, now returns the logs directory)
     */
    getLogPath(): string;
}
//# sourceMappingURL=implementation-log-manager.d.ts.map