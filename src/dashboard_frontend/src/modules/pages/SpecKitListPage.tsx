import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../projects/ProjectProvider';

interface SpecKitFeature {
  featureNumber: string;
  shortName: string;
  directoryName: string;
  directoryPath: string;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  hasResearch: boolean;
  hasDataModel: boolean;
  hasContracts: boolean;
  taskProgress?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface NewFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { featureName: string; shortName: string; description: string }) => void;
  nextNumber: string;
}

const NewFeatureModal: React.FC<NewFeatureModalProps> = ({ isOpen, onClose, onSubmit, nextNumber }) => {
  const [featureName, setFeatureName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (featureName && shortName) {
      onSubmit({ featureName, shortName, description });
      setFeatureName('');
      setShortName('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Feature
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature Number
              </label>
              <input
                type="text"
                value={nextNumber}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Auto-assigned based on existing features
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature Name *
              </label>
              <input
                type="text"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="e.g., User Authentication System"
                required
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Name (for directory) *
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="e.g., user-auth"
                required
                pattern="[a-z0-9-]+"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Will create: {nextNumber}-{shortName || 'short-name'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this feature will do..."
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Create Feature
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const SpecKitListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useProjects();
  const projectId = currentProject?.projectId;

  const [features, setFeatures] = useState<SpecKitFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [nextNumber, setNextNumber] = useState('001');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    loadFeatures();
  }, [projectId]);

  const loadFeatures = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/speckit/specs/list`);

      if (!response.ok) {
        throw new Error('Failed to load features');
      }

      const data = await response.json();
      setFeatures(data.features || []);
      setNextNumber(data.nextNumber || '001');
    } catch (err: any) {
      console.error('Error loading features:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async (data: { featureName: string; shortName: string; description: string }) => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/speckit/specs/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create feature');
      }

      const result = await response.json();
      setShowNewModal(false);

      // Navigate to editor
      navigate(`/projects/${projectId}/speckit/edit/${result.featureNumber}`);
    } catch (err: any) {
      console.error('Error creating feature:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (feature: SpecKitFeature) => {
    if (!feature.taskProgress) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Not Started</span>;
    }

    const { completed, total, percentage } = feature.taskProgress;

    if (percentage === 100) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">✓ Completed</span>;
    }

    if (percentage > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">{completed}/{total} tasks</span>;
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Ready</span>;
  };

  const getFileIndicators = (feature: SpecKitFeature) => {
    const files = [
      { name: 'spec', exists: feature.hasSpec, label: 'S' },
      { name: 'plan', exists: feature.hasPlan, label: 'P' },
      { name: 'tasks', exists: feature.hasTasks, label: 'T' },
      { name: 'research', exists: feature.hasResearch, label: 'R' },
      { name: 'model', exists: feature.hasDataModel, label: 'M' },
      { name: 'contracts', exists: feature.hasContracts, label: 'C' }
    ];

    return (
      <div className="flex gap-1">
        {files.map((file) => (
          <span
            key={file.name}
            className={`w-6 h-6 flex items-center justify-center text-xs rounded ${
              file.exists
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
            title={`${file.name}.md ${file.exists ? 'exists' : 'missing'}`}
          >
            {file.label}
          </span>
        ))}
      </div>
    );
  };

  const filteredFeatures = features.filter((feature) => {
    const matchesSearch =
      feature.featureNumber.includes(searchQuery) ||
      feature.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.directoryName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'completed') {
      return matchesSearch && feature.taskProgress?.percentage === 100;
    }
    if (filterStatus === 'in-progress') {
      return matchesSearch && feature.taskProgress && feature.taskProgress.percentage > 0 && feature.taskProgress.percentage < 100;
    }

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Spec-Kit Features
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage all feature specifications and implementations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects/${projectId}/speckit/constitution`)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              title="View and edit the project constitution"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Constitution
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Feature
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
            {(['all', 'in-progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' && 'All'}
                {status === 'in-progress' && 'In Progress'}
                {status === 'completed' && 'Completed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No features found' : 'No features yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first feature specification'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Create First Feature
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => (
              <div
                key={feature.featureNumber}
                onClick={() => navigate(`/projects/${projectId}/speckit/edit/${feature.featureNumber}`)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      #{feature.featureNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {feature.shortName}
                    </h3>
                  </div>
                  {getStatusBadge(feature)}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {feature.directoryName}
                </p>

                <div className="flex items-center justify-between">
                  {getFileIndicators(feature)}

                  {feature.taskProgress && feature.taskProgress.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${feature.taskProgress.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(feature.taskProgress.percentage)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Feature Modal */}
      <NewFeatureModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateFeature}
        nextNumber={nextNumber}
      />
    </div>
  );
};
