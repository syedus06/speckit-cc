import { FastifyInstance } from 'fastify';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import type { SpecKitParser } from '../core/parser';
import type { ProjectRegistry } from '../core/project-registry';

interface SpecFileContent {
  fileName: string;
  content: string;
}

interface WorkflowExecutionRequest {
  command: string; // 'specify', 'plan', 'tasks', 'implement', 'clarify', 'constitution', 'analyze', 'checklist'
  args?: string;
  agentType?: string; // 'claude', 'cursor', 'copilot', etc.
}

export class SpecKitRoutes {
  constructor(
    private app: FastifyInstance,
    private projectRegistry: ProjectRegistry
  ) {
    this.registerRoutes();
  }

  private registerRoutes() {
    const self = this;

    // ==================== SPEC FILE CRUD OPERATIONS ====================

    // Get spec file content (spec.md, plan.md, tasks.md, etc.)
    this.app.get('/api/projects/:projectId/specs/:featureNumber/files/:fileName', async (request: any, reply: any) => {
      const { projectId, featureNumber, fileName } = request.params as { projectId: string; featureNumber: string; fileName: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const parser = project.parser as SpecKitParser;
        const specs = await parser.getSpecs();
        const spec = specs.find(s => s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        // Validate fileName to prevent directory traversal
        const allowedFiles = [
          'spec.md', 'plan.md', 'tasks.md', 'research.md',
          'data-model.md', 'quickstart.md', 'README.md'
        ];

        if (!allowedFiles.includes(fileName)) {
          return reply.code(400).send({ error: 'Invalid file name' });
        }

        const filePath = join(spec.directoryPath, fileName);

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

    // Update spec file content
    this.app.put('/api/projects/:projectId/specs/:featureNumber/files/:fileName', async (request: any, reply: any) => {
      const { projectId, featureNumber, fileName } = request.params as { projectId: string; featureNumber: string; fileName: string };
      const { content } = request.body as { content: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const parser = project.parser as SpecKitParser;
        const specs = await parser.getSpecs();
        const spec = specs.find(s => s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        // Validate fileName
        const allowedFiles = [
          'spec.md', 'plan.md', 'tasks.md', 'research.md',
          'data-model.md', 'quickstart.md', 'README.md'
        ];

        if (!allowedFiles.includes(fileName)) {   });
443

          return reply.code(400).send({ error: 'Invalid file name' });
        }

        const filePath = join(spec.directoryPath, fileName);
        await writeFile(filePath, content, 'utf-8');

        return { success: true, fileName, filePath };
      } catch (error: any) {
        console.error(`Error writing spec file: ${error.message}`);
        return reply.code(500).send({ error: `Failed to write file: ${error.message}` });
      }
    });

    // Create new spec (feature directory)
    this.app.post('/api/projects/:projectId/specs/new', async (request: any, reply: any) => {
      const { projectId } = request.params as { projectId: string };
      const { featureName, shortName } = request.body as { featureName: string; shortName: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const parser = project.parser as SpecKitParser;
        const specs = await parser.getSpecs();

        // Find next feature number
        const numbers = specs
          .map(s => parseInt(s.featureNumber, 10))
          .filter(n => !isNaN(n));
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        const featureNumber = String(nextNumber).padStart(3, '0');

        // Create directory name
        const directoryName = `${featureNumber}-${shortName}`;
        const directoryPath = join(project.projectPath, 'specs', directoryName);

        // Create spec directory
        await mkdir(directoryPath, { recursive: true });

        // Create subdirectories
        await mkdir(join(directoryPath, 'contracts'), { recursive: true });
        await mkdir(join(directoryPath, 'checklists'), { recursive: true });

        // Create empty spec.md
        const specTemplate = `# Feature: ${featureName}

## Overview

*Describe what this feature does and why it's needed.*

## User Stories

### User Story 1: [Name]

**As a** [user type]
**I want** [capability]
**So that** [benefit]

**Priority**: P1

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

## Functional Requirements

1. **Requirement 1**: Description
2. **Requirement 2**: Description

## Success Criteria

- **Criterion 1**: Measurable outcome
- **Criterion 2**: Measurable outcome

## Assumptions

- List any assumptions made

## Out of Scope

- List what is explicitly not included
`;

        await writeFile(join(directoryPath, 'spec.md'), specTemplate, 'utf-8');

        return {
          success: true,
          featureNumber,
          directoryName,
          directoryPath
        };
      } catch (error: any) {
        console.error(`Error creating spec: ${error.message}`);
        return reply.code(500).send({ error: `Failed to create spec: ${error.message}` });
      }
    });

    // Delete spec
    this.app.delete('/api/projects/:projectId/specs/:featureNumber', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params as { projectId: string; featureNumber: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const parser = project.parser as SpecKitParser;
        const specs = await parser.getSpecs();
        const spec = specs.find(s => s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        // Move to archive instead of deleting
        const archivePath = join(project.projectPath, 'specs', 'archive');
        await mkdir(archivePath, { recursive: true });

        const { spawn: spawnProcess } = await import('child_process');
        const mvProcess = spawnProcess('mv', [spec.directoryPath, archivePath], {
          cwd: project.projectPath
        });

        return new Promise((resolve, reject) => {
          mvProcess.on('close', (code) => {
            if (code === 0) {
              resolve({ success: true, archived: true });
            } else {
              reject(new Error(`Failed to archive spec (exit code ${code})`));
            }
          });
        });
      } catch (error: any) {
        console.error(`Error deleting spec: ${error.message}`);
        return reply.code(500).send({ error: `Failed to delete spec: ${error.message}` });
      }
    });

    // ==================== WORKFLOW EXECUTION ====================

    // Execute spec-kit workflow command
    this.app.post('/api/projects/:projectId/workflows/execute', async (request: any, reply: any) => {
      const { projectId } = request.params as { projectId: string };
      const { command, args, agentType } = request.body as WorkflowExecutionRequest;

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        // Validate command
        const validCommands = ['specify', 'plan', 'tasks', 'implement', 'clarify', 'constitution', 'analyze', 'checklist'];
        if (!validCommands.includes(command)) {
          return reply.code(400).send({ error: 'Invalid command' });
        }

        // Create a unique execution ID
        const executionId = `${projectId}-${command}-${Date.now()}`;

        // Stream will be handled via WebSocket
        // For now, return execution ID and let client listen for updates
        return {
          success: true,
          executionId,
          command,
          message: 'Command execution started. Listen for updates via WebSocket.'
        };
      } catch (error: any) {
        console.error(`Error executing workflow: ${error.message}`);
        return reply.code(500).send({ error: `Failed to execute workflow: ${error.message}` });
      }
    });

    // Get constitution content
    this.app.get('/api/projects/:projectId/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params as { projectId: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const parser = project.parser as SpecKitParser;
        const constitution = await parser.getConstitution();

        if (!constitution) {
          return reply.code(404).send({ error: 'Constitution not found' });
        }

        const constitutionPath = join(project.projectPath, 'memory', 'constitution.md');
        const content = await readFile(constitutionPath, 'utf-8');

        return {
          ...constitution,
          content,
          filePath: constitutionPath
        };
      } catch (error: any) {
        console.error(`Error reading constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to read constitution: ${error.message}` });
      }
    });

    // Update constitution content
    this.app.put('/api/projects/:projectId/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params as { projectId: string };
      const { content } = request.body as { content: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        if (project.projectType !== 'spec-kit') {
          return reply.code(400).send({ error: 'Project is not a spec-kit project' });
        }

        const constitutionPath = join(project.projectPath, 'memory', 'constitution.md');
        const constitutionDir = dirname(constitutionPath);

        // Ensure directory exists
        await mkdir(constitutionDir, { recursive: true });

        await writeFile(constitutionPath, content, 'utf-8');

        return { success: true, filePath: constitutionPath };
      } catch (error: any) {
        console.error(`Error updating constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to update constitution: ${error.message}` });
      }
    });
  }
}
