import React from 'react';
import { useTranslation } from 'react-i18next';
import { AIAgentDTO } from '../types';

interface AgentListProps {
  agents: AIAgentDTO[];
  className?: string;
}

interface AgentIconProps {
  agentName: string;
  className?: string;
}

function AgentIcon({ agentName, className = 'w-6 h-6' }: AgentIconProps) {
  // Map agent names to their icons/colors
  const agentConfig = {
    claude: {
      icon: (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    codex: {
      icon: (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    gemini: {
      icon: (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    cursor: {
      icon: (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  };

  const config = agentConfig[agentName as keyof typeof agentConfig] || {
    icon: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20'
  };

  return (
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor}`}>
      <div className={config.color}>
        {config.icon}
      </div>
    </div>
  );
}

export function AgentList({ agents, className = '' }: AgentListProps) {
  const { t } = useTranslation();

  if (agents.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('agents.empty.title', 'No agents configured')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('agents.empty.description', 'Create AI agent folders (.claude, .codex, etc.) with commands or prompts subdirectories.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('agents.title', 'AI Agents')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('agents.subtitle', 'Available AI assistants and their slash commands')}
        </p>
      </div>

      <div className="space-y-6">
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AgentIcon agentName={agent.agentName} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {agent.agentName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {agent.commandCount} {t('agents.commands', 'commands')} • {agent.subdirectoryType}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {agent.subdirectoryType}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('agents.availableCommands', 'Available Commands')}:
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {agent.commands.map((command) => (
                  <div
                    key={command.commandId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                        {command.slashCommand}
                      </code>
                      {command.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {command.description}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('agents.lastUpdated', 'Last updated')}: {new Date(agent.lastUpdated).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}