import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
/**
 * Manages the global dashboard session
 * Stores dashboard connection info in ~/.spec-workflow-mcp/activeSession.json
 */
export class DashboardSessionManager {
    sessionDir;
    sessionPath;
    constructor() {
        this.sessionDir = join(homedir(), '.spec-workflow-mcp');
        this.sessionPath = join(this.sessionDir, 'activeSession.json');
    }
    /**
     * Ensure the session directory exists
     */
    async ensureSessionDir() {
        try {
            await fs.mkdir(this.sessionDir, { recursive: true });
        }
        catch (error) {
            // Directory might already exist, ignore
        }
    }
    /**
     * Read the session file
     */
    async readSession() {
        await this.ensureSessionDir();
        try {
            const content = await fs.readFile(this.sessionPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist yet
                return null;
            }
            throw error;
        }
    }
    /**
     * Write the session file atomically
     */
    async writeSession(session) {
        await this.ensureSessionDir();
        const content = JSON.stringify(session, null, 2);
        // Write to temporary file first, then rename for atomic operation
        const tempPath = `${this.sessionPath}.tmp`;
        await fs.writeFile(tempPath, content, 'utf-8');
        await fs.rename(tempPath, this.sessionPath);
    }
    /**
     * Check if a process is still running
     */
    isProcessAlive(pid) {
        try {
            // Sending signal 0 checks if process exists without actually sending a signal
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Register the dashboard session
     */
    async registerDashboard(url, port, pid) {
        const session = {
            url,
            port,
            pid,
            startedAt: new Date().toISOString()
        };
        await this.writeSession(session);
    }
    /**
     * Unregister the dashboard session
     */
    async unregisterDashboard() {
        try {
            await fs.unlink(this.sessionPath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    /**
     * Get the current dashboard session if it's valid
     */
    async getDashboardSession() {
        const session = await this.readSession();
        if (!session) {
            return null;
        }
        // Check if the dashboard process is still alive
        if (!this.isProcessAlive(session.pid)) {
            // Process is dead, clean up
            try {
                await this.unregisterDashboard();
            }
            catch (error) {
                // Ignore cleanup errors
            }
            return null;
        }
        return session;
    }
    /**
     * Check if a dashboard is currently running
     */
    async isDashboardRunning() {
        const session = await this.getDashboardSession();
        return session !== null;
    }
}
//# sourceMappingURL=dashboard-session.js.map