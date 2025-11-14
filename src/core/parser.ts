import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { PathUtils } from './path-utils.js';
import { SpecData, SteeringStatus, PhaseStatus, SpecDirectory } from '../types.js';
import { parseTaskProgress } from './task-parser.js';
import { logSpecParsed } from '../dashboard/utils.js';

export class SpecParser {
  constructor(private projectPath: string) {}

  async getAllSpecs(): Promise<SpecData[]> {
    const specs: SpecData[] = [];
    const specsPath = PathUtils.getSpecPath(this.projectPath, '');
    
    try {
      const entries = await readdir(specsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const spec = await this.getSpec(entry.name);
          if (spec) {
            specs.push(spec);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
      return [];
    }
    
    return specs;
  }

  async getSpec(name: string): Promise<SpecData | null> {
    const specPath = PathUtils.getSpecPath(this.projectPath, name);
    
    try {
      const stats = await stat(specPath);
      if (!stats.isDirectory()) {
        return null;
      }
      
      // Read all phase files
      const requirements = await this.getPhaseStatus(specPath, 'requirements.md');
      const design = await this.getPhaseStatus(specPath, 'design.md');
      const tasks = await this.getPhaseStatus(specPath, 'tasks.md');
      
      // Parse task progress using unified parser
      let taskProgress = undefined;
      if (tasks.exists) {
        try {
          const tasksContent = await readFile(join(specPath, 'tasks.md'), 'utf-8');
          taskProgress = parseTaskProgress(tasksContent);
        } catch {
          // Error reading tasks file
        }
      }
      
      return {
        name,
        createdAt: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString(),
        phases: {
          requirements,
          design,
          tasks,
          implementation: {
            exists: taskProgress ? taskProgress.completed > 0 : false
          }
        },
        taskProgress
      };
    } catch (error) {
      return null;
    }
  }


  async getProjectSteeringStatus(): Promise<SteeringStatus> {
    const steeringPath = PathUtils.getSteeringPath(this.projectPath);
    
    try {
      const stats = await stat(steeringPath);
      
      const productExists = await this.fileExists(join(steeringPath, 'product.md'));
      const techExists = await this.fileExists(join(steeringPath, 'tech.md'));
      const structureExists = await this.fileExists(join(steeringPath, 'structure.md'));
      
      return {
        exists: stats.isDirectory(),
        documents: {
          product: productExists,
          tech: techExists,
          structure: structureExists
        },
        lastModified: stats.mtime.toISOString()
      };
    } catch (error) {
      return {
        exists: false,
        documents: {
          product: false,
          tech: false,
          structure: false
        }
      };
    }
  }

  private async getPhaseStatus(basePath: string, filename: string): Promise<PhaseStatus> {
    const filePath = join(basePath, filename);
    
    try {
      const stats = await stat(filePath);
      const content = await readFile(filePath, 'utf-8');
      
      return {
        exists: true,
        lastModified: stats.mtime.toISOString(),
        content
      };
    } catch (error) {
      return {
        exists: false
      };
    }
  }


  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export class SpecKitParser {
  constructor(private projectPath: string) {}

  async parseProjectMetadata(): Promise<{
    agents: any[];
    constitution?: any;
    templates: any[];
    scripts: any[];
    specs: any[];
  }> {
    const startTime = Date.now();
    const [agents, constitution, templates, scripts, specs] = await Promise.all([
      this.discoverAIAgents(),
      this.parseConstitution(),
      this.getTemplates(),
      this.getScripts(),
      this.getSpecs()
    ]);

    const parseDuration = Date.now() - startTime;

    // Log configuration access metrics
    console.log(`[SpecKit] Configuration access completed in ${parseDuration}ms for project ${this.generateProjectId()}`);
    console.log(`[SpecKit] Configuration summary: ${agents.length} agents, ${constitution ? 1 : 0} constitution, ${templates.length} templates, ${scripts.length} scripts, ${specs.length} specs`);

    return {
      agents,
      constitution,
      templates,
      scripts,
      specs
    };
  }

  async discoverAIAgents(): Promise<any[]> {
    const agents: any[] = [];

    try {
      const entries = await readdir(this.projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && /^\.[a-z]+$/.test(entry.name)) {
          // Log agent folder detection
          console.log(`[SpecKit] Agent folder detected: ${entry.name} in project ${this.generateProjectId()}`);
          
          try {
            const agentFolder = await this.parseAgentFolder(entry.name);
            if (agentFolder) {
              agents.push(agentFolder);
            }
          } catch (error: any) {
            console.warn(`[SpecKit] Error parsing agent folder ${entry.name}: ${error.message}`);
            // Continue with other agents
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Project directory not found: ${this.projectPath}`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing project directory: ${this.projectPath}`);
      } else {
        console.warn(`[SpecKit] Error reading project directory ${this.projectPath}: ${error.message}`);
      }
      // Return empty array for graceful degradation
    }

    // Log agent discovery operations
    console.log(`[SpecKit] Agent discovery completed: ${agents.length} agents found in project ${this.generateProjectId()}`);

    return agents;
  }

  private async parseAgentFolder(folderName: string): Promise<any | null> {
    const agentName = folderName.slice(1); // Remove leading dot
    const agentPath = join(this.projectPath, folderName);

    try {
      // Check if it's actually a directory (handle symlinks)
      const stats = await stat(agentPath);
      if (!stats.isDirectory()) {
        console.log(`[SpecKit] Skipping non-directory agent path: ${agentPath}`);
        return null;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Agent directory no longer exists: ${agentPath}`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing agent directory: ${agentPath}`);
      } else {
        console.warn(`[SpecKit] Error accessing agent directory ${agentPath}: ${error.message}`);
      }
      return null;
    }

    // Check for commands or prompts subdirectory
    const subdirectoryType = await this.detectAgentSubdirectory(agentPath);
    if (!subdirectoryType) {
      return null;
    }

    const subdirPath = join(agentPath, subdirectoryType);

    // Parse commands
    const commands = await this.parseAgentCommands(subdirPath, agentName);

    return {
      agentId: `${this.generateProjectId()}-${agentName}`,
      projectId: this.generateProjectId(),
      agentName,
      folderPath: agentPath,
      subdirectoryType,
      commandCount: commands.length,
      commands,
      lastUpdated: new Date().toISOString()
    };
  }

  private async detectAgentSubdirectory(agentPath: string): Promise<'commands' | 'prompts' | null> {
    const commandsPath = join(agentPath, 'commands');
    const promptsPath = join(agentPath, 'prompts');

    try {
      await stat(commandsPath);
      // Log subdirectory type detection
      console.log(`[SpecKit] Agent subdirectory detected: commands in ${agentPath}`);
      return 'commands';
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`[SpecKit] Error checking commands directory ${commandsPath}: ${error.message}`);
      }
      
      try {
        await stat(promptsPath);
        // Log subdirectory type detection
        console.log(`[SpecKit] Agent subdirectory detected: prompts in ${agentPath}`);
        return 'prompts';
      } catch (error2: any) {
        if (error2.code !== 'ENOENT') {
          console.warn(`[SpecKit] Error checking prompts directory ${promptsPath}: ${error2.message}`);
        }
        // Neither subdirectory exists
        console.log(`[SpecKit] No valid subdirectory found in agent folder: ${agentPath}`);
        return null;
      }
    }
  }

