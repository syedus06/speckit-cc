import React, { useState, useEffect } from 'react';

interface WorkflowProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  command: string;
  executionId: string | null;
  featureNumber?: string;
}

export const WorkflowProgressModal: React.FC<WorkflowProgressModalProps> = ({
  isOpen,
  onClose,
  command,
  executionId,
  featureNumber
}) => {
  const [dots, setDots] = useState('');

  // Animated dots for progress indicator
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCommandIcon = (cmd: string) => {
    switch (cmd) {
      case 'specify':
        return '📝';
      case 'clarify':
        return '❓';
      case 'plan':
        return '📋';
      case 'tasks':
        return '✅';
      case 'implement':
        return '⚙️';
      case 'analyze':
        return '🔍';
      case 'checklist':
        return '📌';
      case 'constitution':
        return '📜';
      default:
        return '🔄';
    }
  };

  const getCommandLabel = (cmd: string) => {
    switch (cmd) {
      case 'specify':
        return 'Specify';
      case 'clarify':
        return 'Clarify';
      case 'plan':
        return 'Plan';
      case 'tasks':
        return 'Tasks';
      case 'implement':
        return 'Implement';
      case 'analyze':
        return 'Analyze';
      case 'checklist':
        return 'Checklist';
      case 'constitution':
        return 'Constitution';
      default:
        return cmd.charAt(0).toUpperCase() + cmd.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getCommandIcon(command)}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {getCommandLabel(command)} Workflow
              </h2>
              {featureNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Feature {featureNumber}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">{getCommandIcon(command)}</span>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6">
              Workflow Executing{dots}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center max-w-md">
              The <span className="font-medium">{getCommandLabel(command)}</span> workflow is running in the background.
              This may take a few moments.
            </p>
          </div>

          {/* Execution Details */}
          {executionId && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Execution ID
                  </p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                    {executionId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Updates */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Workflow initiated successfully
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Command: <span className="font-mono">{command}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Processing in background
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Check the file tabs for updates when complete
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  What happens next?
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• The workflow will generate or update relevant files</li>
                  <li>• Files will be automatically saved to your feature directory</li>
                  <li>• Refresh the file tabs to see the latest changes</li>
                  <li>• You can safely close this dialog - the workflow continues in the background</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Real-time progress monitoring coming soon via WebSocket
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
};
