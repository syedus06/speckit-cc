import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { specWorkflowGuideTool, specWorkflowGuideHandler } from './spec-workflow-guide.js';
import { specStatusTool, specStatusHandler } from './spec-status.js';
import { steeringGuideTool, steeringGuideHandler } from './steering-guide.js';
import { approvalsTool, approvalsHandler } from './approvals.js';
import { logImplementationTool, logImplementationHandler } from './log-implementation.js';
import { getSpeckitAgentsTool, getSpeckitAgentsHandler, getSpeckitConstitutionTool, getSpeckitConstitutionHandler, getSpeckitTemplatesTool, getSpeckitTemplatesHandler, getSpeckitScriptsTool, getSpeckitScriptsHandler, getSpeckitProjectsTool, getSpeckitProjectsHandler, scanSpeckitRootTool, scanSpeckitRootHandler } from './speckit-tools.js';
import { ToolContext, ToolResponse, MCPToolResponse, toMCPResponse } from '../types.js';

export function registerTools(): Tool[] {
  return [
    specWorkflowGuideTool,
    steeringGuideTool,
    specStatusTool,
    approvalsTool,
    logImplementationTool,
    getSpeckitAgentsTool,
    getSpeckitConstitutionTool,
    getSpeckitTemplatesTool,
    getSpeckitScriptsTool,
    getSpeckitProjectsTool,
    scanSpeckitRootTool
  ];
}

export async function handleToolCall(name: string, args: any, context: ToolContext): Promise<MCPToolResponse> {
  let response: ToolResponse = { success: false, message: 'Unknown error' };
  let isError = false;

  try {
    switch (name) {
      case 'spec-workflow-guide':
        response = await specWorkflowGuideHandler(args, context);
        break;
      case 'steering-guide':
        response = await steeringGuideHandler(args, context);
        break;
      case 'spec-status':
        response = await specStatusHandler(args, context);
        break;
      case 'approvals':
        response = await approvalsHandler(args, context);
        break;
      case 'log-implementation':
        response = await logImplementationHandler(args, context);
        break;
      case 'get_speckit_agents':
        response = await getSpeckitAgentsHandler(args, context);
        break;
      case 'get_speckit_constitution':
        response = await getSpeckitConstitutionHandler(args, context);
        break;
      case 'get_speckit_templates':
        response = await getSpeckitTemplatesHandler(args, context);
        break;
      case 'get_speckit_scripts':
        response = await getSpeckitScriptsHandler(args, context);
        break;
      case 'get_speckit_projects':
        response = await getSpeckitProjectsHandler(args, context);
        break;
      case 'scan_speckit_root':
        response = await scanSpeckitRootHandler(args, context);
        break;
    }

    // Check if the response indicates an error
    isError = !response.success;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    response = {
      success: false,
      message: `Tool execution failed: ${errorMessage}`
    };
    isError = true;
  }

  return toMCPResponse(response, isError);
}