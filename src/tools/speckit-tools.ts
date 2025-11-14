import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';
import { SpecKitParser } from '../core/parser.js';
import { ProjectRegistry } from '../core/project-registry.js';

export const getSpeckitAgentsTool: Tool = {
  name: 'get_speckit_agents',
  description: `Get AI agents and their available slash commands for a spec-kit project.

# Instructions
Call to retrieve the list of AI agents configured in a spec-kit project, including their available slash commands. Shows which AI assistants (Claude, Codex, Gemini, Cursor, etc.) are configured and what workflow commands each supports.`,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Unique identifier of the spec-kit project'
      }
    },
    required: ['projectId']
  }
};

export const getSpeckitConstitutionTool: Tool = {
  name: 'get_speckit_constitution',
  description: 'Retrieve the constitution document for a spec-kit project, including version and principle count',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The unique identifier of the spec-kit project'
      }
    },
    required: ['projectId']
  }
};

export const getSpeckitTemplatesTool: Tool = {
  name: 'get_speckit_templates',
  description: 'Retrieve the list of templates available in a spec-kit project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The unique identifier of the spec-kit project'
      }
    },
    required: ['projectId']
  }
};

export const getSpeckitScriptsTool: Tool = {
  name: 'get_speckit_scripts',
  description: 'Retrieve the list of helper scripts available in a spec-kit project',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The unique identifier of the spec-kit project'
      }
    },
    required: ['projectId']
  }
};

export const getSpeckitProjectsTool: Tool = {
  name: 'get_speckit_projects',
  description: 'List all spec-kit projects registered in the system',
  inputSchema: {
    type: 'object',
    properties: {
      includeDetails: {
        type: 'boolean',
        description: 'Include full project details (agents, specs, etc.)',
        default: false
      }
    }
  }
};

export const scanSpeckitRootTool: Tool = {
  name: 'scan_speckit_root',
  description: 'Trigger a scan of the configured root directory for spec-kit projects',
  inputSchema: {
    type: 'object',
    properties: {
      force: {
        type: 'boolean',
        description: 'Force rescan even if recently scanned',
        default: false
      }
    }
  }
};

