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
    <div className="space-y-6">
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
                              <div
                                key={taskIdx}
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
  );
}
