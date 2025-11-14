export interface SpecWorkflowConfig {
    projectDir?: string;
    port?: number;
    dashboardOnly?: boolean;
    lang?: string;
    speckitRootDir?: string;
}
export interface ConfigLoadResult {
    config: SpecWorkflowConfig | null;
    configPath: string | null;
    error?: string;
}
export declare function loadConfigFromPath(configPath: string): ConfigLoadResult;
export declare function loadConfigFile(projectDir: string, customConfigPath?: string): ConfigLoadResult;
export declare function mergeConfigs(fileConfig: SpecWorkflowConfig | null, cliArgs: Partial<SpecWorkflowConfig>): SpecWorkflowConfig;
export declare function getRootDirectory(): {
    rootDir: string | null;
    error?: string;
};
//# sourceMappingURL=config.d.ts.map