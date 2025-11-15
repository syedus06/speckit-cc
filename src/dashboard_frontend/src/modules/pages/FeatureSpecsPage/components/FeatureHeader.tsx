import React from 'react';

interface FeatureHeaderProps {
  specCount: number;
}

export function FeatureHeader({ specCount }: FeatureHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Feature Specifications</h1>
      <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
        {specCount} features
      </span>
    </div>
  );
}
