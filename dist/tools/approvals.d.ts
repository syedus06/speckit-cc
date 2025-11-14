import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';
export declare const approvalsTool: Tool;
export declare function approvalsHandler(args: {
    action: 'request' | 'status' | 'delete';
    projectPath?: string;
    approvalId?: string;
    title?: string;
    filePath?: string;
    type?: 'document' | 'action';
    category?: 'spec' | 'steering';
    categoryName?: string;
}, context: ToolContext): Promise<ToolResponse>;
//# sourceMappingURL=approvals.d.ts.map