export declare const DASHBOARD_TEST_MESSAGE = "MCP Workflow Dashboard Online!";
export declare function findAvailablePort(): Promise<number>;
/**
 * Check if a specific port is available for use
 * @param port The port number to check
 * @returns Promise<boolean> true if port is available, false otherwise
 */
export declare function isSpecificPortAvailable(port: number): Promise<boolean>;
/**
 * Check if an existing dashboard is running on the specified port
 * @param port The port number to check
 * @returns Promise<boolean> true if a dashboard is running, false otherwise
 */
export declare function checkExistingDashboard(port: number): Promise<boolean>;
/**
 * Validate a port number and check if it's available
 * @param port The port number to validate and check
 * @param skipDashboardCheck Optional flag to skip checking for existing dashboard
 * @returns Promise<void> throws error if invalid or unavailable
 */
export declare function validateAndCheckPort(port: number, skipDashboardCheck?: boolean): Promise<void>;
export interface SpecKitLogEvent {
    event: string;
    projectId?: string;
    projectPath?: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
/**
 * Log spec-kit project discovery
 */
export declare function logProjectDiscovered(projectId: string, projectPath: string): SpecKitLogEvent;
/**
 * Log AI agent detection
 */
export declare function logAgentDetected(projectId: string, agentName: string, commandCount: number): SpecKitLogEvent;
/**
 * Log scan completion
 */
export declare function logScanCompleted(rootDirectory: string, projectCount: number, scanDuration: number, errors: any[]): SpecKitLogEvent;
/**
 * Log scan failure
 */
export declare function logScanFailed(rootDirectory: string, error: Error): SpecKitLogEvent;
/**
 * Log spec parsing operations
 */
export declare function logSpecParsed(projectId: string, specCount: number, structureComplexity: number): SpecKitLogEvent;
/**
 * Log constitution access
 */
export declare function logConstitutionAccessed(projectId: string, hasConstitution: boolean): SpecKitLogEvent;
export interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface PerformanceSummary {
    operation: string;
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    lastRecorded: string;
}
declare class PerformanceTracker {
    private metrics;
    private maxMetrics;
    /**
     * Record a performance metric
     */
    record(operation: string, duration: number, metadata?: Record<string, any>): void;
    /**
     * Get performance summary for an operation
     */
    getSummary(operation: string): PerformanceSummary | null;
    /**
     * Get all performance summaries
     */
    getAllSummaries(): PerformanceSummary[];
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Get recent slow operations
     */
    getSlowOperations(threshold?: number): PerformanceMetric[];
}
export declare const performanceTracker: PerformanceTracker;
/**
 * Time a function execution and record the performance metric
 */
export declare function timeOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
/**
 * Time a synchronous function execution and record the performance metric
 */
export declare function timeSyncOperation<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T;
/**
 * Get performance metrics summary
 */
export declare function getPerformanceMetrics(): {
    summaries: PerformanceSummary[];
    slowOperations: PerformanceMetric[];
    totalMetrics: number;
};
/**
 * Clear performance metrics
 */
export declare function clearPerformanceMetrics(): void;
export {};
//# sourceMappingURL=utils.d.ts.map