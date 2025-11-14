// Common types for the spec workflow MCP server
import { encode } from '@toon-format/toon';
// Helper function to convert ToolResponse to MCP format
export function toMCPResponse(response, isError = false) {
    return {
        content: [{
                type: "text",
                text: encode(response)
            }],
        isError
    };
}
// Type Guards
export function isSpecKitProject(context) {
    return context.projectType === 'spec-kit';
}
export function isWorkflowProject(context) {
    return context.projectType === 'spec-workflow-mcp';
}
//# sourceMappingURL=types.js.map