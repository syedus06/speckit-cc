import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../api/api';
import { useWs } from '../ws/WebSocketProvider';
import { AIAgentDTO, SpecDirectoryDTO, TemplateDTO, ConstitutionDTO } from '../../types';

function Content() {
  const { t } = useTranslation();
  const { initial } = useWs();
  const { info, projectId, reloadAll } = useApi();
  const [agents, setAgents] = useState<AIAgentDTO[]>([]);
  const [specs, setSpecs] = useState<SpecDirectoryDTO[]>([]);
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [constitution, setConstitution] = useState<ConstitutionDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (!initial) reloadAll();
  }, [initial, reloadAll]);

  // Load spec-kit specific data
  useEffect(() => {
    const loadSpecKitData = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const [agentsRes, specsRes, templatesRes, constitutionRes] = await Promise.allSettled([
          fetch(`/api/projects/${encodeURIComponent(projectId)}/agents`).then(r => r.json()),
          fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/list`).then(r => r.json()),
          fetch(`/api/projects/${encodeURIComponent(projectId)}/templates`).then(r => r.json()),
          fetch(`/api/projects/${encodeURIComponent(projectId)}/constitution`).then(r => r.json())
        ]);

        if (agentsRes.status === 'fulfilled' && agentsRes.value.agents) {
          setAgents(agentsRes.value.agents);
        }
        if (specsRes.status === 'fulfilled' && specsRes.value.specs) {
          setSpecs(specsRes.value.specs);
        }
        if (templatesRes.status === 'fulfilled' && templatesRes.value.templates) {
          setTemplates(templatesRes.value.templates);
        }
        if (constitutionRes.status === 'fulfilled' && constitutionRes.value) {
          setConstitution(constitutionRes.value);
        }
      } catch (error) {
        console.error('Failed to load spec-kit data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpecKitData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {info?.projectName || 'Spec-Kit Project'}
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                Spec-Kit
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              AI-native specification-driven development
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* AI Agents Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Agents</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{agents.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {agents.reduce((sum, a) => sum + a.commandCount, 0)} commands
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Features</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{specs.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">specifications</div>
        </div>

        {/* Templates Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Templates</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{templates.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">available</div>
        </div>

        {/* Constitution Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Constitution</div>
          </div>
          <div className={`text-2xl font-semibold mb-1 ${constitution ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}>
            {constitution ? '✓' : '○'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {constitution ? `${constitution.principleCount} principles` : 'not configured'}
          </div>
        </div>
      </div>

      {/* AI Agents Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Agents</h2>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No AI agents configured
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div key={agent.agentId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">{agent.agentName}</div>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {agent.commandCount} cmds
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Type: {agent.subdirectoryType}
                </div>
                {agent.commands.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    {agent.commands.slice(0, 3).map(cmd => (
                      <div key={cmd.commandId} className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {cmd.slashCommand}
                        </code>
                      </div>
                    ))}
                    {agent.commands.length > 3 && (
                      <div className="text-gray-400 dark:text-gray-600">
                        +{agent.commands.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Specifications</h2>
        {specs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No feature specifications yet
          </div>
        ) : (
          <div className="space-y-2">
            {specs.map(spec => (
              <div key={spec.specId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {spec.featureNumber}
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">{spec.featureName}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      {spec.hasSpec && <span className="flex items-center gap-1"><span className="text-green-500">✓</span> spec.md</span>}
                      {spec.hasPlan && <span className="flex items-center gap-1"><span className="text-green-500">✓</span> plan.md</span>}
                      {spec.hasTasks && <span className="flex items-center gap-1"><span className="text-green-500">✓</span> tasks.md</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Templates</h2>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No templates configured
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.templateId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">{template.templateName}</div>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {template.templateType}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">{template.fileName}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Constitution Section */}
      {constitution && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Constitution</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{constitution.principleCount}</span> principles defined
            </div>
            {constitution.version && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Version: <span className="font-medium">{constitution.version}</span>
              </div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Last modified: {new Date(constitution.lastModified).toLocaleDateString()}
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-4 bg-gray-50 dark:bg-gray-900">
              {constitution.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SpecKitDashboard() {
  return <Content />;
}
