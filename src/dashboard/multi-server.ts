import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join, dirname, basename, resolve } from 'path';
import { readFile } from 'fs/promises';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import open from 'open';
import { WebSocket } from 'ws';
import { findAvailablePort, validateAndCheckPort } from './utils.js';
import { parseTasksFromMarkdown } from '../core/task-parser.js';
import { ProjectManager } from './project-manager.js';
import { JobScheduler } from './job-scheduler.js';
import { ImplementationLogManager } from './implementation-log-manager.js';
import { ProjectRegistry } from '../core/project-registry.js';
import { SpecKitParser } from '../core/parser.js';
import { DashboardSessionManager } from '../core/dashboard-session.js';
import { isWorkflowProject } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface WebSocketConnection {
  socket: WebSocket;
  projectId?: string;
}

export interface MultiDashboardOptions {
  autoOpen?: boolean;
  port?: number;
}

export class MultiProjectDashboardServer {
  private app: FastifyInstance;
  private projectManager: ProjectManager;
  private jobScheduler: JobScheduler;
  private sessionManager: DashboardSessionManager;
  private projectRegistry: ProjectRegistry;
  private options: MultiDashboardOptions;
  private actualPort: number = 0;
  private clients: Set<WebSocketConnection> = new Set();
  private packageVersion: string = 'unknown';

  constructor(options: MultiDashboardOptions = {}) {
    this.options = options;
    this.projectManager = new ProjectManager();
    this.jobScheduler = new JobScheduler(this.projectManager);
    this.sessionManager = new DashboardSessionManager();
    this.projectRegistry = new ProjectRegistry();
    this.projectRegistry.setServer(this);
    this.app = fastify({ logger: false });
  }

  async start() {
    // Fetch package version once at startup
    try {
      const response = await fetch('https://registry.npmjs.org/@pimzino/spec-workflow-mcp/latest');
      if (response.ok) {
        const packageInfo = await response.json() as { version?: string };
        this.packageVersion = packageInfo.version || 'unknown';
      }
    } catch {
      // Fallback to local package.json version if npm request fails
      try {
        const packageJsonPath = join(__dirname, '..', '..', 'package.json');
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent) as { version?: string };
        this.packageVersion = packageJson.version || 'unknown';
      } catch {
        // Keep default 'unknown' if both npm and local package.json fail
      }
    }

    // Initialize project manager
    await this.projectManager.initialize();

    // Initialize job scheduler
    await this.jobScheduler.initialize();

    // Register plugins
    await this.app.register(fastifyStatic, {
      root: join(__dirname, 'public'),
      prefix: '/',
    });

    await this.app.register(fastifyWebsocket);

