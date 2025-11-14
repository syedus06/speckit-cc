import React, { useEffect, useState } from 'react';
import { useApi } from '../api/api';
import { ConstitutionDTO } from '../../types';
import { Markdown } from '../markdown/Markdown';

export function ConstitutionPage() {
  const { projectId } = useApi();
  const [constitution, setConstitution] = useState<ConstitutionDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConstitution = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/constitution`);
        if (response.ok) {
          const data = await response.json();
          setConstitution(data);
        }
      } catch (error) {
        console.error('Failed to load constitution:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConstitution();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading constitution...</div>
      </div>
    );
  }

  if (!constitution) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Constitution</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Constitution Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            This project doesn't have a constitution configured yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Constitution</h1>
        <div className="flex items-center gap-4">
          {constitution.version && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Version: <span className="font-medium">{constitution.version}</span>
            </span>
          )}
          <span className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
            {constitution.principleCount} principles
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Last modified: {new Date(constitution.lastModified).toLocaleString()}
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <Markdown content={constitution.content} />
        </div>
      </div>
    </div>
  );
}
