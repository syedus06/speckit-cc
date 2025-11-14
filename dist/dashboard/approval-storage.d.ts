import { EventEmitter } from 'events';
export interface ApprovalComment {
    type: 'selection' | 'general';
    selectedText?: string;
    comment: string;
    timestamp: string;
    lineNumber?: number;
    characterPosition?: number;
    highlightColor?: string;
}
export interface DocumentSnapshot {
    id: string;
    approvalId: string;
    approvalTitle: string;
    version: number;
    timestamp: string;
    trigger: 'initial' | 'revision_requested' | 'approved' | 'manual';
    status: 'pending' | 'approved' | 'rejected' | 'needs-revision';
    content: string;
    fileStats: {
        size: number;
        lines: number;
        lastModified: string;
    };
    comments?: ApprovalComment[];
    annotations?: string;
}
export interface SnapshotMetadata {
    approvalId: string;
    currentVersion: number;
    snapshots: {
        version: number;
        filename: string;
        timestamp: string;
        trigger: string;
    }[];
}
export interface FileSnapshotMetadata {
    filePath: string;
    currentVersion: number;
    snapshots: {
        version: number;
        filename: string;
        timestamp: string;
        trigger: string;
        approvalId: string;
        approvalTitle: string;
    }[];
}
export interface DiffResult {
    additions: number;
    deletions: number;
    changes: number;
    chunks: DiffChunk[];
}
export interface DiffChunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}
export interface DiffLine {
    type: 'add' | 'delete' | 'normal';
    oldLineNumber?: number;
    newLineNumber?: number;
    content: string;
}
export interface ApprovalRequest {
    id: string;
    title: string;
    filePath: string;
    type: 'document' | 'action';
    status: 'pending' | 'approved' | 'rejected' | 'needs-revision';
    createdAt: string;
    respondedAt?: string;
    response?: string;
    annotations?: string;
    comments?: ApprovalComment[];
    revisionHistory?: {
        version: number;
        content: string;
        timestamp: string;
        reason?: string;
    }[];
    metadata?: Record<string, any>;
    category: 'spec' | 'steering';
    categoryName: string;
}
export declare class ApprovalStorage extends EventEmitter {
    projectPath: string;
    private approvalsDir;
    private watcher?;
    constructor(projectPath: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    createApproval(title: string, filePath: string, category: 'spec' | 'steering', categoryName: string, type?: 'document' | 'action', metadata?: Record<string, any>): Promise<string>;
    getApproval(id: string): Promise<ApprovalRequest | null>;
    private findApprovalPath;
    updateApproval(id: string, status: 'approved' | 'rejected' | 'needs-revision', response: string, annotations?: string, comments?: ApprovalComment[]): Promise<void>;
    createRevision(originalId: string, newContent: string, reason?: string): Promise<string>;
    getAllPendingApprovals(): Promise<ApprovalRequest[]>;
    getAllApprovals(): Promise<ApprovalRequest[]>;
    deleteApproval(id: string): Promise<boolean>;
    cleanupOldApprovals(maxAgeDays?: number): Promise<void>;
    captureSnapshot(approvalId: string, trigger: 'initial' | 'revision_requested' | 'approved' | 'manual'): Promise<void>;
    getSnapshots(approvalId: string): Promise<DocumentSnapshot[]>;
    getSnapshot(approvalId: string, version: number): Promise<DocumentSnapshot | null>;
    getCurrentFileContent(approvalId: string): Promise<string | null>;
    compareSnapshots(approvalId: string, fromVersion: number, toVersion: number | 'current'): Promise<DiffResult>;
    private generateSnapshotId;
    private generateId;
}
//# sourceMappingURL=approval-storage.d.ts.map