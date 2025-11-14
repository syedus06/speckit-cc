export declare class SpecWorkflowMCPServer {
    private server;
    private projectPath;
    private projectRegistry;
    private lang?;
    constructor();
    initialize(projectPath: string, lang?: string): Promise<void>;
    private setupHandlers;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map