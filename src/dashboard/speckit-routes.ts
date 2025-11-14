import { FastifyInstance } from 'fastify';
import { join } from 'path';
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { ProjectManager } from './project-manager.js';
import { readdir, stat } from 'fs/promises';

interface SpecKitFeature {
  featureNumber: string;
  shortName: string;
  directoryName: string;
  directoryPath: string;
}

export class SpecKitRoutes {
  private app: FastifyInstance;
  private projectManager: ProjectManager;

  constructor(app: FastifyInstance, projectManager: ProjectManager) {
    this.app = app;
    this.projectManager = projectManager;
  }

  // Helper method to get spec-kit features from a project
  private async getSpecKitFeatures(projectPath: string): Promise<SpecKitFeature[]> {
    const specsDir = join(projectPath, 'specs');
    if (!existsSync(specsDir)) {
      return [];
    }

    const entries = await readdir(specsDir, { withFileTypes: true });
    const features: SpecKitFeature[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        const match = entry.name.match(/^(\d+)-(.+)$/);
        if (match) {
          features.push({
            featureNumber: match[1],
            shortName: match[2],
            directoryName: entry.name,
            directoryPath: join(specsDir, entry.name)
          });
        }
      }
    }

    return features.sort((a, b) => a.featureNumber.localeCompare(b.featureNumber));
  }

  registerRoutes() {
    this.registerFileRoutes();
    this.registerWorkflowRoutes();
    this.registerConstitutionRoutes();
  }

  private registerFileRoutes() {
    const self = this;

    // Read spec file (spec.md, plan.md, tasks.md, etc.)
    this.app.get('/api/projects/:projectId/speckit/specs/:featureNumber/files/:fileName', async (request: any, reply: any) => {
      const { projectId, featureNumber, fileName } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature spec not found' });
        }

        // Validate fileName to prevent directory traversal
        const allowedFiles = [
          'spec.md', 'plan.md', 'tasks.md', 'research.md',
          'data-model.md', 'quickstart.md', 'README.md'
        ];

        if (!allowedFiles.includes(fileName)) {
          return reply.code(400).send({ error: 'Invalid file name' });
        }

        const filePath = join(feature.directoryPath, fileName);
        if (!existsSync(filePath)) {
          return reply.code(404).send({ error: 'File not found' });
        }

        const content = await readFile(filePath, 'utf-8');
        return { fileName, content, filePath };
      } catch (error: any) {
        console.error(`Error reading spec file: ${error.message}`);
        return reply.code(500).send({ error: `Failed to read file: ${error.message}` });
      }
    });

    // Update spec file
    this.app.put('/api/projects/:projectId/speckit/specs/:featureNumber/files/:fileName', async (request: any, reply: any) => {
      const { projectId, featureNumber, fileName } = request.params;
      const { content } = request.body as { content: string };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (typeof content !== 'string') {
          return reply.code(400).send({ error: 'Content must be a string' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature spec not found' });
        }

        // Validate fileName to prevent directory traversal
        const allowedFiles = [
          'spec.md', 'plan.md', 'tasks.md', 'research.md',
          'data-model.md', 'quickstart.md', 'README.md'
        ];

        if (!allowedFiles.includes(fileName)) {
          return reply.code(400).send({ error: 'Invalid file name' });
        }

        const filePath = join(feature.directoryPath, fileName);
        await writeFile(filePath, content, 'utf-8');

        return { success: true, message: `${fileName} updated successfully`, filePath };
      } catch (error: any) {
        console.error(`Error updating spec file: ${error.message}`);
        return reply.code(500).send({ error: `Failed to update file: ${error.message}` });
      }
    });

    // Create new feature spec
    this.app.post('/api/projects/:projectId/speckit/specs/new', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { featureName, shortName } = request.body as { featureName: string; shortName: string };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (!featureName || !shortName) {
          return reply.code(400).send({ error: 'featureName and shortName are required' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);

        // Find next feature number
        const numbers = features
          .map(f => parseInt(f.featureNumber, 10))
          .filter(n => !isNaN(n));
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        const featureNumber = String(nextNumber).padStart(3, '0');

        // Create directory and subdirectories
        const directoryName = `${featureNumber}-${shortName}`;
        const directoryPath = join(project.projectPath, 'specs', directoryName);
        await mkdir(directoryPath, { recursive: true });
        await mkdir(join(directoryPath, 'contracts'), { recursive: true });
        await mkdir(join(directoryPath, 'checklists'), { recursive: true });

        // Create spec.md from template
        const specTemplate = `# ${featureName}

## Overview
<!-- Brief description of the feature -->

## Goals
<!-- What are we trying to achieve? -->

## Non-Goals
<!-- What are we explicitly not doing? -->

## Requirements
<!-- Functional and non-functional requirements -->

## User Stories
<!-- User stories and use cases -->

## Technical Approach
<!-- High-level technical approach -->

## Success Criteria
<!-- How do we measure success? -->
`;

        await writeFile(join(directoryPath, 'spec.md'), specTemplate, 'utf-8');

        return { success: true, featureNumber, directoryName, directoryPath };
      } catch (error: any) {
        console.error(`Error creating new spec: ${error.message}`);
        return reply.code(500).send({ error: `Failed to create spec: ${error.message}` });
      }
    });

    // Archive/delete spec
    this.app.delete('/api/projects/:projectId/speckit/specs/:featureNumber', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature spec not found' });
        }

        // Archive instead of delete for safety
        const archiveDir = join(project.projectPath, 'specs', '_archived');
        await mkdir(archiveDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `${feature.directoryName}_archived_${timestamp}`;
        const archivePath = join(archiveDir, archiveName);

        await rename(feature.directoryPath, archivePath);

        return { success: true, message: `Spec ${featureNumber} archived successfully`, archivePath };
      } catch (error: any) {
        console.error(`Error archiving spec: ${error.message}`);
        return reply.code(500).send({ error: `Failed to archive spec: ${error.message}` });
      }
    });
  }

  private registerWorkflowRoutes() {
    const self = this;

    // Execute workflow command (specify, plan, tasks, implement, etc.)
    this.app.post('/api/projects/:projectId/speckit/workflows/execute', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { command, featureNumber, args } = request.body as {
        command: string;
        featureNumber?: string;
        args?: string[];
      };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Validate command
        const allowedCommands = [
          'constitution', 'specify', 'clarify', 'plan',
          'tasks', 'implement', 'analyze', 'checklist'
        ];

        if (!allowedCommands.includes(command)) {
          return reply.code(400).send({ error: 'Invalid command' });
        }

        // Generate execution ID for tracking
        const executionId = `${projectId}-${command}-${Date.now()}`;

        // Build command to execute
        // Find the spec-kit CLI in the project or use a generic approach
        const specKitPath = join(project.projectPath, '.bin', 'speckit');
        const cliCommand = existsSync(specKitPath) ? specKitPath : 'npx';
        const cliArgs = existsSync(specKitPath)
          ? [command, ...(featureNumber ? [featureNumber] : []), ...(args || [])]
          : ['@spec-kit/cli', command, ...(featureNumber ? [featureNumber] : []), ...(args || [])];

        // Execute command in the background
        const childProcess = spawn(cliCommand, cliArgs, {
          cwd: project.projectPath,
          env: { ...process.env, FORCE_COLOR: '0' },
          shell: true
        });

        // Store execution metadata
        const execution = {
          id: executionId,
          projectId,
          command,
          featureNumber,
          pid: childProcess.pid,
          startTime: new Date().toISOString(),
          status: 'running' as 'running' | 'completed' | 'failed',
          output: [] as string[],
          exitCode: null as number | null
        };

        // Capture stdout
        childProcess.stdout?.on('data', (data: Buffer) => {
          const text = data.toString();
          execution.output.push(text);

          // TODO: Broadcast to WebSocket clients subscribed to this execution
          console.log(`[${executionId}] stdout:`, text);
        });

        // Capture stderr
        childProcess.stderr?.on('data', (data: Buffer) => {
          const text = data.toString();
          execution.output.push(`[ERROR] ${text}`);

          // TODO: Broadcast to WebSocket clients subscribed to this execution
          console.error(`[${executionId}] stderr:`, text);
        });

        // Handle process completion
        childProcess.on('close', (code: number | null) => {
          execution.status = code === 0 ? 'completed' : 'failed';
          execution.exitCode = code;

          console.log(`[${executionId}] Process exited with code ${code}`);

          // TODO: Broadcast completion to WebSocket clients
        });

        // Handle process errors
        childProcess.on('error', (error: Error) => {
          execution.status = 'failed';
          execution.output.push(`[PROCESS ERROR] ${error.message}`);

          console.error(`[${executionId}] Process error:`, error);

          // TODO: Broadcast error to WebSocket clients
        });

        return {
          success: true,
          executionId,
          command,
          featureNumber,
          pid: childProcess.pid,
          message: 'Workflow execution started. Monitor progress via WebSocket.'
        };
      } catch (error: any) {
        console.error(`Error executing workflow: ${error.message}`);
        return reply.code(500).send({ error: `Failed to execute workflow: ${error.message}` });
      }
    });
  }

  private registerConstitutionRoutes() {
    const self = this;

    // Get constitution
    this.app.get('/api/projects/:projectId/speckit/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const constitutionPath = join(project.projectPath, 'memory', 'constitution.md');
        if (!existsSync(constitutionPath)) {
          return reply.code(404).send({ error: 'Constitution not found' });
        }

        const content = await readFile(constitutionPath, 'utf-8');
        return { content, filePath: constitutionPath };
      } catch (error: any) {
        console.error(`Error reading constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to read constitution: ${error.message}` });
      }
    });

    // Update constitution
    this.app.put('/api/projects/:projectId/speckit/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { content } = request.body as { content: string };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (typeof content !== 'string') {
          return reply.code(400).send({ error: 'Content must be a string' });
        }

        const memoryDir = join(project.projectPath, 'memory');
        await mkdir(memoryDir, { recursive: true });

        const constitutionPath = join(memoryDir, 'constitution.md');
        await writeFile(constitutionPath, content, 'utf-8');

        return { success: true, message: 'Constitution updated successfully', filePath: constitutionPath };
      } catch (error: any) {
        console.error(`Error updating constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to update constitution: ${error.message}` });
      }
    });
  }
}
