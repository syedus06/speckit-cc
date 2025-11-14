import React, { useEffect, useState } from 'react';
import { useApi } from '../api/api';
import { SpecDirectoryDTO, AIAgentDTO } from '../../types';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  description: string;
  line: string;
}

interface Phase {
  name: string;
  description: string;
  tasks: Task[];
}

function parseTasksMarkdown(content: string): Phase[] {
  const phases: Phase[] = [];
  const lines = content.split('\n');
  let currentPhase: Phase | null = null;
  let currentDescription = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Phase header - matches both "# Phase X" and "## Phase X"
    if (line.match(/^#{1,2}\s+Phase\s+\d+/i)) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      currentPhase = {
        name: line.replace(/^#+\s*/, '').trim(),
        description: '',
        tasks: []
      };
      currentDescription = '';
    }
    // Description lines after phase header
    else if (line.startsWith('**Purpose**:') || line.startsWith('**Goal**:')) {
      if (currentPhase) {
        currentPhase.description = line.replace(/^\*\*[^*]+\*\*:\s*/, '').trim();
      }
    }
    // Tasks - match checkbox format
    else if (line.match(/^-\s*\[(x| |X)\]/i)) {
      if (!currentPhase) {
        // Create a default phase if we find tasks without a phase header
        currentPhase = {
          name: 'Tasks',
          description: '',
          tasks: []
        };
      }

      const completed = line.match(/\[(x|X)\]/i) !== null;
      let taskId = '';
      let description = '';

      // Format 1: **T001**: Description (bold with colon)
      let match = line.match(/\*\*([A-Z]+\d+)\*\*:?\s*(.+)/i);
      if (match) {
        taskId = match[1].trim();
        description = match[2].trim();
      } else {
        // Format 2: T001 [P] [US1] Description (plain with optional markers)
        // Remove checkbox and extract task ID
        match = line.match(/^-\s*\[(x| |X)\]\s+([A-Z]+\d+)\s+(.+)/i);
        if (match) {
          taskId = match[2].trim();
          let rest = match[3].trim();

          // Remove [P] and [US#] markers from description
          rest = rest.replace(/\[P\]/g, '').replace(/\[US\d+\]/g, '').trim();
          description = rest;
        }
      }

      // Extract metadata
      const parallelMatch = line.match(/\[P\]/);
      const userStoryMatch = line.match(/\[US\d+\]/);

      if (taskId) {
        const task: Task = {
          id: taskId,
          completed,
          parallel: parallelMatch !== null,
          userStory: userStoryMatch ? userStoryMatch[0] : undefined,
          description: description || line.replace(/^-\s*\[(x| |X)\]\s*/i, '').trim(),
          line: line.trim()
        };
        currentPhase.tasks.push(task);
      }
    }
  }

  if (currentPhase && currentPhase.tasks.length > 0) {
    phases.push(currentPhase);
  }

  return phases;
}

