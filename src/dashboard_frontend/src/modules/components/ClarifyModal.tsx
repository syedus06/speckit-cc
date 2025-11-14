import React, { useState, useEffect } from 'react';
import { useProjects } from '../projects/ProjectProvider';

interface QuestionTaxonomy {
  category: string;
  icon: string;
  questions: string[];
}

interface ClarifyData {
  featureNumber: string;
  featureName: string;
  taxonomies: QuestionTaxonomy[];
  specExists: boolean;
  totalQuestions: number;
}

interface ClarifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureNumber: string;
  onSuccess: () => void;
}

export const ClarifyModal: React.FC<ClarifyModalProps> = ({
  isOpen,
  onClose,
  featureNumber,
  onSuccess
}) => {
  const { currentProject } = useProjects();
  const projectId = currentProject?.projectId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarifyData, setClarifyData] = useState<ClarifyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId && featureNumber) {
      loadQuestions();
    }
  }, [isOpen, projectId, featureNumber]);

  const loadQuestions = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/workflows/clarify/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureNumber })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load questions');
      }

      const data = await response.json();
      setClarifyData(data);

      // Initialize answers object
      const initialAnswers: Record<string, Record<string, string>> = {};
      data.taxonomies.forEach((taxonomy: QuestionTaxonomy) => {
        initialAnswers[taxonomy.category] = {};
        taxonomy.questions.forEach(question => {
          initialAnswers[taxonomy.category][question] = '';
        });
      });
      setAnswers(initialAnswers);

      // Set first category as active
      if (data.taxonomies.length > 0) {
        setActiveCategory(data.taxonomies[0].category);
      }
    } catch (err: any) {
      console.error('Error loading questions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (category: string, question: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [question]: answer
      }
    }));
  };

  const handleSubmit = async () => {
    if (!projectId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/speckit/workflows/clarify/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureNumber, answers })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit answers');
      }

      const data = await response.json();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting answers:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    let count = 0;
    Object.values(answers).forEach(categoryAnswers => {
      Object.values(categoryAnswers).forEach(answer => {
        if (answer.trim()) count++;
      });
    });
    return count;
  };

  const getTotalQuestions = () => {
    return clarifyData?.totalQuestions || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clarify Requirements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Feature {featureNumber} - {clarifyData?.featureName}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : clarifyData ? (
          <>
            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress: {getAnsweredCount()} / {getTotalQuestions()} questions answered
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round((getAnsweredCount() / getTotalQuestions()) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(getAnsweredCount() / getTotalQuestions()) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Taxonomy Sidebar */}
              <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {clarifyData.taxonomies.map((taxonomy) => {
                      const categoryAnswers = answers[taxonomy.category] || {};
                      const answeredInCategory = Object.values(categoryAnswers).filter(a => a.trim()).length;
                      const totalInCategory = taxonomy.questions.length;

                      return (
                        <button
                          key={taxonomy.category}
                          onClick={() => setActiveCategory(taxonomy.category)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            activeCategory === taxonomy.category
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{taxonomy.icon}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {taxonomy.category}
                              </span>
                            </div>
                            {answeredInCategory > 0 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                answeredInCategory === totalInCategory
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {answeredInCategory}/{totalInCategory}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Questions Panel */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeCategory && (() => {
                  const taxonomy = clarifyData.taxonomies.find(t => t.category === activeCategory);
                  if (!taxonomy) return null;

                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">{taxonomy.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {taxonomy.category}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {taxonomy.questions.length} {taxonomy.questions.length === 1 ? 'question' : 'questions'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {taxonomy.questions.map((question, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {question}
                            </label>
                            <textarea
                              value={answers[taxonomy.category]?.[question] || ''}
                              onChange={(e) => handleAnswerChange(taxonomy.category, question, e.target.value)}
                              placeholder="Enter your answer here... (optional)"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getAnsweredCount() === 0 ? (
                  <span>You can skip questions by leaving them blank</span>
                ) : (
                  <span>
                    <span className="font-medium">{getAnsweredCount()}</span> {getAnsweredCount() === 1 ? 'answer' : 'answers'} will be saved to spec.md
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || getAnsweredCount() === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    submitting || getAnsweredCount() === 0
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {submitting ? 'Saving...' : 'Save Clarifications'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
