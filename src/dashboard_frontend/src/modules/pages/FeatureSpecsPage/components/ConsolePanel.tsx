import React from 'react';

interface ConsolePanelProps {
  show: boolean;
  onClose: () => void;
  command: string;
  taskId: string;
  progress: number;
  output: string[];
  isExecuting: boolean;
}

export function ConsolePanel({
  show,
  onClose,
  command,
  taskId,
  progress,
  output,
  isExecuting,
}: ConsolePanelProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="w-1/2 flex flex-col bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">AI Agent Execution Console</h3>
            <p className="text-xs text-gray-400">{command}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          title="Close console"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs font-mono text-green-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-gray-950">
        <div className="space-y-0.5">
          {output.map((line, index) => (
            <div key={index} className={`${
              line.includes('[Dashboard]') ? 'text-blue-400' :
              line.includes('ERROR') || line.includes('failed') ? 'text-red-400' :
              line.includes('completed') || line.includes('successfully') || line.includes('success') ? 'text-green-400' :
              line.includes('[') && line.includes(']') ? 'text-yellow-400' :
              'text-gray-300'
            }`}>
              {line || '\u00A0'}
            </div>
          ))}
          {isExecuting && (
            <div className="flex items-center gap-2 text-yellow-400 animate-pulse mt-2">
              <span>⚡</span>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Console Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
        <div className="text-xs">
          {isExecuting ? (
            <span className="flex items-center gap-2 text-yellow-400">
              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Execution in progress...
            </span>
          ) : (
            <span className="text-green-400">✓ Execution completed</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
