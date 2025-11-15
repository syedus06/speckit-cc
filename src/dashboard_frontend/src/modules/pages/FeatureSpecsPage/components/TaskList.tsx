import React from 'react';
import { Phase as PhaseType, Task as TaskType } from '../models';
import { AIAgentDTO } from '../../../../types';
import { Phase } from './Phase';

interface TaskListProps {
  phases: PhaseType[];
  expandedPhases: Set<string>;
  executingTasks: Set<string>;
  executionResults: Map<string, { success: boolean; message: string }>;
  bulkTaskSelection: Set<string>;
  agents: AIAgentDTO[];
  onTogglePhase: (phaseName: string) => void;
  onToggleTask: (task: TaskType) => void;
  onToggleBulkTask: (taskId: string) => void;
  onExecuteTask: (task: TaskType, agentName: string) => void;
  onCompletePhase: (phase: PhaseType) => void;
}

export function TaskList({
  phases,
  expandedPhases,
  executingTasks,
  executionResults,
  bulkTaskSelection,
  agents,
  onTogglePhase,
  onToggleTask,
  onToggleBulkTask,
  onExecuteTask,
  onCompletePhase,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      {phases.map((phase, phaseIdx) => (
        <Phase
          key={phaseIdx}
          phase={phase}
          isExpanded={expandedPhases.has(phase.name)}
          executingTasks={executingTasks}
          executionResults={executionResults}
          bulkTaskSelection={bulkTaskSelection}
          agents={agents}
          onTogglePhase={onTogglePhase}
          onToggleTask={onToggleTask}
          onToggleBulkTask={onToggleBulkTask}
          onExecuteTask={onExecuteTask}
          onCompletePhase={onCompletePhase}
        />
      ))}
    </div>
  );
}
