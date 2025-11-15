import React from 'react';
import { useParams } from 'react-router-dom';

export function TaskDetailsPage() {
  const { taskId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Task Details</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Task ID: {taskId}
      </p>
    </div>
  );
}
