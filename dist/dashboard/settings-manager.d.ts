import { GlobalSettings, AutomationJob } from '../types.js';
export declare class SettingsManager {
    private settingsPath;
    private settingsDir;
    constructor();
    /**
     * Ensure the settings directory exists
     */
    private ensureSettingsDir;
    /**
     * Load global settings from file
     */
    loadSettings(): Promise<GlobalSettings>;
    /**
     * Save global settings to file atomically
     */
    saveSettings(settings: GlobalSettings): Promise<void>;
    /**
     * Get a specific automation job by ID
     */
    getJob(jobId: string): Promise<AutomationJob | null>;
    /**
     * Get all automation jobs
     */
    getAllJobs(): Promise<AutomationJob[]>;
    /**
     * Add a new automation job
     */
    addJob(job: AutomationJob): Promise<void>;
    /**
     * Update an existing automation job
     */
    updateJob(jobId: string, updates: Partial<AutomationJob>): Promise<void>;
    /**
     * Delete an automation job
     */
    deleteJob(jobId: string): Promise<void>;
    /**
     * Get the settings file path
     */
    getSettingsPath(): string;
    /**
     * Get the settings directory path
     */
    getSettingsDir(): string;
}
//# sourceMappingURL=settings-manager.d.ts.map