import { useState } from 'react';
import { Phase, Task } from '../models';

export function useFeatureSpecsPage(
  phases: Phase[],
  executingTasks: Set<string>,
  runTaskExecution: (task: Task, agentName: string) => Promise<void>,
  setBulkTaskSelection: (tasks: Set<string>) => void,
  openConsole: (taskId: string, agentName: string) => void
) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedExecutionAgent, setSelectedExecutionAgent] = useState<string>('');
  const [agentSelectionError, setAgentSelectionError] = useState<string | null>(null);

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

  const ensureAgentSelection = (): string | null => {
    if (!selectedExecutionAgent) {
      setAgentSelectionError('Select an AI agent before executing tasks.');
      return null;
    }
    setAgentSelectionError(null);
    return selectedExecutionAgent;
  };

  const handleRunTaskExecution = (task: Task, agentName: string) => {
    if (!agentName) {
      setAgentSelectionError('Select an AI agent before executing tasks.');
      return;
    }
    setAgentSelectionError(null);
    openConsole(task.id, agentName);
    runTaskExecution(task, agentName);
  };

  const handleBulkExecute = async (bulkTaskSelection: Set<string>) => {
    if (bulkTaskSelection.size === 0) {
      return;
    }

    // For bulk execution with per-task agent selection, we need to track selected agents per task
    // For now, we'll execute tasks that are in bulk selection
    // In a future enhancement, we could store selected agent per task in state
    const tasksToRun: Task[] = [];
    for (const phase of phases) {
      for (const task of phase.tasks) {
        if (bulkTaskSelection.has(task.id) && !task.completed && !executingTasks.has(task.id)) {
          tasksToRun.push(task);
        }
      }
    }

    // For now, use a default agent or skip tasks without agents
    // This could be enhanced to store agent selection per task
    for (const task of tasksToRun) {
      // TODO: Get agent for this specific task
      // For now, skip tasks without agent selection
      console.warn(`Bulk execution: Task ${task.id} needs agent selection`);
    }

    setBulkTaskSelection(new Set());
  };

  const handleCompletePhase = async (phase: Phase) => {
    if (!selectedExecutionAgent) {
      setAgentSelectionError('Select an AI agent before executing tasks.');
      return;
    }
    setAgentSelectionError(null);

    const tasksToRun = phase.tasks.filter(task => !task.completed && !executingTasks.has(task.id));

    for (const task of tasksToRun) {
      openConsole(task.id, selectedExecutionAgent);
      // eslint-disable-next-line no-await-in-loop
      await runTaskExecution(task, selectedExecutionAgent);
    }
  };

  return {
    expandedPhases,
    selectedExecutionAgent,
    agentSelectionError,
    togglePhase,
    setSelectedExecutionAgent,
    setAgentSelectionError,
    handleRunTaskExecution,
    handleBulkExecute,
    handleCompletePhase,
  };
}
