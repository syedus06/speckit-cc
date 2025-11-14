import { join, normalize, sep, resolve } from 'path';
import { access, stat, mkdir, readdir } from 'fs/promises';
import { constants } from 'fs';
export class PathUtils {
    /**
     * Safely join paths ensuring no directory traversal
     */
    static safeJoin(basePath, ...paths) {
        // Validate base path
        if (!basePath || typeof basePath !== 'string') {
            throw new Error('Invalid base path');
        }
        // Check each path segment for traversal attempts
        for (const pathSegment of paths) {
            if (pathSegment && (pathSegment.includes('..') || pathSegment.startsWith('/'))) {
                throw new Error(`Invalid path segment: ${pathSegment}`);
            }
        }
        const joined = normalize(join(basePath, ...paths));
        const resolvedBase = resolve(basePath);
        const resolvedJoined = resolve(joined);
        // Ensure the joined path is within the base path
        if (!resolvedJoined.startsWith(resolvedBase)) {
            throw new Error('Path traversal detected in join operation');
        }
        return joined;
    }
    static getWorkflowRoot(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow');
    }
    static getSpecPath(projectPath, specName) {
        return this.safeJoin(projectPath, '.spec-workflow', 'specs', specName);
    }
    static getArchiveSpecPath(projectPath, specName) {
        return this.safeJoin(projectPath, '.spec-workflow', 'archive', 'specs', specName);
    }
    static getArchiveSpecsPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'archive', 'specs');
    }
    static getSteeringPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'steering');
    }
    static getTemplatesPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'templates');
    }
    static getScriptsPath(projectPath) {
        return this.safeJoin(projectPath, '.specify', 'scripts', 'bash');
    }
    static getAgentsPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'agents');
    }
    static getCommandsPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'commands');
    }
    static getApprovalsPath(projectPath) {
        return this.safeJoin(projectPath, '.spec-workflow', 'approvals');
    }
    static getSpecApprovalPath(projectPath, specName) {
        return this.safeJoin(projectPath, '.spec-workflow', 'approvals', specName);
    }
    // Ensure paths work across Windows, macOS, Linux
    static toPlatformPath(path) {
        return path.split('/').join(sep);
    }
    static toUnixPath(path) {
        return path.split(sep).join('/');
    }
    // Get relative path from project root
    static getRelativePath(projectPath, fullPath) {
        const normalizedProject = normalize(projectPath);
        const normalizedFull = normalize(fullPath);
        if (normalizedFull.startsWith(normalizedProject)) {
            return normalizedFull.slice(normalizedProject.length + 1);
        }
        return normalizedFull;
    }
}
export async function validateProjectPath(projectPath) {
    try {
        // Validate input
        if (!projectPath || typeof projectPath !== 'string') {
            throw new Error('Invalid project path: path must be a non-empty string');
        }
        // Check for dangerous path patterns before resolving
        if (projectPath.includes('..') || projectPath.includes('~')) {
            // Normalize the path first to check if it's actually traversing
            const normalized = normalize(projectPath);
            const resolved = resolve(normalized);
            // Get the current working directory for comparison
            const cwd = process.cwd();
            // Additional check: ensure the resolved path doesn't contain parent directory references
            if (normalized.includes('..') && !resolved.startsWith(cwd)) {
                throw new Error(`Path traversal detected: ${projectPath}`);
            }
        }
        // Resolve to absolute path
        const absolutePath = resolve(projectPath);
        // Security check: Ensure the path doesn't escape to system directories
        const systemPaths = ['/etc', '/usr', '/bin', '/sbin', '/var', '/sys', '/proc'];
        const windowsSystemPaths = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)'];
        const allSystemPaths = process.platform === 'win32' ? windowsSystemPaths : systemPaths;
        for (const sysPath of allSystemPaths) {
            if (absolutePath.toLowerCase().startsWith(sysPath.toLowerCase())) {
                throw new Error(`Access to system directory not allowed: ${absolutePath}`);
            }
        }
        // Check if path exists
        await access(absolutePath, constants.F_OK);
        // Ensure it's a directory
        const stats = await stat(absolutePath);
        if (!stats.isDirectory()) {
            throw new Error(`Project path is not a directory: ${absolutePath}`);
        }
        // Final security check: ensure we can actually access this directory
        await access(absolutePath, constants.R_OK | constants.W_OK);
        return absolutePath;
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Project path does not exist: ${projectPath}`);
            }
            else if (error.code === 'EACCES') {
                throw new Error(`Permission denied accessing project path: ${projectPath}`);
            }
            throw error;
        }
        throw new Error(`Unknown error validating project path: ${String(error)}`);
    }
}
export async function ensureDirectoryExists(dirPath) {
    try {
        await access(dirPath, constants.F_OK);
    }
    catch {
        await mkdir(dirPath, { recursive: true });
    }
}
export async function ensureWorkflowDirectory(projectPath) {
    const workflowRoot = PathUtils.getWorkflowRoot(projectPath);
    // Create all necessary subdirectories (approvals created on-demand)
    const directories = [
        workflowRoot,
        PathUtils.getSpecPath(projectPath, ''),
        PathUtils.getArchiveSpecsPath(projectPath),
        PathUtils.getSteeringPath(projectPath),
        PathUtils.getTemplatesPath(projectPath),
        PathUtils.getAgentsPath(projectPath),
        PathUtils.getCommandsPath(projectPath)
    ];
    for (const dir of directories) {
        await ensureDirectoryExists(dir);
    }
    return workflowRoot;
}
export async function detectProjectType(projectPath) {
    try {
        // First check for spec-kit indicator (.specify folder)
        const specifyPath = join(projectPath, '.specify');
        try {
            await access(specifyPath, constants.F_OK);
            const stats = await stat(specifyPath);
            if (stats.isDirectory()) {
                return 'spec-kit';
            }
        }
        catch {
            // .specify doesn't exist with exact case, check case-insensitively on Windows/macOS
            if (process.platform !== 'linux') {
                try {
                    const entries = await readdir(projectPath, { withFileTypes: true });
                    const specifyEntry = entries.find(entry => entry.isDirectory() && entry.name.toLowerCase() === '.specify');
                    if (specifyEntry) {
                        return 'spec-kit';
                    }
                }
                catch {
                    // Ignore errors when checking case-insensitively
                }
            }
        }
        // Check for spec-workflow-mcp indicator (.spec-workflow folder)
        const specWorkflowPath = join(projectPath, '.spec-workflow');
        try {
            await access(specWorkflowPath, constants.F_OK);
            const stats = await stat(specWorkflowPath);
            if (stats.isDirectory()) {
                return 'spec-workflow-mcp';
            }
        }
        catch {
            // .spec-workflow doesn't exist or isn't accessible
        }
        // Neither project type detected
        return null;
    }
    catch (error) {
        // If there's any error accessing the directory, return null
        return null;
    }
}
//# sourceMappingURL=path-utils.js.map