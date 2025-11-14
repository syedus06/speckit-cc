import { createServer } from 'net';

// Dashboard constants
export const DASHBOARD_TEST_MESSAGE = 'MCP Workflow Dashboard Online!';

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, '0.0.0.0', () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

export async function findAvailablePort(): Promise<number> {
  // Use industry standard ephemeral port range (49152-65535)
  const ephemeralStart = 49152;
  const ephemeralEnd = 65535;
  
  // Generate a random starting point to avoid always using the same ports
  const randomStart = ephemeralStart + Math.floor(Math.random() * 1000);
  
  for (let port = randomStart; port <= ephemeralEnd; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // If we didn't find one from random start to end, try from beginning to random start
  for (let port = ephemeralStart; port < randomStart; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  throw new Error(`No available ephemeral port found in range ${ephemeralStart}-${ephemeralEnd}`);
}

/**
 * Check if a specific port is available for use
 * @param port The port number to check
 * @returns Promise<boolean> true if port is available, false otherwise
 */
export async function isSpecificPortAvailable(port: number): Promise<boolean> {
  return isPortAvailable(port);
}

/**
 * Check if an existing dashboard is running on the specified port
 * @param port The port number to check
 * @returns Promise<boolean> true if a dashboard is running, false otherwise
 */
export async function checkExistingDashboard(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/api/test`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000) // 1 second timeout
    });
    
    if (response.ok) {
      const data = await response.json() as { message?: string };
      // Check if it's actually our dashboard
      return data.message === DASHBOARD_TEST_MESSAGE;
    }
    return false;
  } catch {
    // Connection failed or timeout - no dashboard running
    return false;
  }
}

/**
 * Validate a port number and check if it's available
 * @param port The port number to validate and check
 * @param skipDashboardCheck Optional flag to skip checking for existing dashboard
 * @returns Promise<void> throws error if invalid or unavailable
 */
export async function validateAndCheckPort(port: number, skipDashboardCheck: boolean = false): Promise<void> {
  // Validate port range first
  if (port < 1024 || port > 65535) {
    throw new Error(`Port ${port} is out of range. Port must be between 1024 and 65535.`);
  }
  
  // Check if it's our dashboard first (more efficient when dashboard exists)
  if (!skipDashboardCheck) {
    const isDashboard = await checkExistingDashboard(port);
    if (isDashboard) {
      // Let caller handle existing dashboard scenario
      throw new Error(`Port ${port} is already in use by an existing dashboard instance.`);
    }
  }
  
  // Only check general port availability if it's not our dashboard
  const available = await isSpecificPortAvailable(port);
  if (!available) {
    throw new Error(`Port ${port} is already in use. Please choose a different port or omit --port to use an ephemeral port.`);
  }
}

// Spec-Kit Logging Infrastructure

export interface SpecKitLogEvent {
  event: string;
  projectId?: string;
  projectPath?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Log spec-kit project discovery
 */
export function logProjectDiscovered(projectId: string, projectPath: string): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'project.discovered',
    projectId,
    projectPath,
    timestamp: new Date().toISOString(),
    metadata: {
      action: 'spec-kit project detected during root directory scan'
    }
  };
  console.log(`[SpecKit] Project discovered: ${projectId} at ${projectPath}`);
  return event;
}

/**
 * Log AI agent detection
 */
export function logAgentDetected(projectId: string, agentName: string, commandCount: number): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'agent.detected',
    projectId,
    timestamp: new Date().toISOString(),
    metadata: {
      agentName,
      commandCount,
      action: 'AI agent folder discovered with speckit commands'
    }
  };
  console.log(`[SpecKit] Agent detected: ${agentName} (${commandCount} commands) in project ${projectId}`);
  return event;
}

/**
 * Log scan completion
 */
export function logScanCompleted(rootDirectory: string, projectCount: number, scanDuration: number, errors: any[]): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'scan.completed',
    timestamp: new Date().toISOString(),
    metadata: {
      rootDirectory,
      projectCount,
      scanDuration,
      errorCount: errors.length,
      action: 'root directory scan completed'
    }
  };
  console.log(`[SpecKit] Scan completed: ${projectCount} projects found in ${scanDuration}ms from ${rootDirectory}`);
  if (errors.length > 0) {
    console.warn(`[SpecKit] Scan had ${errors.length} errors`);
  }
  return event;
}

/**
 * Log scan failure
 */
export function logScanFailed(rootDirectory: string, error: Error): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'scan.failed',
    timestamp: new Date().toISOString(),
    metadata: {
      rootDirectory,
      error: error.message,
      action: 'root directory scan failed'
    }
  };
  console.error(`[SpecKit] Scan failed for ${rootDirectory}: ${error.message}`);
  return event;
}

/**
 * Log spec parsing operations
 */
export function logSpecParsed(projectId: string, specCount: number, structureComplexity: number): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'spec.parsed',
    projectId,
    timestamp: new Date().toISOString(),
    metadata: {
      specCount,
      structureComplexity,
      action: 'spec directory structure parsed'
    }
  };
  console.log(`[SpecKit] Specs parsed: ${specCount} specs with complexity ${structureComplexity} in project ${projectId}`);
  return event;
}

/**
 * Log constitution access
 */
export function logConstitutionAccessed(projectId: string, hasConstitution: boolean): SpecKitLogEvent {
  const event: SpecKitLogEvent = {
    event: 'constitution.accessed',
    projectId,
    timestamp: new Date().toISOString(),
    metadata: {
      hasConstitution,
      action: 'project constitution accessed'
    }
  };
  console.log(`[SpecKit] Constitution accessed: ${hasConstitution ? 'found' : 'not found'} in project ${projectId}`);
  return event;
}

// Performance Metrics Infrastructure

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceSummary {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastRecorded: string;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000; // Keep last 1000 metrics

  /**
   * Record a performance metric
   */
  record(operation: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.metrics.push(metric);

    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift(); // Remove oldest
    }

    // Log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Get performance summary for an operation
   */
  getSummary(operation: string): PerformanceSummary | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      operation,
      count: operationMetrics.length,
      totalDuration,
      averageDuration: totalDuration / operationMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      lastRecorded: operationMetrics[operationMetrics.length - 1].timestamp
    };
  }

  /**
   * Get all performance summaries
   */
  getAllSummaries(): PerformanceSummary[] {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    return operations.map(op => this.getSummary(op)).filter((s): s is PerformanceSummary => s !== null);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(threshold: number = 100): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

/**
 * Time a function execution and record the performance metric
 */
export async function timeOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceTracker.record(operation, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceTracker.record(`${operation}.error`, duration, { ...metadata, error: String(error) });
    throw error;
  }
}

/**
 * Time a synchronous function execution and record the performance metric
 */
export function timeSyncOperation<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceTracker.record(operation, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceTracker.record(`${operation}.error`, duration, { ...metadata, error: String(error) });
    throw error;
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics(): {
  summaries: PerformanceSummary[];
  slowOperations: PerformanceMetric[];
  totalMetrics: number;
} {
  return {
    summaries: performanceTracker.getAllSummaries(),
    slowOperations: performanceTracker.getSlowOperations(),
    totalMetrics: performanceTracker.getAllSummaries().reduce((sum, s) => sum + s.count, 0)
  };
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  performanceTracker.clear();
}