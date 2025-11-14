import { SpecData, SteeringStatus } from '../types.js';
export declare class SpecParser {
    private projectPath;
    constructor(projectPath: string);
    getAllSpecs(): Promise<SpecData[]>;
    getSpec(name: string): Promise<SpecData | null>;
    getProjectSteeringStatus(): Promise<SteeringStatus>;
    private getPhaseStatus;
    private fileExists;
}
export declare class SpecKitParser {
    private projectPath;
    constructor(projectPath: string);
    parseProjectMetadata(): Promise<{
        agents: any[];
        constitution?: any;
        templates: any[];
        scripts: any[];
        specs: any[];
    }>;
    discoverAIAgents(): Promise<any[]>;
    private parseAgentFolder;
    private detectAgentSubdirectory;
    private parseAgentCommands;
    parseConstitution(): Promise<any | undefined>;
    getTemplates(): Promise<any[]>;
    getScripts(): Promise<any[]>;
    getSpecs(): Promise<any[]>;
    private calculateStructureComplexity;
    private extractCommandName;
    private generateProjectId;
    private countPrinciples;
    private extractVersion;
    private extractScriptDescription;
    private inferTemplateType;
    private parseSpecDirectory;
    detectSpecFiles(specDirPath: string): Promise<{
        hasSpec: boolean;
        hasPlan: boolean;
        hasTasks: boolean;
        subdirectories: string[];
        taskFiles: string[];
    }>;
    detectSpecSubdirectories(specDirPath: string): Promise<string[]>;
}
//# sourceMappingURL=parser.d.ts.map