import React from 'react';
import { Phase as PhaseType, Task as TaskType } from '../models';
import { AIAgentDTO } from '../../../../types';
import { Task } from './Task';

interface PhaseProps {
  phase: PhaseType;
  isExpanded: boolean;
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

export function Phase({
  phase,
  isExpanded,
  executingTasks,
  executionResults,
  bulkTaskSelection,
  agents,
  onTogglePhase,
  onToggleTask,
  onToggleBulkTask,
  onExecuteTask,
  onCompletePhase,
}: PhaseProps) {
  const phaseTasks = phase.tasks.length;
  const phaseCompleted = phase.tasks.filter(t => t.completed).length;
  const phaseProgress = phaseTasks > 0 ? Math.round((phaseCompleted / phaseTasks) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="w-full p-6 text-left">
        <button
          onClick={() => onTogglePhase(phase.name)}
          className="w-full"
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
        <div className="flex justify-end mt-4">
          <button
            onClick={() => onCompletePhase(phase)}
            disabled={phaseProgress === 100}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              phaseProgress === 100
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Complete Phase
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          {phase.tasks.map((task, taskIdx) => (
            <Task
              key={taskIdx}
              task={task}
              isExecuting={executingTasks.has(task.id)}
              executionResult={executionResults.get(task.id)}
              isBulkSelected={bulkTaskSelection.has(task.id)}
              agents={agents}
              onToggleTask={onToggleTask}
              onToggleBulkTask={onToggleBulkTask}
              onExecuteTask={onExecuteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
