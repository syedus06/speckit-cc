import React, { useState } from 'react';
import { useSpecs } from './hooks/useSpecs';
import { useAgents } from './hooks/useAgents';
import { useConsole } from './hooks/useConsole';
import { useTasks } from './hooks/useTasks';
import { useFeatureSpecsPage } from './hooks/useFeatureSpecsPage';
import { FeatureHeader } from './components/FeatureHeader';
import { EmptyState } from './components/EmptyState';
import { SpecList } from './components/SpecList';
import { SpecDetails } from './components/SpecDetails';
import { ExecutionControls } from './components/ExecutionControls';
import { TaskList } from './components/TaskList';
import { ConsolePanel } from './components/ConsolePanel';

export function FeatureSpecsPage() {
  const { specs, selectedSpec, setSelectedSpec, loading } = useSpecs();
  const { agents } = useAgents();
  const {
    showConsole,
    consoleOutput,
    consoleCommand,
    consoleTaskId,
    consoleProgress,
    openConsole,
    closeConsole,
    setConsoleOutput,
    setConsoleProgress,
  } = useConsole();

  const {
    phases,
    loading: tasksLoading,
    executingTasks,
    executionResults,
    bulkTaskSelection,
    toggleBulkTaskSelection,
    runTaskExecution,
    handleToggleTask,
    setBulkTaskSelection,
  } = useTasks(selectedSpec, setConsoleOutput, setConsoleProgress);

  const {
    expandedPhases,
    selectedExecutionAgent,
    agentSelectionError,
    togglePhase,
    setSelectedExecutionAgent,
    setAgentSelectionError,
    handleRunTaskExecution,
    handleBulkExecute,
    handleCompletePhase,
  } = useFeatureSpecsPage(
    phases,
    executingTasks,
    runTaskExecution,
    setBulkTaskSelection,
    openConsole
  );

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecs = specs.filter(spec =>
    spec.featureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.featureNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading features...</div>
      </div>
    );
  }

  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const completedTasks = phases.reduce((sum, phase) => sum + phase.tasks.filter(t => t.completed).length, 0);

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      <div className={`flex-1 space-y-6 overflow-y-auto transition-all duration-300 ${showConsole ? 'w-1/2' : 'w-full'}`}>
        <FeatureHeader specCount={filteredSpecs.length} />

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search specs..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredSpecs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <SpecList
              specs={filteredSpecs}
              selectedSpec={selectedSpec}
              onSelectSpec={setSelectedSpec}
            />

            <div className="lg:col-span-3 space-y-6">
              {selectedSpec && (
                <>
                  <SpecDetails
                    selectedSpec={selectedSpec}
                    phases={phases}
                    completedTasks={completedTasks}
                    totalTasks={totalTasks}
                  />

                  {tasksLoading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500 dark:text-gray-400">Loading tasks...</span>
                      </div>
                    </div>
                  ) : phases.length > 0 ? (
                    <div className="space-y-4">
                      <ExecutionControls
                        bulkTaskCount={bulkTaskSelection.size}
                        onBulkExecute={() => handleBulkExecute(bulkTaskSelection)}
                        onClearBulkSelection={() => setBulkTaskSelection(new Set())}
                      />
                      <TaskList
                        phases={phases}
                        expandedPhases={expandedPhases}
                        executingTasks={executingTasks}
                        executionResults={executionResults}
                        bulkTaskSelection={bulkTaskSelection}
                        agents={agents}
                        onTogglePhase={togglePhase}
                        onToggleTask={handleToggleTask}
                        onToggleBulkTask={toggleBulkTaskSelection}
                        onExecuteTask={handleRunTaskExecution}
                        onCompletePhase={handleCompletePhase}
                      />
                    </div>
                  ) : selectedSpec.hasTasks ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        Tasks file exists but couldn't be parsed. The file may be empty or in an unsupported format.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400">
                        No tasks defined for this feature yet.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ConsolePanel
        show={showConsole}
        onClose={closeConsole}
        command={consoleCommand}
        taskId={consoleTaskId}
        progress={consoleProgress}
        output={consoleOutput}
        isExecuting={executingTasks.has(consoleTaskId)}
      />
    </div>
  );
}