import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';
export declare const getSpeckitAgentsTool: Tool;
export declare const getSpeckitConstitutionTool: Tool;
export declare const getSpeckitTemplatesTool: Tool;
export declare const getSpeckitScriptsTool: Tool;
export declare const getSpeckitProjectsTool: Tool;
export declare const scanSpeckitRootTool: Tool;
export declare function getSpeckitAgentsHandler(args: any, context: ToolContext): Promise<ToolResponse>;
export declare function getSpeckitConstitutionHandler(args: any, context: ToolContext): Promise<ToolResponse>;
export declare function getSpeckitTemplatesHandler(args: any, context: ToolContext): Promise<ToolResponse>;
export declare function getSpeckitScriptsHandler(args: any, context: ToolContext): Promise<ToolResponse>;
export declare function getSpeckitProjectsHandler(args: any, context: ToolContext): Promise<ToolResponse>;
export declare function scanSpeckitRootHandler(args: any, context: ToolContext): Promise<ToolResponse>;
//# sourceMappingURL=speckit-tools.d.ts.map