import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SpecKitProjectDTO } from '../types';
import { apiService } from '../services/api';

interface ProjectSwitcherProps {
  currentProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  className?: string;
}

interface ProjectSwitcherState {
  projects: SpecKitProjectDTO[];
  recentProjects: string[];
  isOpen: boolean;
  loading: boolean;
}

export function ProjectSwitcher({ currentProjectId, onProjectSelect, className = '' }: ProjectSwitcherProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<ProjectSwitcherState>({
    projects: [],
    recentProjects: [],
    isOpen: false,
    loading: true
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects and recent projects from localStorage
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await apiService.getProjects(false);
        const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');

        setState(prev => ({
          ...prev,
          projects: data.projects,
          recentProjects,
          loading: false
        }));
      } catch (error) {
        console.error('Failed to load projects:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadProjects();
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (projectId: string) => {
    // Update recent projects
    const recentProjects = [
      projectId,
      ...state.recentProjects.filter(id => id !== projectId)
    ].slice(0, 5); // Keep only 5 most recent

    localStorage.setItem('recentProjects', JSON.stringify(recentProjects));

    setState(prev => ({
      ...prev,
      recentProjects,
      isOpen: false
    }));

    onProjectSelect(projectId);
  };

  const getCurrentProject = () => {
    return state.projects.find(p => p.projectId === currentProjectId);
  };

  const getRecentProjects = () => {
    return state.recentProjects
      .map(id => state.projects.find(p => p.projectId === id))
      .filter(Boolean) as SpecKitProjectDTO[];
  };

  const getOtherProjects = () => {
    const recentIds = new Set(state.recentProjects);
    return state.projects.filter(p => !recentIds.has(p.projectId) && p.projectId !== currentProjectId);
  };

  if (state.loading) {
    return (
      <div className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {t('projectSwitcher.loading', 'Loading...')}
        </span>
      </div>
    );
  }

  const currentProject = getCurrentProject();
  const recentProjects = getRecentProjects();
  const otherProjects = getOtherProjects();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        className="inline-flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={state.isOpen}
      >
        <div className="flex items-center min-w-0 flex-1">
          {currentProject ? (
            <>
              <div className="flex-1 text-left">
                <div className="font-medium truncate">{currentProject.projectName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentProject.projectType === 'spec-kit' ? 'Spec-Kit' : 'Workflow'}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {t('projectSwitcher.selectProject', 'Select project')}
            </span>
          )}
        </div>
        <svg
          className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${state.isOpen ? 'transform rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {state.isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {/* Recent Projects Section */}
          {recentProjects.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('projectSwitcher.recent', 'Recent')}
              </div>
              {recentProjects.map((project) => (
                <button
                  key={project.projectId}
                  onClick={() => handleProjectSelect(project.projectId)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.projectName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {project.projectType === 'spec-kit' ? 'Spec-Kit' : 'Workflow'}
                      </div>
                    </div>
                    {project.projectId === currentProjectId && (
                      <svg className="ml-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
              {otherProjects.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              )}
            </>
          )}

          {/* All Projects Section */}
          {otherProjects.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('projectSwitcher.allProjects', 'All Projects')}
              </div>
              {otherProjects.map((project) => (
                <button
                  key={project.projectId}
                  onClick={() => handleProjectSelect(project.projectId)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.projectName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {project.projectType === 'spec-kit' ? 'Spec-Kit' : 'Workflow'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* No Projects Message */}
          {state.projects.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('projectSwitcher.noProjects', 'No projects available')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}