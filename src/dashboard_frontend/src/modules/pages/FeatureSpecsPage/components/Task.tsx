import React, { useState } from 'react';
import { Task as TaskType } from '../models';
import { AIAgentDTO } from '../../../../types';

interface TaskProps {
  task: TaskType;
  isExecuting: boolean;
  executionResult?: { success: boolean; message: string };
  isBulkSelected: boolean;
  agents: AIAgentDTO[];
  onToggleTask: (task: TaskType) => void;
  onToggleBulkTask: (taskId: string) => void;
  onExecuteTask: (task: TaskType, agentName: string) => void;
}

export function Task({
  task,
  isExecuting,
  executionResult,
  isBulkSelected,
  agents,
  onToggleTask,
  onToggleBulkTask,
  onExecuteTask,
}: TaskProps) {
  const [showAgentSelection, setShowAgentSelection] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  return (
    <div className="space-y-2">
      <div
        className={`flex items-start gap-3 p-3 rounded-lg ${
          task.completed
            ? 'bg-green-50 dark:bg-green-900/10'
            : 'bg-gray-50 dark:bg-gray-900/50'
        }`}
      >
        <button
          onClick={() => onToggleTask(task)}
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
          <div className="relative">
            <button
              onClick={() => {
                if (!task.completed) {
                  setShowAgentSelection(!showAgentSelection);
                }
              }}
              disabled={task.completed}
              className={`flex-shrink-0 px-3 py-1 text-xs rounded transition-colors ${
                task.completed
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  : showAgentSelection
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : selectedAgent
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
              }`}
              title={
                task.completed
                  ? 'Task already completed'
                  : showAgentSelection
                  ? 'Hide agent selection'
                  : selectedAgent
                  ? `Agent selected: ${selectedAgent}`
                  : 'Select AI agent'
              }
            >
              {selectedAgent ? 'Agent Selected' : 'Select Agent'}
            </button>
            
            {showAgentSelection && !task.completed && (
              <div className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Choose AI Agent:</div>
                <div className="space-y-1">
                  {agents.map((agent) => (
                    <button
                      key={agent.agentId}
                      onClick={() => {
                        setSelectedAgent(agent.agentName);
                        setShowAgentSelection(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedAgent === agent.agentName
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white text-[10px] font-bold">
                          {agent.agentName.charAt(0).toUpperCase()}
                        </div>
                        <span>{agent.agentName}</span>
                        <span className="text-gray-500 dark:text-gray-500">({agent.commandCount} commands)</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => onExecuteTask(task, selectedAgent)}
            disabled={isExecuting || task.completed || !selectedAgent}
            className={`flex-shrink-0 px-3 py-1 text-xs rounded transition-colors ${
              isExecuting
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 cursor-wait'
                : task.completed
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : !selectedAgent
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
            }`}
            title={
              isExecuting 
                ? 'Executing...' 
                : task.completed 
                ? 'Already completed' 
                : !selectedAgent
                ? 'Select an AI agent first'
                : `Execute with ${selectedAgent}`
            }
          >
            {isExecuting ? (
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
      {executionResult && (
        <div className={`mt-2 p-2 rounded text-xs ${
          executionResult.success
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {executionResult.success ? (
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {executionResult.message}
        </div>
      )}
    </div>
  );
}
