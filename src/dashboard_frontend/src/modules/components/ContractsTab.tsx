import React, { useState, useEffect } from 'react';
import { useProjects } from '../projects/ProjectProvider';
import { MarkdownEditor } from './MarkdownEditor';

interface Contract {
  name: string;
  fileName: string;
  filePath: string;
  type: string;
  version: string;
  size: number;
}

interface Template {
  type: 'api' | 'event' | 'schema';
  name: string;
  description: string;
  template: string;
}

interface ContractsTabProps {
  featureNumber: string;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({ featureNumber }) => {
  const { currentProject } = useProjects();
  const projectId = currentProject?.projectId;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractContent, setContractContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (projectId && featureNumber) {
      loadContracts();
      loadTemplates();
    }
  }, [projectId, featureNumber]);

  const loadContracts = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/contracts`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load contracts');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      console.error('Error loading contracts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/contracts/templates`
      );

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Error loading templates:', err);
    }
  };

  const loadContract = async (contract: Contract) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/contracts/${contract.fileName}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load contract');
      }

      const data = await response.json();
      setContractContent(data.content);
      setSelectedContract(contract);
      setIsEditing(true);
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveContract = async () => {
    if (!projectId || !selectedContract) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/contracts/${selectedContract.fileName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: contractContent })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save contract');
      }

      setError(null);
      await loadContracts();
    } catch (err: any) {
      console.error('Error saving contract:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const createContract = async (templateType: 'api' | 'event' | 'schema', contractName: string) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/contracts/${contractName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractType: templateType })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contract');
      }

      setShowNewContractModal(false);
      await loadContracts();
    } catch (err: any) {
      console.error('Error creating contract:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteContract = async (contract: Contract) => {
    if (!projectId) return;
    if (!confirm(`Are you sure you want to delete ${contract.name}?`)) return;

    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/specs/${featureNumber}/contracts/${contract.fileName}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contract');
      }

      if (selectedContract?.fileName === contract.fileName) {
        setSelectedContract(null);
        setIsEditing(false);
        setContractContent('');
      }

      await loadContracts();
    } catch (err: any) {
      console.error('Error deleting contract:', err);
      setError(err.message);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'api':
        return '🔌';
      case 'event':
        return '⚡';
      case 'schema':
        return '📋';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'api':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'event':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'schema':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  if (isEditing && selectedContract) {
    return (
      <div className="h-full flex flex-col">
        {/* Contract Editor Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedContract(null);
                  setContractContent('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to Contracts
              </button>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedContract.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(selectedContract.type)}`}>
                    {getTypeIcon(selectedContract.type)} {selectedContract.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    v{selectedContract.version}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={saveContract}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Save Contract'}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Contract Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <MarkdownEditor
            value={contractContent}
            onChange={setContractContent}
            onSave={saveContract}
            placeholder="Edit contract content..."
            height="calc(100vh - 350px)"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Contracts List Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Contracts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Define API, Event, and Schema contracts for this feature
            </p>
          </div>

          <button
            onClick={() => setShowNewContractModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            + New Contract
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Contracts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Contracts Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first contract to define APIs, events, or schemas
            </p>
            <button
              onClick={() => setShowNewContractModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Contract
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract) => (
              <div
                key={contract.fileName}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(contract.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {contract.fileName}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(contract.type)}`}>
                        {contract.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteContract(contract)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Version {contract.version} • {Math.round(contract.size / 1024)}KB
                </div>

                <button
                  onClick={() => loadContract(contract)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Contract
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Contract Modal */}
      {showNewContractModal && (
        <NewContractModal
          templates={templates}
          onClose={() => setShowNewContractModal(false)}
          onCreate={createContract}
          saving={saving}
        />
      )}
    </div>
  );
};

interface NewContractModalProps {
  templates: Template[];
  onClose: () => void;
  onCreate: (type: 'api' | 'event' | 'schema', name: string) => void;
  saving: boolean;
}

const NewContractModal: React.FC<NewContractModalProps> = ({
  templates,
  onClose,
  onCreate,
  saving
}) => {
  const [selectedType, setSelectedType] = useState<'api' | 'event' | 'schema'>('api');
  const [contractName, setContractName] = useState('');

  const handleCreate = () => {
    if (!contractName.trim()) {
      alert('Please enter a contract name');
      return;
    }

    // Remove .md extension if provided
    const cleanName = contractName.replace(/\.md$/, '');
    onCreate(selectedType, cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Contract
          </h2>
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
          {/* Contract Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contract Name
            </label>
            <input
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="e.g., user-service-api, order-created-event"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use kebab-case. The .md extension will be added automatically.
            </p>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contract Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.type}
                  onClick={() => setSelectedType(template.type)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    selectedType === template.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {template.type === 'api' && '🔌'}
                    {template.type === 'event' && '⚡'}
                    {template.type === 'schema' && '📋'}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !contractName.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              saving || !contractName.trim()
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {saving ? 'Creating...' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
};
