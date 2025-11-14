import { SpecData, SteeringStatus } from '../types.js';
export interface ParsedSpec extends SpecData {
    displayName: string;
}
export declare class SpecParser {
    private projectPath;
    private specsPath;
    private archiveSpecsPath;
    private steeringPath;
    constructor(projectPath: string);
    getAllSpecs(): Promise<ParsedSpec[]>;
    getAllArchivedSpecs(): Promise<ParsedSpec[]>;
    getSpec(name: string): Promise<ParsedSpec | null>;
    getArchivedSpec(name: string): Promise<ParsedSpec | null>;
    getProjectSteeringStatus(): Promise<SteeringStatus>;
    private formatDisplayName;
}
//# sourceMappingURL=parser.d.ts.map