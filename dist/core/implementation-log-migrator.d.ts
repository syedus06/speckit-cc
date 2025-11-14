/**
 * Migrates implementation logs from JSON format to individual markdown files
 * This utility class handles the automatic migration when the MCP server starts
 */
export declare class ImplementationLogMigrator {
    private migrationLogPath;
    constructor(userDataDir: string);
    /**
     * Log migration events
     */
    private log;
    /**
     * Sanitize taskId for use in filenames (e.g., "1.2" → "1-2")
     */
    private sanitizeTaskId;
    /**
     * Generate markdown filename for a log entry
     */
    private generateFileName;
    /**
     * Convert an implementation log entry to markdown format
     */
    private entryToMarkdown;
    /**
     * Migrate a single JSON file to markdown files
     */
    private migrateJsonFile;
    /**
     * Scan all specs and migrate their implementation logs
     */
    migrateAllSpecs(specsDir: string): Promise<{
        totalSpecs: number;
        migratedSpecs: number;
        totalEntries: number;
        errors: Array<{
            spec: string;
            error: string;
        }>;
    }>;
}
//# sourceMappingURL=implementation-log-migrator.d.ts.map