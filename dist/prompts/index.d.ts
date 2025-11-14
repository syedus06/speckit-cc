import { Prompt, ListPromptsResult, GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext } from '../types.js';
/**
 * Get all registered prompts
 */
export declare function registerPrompts(): Prompt[];
/**
 * Handle prompts/list request
 */
export declare function handlePromptList(): Promise<ListPromptsResult>;
/**
 * Handle prompts/get request
 */
export declare function handlePromptGet(name: string, args: Record<string, any> | undefined, context: ToolContext): Promise<GetPromptResult>;
//# sourceMappingURL=index.d.ts.map