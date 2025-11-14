// Import individual prompt definitions
import { createSpecPrompt } from './create-spec.js';
import { createSteeringDocPrompt } from './create-steering-doc.js';
import { implementTaskPrompt } from './implement-task.js';
import { specStatusPrompt } from './spec-status.js';
import { injectSpecWorkflowGuidePrompt } from './inject-spec-workflow-guide.js';
import { injectSteeringGuidePrompt } from './inject-steering-guide.js';
import { refreshTasksPrompt } from './refresh-tasks.js';
// Registry of all prompts
const promptDefinitions = [
    createSpecPrompt,
    createSteeringDocPrompt,
    implementTaskPrompt,
    specStatusPrompt,
    injectSpecWorkflowGuidePrompt,
    injectSteeringGuidePrompt,
    refreshTasksPrompt
];
/**
 * Get all registered prompts
 */
export function registerPrompts() {
    return promptDefinitions.map(def => def.prompt);
}
/**
 * Handle prompts/list request
 */
export async function handlePromptList() {
    return {
        prompts: registerPrompts()
    };
}
/**
 * Handle prompts/get request
 */
export async function handlePromptGet(name, args = {}, context) {
    const promptDef = promptDefinitions.find(def => def.prompt.name === name);
    if (!promptDef) {
        throw new Error(`Prompt not found: ${name}`);
    }
    try {
        const messages = await promptDef.handler(args, context);
        return { messages };
    }
    catch (error) {
        throw new Error(`Failed to generate prompt messages: ${error.message}`);
    }
}
//# sourceMappingURL=index.js.map