    // WebSocket endpoint for real-time updates
    const self = this;
    await this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: WebSocketConnection, req) => {
        const socket = connection.socket;

        // Get projectId from query parameter
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const projectId = url.searchParams.get('projectId') || undefined;

        connection.projectId = projectId;
        self.clients.add(connection);

        // Send initial state for the requested project
        if (projectId) {
          const project = self.projectManager.getProject(projectId);
          if (project && isWorkflowProject(project)) {
            Promise.all([
              project.parser.getAllSpecs(),
              project.approvalStorage.getAllPendingApprovals()
            ])
              .then(([specs, approvals]) => {
                socket.send(
                  JSON.stringify({
                    type: 'initial',
                    projectId,
                    data: { specs, approvals },
                  })
                );
              })
              .catch((error) => {
                console.error('Error getting initial data:', error);
              });
          }
        }

        // Send projects list
        socket.send(
          JSON.stringify({
            type: 'projects-update',
            data: { projects: self.projectManager.getProjectsList() }
          })
        );

        // Handle client disconnect
        const cleanup = () => {
          self.clients.delete(connection);
          socket.removeAllListeners();
        };

        socket.on('close', cleanup);
        socket.on('error', cleanup);
        socket.on('disconnect', cleanup);
        socket.on('end', cleanup);

        // Handle subscription messages
        socket.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'subscribe' && msg.projectId) {
              connection.projectId = msg.projectId;

              // Send initial data for new subscription
              const project = self.projectManager.getProject(msg.projectId);
              if (project && isWorkflowProject(project)) {
                Promise.all([
                  project.parser.getAllSpecs(),
                  project.approvalStorage.getAllPendingApprovals()
                ])
                  .then(([specs, approvals]) => {
                    socket.send(
                      JSON.stringify({
                        type: 'initial',
                        projectId: msg.projectId,
                        data: { specs, approvals },
                      })
                    );
                  })
                  .catch((error) => {
                    console.error('Error getting initial data:', error);
                  });
              }
            }
          } catch (error) {
            // Ignore invalid messages
          }
        });
      });
    });

    // Serve Claude icon as favicon
    this.app.get('/favicon.ico', async (request, reply) => {
      return reply.sendFile('claude-icon.svg', join(__dirname, 'public'));
    });

    // Setup project manager event handlers
    this.setupProjectManagerEvents();

    // Register API routes
    this.registerApiRoutes();

    // Validate and set port (always provided by caller)
    if (!this.options.port) {
      throw new Error('Dashboard port must be specified');
    }

    await validateAndCheckPort(this.options.port);
    this.actualPort = this.options.port;

    // Start server
    await this.app.listen({ port: this.actualPort, host: '0.0.0.0' });

    // Register dashboard in the session manager
    const dashboardUrl = `http://localhost:${this.actualPort}`;
    await this.sessionManager.registerDashboard(dashboardUrl, this.actualPort, process.pid);

    // Open browser if requested
    if (this.options.autoOpen) {
      await open(dashboardUrl);
    }

    // Automatically scan for spec-kit projects if SPECKIT_ROOT_DIR is set
    try {
      const { getRootDirectory } = await import('../config.js');
      const rootResult = getRootDirectory();

      if (rootResult.rootDir) {
        console.log(`[Dashboard] Auto-scanning ${rootResult.rootDir} for spec-kit projects...`);
        this.projectRegistry.setRootDirectory(rootResult.rootDir);
        await this.projectRegistry.startWatching();
        await this.projectRegistry.scanRootDirectory();
        console.log(`[Dashboard] Auto-scan completed`);
      }
    } catch (error) {
      console.warn(`[Dashboard] Auto-scan failed:`, error);
    }

    return dashboardUrl;
  }

  private setupProjectManagerEvents() {
    // Broadcast projects update when projects change
    this.projectManager.on('projects-update', (projects) => {
      this.broadcastToAll({
        type: 'projects-update',
        data: { projects }
      });
    });

    // Broadcast spec changes
    this.projectManager.on('spec-change', async (event) => {
      const { projectId, ...data } = event;
      const project = this.projectManager.getProject(projectId);
      if (project) {
        const specs = await project.parser.getAllSpecs();
        const archivedSpecs = await project.parser.getAllArchivedSpecs();
        this.broadcastToProject(projectId, {
          type: 'spec-update',
          projectId,
          data: { specs, archivedSpecs }
        });
      }
    });

    // Broadcast task updates
    this.projectManager.on('task-update', (event) => {
      const { projectId, specName } = event;
      this.broadcastTaskUpdate(projectId, specName);
    });

    // Broadcast steering changes
    this.projectManager.on('steering-change', async (event) => {
      const { projectId, steeringStatus } = event;
      this.broadcastToProject(projectId, {
        type: 'steering-update',
        projectId,
        data: steeringStatus
      });
    });

    // Broadcast approval changes
    this.projectManager.on('approval-change', async (event) => {
      const { projectId } = event;
      const project = this.projectManager.getProject(projectId);
      if (project && isWorkflowProject(project)) {
        const approvals = await project.approvalStorage.getAllPendingApprovals();
        this.broadcastToProject(projectId, {
          type: 'approval-update',
          projectId,
          data: approvals
        });
      }
    });

    // Broadcast agent changes
    this.projectManager.on('agent-change', (event) => {
      const { projectId, agentName, commandCount } = event;
      this.broadcastToProject(projectId, {
        type: 'agent.detected',
        projectId,
        data: {
          agentName,
          commandCount,
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  private registerApiRoutes() {
    const self = this;

    // Get all projects with optional type filtering and stats
    this.app.get('/api/projects', async (request, reply) => {
      const query = request.query as { type?: string; includeStats?: string };
      const typeFilter = query.type as 'spec-kit' | 'spec-workflow-mcp' | undefined;
      const includeStats = query.includeStats === 'true';

      try {
        let projects = self.projectRegistry.getAllProjectContexts();

        // Apply type filter if specified
        if (typeFilter) {
          projects = projects.filter(project => project.projectType === typeFilter);
        }

        // Include stats if requested
        if (includeStats) {
          const stats = {
            total: projects.length,
            byType: {
              'spec-kit': projects.filter(p => p.projectType === 'spec-kit').length,
              'spec-workflow-mcp': projects.filter(p => p.projectType === 'spec-workflow-mcp').length
            },
            lastScanned: new Date().toISOString()
          };

          return {
            projects,
            stats
          };
        }

        return { projects };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get projects: ${error.message}` });
      }
    });

    // Trigger manual root directory scan
    this.app.post('/api/scan', async (request, reply) => {
      const body = (request.body as { force?: boolean }) || {};
      const force = body.force === true;

      try {
        // Get root directory from config
        const { getRootDirectory } = await import('../config.js');
        const rootResult = getRootDirectory();

        if (!rootResult.rootDir) {
          return reply.code(400).send({ error: rootResult.error || 'Root directory not configured' });
        }

        // Set root directory in registry
        self.projectRegistry.setRootDirectory(rootResult.rootDir);

        // Start watching for filesystem changes
        await self.projectRegistry.startWatching();

        // Perform scan
        await self.projectRegistry.scanRootDirectory();

        // Get updated project list
        const projects = self.projectRegistry.getAllProjectContexts();

        return {
          success: true,
          message: 'Root directory scan completed',
          projectsCount: projects.length,
          rootDirectory: rootResult.rootDir
        };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to scan root directory: ${error.message}` });
      }
    });

    // Get full project details including specs array
    this.app.get('/api/projects/:projectId', async (request: any, reply: any) => {
      const { projectId } = request.params as { projectId: string };

      try {
        const project = self.projectRegistry.getProjectContext(projectId);
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // For spec-kit projects, get additional details
        if (project.projectType === 'spec-kit') {
          const parser = new (await import('../core/parser.js')).SpecKitParser(project.projectPath);
          const metadata = await parser.parseProjectMetadata();

          // Broadcast agent detection events for real-time updates
          metadata.agents.forEach((agent) => {
            self.broadcastAgentDetected(projectId, agent.agentName, agent.commandCount);
          });

          return {
            ...project,
            agents: metadata.agents,
            constitution: metadata.constitution,
            templates: metadata.templates,
            specs: metadata.specs
          };
        }

        // For workflow projects, return basic context
        return project;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get project details: ${error.message}` });
      }
    });

    // Get detailed spec directory information
    this.app.get('/api/projects/:projectId/specs/:specId', async (request: any, reply: any) => {
      const { projectId, specId } = request.params as { projectId: string; specId: string };

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

        // Find the spec directory by feature number (specId)
        const spec = specs.find(s => s.featureNumber === specId);
        if (!spec) {
          return reply.code(404).send({ error: 'Spec directory not found' });
        }

        // Get detailed information for this spec
        const specPath = spec.directoryPath;
        const files = await parser.detectSpecFiles(specPath);
        const subdirectories = await parser.detectSpecSubdirectories(specPath);

        return {
          ...spec,
          files,
          subdirectories
        };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get spec details: ${error.message}` });
      }
    });

    // Get constitution for spec-kit project
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
        const constitution = await parser.parseConstitution();

        if (!constitution) {
          return reply.code(404).send({ error: 'Constitution not found' });
        }

        return constitution;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get constitution: ${error.message}` });
      }
    });

    // Get templates for spec-kit project
    this.app.get('/api/projects/:projectId/templates', async (request: any, reply: any) => {
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
        const templates = await parser.getTemplates();

        return { templates };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get templates: ${error.message}` });
      }
    });

    // Get scripts for spec-kit project
    this.app.get('/api/projects/:projectId/scripts', async (request: any, reply: any) => {
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
        const scripts = await parser.getScripts();

        return { scripts };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get scripts: ${error.message}` });
      }
    });

    // Get agents for spec-kit project
    this.app.get('/api/projects/:projectId/agents', async (request: any, reply: any) => {
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
        const agents = await parser.discoverAIAgents();

        return { agents };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get agents: ${error.message}` });
      }
    });

    // Get specs list for spec-kit project
    this.app.get('/api/projects/:projectId/specs/list', async (request: any, reply: any) => {
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
        const specs = await parser.getSpecs();

        return { specs };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get specs: ${error.message}` });
      }
    });

    // Get tasks.md content for a specific spec
    this.app.get('/api/projects/:projectId/specs/:featureNumber/tasks', async (request: any, reply: any) => {
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

        // Get all specs to find the directory path for this feature
        const specs = await parser.getSpecs();
        const spec = specs.find(s => s.directoryName === featureNumber || s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        const tasksPath = join(spec.directoryPath, 'tasks.md');

        // Check if tasks file exists
        try {
          await fs.access(tasksPath);
        } catch {
          return reply.code(404).send({ error: 'Tasks file not found' });
        }

        const content = await fs.readFile(tasksPath, 'utf-8');
        return { content };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get tasks: ${error.message}` });
      }
    });

    // Update tasks.md content for a specific spec
    this.app.put('/api/projects/:projectId/specs/:featureNumber/tasks', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params as { projectId: string; featureNumber: string };
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
        const spec = specs.find(s => s.directoryName === featureNumber || s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        const tasksPath = join(spec.directoryPath, 'tasks.md');
        await fs.writeFile(tasksPath, content, 'utf-8');

        return { success: true, message: 'Tasks updated successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to update tasks: ${error.message}` });
      }
    });

    // Toggle task completion status
    this.app.patch('/api/projects/:projectId/specs/:featureNumber/tasks/toggle', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params as { projectId: string; featureNumber: string };
      const { taskId } = request.body as { taskId: string };

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
        const spec = specs.find(s => s.directoryName === featureNumber || s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        const tasksPath = join(spec.directoryPath, 'tasks.md');
        let content = await fs.readFile(tasksPath, 'utf-8');

        // Toggle task completion by finding the task ID and flipping its checkbox
        const lines = content.split('\n');
        let modified = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for both bold format **T001** and plain format T001
          if (line.match(/^-\s*\[(x| )\]/i) && (line.includes(`**${taskId}**`) || line.match(new RegExp(`\\[(?:x| )\\]\\s*${taskId}(?:\\s|\\[|$)`, 'i')))) {
            if (line.match(/\[x\]/i)) {
              lines[i] = line.replace(/\[x\]/i, '[ ]');
            } else {
              lines[i] = line.replace(/\[ \]/i, '[x]');
            }
            modified = true;
            break;
          }
        }

        if (!modified) {
          return reply.code(404).send({ error: 'Task not found' });
        }

        content = lines.join('\n');
        await fs.writeFile(tasksPath, content, 'utf-8');

        return { success: true, message: 'Task status toggled successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to toggle task: ${error.message}` });
      }
    });

    // Assign task to CLI agent
    this.app.post('/api/projects/:projectId/specs/:featureNumber/tasks/assign', async (request: any, reply: any) => {
      const { projectId, featureNumber } = request.params as { projectId: string; featureNumber: string };
      const { taskId, agentName, command } = request.body as { taskId: string; agentName: string; command?: string };

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
        const spec = specs.find(s => s.directoryName === featureNumber || s.featureNumber === featureNumber);

        if (!spec) {
          return reply.code(404).send({ error: 'Spec not found' });
        }

        const tasksPath = join(spec.directoryPath, 'tasks.md');
        let content = await fs.readFile(tasksPath, 'utf-8');

        // Add assignment annotation to task
        const lines = content.split('\n');
        let modified = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for both bold format **T001** and plain format T001
          if (line.match(/^-\s*\[(x| )\]/i) && (line.includes(`**${taskId}**`) || line.match(new RegExp(`\\[(?:x| )\\]\\s*${taskId}(?:\\s|\\[|$)`, 'i')))) {
            // Remove existing assignment if any
            lines[i] = line.replace(/\s*\[ASSIGNED:\s*[^\]]+\]/g, '');
            // Add new assignment
            lines[i] = `${lines[i]} [ASSIGNED: ${agentName}${command ? ` - ${command}` : ''}]`;
            modified = true;
            break;
          }
        }

        if (!modified) {
          return reply.code(404).send({ error: 'Task not found' });
        }

        content = lines.join('\n');
        await fs.writeFile(tasksPath, content, 'utf-8');

        return { success: true, message: 'Task assigned successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to assign task: ${error.message}` });
      }
    });

    // Projects list
    this.app.get('/api/projects/list', async () => {
      // Get both workflow projects and spec-kit projects
      const workflowProjects = this.projectManager.getProjectsList().map(p => ({
        ...p,
        projectType: 'spec-workflow-mcp' as const
      }));
      const allContexts = this.projectRegistry.getAllProjectContexts();

      // Combine both types of projects
      const allProjects = [
        ...workflowProjects,
        ...allContexts.filter(ctx => ctx.projectType === 'spec-kit').map(ctx => ({
          projectId: ctx.projectId,
          projectName: ctx.projectName,
          projectPath: ctx.projectPath,
          projectType: 'spec-kit' as const
        }))
      ];

      return allProjects;
    });

    // Get active project
    this.app.get('/api/projects/active', async () => {
      const activeProjectId = this.projectManager.getActiveProjectId();
      if (!activeProjectId) {
        return { activeProjectId: null };
      }

      const activeProject = this.projectManager.getActiveProject();
      return {
        activeProjectId,
        activeProject: activeProject ? {
          projectId: activeProject.projectId,
          projectName: activeProject.projectName,
          projectPath: activeProject.projectPath
        } : null
      };
    });

    // Set active project
    this.app.post('/api/projects/active', async (request, reply) => {
      const { projectId } = request.body as { projectId: string | null };
      if (projectId === null || projectId === undefined || projectId.trim() === '') {
        // Clear active project
        this.projectManager.setActiveProject('');
        return { success: true, activeProjectId: null };
      }

      if (typeof projectId !== 'string') {
        return reply.code(400).send({ error: 'projectId must be a string or null' });
      }

      const success = this.projectManager.setActiveProject(projectId);
      if (!success) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return { success: true, activeProjectId: projectId };
    });

    // Add project manually
    this.app.post('/api/projects/add', async (request, reply) => {
      const { projectPath } = request.body as { projectPath: string };
      if (!projectPath) {
        return reply.code(400).send({ error: 'projectPath is required' });
      }
      try {
        const projectId = await this.projectManager.addProjectByPath(projectPath);
        return { projectId, success: true };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    // Remove project
    this.app.delete('/api/projects/:projectId', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      try {
        await this.projectManager.removeProjectById(projectId);
        return { success: true };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    // Project info
    this.app.get('/api/projects/:projectId/info', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const steeringStatus = await project.parser.getProjectSteeringStatus();
      return {
        projectId,
        projectName: project.projectName,
        projectPath: project.projectPath,
        steering: steeringStatus,
        version: this.packageVersion
      };
    });

    // Specs list
    this.app.get('/api/projects/:projectId/specs', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      return await project.parser.getAllSpecs();
    });

    // Archived specs list
    this.app.get('/api/projects/:projectId/specs/archived', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      return await project.parser.getAllArchivedSpecs();
    });

    // Get spec details
    // this.app.get('/api/projects/:projectId/specs/:name', async (request, reply) => {
    //   const { projectId, name } = request.params as { projectId: string; name: string };
    //   const project = this.projectManager.getProject(projectId);
    //   if (!project) {
    //     return reply.code(404).send({ error: 'Project not found' });
    //   }
    //   const spec = await project.parser.getSpec(name);
    //   if (!spec) {
    //     return reply.code(404).send({ error: 'Spec not found' });
    //   }
    //   return spec;
    // });

    // Get all spec documents
    this.app.get('/api/projects/:projectId/specs/:name/all', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const specDir = join(project.projectPath, '.spec-workflow', 'specs', name);
      const documents = ['requirements', 'design', 'tasks'];
      const result: Record<string, { content: string; lastModified: string } | null> = {};

      for (const doc of documents) {
        const docPath = join(specDir, `${doc}.md`);
        try {
          const content = await readFile(docPath, 'utf-8');
          const stats = await fs.stat(docPath);
          result[doc] = {
            content,
            lastModified: stats.mtime.toISOString()
          };
        } catch {
          result[doc] = null;
        }
      }

      return result;
    });

    // Save spec document
    this.app.put('/api/projects/:projectId/specs/:name/:document', async (request, reply) => {
      const { projectId, name, document } = request.params as { projectId: string; name: string; document: string };
      const { content } = request.body as { content: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const allowedDocs = ['requirements', 'design', 'tasks'];
      if (!allowedDocs.includes(document)) {
        return reply.code(400).send({ error: 'Invalid document type' });
      }

      if (typeof content !== 'string') {
        return reply.code(400).send({ error: 'Content must be a string' });
      }

      const docPath = join(project.projectPath, '.spec-workflow', 'specs', name, `${document}.md`);

      try {
        const specDir = join(project.projectPath, '.spec-workflow', 'specs', name);
        await fs.mkdir(specDir, { recursive: true });
        await fs.writeFile(docPath, content, 'utf-8');
        return { success: true, message: 'Document saved successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to save document: ${error.message}` });
      }
    });

    // Archive spec
    this.app.post('/api/projects/:projectId/specs/:name/archive', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Archive operations are only supported for workflow projects' });
      }

      try {
        await project.archiveService.archiveSpec(name);
        return { success: true, message: `Spec '${name}' archived successfully` };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Unarchive spec
    this.app.post('/api/projects/:projectId/specs/:name/unarchive', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Unarchive operations are only supported for workflow projects' });
      }

      try {
        await project.archiveService.unarchiveSpec(name);
        return { success: true, message: `Spec '${name}' unarchived successfully` };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Get approvals
    this.app.get('/api/projects/:projectId/approvals', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }
      return await project.approvalStorage.getAllPendingApprovals();
    });

    // Get approval content
    this.app.get('/api/projects/:projectId/approvals/:id/content', async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Approval not found or no file path' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }

      try {
        const approval = await project.approvalStorage.getApproval(id);
        if (!approval || !approval.filePath) {
          return reply.code(404).send({ error: 'Approval not found or no file path' });
        }

        const candidates: string[] = [];
        const p = approval.filePath;
        candidates.push(join(project.projectPath, p));
        if (p.startsWith('/') || p.match(/^[A-Za-z]:[\\\/]/)) {
          candidates.push(p);
        }
        if (!p.includes('.spec-workflow')) {
          candidates.push(join(project.projectPath, '.spec-workflow', p));
        }

        let content: string | null = null;
        let resolvedPath: string | null = null;
        for (const candidate of candidates) {
          try {
            const data = await fs.readFile(candidate, 'utf-8');
            content = data;
            resolvedPath = candidate;
            break;
          } catch {
            // try next candidate
          }
        }

        if (content == null) {
          return reply.code(500).send({ error: `Failed to read file at any known location for ${approval.filePath}` });
        }

        return { content, filePath: resolvedPath || approval.filePath };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to read file: ${error.message}` });
      }
    });

    // Approval actions (approve, reject, needs-revision)
    this.app.post('/api/projects/:projectId/approvals/:id/:action', async (request, reply) => {
      const { projectId, id, action } = request.params as { projectId: string; id: string; action: string };
      const { response, annotations, comments } = request.body as {
        response: string;
        annotations?: string;
        comments?: any[];
      };

      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }

      const validActions = ['approve', 'reject', 'needs-revision'];
      if (!validActions.includes(action)) {
        return reply.code(400).send({ error: 'Invalid action' });
      }

      // Convert action name to status value
      const actionToStatus: Record<string, 'approved' | 'rejected' | 'needs-revision'> = {
        'approve': 'approved',
        'reject': 'rejected',
        'needs-revision': 'needs-revision'
      };
      const status = actionToStatus[action];

      try {
        await project.approvalStorage.updateApproval(id, status, response, annotations, comments);
        return { success: true };
      } catch (error: any) {
        return reply.code(404).send({ error: error.message });
      }
    });

    // Get all snapshots for an approval
    this.app.get('/api/projects/:projectId/approvals/:id/snapshots', async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }
      try {
        const snapshots = await project.approvalStorage.getSnapshots(id);
        return snapshots;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get snapshots: ${error.message}` });
      }
    });

    // Get specific snapshot version for an approval
    this.app.get('/api/projects/:projectId/approvals/:id/snapshots/:version', async (request, reply) => {
      const { projectId, id, version } = request.params as { projectId: string; id: string; version: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }
      try {
        const versionNum = parseInt(version, 10);
        if (isNaN(versionNum)) {
          return reply.code(400).send({ error: 'Invalid version number' });
        }

        const snapshot = await project.approvalStorage.getSnapshot(id, versionNum);
        if (!snapshot) {
          return reply.code(404).send({ error: `Snapshot version ${version} not found` });
        }

        return snapshot;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get snapshot: ${error.message}` });
      }
    });

    // Get diff between two versions or between version and current
    this.app.get('/api/projects/:projectId/approvals/:id/diff', async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string };
      const { from, to } = request.query as { from?: string; to?: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }

      if (!from) {
        return reply.code(400).send({ error: 'from parameter is required' });
      }

      try {
        const fromVersion = parseInt(from, 10);
        if (isNaN(fromVersion)) {
          return reply.code(400).send({ error: 'Invalid from version number' });
        }

        let toVersion: number | 'current';
        if (to === 'current' || to === undefined) {
          toVersion = 'current';
        } else {
          const toVersionNum = parseInt(to, 10);
          if (isNaN(toVersionNum)) {
            return reply.code(400).send({ error: 'Invalid to version number' });
          }
          toVersion = toVersionNum;
        }

        const diff = await project.approvalStorage.compareSnapshots(id, fromVersion, toVersion);
        return diff;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to compute diff: ${error.message}` });
      }
    });

    // Manual snapshot capture
    this.app.post('/api/projects/:projectId/approvals/:id/snapshot', async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (!isWorkflowProject(project)) {
        return reply.code(400).send({ error: 'Approvals are only supported for workflow projects' });
      }
      try {
        await project.approvalStorage.captureSnapshot(id, 'manual');
        return { success: true, message: 'Snapshot captured successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to capture snapshot: ${error.message}` });
      }
    });

    // Get steering document
    this.app.get('/api/projects/:projectId/steering/:name', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const allowedDocs = ['product', 'tech', 'structure'];
      if (!allowedDocs.includes(name)) {
        return reply.code(400).send({ error: 'Invalid steering document name' });
      }

      const docPath = join(project.projectPath, '.spec-workflow', 'steering', `${name}.md`);

      try {
        const content = await readFile(docPath, 'utf-8');
        const stats = await fs.stat(docPath);
        return {
          content,
          lastModified: stats.mtime.toISOString()
        };
      } catch {
        return {
          content: '',
          lastModified: new Date().toISOString()
        };
      }
    });

    // Save steering document
    this.app.put('/api/projects/:projectId/steering/:name', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const { content } = request.body as { content: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const allowedDocs = ['product', 'tech', 'structure'];
      if (!allowedDocs.includes(name)) {
        return reply.code(400).send({ error: 'Invalid steering document name' });
      }

      if (typeof content !== 'string') {
        return reply.code(400).send({ error: 'Content must be a string' });
      }

      const steeringDir = join(project.projectPath, '.spec-workflow', 'steering');
      const docPath = join(steeringDir, `${name}.md`);

      try {
        await fs.mkdir(steeringDir, { recursive: true });
        await fs.writeFile(docPath, content, 'utf-8');
        return { success: true, message: 'Steering document saved successfully' };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to save steering document: ${error.message}` });
      }
    });

    // Get task progress
    this.app.get('/api/projects/:projectId/specs/:name/tasks/progress', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      try {
        const spec = await project.parser.getSpec(name);
        if (!spec || !spec.phases.tasks.exists) {
          return reply.code(404).send({ error: 'Spec or tasks not found' });
        }

        const tasksPath = join(project.projectPath, '.spec-workflow', 'specs', name, 'tasks.md');
        const tasksContent = await readFile(tasksPath, 'utf-8');
        const parseResult = parseTasksFromMarkdown(tasksContent);

        const totalTasks = parseResult.summary.total;
        const completedTasks = parseResult.summary.completed;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          total: totalTasks,
          completed: completedTasks,
          inProgress: parseResult.inProgressTask,
          progress: progress,
          taskList: parseResult.tasks,
          lastModified: spec.phases.tasks.lastModified || spec.lastModified
        };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get task progress: ${error.message}` });
      }
    });

    // Update task status
    this.app.put('/api/projects/:projectId/specs/:name/tasks/:taskId/status', async (request, reply) => {
      const { projectId, name, taskId } = request.params as { projectId: string; name: string; taskId: string };
      const { status } = request.body as { status: 'pending' | 'in-progress' | 'completed' };
      const project = this.projectManager.getProject(projectId);

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
        return reply.code(400).send({ error: 'Invalid status. Must be pending, in-progress, or completed' });
      }

      try {
        const tasksPath = join(project.projectPath, '.spec-workflow', 'specs', name, 'tasks.md');

        let tasksContent: string;
        try {
          tasksContent = await readFile(tasksPath, 'utf-8');
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            return reply.code(404).send({ error: 'Tasks file not found' });
          }
          throw error;
        }

        const parseResult = parseTasksFromMarkdown(tasksContent);
        const task = parseResult.tasks.find(t => t.id === taskId);

        if (!task) {
          return reply.code(404).send({ error: `Task ${taskId} not found` });
        }

        if (task.status === status) {
          return {
            success: true,
            message: `Task ${taskId} already has status ${status}`,
            task: { ...task, status }
          };
        }

        const { updateTaskStatus } = await import('../core/task-parser.js');
        const updatedContent = updateTaskStatus(tasksContent, taskId, status);

        if (updatedContent === tasksContent) {
          return reply.code(500).send({ error: `Failed to update task ${taskId} in markdown content` });
        }

        await fs.writeFile(tasksPath, updatedContent, 'utf-8');

        this.broadcastTaskUpdate(projectId, name);

        return {
          success: true,
          message: `Task ${taskId} status updated to ${status}`,
          task: { ...task, status }
        };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to update task status: ${error.message}` });
      }
    });

    // Add implementation log entry
    this.app.post('/api/projects/:projectId/specs/:name/implementation-log', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      try {
        const logData = request.body as any;

        // Validate artifacts are provided
        if (!logData.artifacts) {
          return reply.code(400).send({ error: 'artifacts field is REQUIRED. Include apiEndpoints, components, functions, classes, or integrations in the artifacts object.' });
        }

        const specPath = join(project.projectPath, '.spec-workflow', 'specs', name);
        const logManager = new ImplementationLogManager(specPath);
        const entry = await logManager.addLogEntry(logData);

        await this.broadcastImplementationLogUpdate(projectId, name);
        return entry;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to add implementation log: ${error.message}` });
      }
    });

    // Get implementation logs
    this.app.get('/api/projects/:projectId/specs/:name/implementation-log', async (request, reply) => {
      const { projectId, name } = request.params as { projectId: string; name: string };
      const query = request.query as { taskId?: string; search?: string };

      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      try {
        const specPath = join(project.projectPath, '.spec-workflow', 'specs', name);
        const logManager = new ImplementationLogManager(specPath);
        let logs = await logManager.getAllLogs();

        if (query.taskId) {
          logs = logs.filter(log => log.taskId === query.taskId);
        }
        if (query.search) {
          logs = await logManager.searchLogs(query.search);
        }

        return { entries: logs };
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get implementation logs: ${error.message}` });
      }
    });

    // Get implementation log task stats
    this.app.get('/api/projects/:projectId/specs/:name/implementation-log/task/:taskId/stats', async (request, reply) => {
      const { projectId, name, taskId } = request.params as { projectId: string; name: string; taskId: string };

      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      try {
        const specPath = join(project.projectPath, '.spec-workflow', 'specs', name);
        const logManager = new ImplementationLogManager(specPath);
        const stats = await logManager.getTaskStats(taskId);

        return stats;
      } catch (error: any) {
        return reply.code(500).send({ error: `Failed to get implementation log stats: ${error.message}` });
      }
    });

    // Project-specific changelog endpoint
    this.app.get('/api/projects/:projectId/changelog/:version', async (request, reply) => {
      const { version } = request.params as { version: string };

      try {
        const changelogPath = join(__dirname, '..', '..', 'CHANGELOG.md');
        const content = await readFile(changelogPath, 'utf-8');

        // Extract the section for the requested version
        const versionRegex = new RegExp(`## \\[${version}\\][^]*?(?=## \\[|$)`, 'i');
        const match = content.match(versionRegex);

        if (!match) {
          return reply.code(404).send({ error: `Changelog for version ${version} not found` });
        }

        return { content: match[0].trim() };
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return reply.code(404).send({ error: 'Changelog file not found' });
        }
        return reply.code(500).send({ error: `Failed to fetch changelog: ${error.message}` });
      }
    });

    // Global changelog endpoint
    this.app.get('/api/changelog/:version', async (request, reply) => {
      const { version } = request.params as { version: string };

      try {
        const changelogPath = join(__dirname, '..', '..', 'CHANGELOG.md');
        const content = await readFile(changelogPath, 'utf-8');

        // Extract the section for the requested version
        const versionRegex = new RegExp(`## \\[${version}\\][^]*?(?=## \\[|$)`, 'i');
        const match = content.match(versionRegex);

        if (!match) {
          return reply.code(404).send({ error: `Changelog for version ${version} not found` });
        }

        return { content: match[0].trim() };
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return reply.code(404).send({ error: 'Changelog file not found' });
        }
        return reply.code(500).send({ error: `Failed to fetch changelog: ${error.message}` });
      }
    });

    // Global settings endpoints

    // Get all automation jobs
    this.app.get('/api/jobs', async () => {
      return await this.jobScheduler.getAllJobs();
    });

    // Create a new automation job
    this.app.post('/api/jobs', async (request, reply) => {
      const job = request.body as any;

      if (!job.id || !job.name || !job.type || job.config === undefined || !job.schedule) {
        return reply.code(400).send({ error: 'Missing required fields: id, name, type, config, schedule' });
      }

      try {
        await this.jobScheduler.addJob({
          id: job.id,
          name: job.name,
          type: job.type,
          enabled: job.enabled !== false,
          config: job.config,
          schedule: job.schedule,
          createdAt: new Date().toISOString()
        });
        return { success: true, message: 'Job created successfully' };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Get a specific automation job
    this.app.get('/api/jobs/:jobId', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const settingsManager = new (await import('./settings-manager.js')).SettingsManager();

      try {
        const job = await settingsManager.getJob(jobId);
        if (!job) {
          return reply.code(404).send({ error: 'Job not found' });
        }
        return job;
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    // Update an automation job
    this.app.put('/api/jobs/:jobId', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const updates = request.body as any;

      try {
        await this.jobScheduler.updateJob(jobId, updates);
        return { success: true, message: 'Job updated successfully' };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Delete an automation job
    this.app.delete('/api/jobs/:jobId', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };

      try {
        await this.jobScheduler.deleteJob(jobId);
        return { success: true, message: 'Job deleted successfully' };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Manually run a job
    this.app.post('/api/jobs/:jobId/run', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };

      try {
        const result = await this.jobScheduler.runJobManually(jobId);
        return result;
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    });

    // Get job execution history
    this.app.get('/api/jobs/:jobId/history', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };
      const { limit } = request.query as { limit?: string };

      try {
        const history = await this.jobScheduler.getJobExecutionHistory(jobId, parseInt(limit || '50'));
        return history;
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    // Get job statistics
    this.app.get('/api/jobs/:jobId/stats', async (request, reply) => {
      const { jobId } = request.params as { jobId: string };

      try {
        const stats = await this.jobScheduler.getJobStats(jobId);
        return stats;
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });
  }

  private broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((connection) => {
      if (connection.socket.readyState === 1) {
        connection.socket.send(messageStr);
      }
    });
  }

  private broadcastToProject(projectId: string, message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((connection) => {
      if (connection.socket.readyState === 1 && connection.projectId === projectId) {
        connection.socket.send(messageStr);
      }
    });
  }

  private async broadcastTaskUpdate(projectId: string, specName: string) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) return;

      const tasksPath = join(project.projectPath, '.spec-workflow', 'specs', specName, 'tasks.md');
      const tasksContent = await readFile(tasksPath, 'utf-8');
      const parseResult = parseTasksFromMarkdown(tasksContent);

      this.broadcastToProject(projectId, {
        type: 'task-status-update',
        projectId,
        data: {
          specName,
          taskList: parseResult.tasks,
          summary: parseResult.summary,
          inProgress: parseResult.inProgressTask
        }
      });
    } catch (error) {
      console.error('Error broadcasting task update:', error);
    }
  }

  private async broadcastImplementationLogUpdate(projectId: string, specName: string): Promise<void> {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) return;

      const specPath = join(project.projectPath, '.spec-workflow', 'specs', specName);
      const logManager = new ImplementationLogManager(specPath);
      const logs = await logManager.getAllLogs();

      this.broadcastToProject(projectId, {
        type: 'implementation-log-update',
        projectId,
        data: {
          specName,
          entries: logs
        }
      });
    } catch (error) {
      console.error('Error broadcasting implementation log update:', error);
    }
  }

  /**
   * Broadcast project discovered event for spec-kit projects
   */
  broadcastProjectDiscovered(projectId: string, projectName: string, projectType: 'spec-kit' | 'spec-workflow-mcp', projectPath: string): void {
    this.broadcastToAll({
      type: 'project.discovered',
      data: {
        projectId,
        projectName,
        projectType,
        projectPath,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast agent detected event for spec-kit projects
   */
  broadcastAgentDetected(projectId: string, agentName: string, commandCount: number): void {
    this.broadcastToProject(projectId, {
      type: 'agent.detected',
      data: {
        projectId,
        agentName,
        commandCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast project removed event for spec-kit projects
   */
  broadcastProjectRemoved(projectId: string, projectName: string): void {
    this.broadcastToAll({
      type: 'project.removed',
      data: {
        projectId,
        projectName,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast project updated event for spec-kit projects
   */
  broadcastProjectUpdated(projectId: string, changedPaths: string[]): void {
    this.broadcastToAll({
      type: 'project.updated',
      data: {
        projectId,
        changedPaths,
        timestamp: new Date().toISOString()
      }
    });
  }

  async stop() {
    // Close all WebSocket connections
    this.clients.forEach((connection) => {
      try {
        connection.socket.removeAllListeners();
        if (connection.socket.readyState === 1) {
          connection.socket.close();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    this.clients.clear();

    // Stop job scheduler
    await this.jobScheduler.shutdown();

    // Stop project manager
    await this.projectManager.stop();

    // Close the Fastify server
    await this.app.close();

    // Unregister from the session manager
    try {
      await this.sessionManager.unregisterDashboard();
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  getUrl(): string {
    return `http://localhost:${this.actualPort}`;
  }
}
