import { useState, useEffect } from 'react';
import { useApi } from '../../../api/api';
import { Phase, Task } from '../models';
import { parseTasksMarkdown } from '../taskParser';
import { SpecDirectoryDTO } from '../../../../types';

export function useTasks(
  selectedSpec: SpecDirectoryDTO | null,
  setConsoleOutput: (output: string[]) => void,
  setConsoleProgress: (progress: number) => void
) {
  const { projectId } = useApi();
  const [tasksContent, setTasksContent] = useState<string>('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [executionResults, setExecutionResults] = useState<Map<string, { success: boolean; message: string }>>(new Map());
  const [bulkTaskSelection, setBulkTaskSelection] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedSpec || !projectId) {
        setTasksContent('');
        setPhases([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      // Clear previous tasks immediately when switching specs
      setPhases([]);
      setTasksContent('');
      setBulkTaskSelection(new Set());
      setExecutionResults(new Map());

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasksContent(data.content || '');
          setPhases(parseTasksMarkdown(data.content || ''));
        } else {
          // If no tasks file exists, clear everything
          setTasksContent('');
          setPhases([]);
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasksContent('');
        setPhases([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [selectedSpec, projectId]);

  const handleToggleTask = async (task: Task) => {
    if (!selectedSpec || !projectId) return;

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(selectedSpec.featureNumber)}/tasks/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, taskLine: task.line, taskDescription: task.description })
      });

      if (response.ok) {
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

  const toggleBulkTaskSelection = (taskId: string) => {
    setBulkTaskSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const runTaskExecution = async (task: Task, agentName: string) => {
    if (!selectedSpec || !projectId) return;

    setExecutingTasks(prev => new Set(prev).add(task.id));
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
          agentType: agentName
        })
      });

      if (response.ok) {
        const result = await response.json();

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
                await handleToggleTask(task);
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

  return {
    tasksContent,
    phases,
    loading,
    executingTasks,
    executionResults,
    bulkTaskSelection,
    toggleBulkTaskSelection,
    runTaskExecution,
    handleToggleTask,
    setPhases,
    setTasksContent,
    setBulkTaskSelection,
  };
}
