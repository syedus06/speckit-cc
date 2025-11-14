import React, { useEffect, useState } from 'react';
import { useApi } from '../api/api';

interface ScriptDTO {
  scriptId: string;
  scriptName: string;
  fileName: string;
  lastModified: string;
}

export function ScriptsPage() {
  const { projectId } = useApi();
  const [scripts, setScripts] = useState<ScriptDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScripts = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/scripts`);
        if (response.ok) {
          const data = await response.json();
          setScripts(data.scripts || []);
        }
      } catch (error) {
        console.error('Failed to load scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScripts();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading scripts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Scripts</h1>
        <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
          {scripts.length} scripts
        </span>
      </div>

      {scripts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Scripts Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No custom scripts configured in this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map(script => (
            <div key={script.scriptId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{script.scriptName}</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">{script.fileName}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-600">
                    Modified: {new Date(script.lastModified).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
