export declare class WorkspaceInitializer {
    private projectPath;
    private version;
    constructor(projectPath: string, version: string);
    initializeWorkspace(): Promise<void>;
    private initializeDirectories;
    private initializeTemplates;
    private copyTemplate;
    private createUserTemplatesReadme;
    /**
     * Migrate implementation logs from JSON to Markdown format
     * Runs on server startup to handle automatic migration for existing specs
     */
    private migrateImplementationLogs;
}
//# sourceMappingURL=workspace-initializer.d.ts.map