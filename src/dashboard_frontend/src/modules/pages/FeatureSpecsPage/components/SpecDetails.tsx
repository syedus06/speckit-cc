import React from 'react';
import { SpecDirectoryDTO } from '../../../../types';
import { Phase } from '../models';
import { ProgressBar } from './ProgressBar';

interface SpecDetailsProps {
  selectedSpec: SpecDirectoryDTO;
  phases: Phase[];
  completedTasks: number;
  totalTasks: number;
}

export function SpecDetails({ selectedSpec, phases, completedTasks, totalTasks }: SpecDetailsProps) {
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-sm font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
              {selectedSpec.featureNumber}
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedSpec.featureName}
            </h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedSpec.directoryPath}
          </div>
        </div>
      </div>

      {phases.length > 0 && (
        <ProgressBar
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          progress={progress}
        />
      )}
    </div>
  );
}
