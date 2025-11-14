export interface DashboardSessionEntry {
    url: string;
    port: number;
    pid: number;
    startedAt: string;
}
/**
 * Manages the global dashboard session
 * Stores dashboard connection info in ~/.spec-workflow-mcp/activeSession.json
 */
export declare class DashboardSessionManager {
    private sessionDir;
    private sessionPath;
    constructor();
    /**
     * Ensure the session directory exists
     */
    private ensureSessionDir;
    /**
     * Read the session file
     */
    private readSession;
    /**
     * Write the session file atomically
     */
    private writeSession;
    /**
     * Check if a process is still running
     */
    private isProcessAlive;
    /**
     * Register the dashboard session
     */
    registerDashboard(url: string, port: number, pid: number): Promise<void>;
    /**
     * Unregister the dashboard session
     */
    unregisterDashboard(): Promise<void>;
    /**
     * Get the current dashboard session if it's valid
     */
    getDashboardSession(): Promise<DashboardSessionEntry | null>;
    /**
     * Check if a dashboard is currently running
     */
    isDashboardRunning(): Promise<boolean>;
}
//# sourceMappingURL=dashboard-session.d.ts.map