export async function getSpeckitAgentsHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { projectId } = args;

  if (!projectId) {
    return {
      success: false,
      message: 'Project ID is required'
    };
  }

  try {
    // Resolve project path from projectId using the project registry
    const registry = new ProjectRegistry();
    const projectEntry = await registry.getProjectById(projectId);

    if (!projectEntry) {
      return {
        success: false,
        message: `Project with ID '${projectId}' not found in registry`,
        nextSteps: [
          'Verify the project ID is correct',
          'Check if the project is registered in the global registry',
          'Use project scanning tools to register the project'
        ]
      };
    }

    const projectPath = projectEntry.projectPath;

    // Use SpecKitParser to get agents from the project
    const parser = new SpecKitParser(projectPath);
    const agents = await parser.discoverAIAgents();

    return {
      success: true,
      message: `Found ${agents.length} AI agents in project '${projectEntry.projectName}'`,
      data: {
        projectId,
        projectPath,
        projectName: projectEntry.projectName,
        agents: agents.map(agent => ({
          agentId: agent.agentId,
          agentName: agent.agentName,
          folderPath: agent.folderPath,
          subdirectoryType: agent.subdirectoryType,
          commandCount: agent.commandCount,
          commands: agent.commands.map((cmd: any) => ({
            commandId: cmd.commandId,
            commandName: cmd.commandName,
            slashCommand: cmd.slashCommand,
            filePath: cmd.filePath,
            fileName: cmd.fileName,
            description: cmd.description,
            lastModified: cmd.lastModified
          })),
          lastUpdated: agent.lastUpdated
        }))
      },
      nextSteps: agents.length > 0 ? [
        'Use agent commands in your AI assistant',
        'Commands are available as slash commands (e.g., /speckit.analyze)',
        'Each command file contains specific instructions for that agent'
      ] : [
        'Create AI agent folders (e.g., .claude, .codex) in the project root',
        'Add commands/ or prompts/ subdirectories with speckit.*.md files',
        'Run agent discovery again to see available commands'
      ]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to get speckit agents: ${errorMessage}`,
      nextSteps: [
        'Verify the project exists and is accessible',
        'Check if the project contains AI agent folders (.claude, .codex, etc.)',
        'Ensure agent folders have commands/ or prompts/ subdirectories with speckit.*.md files'
      ]
    };
  }
}

export async function getSpeckitConstitutionHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { projectId } = args;

  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      message: 'projectId is required and must be a string'
    };
  }

  try {
    // Resolve project context from projectId using the project registry
    const registry = new ProjectRegistry();
    const project = registry.getProjectContext(projectId);

    if (!project) {
      return {
        success: false,
        message: `Project with ID '${projectId}' not found in registry`,
        nextSteps: [
          'Verify the project ID is correct',
          'Check if the project is registered in the global registry',
          'Use project scanning tools to register the project'
        ]
      };
    }

    if (project.projectType !== 'spec-kit') {
      return {
        success: false,
        message: `Project ${projectId} is not a spec-kit project`
      };
    }

    const parser = project.parser as SpecKitParser;
    const constitution = await parser.parseConstitution();

    if (!constitution) {
      return {
        success: false,
        message: 'Constitution not found for this project',
        nextSteps: [
          'Ensure the project has a .specify/memory/constitution.md file',
          'Check that the constitution file contains valid markdown content'
        ]
      };
    }

    return {
      success: true,
      message: `Successfully retrieved constitution for project ${projectId}`,
      data: constitution
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve constitution: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getSpeckitTemplatesHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { projectId } = args;

  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      message: 'projectId is required and must be a string'
    };
  }

  try {
    // Resolve project context from projectId using the project registry
    const registry = new ProjectRegistry();
    const project = registry.getProjectContext(projectId);

    if (!project) {
      return {
        success: false,
        message: `Project with ID '${projectId}' not found in registry`,
        nextSteps: [
          'Verify the project ID is correct',
          'Check if the project is registered in the global registry',
          'Use project scanning tools to register the project'
        ]
      };
    }

    if (project.projectType !== 'spec-kit') {
      return {
        success: false,
        message: `Project ${projectId} is not a spec-kit project`
      };
    }

    const parser = project.parser as SpecKitParser;
    const templates = await parser.getTemplates();

    return {
      success: true,
      message: `Successfully retrieved ${templates.length} templates for project ${projectId}`,
      data: { templates }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve templates: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getSpeckitScriptsHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { projectId } = args;

  if (!projectId || typeof projectId !== 'string') {
    return {
      success: false,
      message: 'projectId is required and must be a string'
    };
  }

  try {
    // Resolve project context from projectId using the project registry
    const registry = new ProjectRegistry();
    const project = registry.getProjectContext(projectId);

    if (!project) {
      return {
        success: false,
        message: `Project with ID '${projectId}' not found in registry`,
        nextSteps: [
          'Verify the project ID is correct',
          'Check if the project is registered in the global registry',
          'Use project scanning tools to register the project'
        ]
      };
    }

    if (project.projectType !== 'spec-kit') {
      return {
        success: false,
        message: `Project ${projectId} is not a spec-kit project`
      };
    }

    const parser = project.parser as SpecKitParser;
    const scripts = await parser.getScripts();

    return {
      success: true,
      message: `Successfully retrieved ${scripts.length} scripts for project ${projectId}`,
      data: { scripts }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve scripts: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getSpeckitProjectsHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { includeDetails = false } = args;

  try {
    const registry = new ProjectRegistry();
    const specKitProjects = registry.getProjectsByType('spec-kit');

    let projectData;
    if (includeDetails) {
      // Get full details for each project
      projectData = await Promise.all(
        specKitProjects.map(async (project) => {
          try {
            const parser = project.parser as SpecKitParser;
            const agents = await parser.discoverAIAgents();
            const specs = await parser.getSpecs();
            const constitution = await parser.parseConstitution();

            return {
              projectId: project.projectId,
              projectName: project.projectName,
              projectPath: project.projectPath,
              projectType: project.projectType,
              agentCount: agents.length,
              specCount: specs.length,
              hasConstitution: !!constitution,
              agents: agents.map((agent: any) => ({
                agentName: agent.agentName,
                commandCount: agent.commandCount,
                commands: agent.commands.map((cmd: any) => ({
                  commandName: cmd.commandName,
                  slashCommand: cmd.slashCommand
                }))
              })),
              specs: specs.map((spec: any) => ({
                featureNumber: spec.featureNumber,
                featureName: spec.featureName,
                hasSpec: spec.hasSpec,
                hasPlan: spec.hasPlan,
                hasTasks: spec.hasTasks
              }))
            };
          } catch (error) {
            // Return basic info if detailed parsing fails
            return {
              projectId: project.projectId,
              projectName: project.projectName,
              projectPath: project.projectPath,
              projectType: project.projectType,
              agentCount: 0,
              specCount: 0,
              hasConstitution: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );
    } else {
      // Return summary only
      projectData = specKitProjects.map((project: any) => ({
        projectId: project.projectId,
        projectName: project.projectName,
        projectPath: project.projectPath,
        projectType: project.projectType,
        agentCount: (project as any).agentCount || 0,
        specCount: (project as any).specCount || 0,
        hasConstitution: (project as any).hasConstitution || false
      }));
    }

    return {
      success: true,
      message: `Found ${specKitProjects.length} spec-kit projects`,
      data: {
        projects: projectData
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get spec-kit projects: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function scanSpeckitRootHandler(args: any, context: ToolContext): Promise<ToolResponse> {
  const { force = false } = args;

  try {
    const registry = new ProjectRegistry();
    const startTime = Date.now();

    // Trigger scan
    await registry.scanRootDirectory();

    const endTime = Date.now();
    const scanDuration = endTime - startTime;

    // Get results
    const specKitProjects = registry.getProjectsByType('spec-kit');

    return {
      success: true,
      message: `Scan completed in ${scanDuration}ms, found ${specKitProjects.length} spec-kit projects`,
      data: {
        projectsFound: specKitProjects.length,
        scanDuration,
        errors: [] // TODO: collect actual errors from scan
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Scan failed: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        projectsFound: 0,
        scanDuration: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      }
    };
  }
}