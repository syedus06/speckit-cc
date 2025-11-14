export interface MultiDashboardOptions {
    autoOpen?: boolean;
    port?: number;
}
export declare class MultiProjectDashboardServer {
    private app;
    private projectManager;
    private jobScheduler;
    private sessionManager;
    private projectRegistry;
    private options;
    private actualPort;
    private clients;
    private packageVersion;
    constructor(options?: MultiDashboardOptions);
    start(): Promise<string>;
    private setupProjectManagerEvents;
    private registerApiRoutes;
    private broadcastToAll;
    private broadcastToProject;
    private broadcastTaskUpdate;
    private broadcastImplementationLogUpdate;
    /**
     * Broadcast project discovered event for spec-kit projects
     */
    broadcastProjectDiscovered(projectId: string, projectName: string, projectType: 'spec-kit' | 'spec-workflow-mcp', projectPath: string): void;
    /**
     * Broadcast agent detected event for spec-kit projects
     */
    broadcastAgentDetected(projectId: string, agentName: string, commandCount: number): void;
    /**
     * Broadcast project removed event for spec-kit projects
     */
    broadcastProjectRemoved(projectId: string, projectName: string): void;
    /**
     * Broadcast project updated event for spec-kit projects
     */
    broadcastProjectUpdated(projectId: string, changedPaths: string[]): void;
    stop(): Promise<void>;
    getUrl(): string;
}
//# sourceMappingURL=multi-server.d.ts.map