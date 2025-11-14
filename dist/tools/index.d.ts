import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, MCPToolResponse } from '../types.js';
export declare function registerTools(): Tool[];
export declare function handleToolCall(name: string, args: any, context: ToolContext): Promise<MCPToolResponse>;
//# sourceMappingURL=index.d.ts.map