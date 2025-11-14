import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { basename, resolve } from 'path';
import { createHash } from 'crypto';
import chokidar from 'chokidar';
import pLimit from 'p-limit';
import { detectProjectType } from './path-utils.js';
import { SpecKitParser } from './parser.js';
import { SpecKitProject, WorkflowProjectContext, SpecKitProjectContext, ProjectContext } from '../types.js';
import { logProjectDiscovered, timeOperation } from '../dashboard/utils.js';

export interface ProjectRegistryEntry {
  projectId: string;
  projectPath: string;
  projectName: string;
  pid: number;
  registeredAt: string;
}

/**
 * Generate a stable projectId from an absolute path
 * Uses SHA-1 hash encoded as base64url
 */
export function generateProjectId(absolutePath: string): string {
  const hash = createHash('sha1').update(absolutePath).digest('base64url');
  // Take first 16 characters for readability
  return hash.substring(0, 16);
}

export class ProjectRegistry {
  private registryPath: string;
  private registryDir: string;
  private needsInitialization: boolean = false;
  private rootDirectory?: string;
  private specKitProjects: Map<string, SpecKitProject> = new Map();
  private workflowProjects: Map<string, any> = new Map();
  private server?: any; // Reference to MultiProjectDashboardServer for WebSocket events
  private watcher?: chokidar.FSWatcher;
  private projectTypeCache: Map<string, { type: 'spec-kit' | 'spec-workflow-mcp' | null; mtime: number }> = new Map();
  private negativeResultCache: Map<string, number> = new Map(); // Cache negative results with expiration

  constructor() {
    this.registryDir = join(homedir(), '.spec-workflow-mcp');
    this.registryPath = join(this.registryDir, 'activeProjects.json');
  }

  /**
   * Ensure the registry directory exists
   */
  private async ensureRegistryDir(): Promise<void> {
    try {
      await fs.mkdir(this.registryDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
  }

  /**
   * Read the registry file with atomic operations
   * Returns a map keyed by projectId
   */
  private async readRegistry(): Promise<Map<string, ProjectRegistryEntry>> {
    await this.ensureRegistryDir();

    let fileWasEmpty = false;
    try {
      const content = await fs.readFile(this.registryPath, 'utf-8');
      // Handle empty or whitespace-only files
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        console.error(`[ProjectRegistry] Warning: ${this.registryPath} is empty, initializing with empty registry`);
        fileWasEmpty = true;
        // Mark that we need to write the file
        this.needsInitialization = true;
        return new Map();
      }
      const data = JSON.parse(trimmedContent) as Record<string, ProjectRegistryEntry>;
      return new Map(Object.entries(data));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, return empty map
        this.needsInitialization = true;
        return new Map();
      }
      if (error instanceof SyntaxError) {
        // JSON parsing error - file is corrupted or invalid
        console.error(`[ProjectRegistry] Error: Failed to parse ${this.registryPath}: ${error.message}`);
        console.error(`[ProjectRegistry] The file may be corrupted. Initializing with empty registry.`);
        // Back up the corrupted file
        try {
          const backupPath = `${this.registryPath}.corrupted.${Date.now()}`;
          await fs.copyFile(this.registryPath, backupPath);
          console.error(`[ProjectRegistry] Corrupted file backed up to: ${backupPath}`);
        } catch (backupError) {
          // Ignore backup errors
        }
        this.needsInitialization = true;
        return new Map();
      }
      throw error;
    }
  }

