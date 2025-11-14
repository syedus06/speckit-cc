import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConstitutionDTO, TemplateDTO } from '../types';
import { apiService } from '../services/api';

interface ConfigurationPanelProps {
  projectId: string;
  className?: string;
}

interface ScriptDTO {
  scriptId: string;
  projectId: string;
  scriptName: string;
  fileName: string;
  filePath: string;
  description: string;
  lastModified: string;
}

export function ConfigurationPanel({ projectId, className = '' }: ConfigurationPanelProps) {
  const { t } = useTranslation();
  const [constitution, setConstitution] = useState<ConstitutionDTO | null>(null);
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [scripts, setScripts] = useState<ScriptDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'constitution' | 'templates' | 'scripts'>('constitution');

  useEffect(() => {
    loadConfiguration();
  }, [projectId]);

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      const [constitutionResult, templatesResult, scriptsResult] = await Promise.all([
        apiService.getConstitution(projectId).catch(() => null),
        apiService.getTemplates(projectId).catch(() => ({ templates: [] })),
        apiService.getScripts(projectId).catch(() => ({ scripts: [] }))
      ]);

      setConstitution(constitutionResult);
      setTemplates(templatesResult.templates);
      setScripts(scriptsResult.scripts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('configuration.notAvailable', 'Configuration not available')}
          </h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={loadConfiguration}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'constitution' as const, label: t('configuration.constitution', 'Constitution'), available: !!constitution },
    { id: 'templates' as const, label: t('configuration.templates', 'Templates'), available: templates.length > 0 },
    { id: 'scripts' as const, label: t('configuration.scripts', 'Scripts'), available: scripts.length > 0 }
  ].filter(tab => tab.available);

  if (tabs.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('configuration.notAvailable', 'Configuration not available')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No configuration documents found for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('configuration.constitution', 'Configuration')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Project constitution, templates, and helper scripts
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'templates' && templates.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  {templates.length}
                </span>
              )}
              {tab.id === 'scripts' && scripts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  {scripts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'constitution' && constitution && (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('configuration.constitution', 'Constitution')}
              </h3>
              {constitution.version && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Version {constitution.version} • {constitution.principleCount} principles
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last modified: {new Date(constitution.lastModified).toLocaleString()}
            </div>
          </div>
          <div
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            dangerouslySetInnerHTML={{
              __html: constitution.content
                .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/\n/g, '<br/>')
                .replace(/^/, '<p class="mb-4">')
                .replace(/$/, '</p>')
            }}
          />
        </div>
      )}

      {activeTab === 'templates' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('configuration.templates', 'Templates')}
          </h3>
          {templates.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No templates available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.templateId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.templateName}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      template.templateType === 'spec' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      template.templateType === 'plan' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      template.templateType === 'tasks' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}>
                      {template.templateType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.fileName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Modified: {new Date(template.lastModified).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scripts' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('configuration.scripts', 'Scripts')}
            </h3>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {t('configuration.scriptExecutionWarning', 'Warning: Executing scripts can modify your project files. Make sure you understand what the script does before running it.')}
            </p>
          </div>
          {scripts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No scripts available.</p>
          ) : (
            <div className="space-y-4">
              {scripts.map((script) => (
                <div
                  key={script.scriptId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {script.scriptName}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Shell Script
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {script.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {script.fileName} • Modified: {new Date(script.lastModified).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}