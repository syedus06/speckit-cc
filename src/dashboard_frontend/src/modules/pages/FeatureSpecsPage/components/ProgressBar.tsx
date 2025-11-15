import React from 'react';

interface ProgressBarProps {
  completedTasks: number;
  totalTasks: number;
  progress: number;
}

export function ProgressBar({ completedTasks, totalTasks, progress }: ProgressBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Progress: {completedTasks} / {totalTasks} tasks
        </span>
        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
