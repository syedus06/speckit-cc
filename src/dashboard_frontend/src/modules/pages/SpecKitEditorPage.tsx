import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarkdownEditor } from '../components/MarkdownEditor';

interface SpecFile {
  name: string;
  label: string;
  content: string;
  loaded: boolean;
  modified: boolean;
}

interface WorkflowCommand {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const SPEC_FILES: Array<{ name: string; label: string }> = [
  { name: 'spec.md', label: 'Specification' },
  { name: 'plan.md', label: 'Implementation Plan' },
  { name: 'tasks.md', label: 'Tasks' },
  { name: 'research.md', label: 'Research' },
  { name: 'data-model.md', label: 'Data Model' },
  { name: 'quickstart.md', label: 'Quickstart' }
];

const WORKFLOW_COMMANDS: WorkflowCommand[] = [
  { id: 'specify', label: 'Specify', description: 'Create/update feature specification', icon: '📝' },
  { id: 'clarify', label: 'Clarify', description: 'Ask clarification questions', icon: '❓' },
  { id: 'plan', label: 'Plan', description: 'Generate implementation plan', icon: '📋' },
  { id: 'tasks', label: 'Tasks', description: 'Generate task list', icon: '✅' },
  { id: 'implement', label: 'Implement', description: 'Execute all tasks', icon: '⚙️' },
  { id: 'analyze', label: 'Analyze', description: 'Cross-artifact analysis', icon: '🔍' },
  { id: 'checklist', label: 'Checklist', description: 'Generate quality checklist', icon: '📌' }
];

export const SpecKitEditorPage: React.FC = () => {
  const { projectId, featureNumber } = useParams<{ projectId: string; featureNumber: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<Record<string, SpecFile>>({});
  const [activeTab, setActiveTab] = useState('spec.md');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState<string | null>(null);

  // Initialize files state
  useEffect(() => {
    const initialFiles: Record<string, SpecFile> = {};
    SPEC_FILES.forEach(({ name, label }) => {
      initialFiles[name] = {
        name,
        label,
        content: '',
        loaded: false,
        modified: false
      };
    });
    setFiles(initialFiles);
  }, []);

  // Load file content when tab changes
  useEffect(() => {
    if (!files[activeTab]?.loaded && projectId && featureNumber) {
      loadFile(activeTab);
    }
  }, [activeTab, projectId, featureNumber]);

  const loadFile = async (fileName: string) => {
    if (!projectId || !featureNumber) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/files/${fileName}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // File doesn't exist yet, that's okay
          setFiles(prev => ({
            ...prev,
            [fileName]: { ...prev[fileName], content: '', loaded: true, modified: false }
          }));
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load file');
        }
      } else {
        const data = await response.json();
        setFiles(prev => ({
          ...prev,
          [fileName]: { ...prev[fileName], content: data.content, loaded: true, modified: false }
        }));
      }
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async (fileName: string) => {
    if (!projectId || !featureNumber) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/files/${fileName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: files[fileName].content })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save file');
      }

      setFiles(prev => ({
        ...prev,
        [fileName]: { ...prev[fileName], modified: false }
      }));

      // Show success message
      setError(null);
    } catch (err: any) {
      console.error('Error saving file:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (content: string) => {
    setFiles(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], content, modified: true }
    }));
  };

  const handleSave = () => {
    saveFile(activeTab);
  };

  const executeWorkflow = async (command: string) => {
    if (!projectId || !featureNumber) return;

    setExecutingWorkflow(command);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/workflows/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, featureNumber })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute workflow');
      }

      const data = await response.json();
      console.log('Workflow executed:', data);

      // TODO: Show execution output in a modal or panel
      alert(`Workflow ${command} initiated. ExecutionID: ${data.executionId}`);

    } catch (err: any) {
      console.error('Error executing workflow:', err);
      setError(err.message);
    } finally {
      setExecutingWorkflow(null);
    }
  };

  const currentFile = files[activeTab];
  const hasUnsavedChanges = Object.values(files).some(f => f.modified);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}/specs`)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Feature {featureNumber}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Edit specification and related documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Unsaved changes
              </span>
            )}

            <button
              onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              {showWorkflowPanel ? 'Hide' : 'Show'} Workflows
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !currentFile?.modified}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saving || !currentFile?.modified
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {SPEC_FILES.map(({ name, label }) => (
                <button
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === name
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } ${files[name]?.modified ? 'font-bold' : ''}`}
                >
                  {label}
                  {files[name]?.modified && ' *'}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : currentFile ? (
              <MarkdownEditor
                value={currentFile.content}
                onChange={handleContentChange}
                onSave={handleSave}
                placeholder={`Enter ${currentFile.label} content...`}
                height="calc(100vh - 250px)"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Select a file to edit
              </div>
            )}
          </div>
        </div>

        {/* Workflow Panel */}
        {showWorkflowPanel && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Workflows
              </h2>

              <div className="space-y-2">
                {WORKFLOW_COMMANDS.map((command) => (
                  <button
                    key={command.id}
                    onClick={() => executeWorkflow(command.id)}
                    disabled={executingWorkflow !== null}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      executingWorkflow === command.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{command.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {command.label}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {command.description}
                        </p>
                        {executingWorkflow === command.id && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Executing...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Save</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl+S
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bold</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl+B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Italic</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl+I
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      Ctrl+K
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