export function FeatureSpecsPage() {
  const { projectId } = useApi();
  const [specs, setSpecs] = useState<SpecDirectoryDTO[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<SpecDirectoryDTO | null>(null);
  const [tasksContent, setTasksContent] = useState<string>('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AIAgentDTO[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [executionResults, setExecutionResults] = useState<Map<string, { success: boolean; message: string }>>(new Map());
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [taskToExecute, setTaskToExecute] = useState<Task | null>(null);
  const [selectedExecutionAgent, setSelectedExecutionAgent] = useState<string>('');
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [consoleCommand, setConsoleCommand] = useState<string>('');
  const [consoleTaskId, setConsoleTaskId] = useState<string>('');
  const [consoleProgress, setConsoleProgress] = useState<number>(0);
  const navigate = useNavigate();

  const togglePhase = (phaseName: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseName)) {
        newSet.delete(phaseName);
      } else {
        newSet.add(phaseName);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const loadSpecs = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/list`);
        if (response.ok) {
          const data = await response.json();
          setSpecs(data.specs || []);
          if (data.specs && data.specs.length > 0) {
            setSelectedSpec(data.specs[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load specs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpecs();
  }, [projectId]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedSpec || !projectId) return;

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasksContent(data.content || '');
          setPhases(parseTasksMarkdown(data.content || ''));
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasksContent('');
        setPhases([]);
      }
    };

    loadTasks();
  }, [selectedSpec, projectId]);

  useEffect(() => {
    const loadAgents = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/agents`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    };

    loadAgents();
  }, [projectId]);

  const handleToggleTask = async (taskId: string) => {
    if (!selectedSpec || !projectId) return;

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });

      if (response.ok) {
        // Reload tasks to get updated content
        const tasksResponse = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks`);
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setTasksContent(data.content || '');
          setPhases(parseTasksMarkdown(data.content || ''));
        }
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleAssignTask = (task: Task) => {
    setSelectedTask(task);
    setShowAssignModal(true);
    setSelectedAgent('');
    setSelectedCommand('');
  };

  const handleConfirmAssign = async () => {
    if (!selectedTask || !selectedAgent || !selectedSpec || !projectId) return;

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          agentName: selectedAgent,
          command: selectedCommand || undefined
        })
      });

      if (response.ok) {
        // Reload tasks to show assignment
        const tasksResponse = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks`);
        if (tasksResponse.ok) {
          const data = await tasksResponse.json();
          setTasksContent(data.content || '');
          setPhases(parseTasksMarkdown(data.content || ''));
        }
        setShowAssignModal(false);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  };

  const handleExecuteTask = (task: Task) => {
    setTaskToExecute(task);
    setShowExecuteModal(true);
    setSelectedExecutionAgent('');
  };

  const handleConfirmExecute = async () => {
    if (!taskToExecute || !selectedExecutionAgent || !selectedSpec || !projectId) return;

    const task = taskToExecute;
    setShowExecuteModal(false);

    // Open console panel immediately
    setConsoleTaskId(task.id);
    setConsoleCommand(`${selectedExecutionAgent} - Task ${task.id}`);
    setConsoleOutput([`Initializing ${selectedExecutionAgent} agent...`, '']);
    setConsoleProgress(0);
    setShowConsole(true);

    // Mark task as executing
    setExecutingTasks(prev => new Set(prev).add(task.id));

    // Clear previous execution result for this task
    setExecutionResults(prev => {
      const newMap = new Map(prev);
      newMap.delete(task.id);
      return newMap;
    });

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureNumber: selectedSpec.featureNumber,
          taskDescription: task.description,
          agentType: selectedExecutionAgent
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Poll for execution status
        const pollStatus = async (executionId: string, attempts = 0, maxAttempts = 30) => {
          if (attempts >= maxAttempts) {
            setExecutionResults(prev => new Map(prev).set(task.id, {
              success: false,
              message: 'Task execution timed out'
            }));
            setExecutingTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(task.id);
              return newSet;
            });
            return;
          }

          try {
            const statusResponse = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(task.id)}/executions/${encodeURIComponent(executionId)}`);

            if (statusResponse.ok) {
              const status = await statusResponse.json();

              // Update console output and progress if available
              if (status.output && Array.isArray(status.output)) {
                setConsoleOutput(status.output);
              }
              if (typeof status.progress === 'number') {
                setConsoleProgress(status.progress);
              }

              if (status.status === 'completed') {
                setExecutionResults(prev => new Map(prev).set(task.id, {
                  success: true,
                  message: status.message
                }));
                setExecutingTasks(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(task.id);
                  return newSet;
                });

                // Mark task as completed
                await handleToggleTask(task.id);
              } else if (status.status === 'failed') {
                setExecutionResults(prev => new Map(prev).set(task.id, {
                  success: false,
                  message: status.error || status.message
                }));
                setExecutingTasks(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(task.id);
                  return newSet;
                });
              } else {
                // Still running, poll again
                setTimeout(() => pollStatus(executionId, attempts + 1, maxAttempts), 2000);
              }
            } else {
              throw new Error('Failed to fetch execution status');
            }
          } catch (error) {
            console.error('Error polling execution status:', error);
            setExecutionResults(prev => new Map(prev).set(task.id, {
              success: false,
              message: 'Failed to check execution status'
            }));
            setExecutingTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(task.id);
              return newSet;
            });
          }
        };

        // Start polling
        pollStatus(result.executionId);
      } else {
        const errorData = await response.json();
        setExecutionResults(prev => new Map(prev).set(task.id, {
          success: false,
          message: errorData.error || 'Failed to execute task'
        }));
        setExecutingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      setExecutionResults(prev => new Map(prev).set(task.id, {
        success: false,
        message: 'Failed to execute task'
      }));
      setExecutingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading features...</div>
      </div>
    );
  }

  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = phases.reduce((sum, phase) => sum + phase.tasks.filter(t => t.completed).length, 0);
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Content Area */}
      <div className={`flex-1 space-y-6 overflow-y-auto transition-all duration-300 ${showConsole ? 'w-1/2' : 'w-full'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Feature Specifications</h1>
        <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
          {specs.length} features
        </span>
      </div>

      {specs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Features Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No feature specifications in this project yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Spec List Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {specs.map(spec => (
              <button
                key={spec.specId}
                onClick={() => setSelectedSpec(spec)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedSpec?.specId === spec.specId
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {spec.featureNumber}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {spec.featureName}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {spec.hasSpec && <span className="text-green-600 dark:text-green-400">✓ spec</span>}
                  {spec.hasPlan && <span className="text-green-600 dark:text-green-400">✓ plan</span>}
                  {spec.hasTasks && <span className="text-green-600 dark:text-green-400">✓ tasks</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Spec Detail View */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSpec && (
              <>
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 text-sm font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {selectedSpec.featureNumber}
                        </span>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {selectedSpec.featureName}
                        </h2>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedSpec.directoryPath}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {phases.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Progress: {completedTasks} / {totalTasks} tasks
                        </span>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Phases and Tasks */}
                {phases.length > 0 ? (
                  <div className="space-y-4">
                    {phases.map((phase, phaseIdx) => {
                      const phaseTasks = phase.tasks.length;
                      const phaseCompleted = phase.tasks.filter(t => t.completed).length;
                      const phaseProgress = phaseTasks > 0 ? Math.round((phaseCompleted / phaseTasks) * 100) : 0;
                      const isExpanded = expandedPhases.has(phase.name);

                      return (
                        <div key={phaseIdx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          {/* Phase Header - Clickable */}
                          <button
                            onClick={() => togglePhase(phase.name)}
                            className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <svg
                                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                                {phase.name}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                phaseProgress === 100
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : phaseProgress > 0
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {phaseCompleted}/{phaseTasks} tasks
                              </span>
                            </div>
                            {phase.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {phase.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    phaseProgress === 100
                                      ? 'bg-green-500'
                                      : phaseProgress > 0
                                      ? 'bg-yellow-500'
                                      : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${phaseProgress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {phaseProgress}%
                              </span>
                            </div>
                          </button>

                          {/* Tasks - Collapsible */}
                          {isExpanded && (
                            <div className="px-6 pb-6 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                              {phase.tasks.map((task, taskIdx) => (
                              <div key={taskIdx} className="space-y-2">
                              <div
                                className={`flex items-start gap-3 p-3 rounded-lg ${
                                  task.completed
                                    ? 'bg-green-50 dark:bg-green-900/10'
                                    : 'bg-gray-50 dark:bg-gray-900/50'
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleTask(task.id)}
                                  className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform cursor-pointer"
                                  title="Toggle task completion"
                                >
                                  {task.completed ? (
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-xs font-mono px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                      {task.id}
                                    </code>
                                    {task.parallel && (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        Parallel
                                      </span>
                                    )}
                                    {task.userStory && (
                                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                        {task.userStory}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${
                                    task.completed
                                      ? 'text-gray-700 dark:text-gray-300 line-through'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {task.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAssignTask(task)}
                                    className="flex-shrink-0 px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                    title="Assign to AI agent"
                                  >
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Assign
                                  </button>
                                  <button
                                    onClick={() => handleExecuteTask(task)}
                                    disabled={executingTasks.has(task.id) || task.completed}
                                    className={`flex-shrink-0 px-3 py-1 text-xs rounded transition-colors ${
                                      executingTasks.has(task.id)
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 cursor-wait'
                                        : task.completed
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                    }`}
                                    title={executingTasks.has(task.id) ? 'Executing...' : task.completed ? 'Already completed' : 'Execute task'}
                                  >
                                    {executingTasks.has(task.id) ? (
                                      <>
                                        <svg className="w-4 h-4 inline mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Executing...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Execute
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              {executionResults.has(task.id) && (
                                <div className={`mt-2 p-2 rounded text-xs ${
                                  executionResults.get(task.id)?.success
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                }`}>
                                  {executionResults.get(task.id)?.success ? (
                                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {executionResults.get(task.id)?.message}
                                </div>
                              )}
                              </div>
                            ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : selectedSpec.hasTasks ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Tasks file exists but couldn't be parsed. The file may be empty or in an unsupported format.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      No tasks defined for this feature yet.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}


      {/* Execute Modal */}
      {showExecuteModal && taskToExecute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Execute Task with AI Agent
              </h3>
              <button
                onClick={() => setShowExecuteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Task: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{taskToExecute.id}</code>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{taskToExecute.description}</p>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The selected AI agent will analyze the task and generate the required code/files automatically.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select AI Agent *
                </label>
                <select
                  value={selectedExecutionAgent}
                  onChange={(e) => setSelectedExecutionAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map(agent => (
                    <option key={agent.agentId} value={agent.agentName}>
                      {agent.agentName} ({agent.commands.length} commands)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExecuteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecute}
                disabled={!selectedExecutionAgent}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedExecutionAgent
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Task to Agent
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Task: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{selectedTask.id}</code>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select AI Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map(agent => (
                    <option key={agent.agentId} value={agent.agentName}>
                      {agent.agentName} ({agent.commands.length} commands)
                    </option>
                  ))}
                </select>
              </div>

              {selectedAgent && agents.find(a => a.agentName === selectedAgent) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Command (optional)
                  </label>
                  <select
                    value={selectedCommand}
                    onChange={(e) => setSelectedCommand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Default --</option>
                    {agents.find(a => a.agentName === selectedAgent)?.commands.map(cmd => (
                      <option key={cmd} value={cmd}>
                        {cmd}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedAgent}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedAgent
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Console Panel - Side by Side */}
      {showConsole && (
        <div className="w-1/2 flex flex-col bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          {/* Console Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">AI Agent Execution Console</h3>
                <p className="text-xs text-gray-400">{consoleCommand}</p>
              </div>
            </div>
            <button
              onClick={() => setShowConsole(false)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close console"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-mono text-green-400">{consoleProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${consoleProgress}%` }}
              />
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-gray-950">
            <div className="space-y-0.5">
              {consoleOutput.map((line, index) => (
                <div key={index} className={`${
                  line.includes('[Dashboard]') ? 'text-blue-400' :
                  line.includes('ERROR') || line.includes('failed') ? 'text-red-400' :
                  line.includes('completed') || line.includes('successfully') || line.includes('success') ? 'text-green-400' :
                  line.includes('[') && line.includes(']') ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {line || '\u00A0'}
                </div>
              ))}
              {executingTasks.has(consoleTaskId) && (
                <div className="flex items-center gap-2 text-yellow-400 animate-pulse mt-2">
                  <span>⚡</span>
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Console Footer */}
          <div className="px-4 py-3 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
            <div className="text-xs">
              {executingTasks.has(consoleTaskId) ? (
                <span className="flex items-center gap-2 text-yellow-400">
                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Execution in progress...
                </span>
              ) : (
                <span className="text-green-400">✓ Execution completed</span>
              )}
            </div>
            <button
              onClick={() => setShowConsole(false)}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
