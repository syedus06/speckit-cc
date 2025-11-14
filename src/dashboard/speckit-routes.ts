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
    this.registerContractsRoutes();
  }

  private registerFileRoutes() {
    const self = this;

    // List all features with status
    this.app.get('/api/projects/:projectId/speckit/specs/list', async (request: any, reply: any) => {
      const { projectId } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);

        // Enhance features with file existence checks and task progress
        const enhancedFeatures = await Promise.all(
          features.map(async (feature) => {
            const hasSpec = existsSync(join(feature.directoryPath, 'spec.md'));
            const hasPlan = existsSync(join(feature.directoryPath, 'plan.md'));
            const hasTasks = existsSync(join(feature.directoryPath, 'tasks.md'));
            const hasResearch = existsSync(join(feature.directoryPath, 'research.md'));
            const hasDataModel = existsSync(join(feature.directoryPath, 'data-model.md'));
            const hasContracts = existsSync(join(feature.directoryPath, 'contracts'));

            let taskProgress = undefined;
            if (hasTasks) {
              try {
                const tasksContent = await readFile(join(feature.directoryPath, 'tasks.md'), 'utf-8');
                const lines = tasksContent.split('\n');
                const taskLines = lines.filter(line => line.match(/^-\s*\[(x| |X)\]/i));
                const total = taskLines.length;
                const completed = taskLines.filter(line => line.match(/\[(x|X)\]/i)).length;
                const percentage = total > 0 ? (completed / total) * 100 : 0;

                taskProgress = { total, completed, percentage };
              } catch (error) {
                console.error(`Error reading tasks for ${feature.featureNumber}:`, error);
              }
            }

            return {
              ...feature,
              hasSpec,
              hasPlan,
              hasTasks,
              hasResearch,
              hasDataModel,
              hasContracts,
              taskProgress
            };
          })
        );

        // Calculate next number
        const numbers = features
          .map(f => parseInt(f.featureNumber, 10))
          .filter(n => !isNaN(n));
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        const nextNumberStr = String(nextNumber).padStart(3, '0');

        return {
          features: enhancedFeatures,
          nextNumber: nextNumberStr,
          count: enhancedFeatures.length
        };
      } catch (error: any) {
        console.error(`Error listing features: ${error.message}`);
        return reply.code(500).send({ error: `Failed to list features: ${error.message}` });
      }
    });

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

    // Clarify command - Generate targeted questions
    this.app.post('/api/projects/:projectId/speckit/workflows/clarify/generate', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { featureNumber } = request.body as { featureNumber: string };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        // Read existing spec if available
        const specPath = join(feature.directoryPath, 'spec.md');
        let specContent = '';
        if (existsSync(specPath)) {
          specContent = await readFile(specPath, 'utf-8');
        }

        // Generate questions based on 9 taxonomies
        const questionTaxonomies = [
          {
            category: 'Functional',
            icon: '⚙️',
            questions: [
              'What are the core features and capabilities this should provide?',
              'What actions should users be able to perform?',
              'What workflows need to be supported?',
              'Are there any edge cases or special scenarios to handle?'
            ]
          },
          {
            category: 'Technical',
            icon: '🔧',
            questions: [
              'What technologies, frameworks, or libraries should be used?',
              'Are there any existing systems this needs to integrate with?',
              'What are the technical constraints or requirements?',
              'Should this follow any specific architectural patterns?'
            ]
          },
          {
            category: 'UX/UI',
            icon: '🎨',
            questions: [
              'What should the user interface look like?',
              'What is the expected user flow?',
              'Are there any accessibility requirements?',
              'Should it work on mobile, desktop, or both?'
            ]
          },
          {
            category: 'Business',
            icon: '💼',
            questions: [
              'What business problem does this solve?',
              'Who are the target users or stakeholders?',
              'What is the expected timeline or deadline?',
              'Are there any budget or resource constraints?'
            ]
          },
          {
            category: 'Security',
            icon: '🔒',
            questions: [
              'What authentication/authorization is required?',
              'What sensitive data needs protection?',
              'Are there any compliance requirements (GDPR, HIPAA, etc.)?',
              'What are the potential security risks?'
            ]
          },
          {
            category: 'Performance',
            icon: '⚡',
            questions: [
              'What are the expected load/traffic levels?',
              'What response time is acceptable?',
              'Are there any scalability requirements?',
              'Should caching be implemented?'
            ]
          },
          {
            category: 'Data',
            icon: '💾',
            questions: [
              'What data needs to be stored?',
              'What is the data schema/structure?',
              'How should data be validated?',
              'What are the data retention requirements?'
            ]
          },
          {
            category: 'Integration',
            icon: '🔗',
            questions: [
              'What external services or APIs will this use?',
              'What data needs to be exchanged with other systems?',
              'Are there any webhook or event requirements?',
              'What error handling is needed for integrations?'
            ]
          },
          {
            category: 'Testing',
            icon: '✅',
            questions: [
              'What are the key test scenarios?',
              'What edge cases should be tested?',
              'What is the acceptance criteria?',
              'Are there any performance benchmarks to meet?'
            ]
          }
        ];

        // Filter out questions that might already be answered in spec
        const relevantQuestions = questionTaxonomies.map(taxonomy => {
          // Simple heuristic: if category is mentioned in spec, reduce questions
          const categoryMentioned = specContent.toLowerCase().includes(taxonomy.category.toLowerCase());

          return {
            ...taxonomy,
            questions: categoryMentioned
              ? taxonomy.questions.slice(0, 2) // Show fewer questions if already covered
              : taxonomy.questions
          };
        });

        return {
          featureNumber,
          featureName: feature.shortName,
          taxonomies: relevantQuestions,
          specExists: existsSync(specPath),
          totalQuestions: relevantQuestions.reduce((sum, t) => sum + t.questions.length, 0)
        };
      } catch (error: any) {
        console.error(`Error generating clarification questions: ${error.message}`);
        return reply.code(500).send({ error: `Failed to generate questions: ${error.message}` });
      }
    });

    // Clarify command - Save answers and update spec
    this.app.post('/api/projects/:projectId/speckit/workflows/clarify/submit', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { featureNumber, answers } = request.body as {
        featureNumber: string;
        answers: Record<string, Record<string, string>>; // { category: { question: answer } }
      };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        // Read existing spec
        const specPath = join(feature.directoryPath, 'spec.md');
        let specContent = '';
        if (existsSync(specPath)) {
          specContent = await readFile(specPath, 'utf-8');
        }

        // Append clarifications to spec
        let clarificationSection = '\n\n## Clarifications\n\n';
        clarificationSection += `> Answers collected: ${new Date().toISOString().split('T')[0]}\n\n`;

        for (const [category, categoryAnswers] of Object.entries(answers)) {
          const answeredQuestions = Object.entries(categoryAnswers).filter(([_, answer]) => answer.trim());

          if (answeredQuestions.length > 0) {
            clarificationSection += `### ${category}\n\n`;

            for (const [question, answer] of answeredQuestions) {
              clarificationSection += `**Q:** ${question}\n\n`;
              clarificationSection += `**A:** ${answer}\n\n`;
            }
          }
        }

        // Remove old clarifications section if exists
        specContent = specContent.replace(/\n## Clarifications\n[\s\S]*?(?=\n##|\Z)/, '');

        // Append new clarifications
        const updatedContent = specContent + clarificationSection;

        await writeFile(specPath, updatedContent, 'utf-8');

        return {
          success: true,
          message: 'Clarifications saved to spec.md',
          filePath: specPath,
          answersCount: Object.values(answers).reduce((sum, cat) =>
            sum + Object.values(cat).filter(a => a.trim()).length, 0
          )
        };
      } catch (error: any) {
        console.error(`Error saving clarifications: ${error.message}`);
        return reply.code(500).send({ error: `Failed to save clarifications: ${error.message}` });
      }
    });

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

    // Get constitution template
    const getConstitutionTemplate = () => {
      return `# Project Constitution

> Version: 1.0.0 (MAJOR.MINOR.PATCH)
> Last Updated: ${new Date().toISOString().split('T')[0]}

This document establishes the foundational principles governing this project's development. All specifications, plans, and implementations must align with these constitutional articles.

---

## Article I: Library-First Principle

> **Every feature in this project MUST begin its existence as a standalone library.**

No feature shall be implemented directly within application code without first being abstracted into a reusable library component. This ensures modularity, testability, and reusability across the ecosystem.

**Rationale**: Enforces separation of concerns and prevents tight coupling.

**Violations**: Require MAJOR version bump with documented justification.

---

## Article II: CLI Interface Mandate

> **All libraries must expose functionality through command-line interfaces.**

Libraries shall accept text input and produce text output (including JSON for structured data). This enables universal integration and testing without UI dependencies.

**Rationale**: CLI interfaces are universal, scriptable, and testable.

**Violations**: Require approval with alternative interface documentation.

---

## Article III: Test-First Imperative (NON-NEGOTIABLE)

> **All implementation MUST follow strict Test-Driven Development (TDD).**

No implementation code shall be written before:
1. Unit tests are written
2. Tests are validated and approved
3. Tests confirmed to FAIL (proving they test something)

**Rationale**: TDD catches bugs early and ensures code meets requirements.

**Violations**: BLOCKED. No exceptions. Implementation without tests is rejected.

---

## Article IV: Integration-First Testing

> **Tests use realistic environments over mocks.**

- Real databases over mocks
- Actual service instances over stubs
- Contract tests mandatory before implementation
- Integration tests run in CI/CD

**Rationale**: Mocks hide integration issues. Real environments catch real problems.

**Violations**: Require documentation of why mocks are necessary (e.g., external paid APIs).

---

## Article V: Simplicity Constraint

> **Implementation limited to maximum 3 projects initially.**

Start simple. Additional complexity requires documented justification showing why simplicity won't work.

**Rationale**: Premature complexity is the root of all evil.

**Violations**: Require MINOR version bump with complexity justification.

---

## Article VI: Anti-Abstraction Rule

> **Frameworks used directly rather than wrapped.**

No unnecessary abstraction layers. Use frameworks and libraries as designed by their creators. Don't wrap them "just in case."

**Rationale**: Abstractions add cognitive load and maintenance burden.

**Violations**: Require documented rationale for abstraction necessity.

---

## Article VII: Versioning & Observability

> **All libraries must include versioning and observability from day one.**

- Semantic versioning (MAJOR.MINOR.PATCH)
- Logging at appropriate levels (INFO, WARN, ERROR)
- Metrics for key operations
- Health check endpoints

**Rationale**: Production readiness from the start.

**Violations**: Implementation blocked until observability added.

---

## Article VIII: Documentation Mandate

> **All code must be documented inline.**

No external documentation without code comments. Docs should live next to the code they describe.

- Public APIs: JSDoc/TSDoc comments
- Complex logic: Inline explanations
- Architecture: README in code directory

**Rationale**: Documentation rots when separated from code.

**Violations**: Code review rejection until documented.

---

## Article IX: Constitutional Supremacy

> **This Constitution supersedes all other practices and guidelines.**

Amendments require:
1. Written proposal with rationale
2. Impact analysis on existing code
3. Team approval
4. Migration plan for affected code

**Semantic Versioning for Constitution**:
- **MAJOR**: Changes to non-negotiable articles (I, III, IX)
- **MINOR**: Changes to recommended articles (II, IV, V, VI, VII, VIII)
- **PATCH**: Clarifications without meaning change

---

## Custom Articles

Add project-specific articles below. Number them X, XI, XII, etc.

### Article X: [Your Custom Rule]

> **[State your principle]**

[Describe the rule and its rationale]

---

## Amendment Log

| Version | Date | Changes | Rationale |
|---------|------|---------|-----------|
| 1.0.0   | ${new Date().toISOString().split('T')[0]} | Initial constitution | Project setup |

---

## Compliance Validation

All specs, plans, and tasks must pass constitutional compliance checking:
- ✓ Article I: Library-first architecture
- ✓ Article II: CLI interfaces defined
- ✓ Article III: Tests written before implementation
- ✓ Article IV: Integration tests included
- ✓ Article V: Complexity justified
- ✓ Article VI: Direct framework usage
- ✓ Article VII: Versioning & observability
- ✓ Article VIII: Inline documentation
- ✓ Article IX: Constitutional alignment
`;
    };

    // Get or initialize constitution
    this.app.get('/api/projects/:projectId/speckit/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const memoryDir = join(project.projectPath, 'memory');
        const constitutionPath = join(memoryDir, 'constitution.md');

        // If constitution doesn't exist, return template
        if (!existsSync(constitutionPath)) {
          return {
            content: getConstitutionTemplate(),
            filePath: constitutionPath,
            exists: false,
            version: '1.0.0'
          };
        }

        const content = await readFile(constitutionPath, 'utf-8');

        // Extract version from content
        const versionMatch = content.match(/Version:\s*(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '1.0.0';

        return {
          content,
          filePath: constitutionPath,
          exists: true,
          version
        };
      } catch (error: any) {
        console.error(`Error reading constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to read constitution: ${error.message}` });
      }
    });

    // Initialize constitution
    this.app.post('/api/projects/:projectId/speckit/constitution/init', async (request: any, reply: any) => {
      const { projectId } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const memoryDir = join(project.projectPath, 'memory');
        const constitutionPath = join(memoryDir, 'constitution.md');

        // Check if already exists
        if (existsSync(constitutionPath)) {
          return reply.code(400).send({ error: 'Constitution already exists. Use PUT to update.' });
        }

        // Create memory directory and write template
        await mkdir(memoryDir, { recursive: true });
        const template = getConstitutionTemplate();
        await writeFile(constitutionPath, template, 'utf-8');

        return {
          success: true,
          message: 'Constitution initialized',
          filePath: constitutionPath,
          version: '1.0.0'
        };
      } catch (error: any) {
        console.error(`Error initializing constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to initialize constitution: ${error.message}` });
      }
    });

    // Update constitution
    this.app.put('/api/projects/:projectId/speckit/constitution', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { content, versionBump, rationale } = request.body as {
        content: string;
        versionBump?: 'major' | 'minor' | 'patch';
        rationale?: string;
      };

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

        // Extract current version
        let currentVersion = '1.0.0';
        if (existsSync(constitutionPath)) {
          const oldContent = await readFile(constitutionPath, 'utf-8');
          const versionMatch = oldContent.match(/Version:\s*(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            currentVersion = versionMatch[1];
          }
        }

        // Calculate new version if bump specified
        let newVersion = currentVersion;
        if (versionBump) {
          const [major, minor, patch] = currentVersion.split('.').map(Number);
          if (versionBump === 'major') {
            newVersion = `${major + 1}.0.0`;
          } else if (versionBump === 'minor') {
            newVersion = `${major}.${minor + 1}.0`;
          } else if (versionBump === 'patch') {
            newVersion = `${major}.${minor}.${patch + 1}`;
          }
        }

        // Update version in content
        let updatedContent = content.replace(
          /Version:\s*\d+\.\d+\.\d+/,
          `Version: ${newVersion}`
        );

        // Update last modified date
        updatedContent = updatedContent.replace(
          /Last Updated:\s*\d{4}-\d{2}-\d{2}/,
          `Last Updated: ${new Date().toISOString().split('T')[0]}`
        );

        // Add to amendment log if rationale provided
        if (rationale && versionBump) {
          const amendmentEntry = `| ${newVersion}   | ${new Date().toISOString().split('T')[0]} | ${versionBump.toUpperCase()} version bump | ${rationale} |`;
          updatedContent = updatedContent.replace(
            /(## Amendment Log\s*\n\s*\|[^\n]+\|\n\|[^\n]+\|)/,
            `$1\n${amendmentEntry}`
          );
        }

        await writeFile(constitutionPath, updatedContent, 'utf-8');

        return {
          success: true,
          message: 'Constitution updated successfully',
          filePath: constitutionPath,
          oldVersion: currentVersion,
          newVersion,
          versionBump
        };
      } catch (error: any) {
        console.error(`Error updating constitution: ${error.message}`);
        return reply.code(500).send({ error: `Failed to update constitution: ${error.message}` });
      }
    });

    // Validate compliance
    this.app.post('/api/projects/:projectId/speckit/constitution/validate', async (request: any, reply: any) => {
      const { projectId } = request.params;
      const { featureNumber } = request.body as { featureNumber: string };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Check if constitution exists
        const constitutionPath = join(project.projectPath, 'memory', 'constitution.md');
        if (!existsSync(constitutionPath)) {
          return reply.code(400).send({
            error: 'Constitution not found. Initialize it first.',
            compliant: false
          });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        // Basic compliance checks
        const checks = {
          hasSpec: existsSync(join(feature.directoryPath, 'spec.md')),
          hasPlan: existsSync(join(feature.directoryPath, 'plan.md')),
          hasTasks: existsSync(join(feature.directoryPath, 'tasks.md')),
          hasTests: false, // TODO: Check for test files
          hasDocumentation: existsSync(join(feature.directoryPath, 'README.md')),
          hasContracts: existsSync(join(feature.directoryPath, 'contracts'))
        };

        const violations = [];
        const warnings = [];

        if (!checks.hasTasks) {
          violations.push({
            article: 'III',
            severity: 'CRITICAL',
            message: 'No tasks.md found. TDD requires task breakdown before implementation.'
          });
        }

        if (!checks.hasPlan) {
          warnings.push({
            article: 'II',
            severity: 'HIGH',
            message: 'No plan.md found. Architecture should be planned.'
          });
        }

        if (!checks.hasDocumentation) {
          violations.push({
            article: 'VIII',
            severity: 'HIGH',
            message: 'No README.md found. Documentation is mandatory.'
          });
        }

        const compliant = violations.length === 0;

        return {
          compliant,
          checks,
          violations,
          warnings,
          summary: {
            total: Object.keys(checks).length,
            passed: Object.values(checks).filter(Boolean).length,
            failed: Object.values(checks).filter(v => !v).length
          }
        };
      } catch (error: any) {
        console.error(`Error validating compliance: ${error.message}`);
        return reply.code(500).send({ error: `Failed to validate compliance: ${error.message}` });
      }
    });
  }

  private registerContractsRoutes() {
    const self = this;

    // Contract templates
    const getContractTemplate = (type: 'api' | 'event' | 'schema') => {
      const templates = {
        api: `# API Contract: [Endpoint Name]

> Contract for REST API endpoint
> Version: 1.0.0
> Last Updated: ${new Date().toISOString().split('T')[0]}

## Endpoint Details

- **Method**: \`GET\` | \`POST\` | \`PUT\` | \`DELETE\`
- **Path**: \`/api/v1/resource\`
- **Authentication**: Required | Optional | None
- **Rate Limit**: X requests per minute

## Request

### Headers
\`\`\`json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
\`\`\`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource identifier |
| \`limit\` | number | No | Result limit (default: 20) |

### Request Body
\`\`\`json
{
  "name": "string",
  "description": "string",
  "metadata": {}
}
\`\`\`

## Response

### Success Response (200)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "createdAt": "ISO8601 timestamp"
  }
}
\`\`\`

### Error Responses

#### 400 Bad Request
\`\`\`json
{
  "success": false,
  "error": "Invalid input parameters"
}
\`\`\`

#### 401 Unauthorized
\`\`\`json
{
  "success": false,
  "error": "Authentication required"
}
\`\`\`

#### 404 Not Found
\`\`\`json
{
  "success": false,
  "error": "Resource not found"
}
\`\`\`

## Validation Rules

- \`name\`: 3-100 characters, alphanumeric + spaces
- \`description\`: Max 500 characters
- \`metadata\`: Valid JSON object

## Examples

### cURL Example
\`\`\`bash
curl -X POST https://api.example.com/api/v1/resource \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"name": "Example", "description": "Test resource"}'
\`\`\`

### JavaScript Example
\`\`\`javascript
const response = await fetch('/api/v1/resource', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Example',
    description: 'Test resource'
  })
});
\`\`\`

## Testing Checklist

- [ ] Validate all required parameters
- [ ] Test with missing optional parameters
- [ ] Verify authentication/authorization
- [ ] Test rate limiting behavior
- [ ] Validate error responses
- [ ] Check response schema compliance
`,
        event: `# Event Contract: [Event Name]

> Contract for asynchronous event
> Version: 1.0.0
> Last Updated: ${new Date().toISOString().split('T')[0]}

## Event Details

- **Event Name**: \`user.created\`
- **Topic/Channel**: \`users\`
- **Type**: Domain Event | Integration Event | System Event
- **Guaranteed Delivery**: Yes | No
- **Order Guarantee**: Yes | No

## Event Schema

### Envelope
\`\`\`json
{
  "eventId": "uuid-v4",
  "eventType": "user.created",
  "timestamp": "ISO8601 timestamp",
  "version": "1.0.0",
  "source": "user-service",
  "data": {}
}
\`\`\`

### Payload
\`\`\`json
{
  "userId": "string (uuid)",
  "email": "string (email format)",
  "username": "string",
  "createdAt": "ISO8601 timestamp",
  "metadata": {
    "ipAddress": "string",
    "userAgent": "string"
  }
}
\`\`\`

## Event Producers

- **Service**: user-service
- **Trigger**: User registration completed
- **Frequency**: On-demand

## Event Consumers

| Consumer | Purpose | SLA |
|----------|---------|-----|
| notification-service | Send welcome email | < 5 minutes |
| analytics-service | Track user metrics | Best effort |
| audit-service | Log user creation | < 1 minute |

## Retry Policy

- **Max Retries**: 3
- **Backoff Strategy**: Exponential (2s, 4s, 8s)
- **Dead Letter Queue**: Yes

## Validation Rules

- \`userId\`: Valid UUID v4
- \`email\`: Valid email format, max 255 chars
- \`username\`: 3-30 characters, alphanumeric + underscore

## Example Event
\`\`\`json
{
  "eventId": "123e4567-e89b-12d3-a456-426614174000",
  "eventType": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "source": "user-service",
  "data": {
    "userId": "987e6543-e21b-12d3-a456-426614174999",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00Z",
    "metadata": {
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
\`\`\`

## Testing Checklist

- [ ] Validate event schema
- [ ] Test all consumers receive event
- [ ] Verify retry mechanism
- [ ] Test dead letter queue
- [ ] Validate event ordering (if required)
- [ ] Test idempotency handling
`,
        schema: `# JSON Schema: [Schema Name]

> JSON Schema definition
> Version: 1.0.0
> Last Updated: ${new Date().toISOString().split('T')[0]}

## Schema Definition

\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/schemas/resource.json",
  "title": "Resource",
  "description": "Represents a resource entity",
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier"
    },
    "name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 100,
      "description": "Resource name"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Optional description"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive", "pending"],
      "default": "pending",
      "description": "Resource status"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true,
      "description": "Flexible metadata object"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  },
  "additionalProperties": false
}
\`\`\`

## Valid Example
\`\`\`json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Example Resource",
  "description": "This is an example",
  "status": "active",
  "metadata": {
    "category": "test",
    "priority": 1
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
\`\`\`

## Invalid Examples

### Missing Required Field
\`\`\`json
{
  "description": "Missing id and name"
}
\`\`\`

### Invalid Type
\`\`\`json
{
  "id": 12345,  // Should be string
  "name": "Example"
}
\`\`\`

### Invalid Enum Value
\`\`\`json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Example",
  "status": "invalid"  // Not in enum
}
\`\`\`

## Validation Notes

- All timestamps must be in ISO 8601 format
- UUIDs must be valid v4 format
- Additional properties not allowed at root level
- Metadata object allows flexible structure

## Usage

### TypeScript Interface
\`\`\`typescript
interface Resource {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Validation Example (JavaScript)
\`\`\`javascript
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(schema);

const data = { /* your data */ };
const valid = validate(data);

if (!valid) {
  console.log(validate.errors);
}
\`\`\`
`
      };
      return templates[type];
    };

    // List contracts for a feature
    this.app.get('/api/projects/:projectId/speckit/specs/:featureNumber/contracts', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        const contractsDir = join(feature.directoryPath, 'contracts');

        if (!existsSync(contractsDir)) {
          return { contracts: [] };
        }

        const entries = await readdir(contractsDir, { withFileTypes: true });
        const contracts = [];

        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const filePath = join(contractsDir, entry.name);
            const content = await readFile(filePath, 'utf-8');

            // Extract contract type and version from content
            const versionMatch = content.match(/Version:\s*(\d+\.\d+\.\d+)/);
            const typeMatch = content.match(/Contract for (.*)/i);

            contracts.push({
              name: entry.name,
              fileName: entry.name.replace('.md', ''),
              filePath,
              type: typeMatch ? typeMatch[1].toLowerCase() : 'unknown',
              version: versionMatch ? versionMatch[1] : '1.0.0',
              size: (await stat(filePath)).size
            });
          }
        }

        return { contracts };
      } catch (error: any) {
        console.error(`Error listing contracts: ${error.message}`);
        return reply.code(500).send({ error: `Failed to list contracts: ${error.message}` });
      }
    });

    // Get a specific contract
    this.app.get('/api/projects/:projectId/speckit/specs/:featureNumber/contracts/:contractName', async (request: any, reply: any) => {
      const { projectId, featureNumber, contractName } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        const contractPath = join(feature.directoryPath, 'contracts', `${contractName}.md`);

        if (!existsSync(contractPath)) {
          return reply.code(404).send({ error: 'Contract not found' });
        }

        const content = await readFile(contractPath, 'utf-8');

        // Extract metadata
        const versionMatch = content.match(/Version:\s*(\d+\.\d+\.\d+)/);
        const typeMatch = content.match(/Contract for (.*)/i);

        return {
          name: `${contractName}.md`,
          fileName: contractName,
          content,
          type: typeMatch ? typeMatch[1].toLowerCase() : 'unknown',
          version: versionMatch ? versionMatch[1] : '1.0.0',
          filePath: contractPath
        };
      } catch (error: any) {
        console.error(`Error reading contract: ${error.message}`);
        return reply.code(500).send({ error: `Failed to read contract: ${error.message}` });
      }
    });

    // Create or update a contract
    this.app.put('/api/projects/:projectId/speckit/specs/:featureNumber/contracts/:contractName', async (request: any, reply: any) => {
      const { projectId, featureNumber, contractName } = request.params;
      const { content, contractType } = request.body as { content?: string; contractType?: 'api' | 'event' | 'schema' };

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        const contractsDir = join(feature.directoryPath, 'contracts');
        await mkdir(contractsDir, { recursive: true });

        const contractPath = join(contractsDir, `${contractName}.md`);

        // If no content provided but contractType specified, use template
        let finalContent = content;
        if (!content && contractType) {
          finalContent = getContractTemplate(contractType);
        }

        if (!finalContent) {
          return reply.code(400).send({ error: 'Either content or contractType must be provided' });
        }

        await writeFile(contractPath, finalContent, 'utf-8');

        return {
          success: true,
          message: 'Contract saved successfully',
          filePath: contractPath,
          name: `${contractName}.md`
        };
      } catch (error: any) {
        console.error(`Error saving contract: ${error.message}`);
        return reply.code(500).send({ error: `Failed to save contract: ${error.message}` });
      }
    });

    // Delete a contract
    this.app.delete('/api/projects/:projectId/speckit/specs/:featureNumber/contracts/:contractName', async (request: any, reply: any) => {
      const { projectId, featureNumber, contractName } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const features = await self.getSpecKitFeatures(project.projectPath);
        const feature = features.find(f => f.featureNumber === featureNumber);

        if (!feature) {
          return reply.code(404).send({ error: 'Feature not found' });
        }

        const contractPath = join(feature.directoryPath, 'contracts', `${contractName}.md`);

        if (!existsSync(contractPath)) {
          return reply.code(404).send({ error: 'Contract not found' });
        }

        const { unlink } = await import('fs/promises');
        await unlink(contractPath);

        return {
          success: true,
          message: 'Contract deleted successfully'
        };
      } catch (error: any) {
        console.error(`Error deleting contract: ${error.message}`);
        return reply.code(500).send({ error: `Failed to delete contract: ${error.message}` });
      }
    });

    // Get contract templates
    this.app.get('/api/projects/:projectId/speckit/contracts/templates', async (request: any, reply: any) => {
      const { projectId } = request.params;

      try {
        const project = self.projectManager.getProject(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        return {
          templates: [
            {
              type: 'api',
              name: 'API Endpoint Contract',
              description: 'REST API endpoint specification with request/response schemas',
              template: getContractTemplate('api')
            },
            {
              type: 'event',
              name: 'Event Contract',
              description: 'Asynchronous event schema with producers and consumers',
              template: getContractTemplate('event')
            },
            {
              type: 'schema',
              name: 'JSON Schema',
              description: 'JSON Schema definition for data validation',
              template: getContractTemplate('schema')
            }
          ]
        };
      } catch (error: any) {
        console.error(`Error getting contract templates: ${error.message}`);
        return reply.code(500).send({ error: `Failed to get contract templates: ${error.message}` });
      }
    });
  }
}