  /**
   * Write the registry file atomically
   */
  private async writeRegistry(registry: Map<string, ProjectRegistryEntry>): Promise<void> {
    await this.ensureRegistryDir();

    const data = Object.fromEntries(registry);
    const content = JSON.stringify(data, null, 2);

    // Write to temporary file first, then rename for atomic operation
    const tempPath = `${this.registryPath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, this.registryPath);
  }

  /**
   * Check if a process is still running
   */
  private isProcessAlive(pid: number): boolean {
    try {
      // Sending signal 0 checks if process exists without actually sending a signal
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register a project in the global registry
   */
  async registerProject(projectPath: string, pid: number): Promise<string> {
    const registry = await this.readRegistry();

    const absolutePath = resolve(projectPath);
    const projectId = generateProjectId(absolutePath);
    const projectName = basename(absolutePath);

    const entry: ProjectRegistryEntry = {
      projectId,
      projectPath: absolutePath,
      projectName,
      pid,
      registeredAt: new Date().toISOString()
    };

    registry.set(projectId, entry);
    await this.writeRegistry(registry);
    return projectId;
  }

  /**
   * Unregister a project from the global registry by path
   */
  async unregisterProject(projectPath: string): Promise<void> {
    const registry = await this.readRegistry();
    const absolutePath = resolve(projectPath);
    const projectId = generateProjectId(absolutePath);

    registry.delete(projectId);
    await this.writeRegistry(registry);
  }

  /**
   * Unregister a project by projectId
   */
  async unregisterProjectById(projectId: string): Promise<void> {
    const registry = await this.readRegistry();
    registry.delete(projectId);
    await this.writeRegistry(registry);
  }

  /**
   * Get all active projects from the registry
   */
  async getAllProjects(): Promise<ProjectRegistryEntry[]> {
    const registry = await this.readRegistry();
    return Array.from(registry.values());
  }

  /**
   * Get a specific project by path
   */
  async getProject(projectPath: string): Promise<ProjectRegistryEntry | null> {
    const registry = await this.readRegistry();
    const absolutePath = resolve(projectPath);
    const projectId = generateProjectId(absolutePath);
    return registry.get(projectId) || null;
  }

  /**
   * Get a specific project by projectId
   */
  async getProjectById(projectId: string): Promise<ProjectRegistryEntry | null> {
    const registry = await this.readRegistry();
    return registry.get(projectId) || null;
  }

  /**
   * Clean up stale projects (where the process is no longer running)
   */
  async cleanupStaleProjects(): Promise<number> {
    const registry = await this.readRegistry();
    let removedCount = 0;
    let needsWrite = this.needsInitialization; // Write if file needs initialization

    for (const [projectId, entry] of registry.entries()) {
      if (!this.isProcessAlive(entry.pid)) {
        registry.delete(projectId);
        removedCount++;
        needsWrite = true;
      }
    }

    if (needsWrite) {
      await this.writeRegistry(registry);
      this.needsInitialization = false; // Reset flag after successful write
    }

    return removedCount;
  }

  /**
   * Check if a project is registered by path
   */
  async isProjectRegistered(projectPath: string): Promise<boolean> {
    const registry = await this.readRegistry();
    const absolutePath = resolve(projectPath);
    const projectId = generateProjectId(absolutePath);
    return registry.has(projectId);
  }

  /**
   * Get the registry file path for watching
   */
  getRegistryPath(): string {
    return this.registryPath;
  }

  /**
   * Set the server reference for WebSocket event emission
   */
  setServer(server: any): void {
    this.server = server;
  }

  /**
   * Set the root directory for scanning
   */
  setRootDirectory(rootDir: string): void {
    this.rootDirectory = rootDir;
  }

  /**
   * Get cached project type with validation
   */
  private async getCachedProjectType(projectPath: string): Promise<'spec-kit' | 'spec-workflow-mcp' | null | undefined> {
    try {
      const stats = await fs.stat(projectPath);
      const cacheKey = projectPath;
      const cached = this.projectTypeCache.get(cacheKey);

      if (cached && cached.mtime >= stats.mtime.getTime()) {
        return cached.type;
      }

      // Cache miss or outdated
      return undefined;
    } catch {
      // If we can't stat the directory, don't use cache
      return undefined;
    }
  }

  /**
   * Cache project type result
   */
  private async cacheProjectType(projectPath: string, projectType: 'spec-kit' | 'spec-workflow-mcp' | null): Promise<void> {
    try {
      const stats = await fs.stat(projectPath);
      const cacheKey = projectPath;
      this.projectTypeCache.set(cacheKey, {
        type: projectType,
        mtime: stats.mtime.getTime()
      });
    } catch {
      // Ignore caching errors
    }
  }

  /**
   * Check if negative result is still valid (within 5 minutes)
   */
  private isNegativeResultValid(cacheTime: number): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - cacheTime < fiveMinutes;
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Clear expired negative results
    for (const [path, cacheTime] of this.negativeResultCache.entries()) {
      if (now - cacheTime > fiveMinutes) {
        this.negativeResultCache.delete(path);
      }
    }

    // Clear outdated project type cache entries (keep for longer - 1 hour)
    const oneHour = 60 * 60 * 1000;
    for (const [path, cached] of this.projectTypeCache.entries()) {
      if (now - cached.mtime > oneHour) {
        this.projectTypeCache.delete(path);
      }
    }
  }

  /**
   * Scan root directory for spec-kit projects
   */
  async scanRootDirectory(): Promise<void> {
    if (!this.rootDirectory) {
      throw new Error('Root directory not configured');
    }

    return timeOperation('scanRootDirectory', async () => {
      // Clear expired cache entries before scanning
      this.clearExpiredCache();

      try {
        const entries = await fs.readdir(this.rootDirectory!, { withFileTypes: true });
        const subdirs = entries.filter((entry: any) => entry.isDirectory());

        // Limit concurrent scanning operations to prevent overwhelming the system
        const limit = pLimit(10);

        const scanPromises = subdirs.map((subdir: any) => 
          limit(async () => {
            const projectPath = join(this.rootDirectory!, subdir.name);
            
            // Skip hidden directories and common non-project directories
            if (subdir.name.startsWith('.') || ['node_modules', 'dist', 'build'].includes(subdir.name)) {
              return;
            }

            return timeOperation('scanProjectDirectory', async () => {
              // Check negative result cache first
              const negativeCacheTime = this.negativeResultCache.get(projectPath);
              if (negativeCacheTime && this.isNegativeResultValid(negativeCacheTime)) {
                return; // Skip recently scanned non-project directories
              }

              // Check project type cache
              let projectType = await this.getCachedProjectType(projectPath);
              if (projectType === undefined) {
                // Cache miss - detect project type
                projectType = await timeOperation('detectProjectType', async () => detectProjectType(projectPath));
                await this.cacheProjectType(projectPath, projectType);
              }

              if (projectType === 'spec-kit') {
                await timeOperation('registerSpecKitProject', async () => this.registerSpecKitProject(projectPath));
              } else if (projectType === 'spec-workflow-mcp') {
                // Handle workflow projects if needed
              } else {
                // Cache negative result
                this.negativeResultCache.set(projectPath, Date.now());
              }
            }, { projectPath });
          })
        );

        await Promise.all(scanPromises);
      } catch (error) {
        throw new Error(`Failed to scan root directory: ${error}`);
      }
    }, { rootDirectory: this.rootDirectory });
  }

  /**
   * Register a spec-kit project
   */
  async registerSpecKitProject(projectPath: string): Promise<string> {
    const absolutePath = resolve(projectPath);
    const projectId = generateProjectId(absolutePath);

    // Check if already registered
    if (this.specKitProjects.has(projectId)) {
      return projectId;
    }

    // Parse project metadata
    const parser = new SpecKitParser(absolutePath);
    const metadata = await parser.parseProjectMetadata();

    const project: SpecKitProject = {
      projectId,
      projectPath: absolutePath,
      projectName: basename(absolutePath),
      projectType: 'spec-kit',
      rootDirectory: this.rootDirectory!,
      hasConstitution: !!metadata.constitution,
      agentCount: metadata.agents.length,
      specCount: metadata.specs.length,
      createdAt: new Date().toISOString(),
      lastScanned: new Date().toISOString()
    };

    this.specKitProjects.set(projectId, project);
    
    // Emit project.discovered event
    logProjectDiscovered(projectId, absolutePath);
    
    // Emit WebSocket event if server is available
    if (this.server && this.server.broadcastProjectDiscovered) {
      this.server.broadcastProjectDiscovered(projectId, project.projectName, 'spec-kit', absolutePath);
    }
    
    return projectId;
  }

  /**
   * Get all project contexts (both spec-kit and workflow)
   */
  getAllProjectContexts(): ProjectContext[] {
    const contexts: ProjectContext[] = [];

    // Add spec-kit projects
    for (const project of this.specKitProjects.values()) {
      const parser = new SpecKitParser(project.projectPath);
      const context: SpecKitProjectContext = {
        projectId: project.projectId,
        projectPath: project.projectPath,
        projectName: project.projectName,
        projectType: 'spec-kit',
        parser,
        agents: [], // Would be populated from parser
        constitution: undefined, // Would be populated from parser
        templates: [], // Would be populated from parser
        specs: [] // Would be populated from parser
      };
      contexts.push(context);
    }

    // Add workflow projects (if any)
    for (const project of this.workflowProjects.values()) {
      const context: WorkflowProjectContext = {
        projectId: project.projectId,
        projectPath: project.projectPath,
        projectName: project.projectName,
        projectType: 'spec-workflow-mcp',
        parser: project.parser,
        watcher: project.watcher,
        approvalStorage: project.approvalStorage,
        archiveService: project.archiveService
      };
      contexts.push(context);
    }

    return contexts;
  }

  /**
   * Get projects by type
   */
  getProjectsByType(type: 'spec-kit' | 'spec-workflow-mcp'): ProjectContext[] {
    return this.getAllProjectContexts().filter((ctx: ProjectContext) => ctx.projectType === type);
  }

  /**
   * Get spec-kit project by ID
   */
  getSpecKitProject(projectId: string): SpecKitProject | null {
    return this.specKitProjects.get(projectId) || null;
  }

  /**
   * Get project context by ID
   */
  getProjectContext(projectId: string): ProjectContext | null {
    // Check spec-kit projects first
    const specKitProject = this.specKitProjects.get(projectId);
    if (specKitProject) {
      const parser = new SpecKitParser(specKitProject.projectPath);
      const context: SpecKitProjectContext = {
        projectId: specKitProject.projectId,
        projectPath: specKitProject.projectPath,
        projectName: specKitProject.projectName,
        projectType: 'spec-kit',
        parser,
        agents: [], // Would be populated from parser
        constitution: undefined, // Would be populated from parser
        templates: [], // Would be populated from parser
        specs: [] // Would be populated from parser
      };
      return context;
    }

    // Check workflow projects
    const workflowProject = this.workflowProjects.get(projectId);
    if (workflowProject) {
      const context: WorkflowProjectContext = {
        projectId: workflowProject.projectId,
        projectPath: workflowProject.projectPath,
        projectName: workflowProject.projectName,
        projectType: 'spec-workflow-mcp',
        parser: workflowProject.parser,
        watcher: workflowProject.watcher,
        approvalStorage: workflowProject.approvalStorage,
        archiveService: workflowProject.archiveService
      };
      return context;
    }

    return null;
  }

  /**
   * Start watching for project directory changes (creation/deletion)
   */
  async startWatching(): Promise<void> {
    if (!this.rootDirectory) {
      throw new Error('Root directory not configured for watching');
    }

    if (this.watcher) {
      await this.stopWatching();
    }

    // Watch for directory creation/deletion in root directory
    this.watcher = chokidar.watch(this.rootDirectory, {
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
      depth: 0, // Only watch immediate subdirectories
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher.on('addDir', async (dirPath) => {
      const relativePath = basename(dirPath);
      // Skip hidden directories and common non-project directories
      if (relativePath.startsWith('.') || ['node_modules', 'dist', 'build'].includes(relativePath)) {
        return;
      }

      try {
        // Clear any cached negative result for this path
        this.negativeResultCache.delete(dirPath);

        // Check cache first
        let projectType = await this.getCachedProjectType(dirPath);
        if (projectType === undefined) {
          projectType = await detectProjectType(dirPath);
          await this.cacheProjectType(dirPath, projectType);
        }

        if (projectType === 'spec-kit') {
          await this.registerSpecKitProject(dirPath);
        }
      } catch (error) {
        // Ignore errors during automatic registration
      }
    });

    this.watcher.on('unlinkDir', async (dirPath) => {
      const projectId = generateProjectId(dirPath);
      
      // Check if this was a registered spec-kit project
      const project = this.specKitProjects.get(projectId);
      if (project) {
        // Remove from registry
        this.specKitProjects.delete(projectId);
        
        // Emit project.removed event
        if (this.server && this.server.broadcastProjectRemoved) {
          this.server.broadcastProjectRemoved(projectId, project.projectName);
        }
      }
    });
  }

  /**
   * Stop watching for project directory changes
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }
}
