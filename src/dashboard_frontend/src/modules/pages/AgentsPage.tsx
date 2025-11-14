import React, { useEffect, useState } from 'react';
import { useApi } from '../api/api';
import { AIAgentDTO } from '../../types';

export function AgentsPage() {
  const { projectId } = useApi();
  const [agents, setAgents] = useState<AIAgentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/agents`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Agents</h1>
        <span className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
          {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
        </span>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No AI Agents Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No AI agent folders detected in this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map(agent => (
            <div key={agent.agentId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {agent.agentName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.subdirectoryType} • {agent.commandCount} commands
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                {agent.folderPath}
              </div>

              {agent.commands.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commands</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agent.commands.map(cmd => (
                      <div key={cmd.commandId} className="flex items-start justify-between py-2 px-3 rounded bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                            {cmd.slashCommand}
                          </code>
                          {cmd.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{cmd.description}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-600 ml-3 flex-shrink-0">
                          {cmd.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
