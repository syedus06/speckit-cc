import { SpecKitProjectDTO, WorkflowProjectDTO, ProjectDTO, SpecKitProjectDetailDTO, AIAgentDTO, ConstitutionDTO, SpecDirectoryDTO, TemplateDTO, ScanResultDTO, WebSocketEvent, WebSocketProjectEvent, WebSocketAgentEvent, WebSocketProjectsUpdateEvent, WebSocketSpecUpdateEvent, WebSocketTaskUpdateEvent, WebSocketApprovalUpdateEvent, WebSocketSteeringUpdateEvent, WebSocketImplementationLogUpdateEvent } from '../types';

const API_BASE_URL = '';

export class ApiService {
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Set<(event: WebSocketEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `ws://localhost:3000/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          this.handleWebSocketEvent(wsEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connectWebSocket();
    }, delay);
  }

  private handleWebSocketEvent(event: WebSocketEvent) {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  /**
   * Subscribe to WebSocket events
   * @param eventType The type of event to listen for
   * @param callback Function to call when event is received
   * @returns Unsubscribe function
   */
  onWebSocketEvent<T extends WebSocketEvent>(eventType: T['type'], callback: (event: T) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback as (event: WebSocketEvent) => void);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback as (event: WebSocketEvent) => void);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to project discovery events
   */
  onProjectDiscovered(callback: (event: WebSocketProjectEvent) => void): () => void {
    return this.onWebSocketEvent('project.discovered', callback);
  }

  /**
   * Subscribe to project removal events
   */
  onProjectRemoved(callback: (event: WebSocketProjectEvent) => void): () => void {
    return this.onWebSocketEvent('project.removed', callback);
  }

  /**
   * Subscribe to project update events
   */
  onProjectUpdated(callback: (event: WebSocketProjectEvent) => void): () => void {
    return this.onWebSocketEvent('project.updated', callback);
  }

  /**
   * Subscribe to agent detection events
   */
  onAgentDetected(callback: (event: WebSocketAgentEvent) => void): () => void {
    return this.onWebSocketEvent('agent.detected', callback);
  }

  /**
   * Subscribe to projects list updates
   */
  onProjectsUpdate(callback: (event: WebSocketProjectsUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('projects-update', callback);
  }

  /**
   * Subscribe to spec updates
   */
  onSpecUpdate(callback: (event: WebSocketSpecUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('spec-update', callback);
  }

  /**
   * Subscribe to task status updates
   */
  onTaskUpdate(callback: (event: WebSocketTaskUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('task-status-update', callback);
  }

  /**
   * Subscribe to approval updates
   */
  onApprovalUpdate(callback: (event: WebSocketApprovalUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('approval-update', callback);
  }

  /**
   * Subscribe to steering document updates
   */
  onSteeringUpdate(callback: (event: WebSocketSteeringUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('steering-update', callback);
  }

  /**
   * Subscribe to implementation log updates
   */
  onImplementationLogUpdate(callback: (event: WebSocketImplementationLogUpdateEvent) => void): () => void {
    return this.onWebSocketEvent('implementation-log-update', callback);
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventListeners.clear();
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getProjects(includeStats = false): Promise<{
    projects: ProjectDTO[];
    stats?: {
      total: number;
      byType: {
        'spec-kit': number;
        'spec-workflow-mcp': number;
      };
      lastScanned: string;
    };
  }> {
    const query = includeStats ? '?includeStats=true' : '';
    return this.request(`/api/projects${query}`);
  }

  async getProjectDetails(projectId: string): Promise<SpecKitProjectDetailDTO> {
    return this.request(`/api/projects/${projectId}`);
  }

  async scanProjects(force = false): Promise<{
    scanResult: ScanResultDTO['scanResult'];
    newProjects: string[];
    removedProjects: string[];
  }> {
    return this.request('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  async removeProject(projectId: string): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async addProject(projectPath: string): Promise<{ projectId: string; success: boolean }> {
    return this.request('/api/projects/add', {
      method: 'POST',
      body: JSON.stringify({ projectPath }),
    });
  }

  async getConstitution(projectId: string): Promise<ConstitutionDTO> {
    return this.request(`/api/projects/${projectId}/constitution`);
  }

  async getTemplates(projectId: string): Promise<{ templates: TemplateDTO[] }> {
    return this.request(`/api/projects/${projectId}/templates`);
  }

  async getScripts(projectId: string): Promise<{ scripts: any[] }> {
    return this.request(`/api/projects/${projectId}/scripts`);
  }
}

export const apiService = new ApiService();