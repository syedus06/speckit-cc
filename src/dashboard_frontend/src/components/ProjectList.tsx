import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectDTO } from '../types';
import { apiService } from '../services/api';

interface ProjectListProps {
  className?: string;
  activeProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

interface ProjectsResponse {
  projects: ProjectDTO[];
  stats?: {
    total: number;
    byType: {
      'spec-kit': number;
      'spec-workflow-mcp': number;
    };
    lastScanned: string;
  };
}

export function ProjectList({ className = '', activeProjectId, onProjectSelect }: ProjectListProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProjects(true);
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      setError(null);
      await apiService.scanProjects(true);
      // Refresh projects after scan
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t('projects.loading', 'Loading projects...')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('projects.error.title', 'Error Loading Projects')}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchProjects}
                  className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  {t('projects.retry', 'Retry')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('projects.title', 'Projects')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('projects.subtitle', 'Discovered spec-kit and workflow projects')}
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
        >
          {scanning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('projects.scanning', 'Scanning...')}
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('projects.scan', 'Scan Projects')}
            </>
          )}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('projects.empty.title', 'No projects found')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('projects.empty.description', 'Configure SPECKIT_ROOT_DIR environment variable and scan for projects.')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isActive = project.projectId === activeProjectId;
            return (
              <div
                key={project.projectId}
                onClick={() => onProjectSelect?.(project.projectId)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 hover:shadow-md transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold truncate ${
                        isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {project.projectName}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                          {t('projects.active', 'Active')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {project.projectPath}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.projectType === 'spec-kit'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {project.projectType === 'spec-kit' ? 'Spec-Kit' : 'Workflow'}
                  </span>
                </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                {project.projectType === 'spec-kit' ? (
                  <>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {project.specCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.specs', 'Specs')}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {project.agentCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.agents', 'Agents')}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {project.hasConstitution ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.constitution', 'Constitution')}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        N/A
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.specs', 'Specs')}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        N/A
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.agents', 'Agents')}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                        N/A
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('projects.constitution', 'Constitution')}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {t('projects.lastScanned', 'Last scanned')}: {new Date(project.lastScanned).toLocaleString()}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}