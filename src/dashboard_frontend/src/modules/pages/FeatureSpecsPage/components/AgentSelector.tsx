import React from 'react';
import { AIAgentDTO } from '../../../../types';

interface AgentSelectorProps {
  agents: AIAgentDTO[];
  selectedExecutionAgent: string;
  onAgentChange: (agent: string) => void;
}

export function AgentSelector({
  agents,
  selectedExecutionAgent,
  onAgentChange,
}: AgentSelectorProps) {
  // Simple icon mapping based on agent name - you can customize these
  const getAgentIcon = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('copilot') || name.includes('github')) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      );
    } else if (name.includes('claude') || name.includes('anthropic')) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.5 14.5c0 3.038-2.462 5.5-5.5 5.5h-7c-3.038 0-5.5-2.462-5.5-5.5v-7c0-3.038 2.462-5.5 5.5-5.5h7c3.038 0 5.5 2.462 5.5 5.5v7z"/>
        </svg>
      );
    } else if (name.includes('gpt') || name.includes('openai')) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.5864a4.501 4.501 0 0 0-4.4968-4.4967l-.0001.0001a4.4956 4.4956 0 0 0-4.497 4.4967v.0001a4.4956 4.4956 0 0 0 4.497 4.4967l.0001-.0001a4.501 4.501 0 0 0 4.4968-4.4967z"/>
        </svg>
      );
    } else {
      // Default robot icon
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
        </svg>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select AI Agent
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Choose an agent to execute selected tasks
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {agents.map(agent => (
          <button
            key={agent.agentId}
            onClick={() => onAgentChange(agent.agentName)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedExecutionAgent === agent.agentName
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            title={`${agent.agentName} (${agent.commandCount} commands)`}
          >
            <div className={`${
              selectedExecutionAgent === agent.agentName
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {getAgentIcon(agent.agentName)}
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {agent.agentName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {agent.commandCount} cmd{agent.commandCount === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      {selectedExecutionAgent && (
        <div className="mt-3 text-center">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ {selectedExecutionAgent} selected
          </p>
        </div>
      )}
    </div>
  );
}