import React from 'react';

interface ExecutionControlsProps {
  bulkTaskCount: number;
  onBulkExecute: () => void;
  onClearBulkSelection: () => void;
}

export function ExecutionControls({
  bulkTaskCount,
  onBulkExecute,
  onClearBulkSelection,
}: ExecutionControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {bulkTaskCount} task{bulkTaskCount === 1 ? '' : 's'} selected for bulk execute
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
            Select agents individually for each task
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBulkExecute}
              disabled={true}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              title="Bulk execution with per-task agent selection coming soon"
            >
              Execute Selected (Coming Soon)
            </button>
            <button
              onClick={onClearBulkSelection}
              disabled={bulkTaskCount === 0}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                bulkTaskCount === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
