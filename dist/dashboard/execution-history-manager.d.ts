import { JobExecutionHistory, JobExecutionLog } from '../types.js';
export declare class ExecutionHistoryManager {
    private historyPath;
    private historyDir;
    private maxHistoryEntries;
    constructor();
    /**
     * Ensure the history directory exists
     */
    private ensureHistoryDir;
    /**
     * Load execution history from file
     */
    loadHistory(): Promise<JobExecutionLog>;
    /**
     * Save execution history to file atomically
     */
    private saveHistory;
    /**
     * Record a job execution
     */
    recordExecution(execution: JobExecutionHistory): Promise<void>;
    /**
     * Get execution history for a specific job
     */
    getJobHistory(jobId: string, limit?: number): Promise<JobExecutionHistory[]>;
    /**
     * Get recent executions across all jobs
     */
    getRecentExecutions(limit?: number): Promise<JobExecutionHistory[]>;
    /**
     * Get execution statistics for a job
     */
    getJobStats(jobId: string): Promise<{
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        successRate: number;
        totalItemsDeleted: number;
        avgDuration: number;
        lastExecution: JobExecutionHistory;
    }>;
    /**
     * Clear old history (keep last N days)
     */
    clearOldHistory(daysToKeep?: number): Promise<void>;
    /**
     * Get the history file path
     */
    getHistoryPath(): string;
}
//# sourceMappingURL=execution-history-manager.d.ts.map