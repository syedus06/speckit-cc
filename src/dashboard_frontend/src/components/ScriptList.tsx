import React from 'react';
import { useTranslation } from 'react-i18next';

interface ScriptDTO {
  scriptId: string;
  projectId: string;
  scriptName: string;
  fileName: string;
  filePath: string;
  description: string;
  lastModified: string;
}

interface ScriptListProps {
  scripts: ScriptDTO[];
  className?: string;
}

export function ScriptList({ scripts, className = '' }: ScriptListProps) {
  const { t } = useTranslation();

  if (scripts.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No Scripts Available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No helper scripts found in the .specify/scripts/bash/ directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('configuration.scripts', 'Scripts')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Helper scripts for project automation and maintenance
        </p>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('configuration.scriptExecutionWarning', 'Warning: Executing scripts can modify your project files. Make sure you understand what the script does before running it.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {scripts.map((script) => (
          <div
            key={script.scriptId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {script.scriptName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Shell script
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  .sh
                </span>
                <button
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onClick={() => {
                    // TODO: Implement script execution
                    alert('Script execution not yet implemented. This would run the script in a controlled environment.');
                  }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run
                </button>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {script.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{script.fileName}</span>
              <span>Modified: {new Date(script.lastModified).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}