  private async parseAgentCommands(subdirPath: string, agentName: string): Promise<any[]> {
    const commands: any[] = [];

    try {
      const files = await readdir(subdirPath);

      for (const file of files) {
        if (/^speckit\.[a-z]+\.md$/.test(file)) {
          const commandName = this.extractCommandName(file);
          if (commandName) {
            const filePath = join(subdirPath, file);
            
            try {
              const stats = await stat(filePath);
              
              commands.push({
                commandId: `${this.generateProjectId()}-${agentName}-${commandName}`,
                agentId: `${this.generateProjectId()}-${agentName}`,
                commandName,
                slashCommand: `/speckit.${commandName}`,
                filePath,
                fileName: file,
                lastModified: stats.mtime.toISOString()
              });
            } catch (error: any) {
              console.warn(`[SpecKit] Error accessing command file ${filePath}: ${error.message}`);
              // Skip this file
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Commands directory not found: ${subdirPath}`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing commands directory: ${subdirPath}`);
      } else {
        console.warn(`[SpecKit] Error reading commands directory ${subdirPath}: ${error.message}`);
      }
      // Return empty array
    }

    // Log command parsing operations
    console.log(`[SpecKit] Agent commands parsed: ${commands.length} commands found for agent ${agentName} in project ${this.generateProjectId()}`);

    return commands;
  }

  async parseConstitution(): Promise<any | undefined> {
    const constitutionPath = join(this.projectPath, '.specify', 'memory', 'constitution.md');

    try {
      const stats = await stat(constitutionPath);
      const content = await readFile(constitutionPath, 'utf-8');

      console.log(`[SpecKit] Constitution loaded successfully for project ${this.generateProjectId()}`);
      return {
        projectId: this.generateProjectId(),
        filePath: constitutionPath,
        content,
        version: this.extractVersion(content),
        lastModified: stats.mtime.toISOString(),
        principleCount: this.countPrinciples(content)
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Constitution not found at ${constitutionPath} for project ${this.generateProjectId()} - .specify/memory/ directory may not exist`);
      } else {
        console.warn(`[SpecKit] Error loading constitution for project ${this.generateProjectId()}: ${error.message}`);
      }
      return undefined;
    }
  }

  async getTemplates(): Promise<any[]> {
    const templates: any[] = [];
    const templatesPath = join(this.projectPath, '.specify', 'templates');

    try {
      const files = await readdir(templatesPath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = join(templatesPath, file);
          
          try {
            const stats = await stat(filePath);
            const templateName = file.replace('.md', '');
            const templateType = this.inferTemplateType(templateName);

            templates.push({
              templateId: `${this.generateProjectId()}-${templateName}`,
              projectId: this.generateProjectId(),
              templateName,
              fileName: file,
              filePath,
              templateType,
              lastModified: stats.mtime.toISOString(),
              accessCount: 0 // Initialize access tracking
            });
          } catch (error: any) {
            console.warn(`[SpecKit] Error accessing template file ${filePath}: ${error.message}`);
            // Skip this file
          }
        }
      }

      // Log template access patterns
      const templateTypes = templates.reduce((acc, template) => {
        acc[template.templateType] = (acc[template.templateType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`[SpecKit] Templates loaded: ${templates.length} templates found for project ${this.generateProjectId()}`);
      console.log(`[SpecKit] Template types distribution: ${JSON.stringify(templateTypes)}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Templates directory not found at ${templatesPath} for project ${this.generateProjectId()} - .specify/templates/ directory may not exist`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing templates directory: ${templatesPath}`);
      } else {
        console.warn(`[SpecKit] Error loading templates for project ${this.generateProjectId()}: ${error.message}`);
      }
      // Templates directory doesn't exist - return empty array for graceful degradation
    }

    return templates;
  }

  async getScripts(): Promise<any[]> {
    const scripts: any[] = [];
    const scriptsPath = join(this.projectPath, '.specify', 'scripts', 'bash');

    try {
      const files = await readdir(scriptsPath);

      for (const file of files) {
        if (file.endsWith('.sh')) {
          const filePath = join(scriptsPath, file);
          
          try {
            const stats = await stat(filePath);
            const scriptName = file.replace('.sh', '');
            const description = await this.extractScriptDescription(filePath);

            scripts.push({
              scriptId: `${this.generateProjectId()}-${scriptName}`,
              projectId: this.generateProjectId(),
              scriptName,
              fileName: file,
              filePath,
              description: description || 'No description available',
              lastModified: stats.mtime.toISOString()
            });
          } catch (error: any) {
            console.warn(`[SpecKit] Error accessing script file ${filePath}: ${error.message}`);
            // Skip this file
          }
        }
      }

      console.log(`[SpecKit] Scripts loaded: ${scripts.length} scripts found for project ${this.generateProjectId()}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Scripts directory not found at ${scriptsPath} for project ${this.generateProjectId()} - .specify/scripts/bash/ directory may not exist`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing scripts directory: ${scriptsPath}`);
      } else {
        console.warn(`[SpecKit] Error loading scripts for project ${this.generateProjectId()}: ${error.message}`);
      }
      // Scripts directory doesn't exist - return empty array for graceful degradation
    }

    return scripts;
  }

  async getSpecs(): Promise<any[]> {
    const startTime = Date.now();
    const specs: any[] = [];
    const specsPath = join(this.projectPath, 'specs');

    try {
      const entries = await readdir(specsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && /^\d{3}-[a-z0-9-]+$/.test(entry.name)) {
          try {
            const spec = await this.parseSpecDirectory(entry.name);
            if (spec) {
              specs.push(spec);
            }
          } catch (error: any) {
            console.warn(`[SpecKit] Error parsing spec directory ${entry.name}: ${error.message}`);
            // Continue with other specs
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Specs directory not found: ${specsPath} - project may not have specs yet`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing specs directory: ${specsPath}`);
      } else {
        console.warn(`[SpecKit] Error reading specs directory ${specsPath}: ${error.message}`);
      }
      // Return empty array for graceful degradation
    }

    const parseDuration = Date.now() - startTime;
    const structureComplexity = this.calculateStructureComplexity(specs);
    
    // Log spec parsing operations
    logSpecParsed(this.generateProjectId(), specs.length, structureComplexity);
    console.log(`[SpecKit] Spec parsing completed in ${parseDuration}ms for project ${this.generateProjectId()}`);

    return specs.sort((a, b) => a.featureNumber.localeCompare(b.featureNumber));
  }

  private calculateStructureComplexity(specs: any[]): number {
    let complexity = 0;
    
    for (const spec of specs) {
      // Base complexity for each spec
      complexity += 1;
      
      // Add complexity for subdirectories
      complexity += spec.subdirectories.length * 0.5;
      
      // Add complexity for task files
      complexity += spec.taskFiles.length * 0.3;
      
      // Add complexity for having standard files
      if (spec.hasSpec) complexity += 0.2;
      if (spec.hasPlan) complexity += 0.2;
      if (spec.hasTasks) complexity += 0.2;
    }
    
    return Math.round(complexity * 100) / 100; // Round to 2 decimal places
  }

  private extractCommandName(fileName: string): string | null {
    const match = fileName.match(/^speckit\.([a-z]+)\.md$/);
    return match ? match[1] : null;
  }

  private generateProjectId(): string {
    // Generate a simple hash of project path for now
    let hash = 0;
    for (let i = 0; i < this.projectPath.length; i++) {
      const char = this.projectPath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  }

  private countPrinciples(content: string): number {
    // Simple heuristic: count markdown headers that might be principles
    const headerMatches = content.match(/^#{1,3}\s/gm);
    return headerMatches ? headerMatches.length : 0;
  }

  private extractVersion(content: string): string | undefined {
    // Look for version patterns in the content
    const versionPatterns = [
      /version[:\s]+([0-9]+\.[0-9]+\.[0-9]+)/i,
      /v([0-9]+\.[0-9]+\.[0-9]+)/i,
      /^#\s.*\b([0-9]+\.[0-9]+\.[0-9]+)\b/im
    ];

    for (const pattern of versionPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  private async extractScriptDescription(filePath: string): Promise<string | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Look for description in the first few lines
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();

        // Check for common comment patterns
        if (line.startsWith('# Description:')) {
          return line.substring('# Description:'.length).trim();
        }
        if (line.startsWith('# ')) {
          // If it's just a comment, use it as description
          return line.substring(2).trim();
        }
        if (line.startsWith('#!/')) {
          // Skip shebang
          continue;
        }
        if (line === '') {
          // Skip empty lines
          continue;
        }
        // Stop looking if we hit actual code
        break;
      }

      return null;
    } catch (error: any) {
      console.warn(`[SpecKit] Error reading script file ${filePath} for description: ${error.message}`);
      return null;
    }
  }

  private inferTemplateType(templateName: string): string {
    if (templateName.includes('spec')) return 'spec';
    if (templateName.includes('plan')) return 'plan';
    if (templateName.includes('task')) return 'tasks';
    if (templateName.includes('checklist')) return 'checklist';
    return 'other';
  }

  private async parseSpecDirectory(dirName: string): Promise<SpecDirectory | null> {
    const [featureNumber, ...nameParts] = dirName.split('-');
    const featureName = nameParts.join('-');
    const dirPath = join(this.projectPath, 'specs', dirName);

    try {
      const stats = await stat(dirPath);
      if (!stats.isDirectory()) {
        console.log(`[SpecKit] Skipping non-directory spec path: ${dirPath}`);
        return null;
      }
      
      const specFiles = await this.detectSpecFiles(dirPath);

      return {
        specId: `${this.generateProjectId()}-${featureNumber}`,
        projectId: this.generateProjectId(),
        featureNumber,
        featureName,
        directoryName: dirName,
        directoryPath: dirPath,
        hasSpec: specFiles.hasSpec,
        hasPlan: specFiles.hasPlan,
        hasTasks: specFiles.hasTasks,
        subdirectories: specFiles.subdirectories,
        taskFiles: specFiles.taskFiles,
        createdAt: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString()
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`[SpecKit] Spec directory no longer exists: ${dirPath}`);
      } else if (error.code === 'EACCES') {
        console.warn(`[SpecKit] Permission denied accessing spec directory: ${dirPath}`);
      } else {
        console.warn(`[SpecKit] Error accessing spec directory ${dirPath}: ${error.message}`);
      }
      return null;
    }
  }

  async detectSpecFiles(specDirPath: string): Promise<{
    hasSpec: boolean;
    hasPlan: boolean;
    hasTasks: boolean;
    subdirectories: string[];
    taskFiles: string[];
  }> {
    try {
      const entries = await readdir(specDirPath, { withFileTypes: true });

      // Check for standard files
      const hasSpec = entries.some((e: any) => e.name === 'spec.md');
      const hasPlan = entries.some((e: any) => e.name === 'plan.md');
      const hasTasks = entries.some((e: any) => e.name === 'tasks.md');

      // Get subdirectories
      const subdirectories = await this.detectSpecSubdirectories(specDirPath);

      // Get task files (tasks-phase*.md pattern)
      const taskFiles = entries
        .filter((e: any) => e.isFile() && /^tasks-phase.*\.md$/.test(e.name))
        .map((e: any) => e.name);

      return {
        hasSpec,
        hasPlan,
        hasTasks,
        subdirectories,
        taskFiles
      };
    } catch (error: any) {
      console.warn(`[SpecKit] Error detecting spec files in ${specDirPath}: ${error.message}`);
      // Return defaults
      return {
        hasSpec: false,
        hasPlan: false,
        hasTasks: false,
        subdirectories: [],
        taskFiles: []
      };
    }
  }

  async detectSpecSubdirectories(specDirPath: string): Promise<string[]> {
    try {
      const entries = await readdir(specDirPath, { withFileTypes: true });

      // Filter for known spec subdirectories
      const knownSubdirs = ['checklists', 'contracts', 'backups', 'scripts', 'github-issue-templates'];

      return entries
        .filter((e: any) => e.isDirectory() && knownSubdirs.includes(e.name))
        .map((e: any) => e.name);
    } catch (error: any) {
      console.warn(`[SpecKit] Error detecting spec subdirectories in ${specDirPath}: ${error.message}`);
      return [];
    }
  }
}