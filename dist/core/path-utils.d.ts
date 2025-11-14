export declare class PathUtils {
    /**
     * Safely join paths ensuring no directory traversal
     */
    private static safeJoin;
    static getWorkflowRoot(projectPath: string): string;
    static getSpecPath(projectPath: string, specName: string): string;
    static getArchiveSpecPath(projectPath: string, specName: string): string;
    static getArchiveSpecsPath(projectPath: string): string;
    static getSteeringPath(projectPath: string): string;
    static getTemplatesPath(projectPath: string): string;
    static getScriptsPath(projectPath: string): string;
    static getAgentsPath(projectPath: string): string;
    static getCommandsPath(projectPath: string): string;
    static getApprovalsPath(projectPath: string): string;
    static getSpecApprovalPath(projectPath: string, specName: string): string;
    static toPlatformPath(path: string): string;
    static toUnixPath(path: string): string;
    static getRelativePath(projectPath: string, fullPath: string): string;
}
export declare function validateProjectPath(projectPath: string): Promise<string>;
export declare function ensureDirectoryExists(dirPath: string): Promise<void>;
export declare function ensureWorkflowDirectory(projectPath: string): Promise<string>;
export declare function detectProjectType(projectPath: string): Promise<'spec-kit' | 'spec-workflow-mcp' | null>;
//# sourceMappingURL=path-utils.d.ts.map