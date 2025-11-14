import { ProjectManager } from './project-manager.js';
import { AutomationJob } from '../types.js';
export interface JobExecutionResult {
    jobId: string;
    jobName: string;
    success: boolean;
    startTime: string;
    endTime: string;
    duration: number;
    itemsProcessed: number;
    itemsDeleted: number;
    error?: string;
}
export declare class JobScheduler {
    private settingsManager;
    private historyManager;
    private projectManager;
    private scheduledJobs;
    constructor(projectManager: ProjectManager);
    /**
     * Initialize the scheduler
     * 1. Run catch-up for any missed jobs
     * 2. Schedule recurring jobs
     */
    initialize(): Promise<void>;
    /**
     * Run catch-up for a job - delete any records that should have been deleted
     */
    private runJobCatchUp;
    /**
     * Schedule a recurring job with cron
     */
    private scheduleJob;
    /**
     * Execute a job against all projects
     */
    private executeJob;
    /**
     * Clean up old approval records
     */
    private cleanupApprovals;
    /**
     * Clean up old active specs
     */
    private cleanupSpecs;
    /**
     * Clean up old archived specs
     */
    private cleanupArchivedSpecs;
    /**
     * Manually trigger a job execution
     */
    runJobManually(jobId: string): Promise<JobExecutionResult>;
    /**
     * Update a job configuration and reschedule if needed
     */
    updateJob(jobId: string, updates: any): Promise<void>;
    /**
     * Delete a job
     */
    deleteJob(jobId: string): Promise<void>;
    /**
     * Add a new job
     */
    addJob(job: AutomationJob): Promise<void>;
    /**
     * Get all jobs
     */
    getAllJobs(): Promise<AutomationJob[]>;
    /**
     * Get execution history for a job
     */
    getJobExecutionHistory(jobId: string, limit?: number): Promise<import("../types.js").JobExecutionHistory[]>;
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
        lastExecution: import("../types.js").JobExecutionHistory;
    }>;
    /**
     * Shutdown the scheduler
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=job-scheduler.d.ts.map