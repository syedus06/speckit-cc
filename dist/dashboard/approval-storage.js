import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, isAbsolute, resolve, basename } from 'path';
import chokidar from 'chokidar';
import { PathUtils } from '../core/path-utils.js';
export class ApprovalStorage extends EventEmitter {
    projectPath; // Make public so dashboard server can access it
    approvalsDir;
    watcher;
    constructor(projectPath) {
        super();
        // Validate project path
        if (!projectPath || projectPath.trim() === '') {
            throw new Error('Project path cannot be empty');
        }
        // Resolve to absolute path
        const resolvedPath = resolve(projectPath);
        // Prevent root directory usage which causes permission errors
        if (resolvedPath === '/' || resolvedPath === '\\' || resolvedPath.match(/^[A-Z]:\\?$/)) {
            throw new Error(`Invalid project path: ${resolvedPath}. Cannot use root directory for spec workflow.`);
        }
        this.projectPath = resolvedPath;
        this.approvalsDir = PathUtils.getApprovalsPath(resolvedPath);
    }
    async start() {
        // Create the approvals directory (empty) so watcher can establish properly
        await fs.mkdir(this.approvalsDir, { recursive: true });
        // Set up file watcher for approval directory and all subdirectories
        // This will catch new directories and files created dynamically
        this.watcher = chokidar.watch(`${this.approvalsDir}/**/*.json`, {
            ignoreInitial: false,
            persistent: true,
            ignorePermissionErrors: true
        });
        this.watcher.on('add', () => this.emit('approval-change'));
        this.watcher.on('change', () => this.emit('approval-change'));
        this.watcher.on('unlink', () => this.emit('approval-change'));
    }
    async stop() {
        if (this.watcher) {
            // Remove all listeners before closing to prevent memory leaks
            this.watcher.removeAllListeners();
            await this.watcher.close();
            this.watcher = undefined;
        }
        // Clean up EventEmitter listeners
        this.removeAllListeners();
    }
    async createApproval(title, filePath, category, categoryName, type = 'document', metadata) {
        const id = this.generateId();
        const approval = {
            id,
            title,
            filePath,
            type,
            status: 'pending',
            createdAt: new Date().toISOString(),
            metadata,
            category,
            categoryName
        };
        // Create category directory if it doesn't exist
        const categoryDir = join(this.approvalsDir, categoryName);
        await fs.mkdir(categoryDir, { recursive: true });
        const approvalFilePath = join(categoryDir, `${id}.json`);
        await fs.writeFile(approvalFilePath, JSON.stringify(approval, null, 2), 'utf-8');
        // Capture initial snapshot
        try {
            await this.captureSnapshot(id, 'initial');
        }
        catch (error) {
            // Log error but don't fail the approval creation
            console.warn(`Failed to capture initial snapshot for approval ${id}:`, error);
        }
        return id;
    }
    async getApproval(id) {
        // Search across all categories and names
        try {
            const approvalPath = await this.findApprovalPath(id);
            if (!approvalPath)
                return null;
            const content = await fs.readFile(approvalPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async findApprovalPath(id) {
        // Search in approvals directory directly (no 'specs' subfolder)
        try {
            const categoryNames = await fs.readdir(this.approvalsDir, { withFileTypes: true });
            for (const categoryName of categoryNames) {
                if (categoryName.isDirectory()) {
                    const approvalPath = join(this.approvalsDir, categoryName.name, `${id}.json`);
                    try {
                        await fs.access(approvalPath);
                        return approvalPath;
                    }
                    catch {
                        // File doesn't exist in this location, continue searching
                    }
                }
            }
        }
        catch {
            // Approvals directory doesn't exist
        }
        return null;
    }
    async updateApproval(id, status, response, annotations, comments) {
        const approval = await this.getApproval(id);
        if (!approval) {
            throw new Error(`Approval ${id} not found`);
        }
        // Capture snapshot before status change for certain transitions
        if (status === 'needs-revision') {
            try {
                await this.captureSnapshot(id, 'revision_requested');
            }
            catch (error) {
                console.warn(`Failed to capture revision snapshot for approval ${id}:`, error);
            }
        }
        else if (status === 'approved') {
            try {
                await this.captureSnapshot(id, 'approved');
            }
            catch (error) {
                console.warn(`Failed to capture approval snapshot for approval ${id}:`, error);
            }
        }
        approval.status = status;
        approval.response = response;
        approval.annotations = annotations;
        approval.respondedAt = new Date().toISOString();
        if (comments) {
            approval.comments = comments;
        }
        const filePath = await this.findApprovalPath(id);
        if (!filePath) {
            throw new Error(`Approval ${id} file not found`);
        }
        await fs.writeFile(filePath, JSON.stringify(approval, null, 2), 'utf-8');
    }
    async createRevision(originalId, newContent, reason) {
        const originalApproval = await this.getApproval(originalId);
        if (!originalApproval) {
            throw new Error(`Original approval ${originalId} not found`);
        }
        if (!originalApproval.filePath) {
            throw new Error(`Approval ${originalId} has no file path for revision`);
        }
        // Read the current file content for revision history
        const filePath = isAbsolute(originalApproval.filePath)
            ? originalApproval.filePath
            : join(this.projectPath, originalApproval.filePath);
        let currentContent = '';
        try {
            currentContent = await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            // Could not read file for revision history
        }
        // Add to revision history
        if (!originalApproval.revisionHistory) {
            originalApproval.revisionHistory = [];
        }
        const version = (originalApproval.revisionHistory.length || 0) + 1;
        originalApproval.revisionHistory.push({
            version: version - 1,
            content: currentContent,
            timestamp: originalApproval.respondedAt || originalApproval.createdAt,
            reason: reason
        });
        // Write the new content to the file
        await fs.writeFile(filePath, newContent, 'utf-8');
        // Reset approval status for re-review
        originalApproval.status = 'pending';
        originalApproval.response = undefined;
        originalApproval.annotations = undefined;
        originalApproval.comments = undefined;
        originalApproval.respondedAt = undefined;
        const approvalFilePath = await this.findApprovalPath(originalId);
        if (!approvalFilePath) {
            throw new Error(`Approval ${originalId} file not found`);
        }
        await fs.writeFile(approvalFilePath, JSON.stringify(originalApproval, null, 2), 'utf-8');
        return originalId;
    }
    async getAllPendingApprovals() {
        const allApprovals = await this.getAllApprovals();
        return allApprovals.filter(approval => approval.status === 'pending');
    }
    async getAllApprovals() {
        try {
            const approvals = [];
            try {
                const categoryNames = await fs.readdir(this.approvalsDir, { withFileTypes: true });
                for (const categoryName of categoryNames) {
                    if (categoryName.isDirectory()) {
                        const categoryPath = join(this.approvalsDir, categoryName.name);
                        try {
                            const approvalFiles = await fs.readdir(categoryPath);
                            for (const file of approvalFiles) {
                                if (file.endsWith('.json')) {
                                    try {
                                        const content = await fs.readFile(join(categoryPath, file), 'utf-8');
                                        const approval = JSON.parse(content);
                                        approvals.push(approval);
                                    }
                                    catch (error) {
                                        // Error reading approval file
                                    }
                                }
                            }
                        }
                        catch (error) {
                            // Error reading category directory
                        }
                    }
                }
            }
            catch {
                // Approvals directory doesn't exist
            }
            // Sort by creation date (newest first)
            return approvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch {
            return [];
        }
    }
    async deleteApproval(id) {
        try {
            const approvalPath = await this.findApprovalPath(id);
            if (!approvalPath)
                return false;
            // Delete the approval file
            await fs.unlink(approvalPath);
            // NOTE: We DO NOT delete snapshots since they are now shared across approvals for the same file
            // Snapshots are stored in .snapshots/{filename}/ and should persist across approval cycles
            return true;
        }
        catch {
            return false;
        }
    }
    async cleanupOldApprovals(maxAgeDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
        try {
            const files = await fs.readdir(this.approvalsDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(join(this.approvalsDir, file), 'utf-8');
                        const approval = JSON.parse(content);
                        const createdAt = new Date(approval.createdAt);
                        if (createdAt < cutoffDate && approval.status !== 'pending') {
                            await fs.unlink(join(this.approvalsDir, file));
                        }
                    }
                    catch (error) {
                        // Error processing approval file
                    }
                }
            }
        }
        catch (error) {
            // Error cleaning up old approvals
        }
    }
    // Snapshot Management Methods
    async captureSnapshot(approvalId, trigger) {
        const approval = await this.getApproval(approvalId);
        if (!approval || !approval.filePath) {
            throw new Error(`Approval ${approvalId} not found or has no file path`);
        }
        // Read current file content
        const filePath = isAbsolute(approval.filePath)
            ? approval.filePath
            : join(this.projectPath, approval.filePath);
        let content;
        let stats;
        try {
            content = await fs.readFile(filePath, 'utf-8');
            stats = await fs.stat(filePath);
        }
        catch (error) {
            throw new Error(`Failed to read file for snapshot: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Create file-based snapshots directory
        const categoryDir = join(this.approvalsDir, approval.categoryName || 'default');
        const snapshotsDir = join(categoryDir, '.snapshots', basename(approval.filePath));
        await fs.mkdir(snapshotsDir, { recursive: true });
        // Load or create metadata
        const metadataPath = join(snapshotsDir, 'metadata.json');
        let metadata;
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent);
        }
        catch {
            metadata = {
                filePath: approval.filePath,
                currentVersion: 0,
                snapshots: []
            };
        }
        // Check for duplicate initial snapshots
        if (trigger === 'initial') {
            const existingInitial = metadata.snapshots.find(s => s.trigger === 'initial');
            if (existingInitial) {
                console.log(`Initial snapshot already exists for ${approval.filePath}, skipping creation`);
                return;
            }
        }
        // Create new snapshot
        const version = metadata.currentVersion + 1;
        const snapshotId = `snapshot-${version.toString().padStart(3, '0')}`;
        const timestamp = new Date().toISOString();
        const snapshot = {
            id: this.generateSnapshotId(),
            approvalId,
            approvalTitle: approval.title,
            version,
            timestamp,
            trigger,
            status: approval.status,
            content,
            fileStats: {
                size: stats.size,
                lines: content.split('\n').length,
                lastModified: stats.mtime.toISOString()
            },
            comments: approval.comments || [],
            annotations: approval.annotations || undefined
        };
        // Write snapshot to disk
        const snapshotPath = join(snapshotsDir, `${snapshotId}.json`);
        await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
        // Update metadata
        metadata.currentVersion = version;
        metadata.snapshots.push({
            version,
            filename: `${snapshotId}.json`,
            timestamp,
            trigger,
            approvalId,
            approvalTitle: approval.title
        });
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }
    async getSnapshots(approvalId) {
        const approval = await this.getApproval(approvalId);
        if (!approval || !approval.filePath)
            return [];
        // Get snapshots based on file path, not approval ID
        const categoryDir = join(this.approvalsDir, approval.categoryName || 'default');
        const snapshotsDir = join(categoryDir, '.snapshots', basename(approval.filePath));
        const metadataPath = join(snapshotsDir, 'metadata.json');
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            const snapshots = [];
            for (const snapMeta of metadata.snapshots) {
                const snapPath = join(snapshotsDir, snapMeta.filename);
                const snapshotContent = await fs.readFile(snapPath, 'utf-8');
                const snapshot = JSON.parse(snapshotContent);
                snapshots.push(snapshot);
            }
            return snapshots.sort((a, b) => a.version - b.version);
        }
        catch {
            return [];
        }
    }
    async getSnapshot(approvalId, version) {
        const snapshots = await this.getSnapshots(approvalId);
        return snapshots.find(s => s.version === version) || null;
    }
    async getCurrentFileContent(approvalId) {
        const approval = await this.getApproval(approvalId);
        if (!approval || !approval.filePath)
            return null;
        const filePath = isAbsolute(approval.filePath)
            ? approval.filePath
            : join(this.projectPath, approval.filePath);
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch {
            return null;
        }
    }
    async compareSnapshots(approvalId, fromVersion, toVersion) {
        let fromContent;
        let toContent;
        if (fromVersion === 0) {
            fromContent = '';
        }
        else {
            const fromSnapshot = await this.getSnapshot(approvalId, fromVersion);
            if (!fromSnapshot) {
                throw new Error(`Snapshot version ${fromVersion} not found`);
            }
            fromContent = fromSnapshot.content;
        }
        if (toVersion === 'current') {
            const currentContent = await this.getCurrentFileContent(approvalId);
            if (currentContent === null) {
                throw new Error(`Could not read current file content for approval ${approvalId}`);
            }
            toContent = currentContent;
        }
        else {
            const toSnapshot = await this.getSnapshot(approvalId, toVersion);
            if (!toSnapshot) {
                throw new Error(`Snapshot version ${toVersion} not found`);
            }
            toContent = toSnapshot.content;
        }
        // Basic diff computation (we'll enhance this when we add the diff library)
        const fromLines = fromContent.split('\n');
        const toLines = toContent.split('\n');
        // Simple line-by-line comparison for now
        const diffLines = [];
        let additions = 0;
        let deletions = 0;
        let changes = 0;
        // This is a very basic implementation - will be replaced with proper diff library
        const maxLines = Math.max(fromLines.length, toLines.length);
        for (let i = 0; i < maxLines; i++) {
            const fromLine = fromLines[i];
            const toLine = toLines[i];
            if (fromLine !== undefined && toLine !== undefined) {
                if (fromLine === toLine) {
                    diffLines.push({
                        type: 'normal',
                        oldLineNumber: i + 1,
                        newLineNumber: i + 1,
                        content: fromLine
                    });
                }
                else {
                    changes++;
                    diffLines.push({
                        type: 'delete',
                        oldLineNumber: i + 1,
                        content: fromLine
                    });
                    diffLines.push({
                        type: 'add',
                        newLineNumber: i + 1,
                        content: toLine
                    });
                }
            }
            else if (fromLine !== undefined) {
                deletions++;
                diffLines.push({
                    type: 'delete',
                    oldLineNumber: i + 1,
                    content: fromLine
                });
            }
            else if (toLine !== undefined) {
                additions++;
                diffLines.push({
                    type: 'add',
                    newLineNumber: i + 1,
                    content: toLine
                });
            }
        }
        return {
            additions,
            deletions,
            changes,
            chunks: [{
                    oldStart: 1,
                    oldLines: fromLines.length,
                    newStart: 1,
                    newLines: toLines.length,
                    lines: diffLines
                }]
        };
    }
    generateSnapshotId() {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateId() {
        return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=approval-storage.js.map