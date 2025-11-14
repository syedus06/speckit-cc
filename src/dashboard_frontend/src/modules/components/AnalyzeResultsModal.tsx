import React, { useState, useEffect } from 'react';
import { useProjects } from '../projects/ProjectProvider';

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
}

interface Insight {
  type: 'positive' | 'neutral' | 'warning';
  message: string;
}

interface Artifact {
  exists: boolean;
  wordCount: number;
}

interface AnalysisData {
  featureNumber: string;
  featureName: string;
  artifacts: Record<string, Artifact>;
  contracts: {
    exists: boolean;
    count: number;
  };
  analysis: {
    completeness: number;
    qualityScore: number;
    issueCount: number;
    issues: Issue[];
    insights: Insight[];
  };
  recommendations: string[];
}

interface AnalyzeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureNumber: string;
}

export const AnalyzeResultsModal: React.FC<AnalyzeResultsModalProps> = ({
  isOpen,
  onClose,
  featureNumber
}) => {
  const { currentProject } = useProjects();
  const projectId = currentProject?.projectId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (isOpen && projectId && featureNumber) {
      runAnalysis();
    }
  }, [isOpen, projectId, featureNumber]);

  const runAnalysis = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/workflows/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureNumber })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run analysis');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Error running analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analysis Results
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Feature {featureNumber} {analysisData && `- ${analysisData.featureName}`}
            </p>
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

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing feature...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : analysisData ? (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Scores Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Quality Score */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Quality Score
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-600"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisData.analysis.qualityScore / 100)}`}
                        className={getScoreBgColor(analysisData.analysis.qualityScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(analysisData.analysis.qualityScore)}`}>
                        {analysisData.analysis.qualityScore}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analysisData.analysis.qualityScore >= 90 ? 'Excellent' :
                       analysisData.analysis.qualityScore >= 70 ? 'Good' : 'Needs Work'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {analysisData.analysis.issueCount} {analysisData.analysis.issueCount === 1 ? 'issue' : 'issues'} found
                    </p>
                  </div>
                </div>
              </div>

              {/* Completeness */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Completeness
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-600"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisData.analysis.completeness / 100)}`}
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analysisData.analysis.completeness}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {Object.values(analysisData.artifacts).filter(a => a.exists).length}/
                      {Object.keys(analysisData.artifacts).length + (analysisData.contracts.exists ? 1 : 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      artifacts present
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues Section */}
            {analysisData.analysis.issues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Issues ({analysisData.analysis.issues.length})
                </h3>
                <div className="space-y-3">
                  {analysisData.analysis.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {issue.severity}
                            </span>
                            <span className="text-xs">•</span>
                            <span className="text-xs font-medium">
                              {issue.category}
                            </span>
                          </div>
                          <p className="text-sm">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights Section */}
            {analysisData.analysis.insights.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Insights ({analysisData.analysis.insights.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisData.analysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        insight.type === 'positive'
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                          : insight.type === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      <p className={`text-sm ${
                        insight.type === 'positive'
                          ? 'text-green-700 dark:text-green-300'
                          : insight.type === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        {insight.type === 'positive' && '✓ '}
                        {insight.type === 'warning' && '⚠ '}
                        {insight.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {analysisData.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Recommendations
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <ul className="space-y-2">
                    {analysisData.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="mt-1">→</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
