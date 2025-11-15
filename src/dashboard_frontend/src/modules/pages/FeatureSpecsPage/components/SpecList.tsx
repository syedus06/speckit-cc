import React from 'react';
import { SpecDirectoryDTO } from '../../../../types';

interface SpecListProps {
  specs: SpecDirectoryDTO[];
  selectedSpec: SpecDirectoryDTO | null;
  onSelectSpec: (spec: SpecDirectoryDTO) => void;
}

export function SpecList({ specs, selectedSpec, onSelectSpec }: SpecListProps) {
  return (
    <div className="lg:col-span-1 space-y-2">
      {specs.map(spec => (
        <button
          key={spec.specId}
          onClick={() => onSelectSpec(spec)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selectedSpec?.specId === spec.specId
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {spec.featureNumber}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {spec.featureName}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
            {spec.hasSpec && <span className="text-green-600 dark:text-green-400">✓ spec</span>}
            {spec.hasPlan && <span className="text-green-600 dark:text-green-400">✓ plan</span>}
            {spec.hasTasks && <span className="text-green-600 dark:text-green-400">✓ tasks</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
