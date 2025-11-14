import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarkdownEditor } from '../components/MarkdownEditor';

interface ConstitutionData {
  content: string;
  filePath: string;
  exists: boolean;
  version: string;
}

interface Amendment {
  version: string;
  date: string;
  type: string;
  rationale: string;
}

export const ConstitutionEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [constitution, setConstitution] = useState<ConstitutionData | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modified, setModified] = useState(false);
  const [versionBump, setVersionBump] = useState<'major' | 'minor' | 'patch'>('patch');
  const [rationale, setRationale] = useState('');
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadConstitution();
  }, [projectId]);

  useEffect(() => {
    if (constitution) {
      parseAmendments(constitution.content);
    }
  }, [constitution]);

  const loadConstitution = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/speckit/constitution`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load constitution');
      }

      const data: ConstitutionData = await response.json();
      setConstitution(data);
      setContent(data.content);
      setModified(false);
    } catch (err: any) {
      console.error('Error loading constitution:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseAmendments = (content: string) => {
    const amendmentSection = content.match(/## Amendment Log\s*\n([\s\S]*?)(?=\n##|\n---|\Z)/);
    if (!amendmentSection) return;

    const lines = amendmentSection[1].split('\n').filter(line => line.trim() && line.startsWith('|') && !line.includes('Version'));
    const parsed: Amendment[] = lines.map(line => {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        return {
          version: parts[0],
          date: parts[1],
          type: parts[2],
          rationale: parts[3]
        };
      }
      return null;
    }).filter(Boolean) as Amendment[];

    setAmendments(parsed);
  };

  const initializeConstitution = async () => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/speckit/constitution/init`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize constitution');
      }

      const data = await response.json();
      await loadConstitution();
    } catch (err: any) {
      console.error('Error initializing constitution:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setModified(true);
  };

  const handleSave = () => {
    if (constitution?.exists && modified) {
      setShowAmendmentModal(true);
    } else {
      saveConstitution();
    }
  };

  const saveConstitution = async () => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/speckit/constitution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          versionBump: constitution?.exists ? versionBump : undefined,
          rationale: constitution?.exists ? rationale : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save constitution');
      }

      const data = await response.json();
      setShowAmendmentModal(false);
      setRationale('');
      await loadConstitution();
    } catch (err: any) {
      console.error('Error saving constitution:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getArticles = () => {
    const articleRegex = /## (Article [IVXLCDM]+: [^\n]+)/g;
    const articles: string[] = [];
    let match;

    while ((match = articleRegex.exec(content)) !== null) {
      articles.push(match[1]);
    }

    return articles;
  };

  const scrollToArticle = (article: string) => {
    const articleNumber = article.match(/Article ([IVXLCDM]+)/)?.[1];
    if (articleNumber) {
      setActiveSection(articleNumber);
      // In a real implementation, you'd scroll the editor to this section
    }
  };

  const articles = getArticles();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}/speckit`)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Project Constitution
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {constitution?.exists
                  ? `Version ${constitution.version} - The Nine Articles governing this project`
                  : 'Initialize the constitutional framework for this project'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {constitution?.exists && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Version:</span> {constitution.version}
              </div>
            )}

            {modified && (
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Unsaved changes
              </span>
            )}

            {!constitution?.exists ? (
              <button
                onClick={initializeConstitution}
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Initializing...' : 'Initialize Constitution'}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !modified}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  saving || !modified
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {saving ? 'Saving...' : 'Save Amendment'}
              </button>
            )}
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
          <div className="flex-1 p-4 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : constitution ? (
              <MarkdownEditor
                value={content}
                onChange={handleContentChange}
                onSave={handleSave}
                placeholder="Enter constitutional framework..."
                height="calc(100vh - 180px)"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Failed to load constitution
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {constitution?.exists && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                The Nine Articles
              </h2>

              <div className="space-y-2 mb-6">
                {articles.map((article, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToArticle(article)}
                    className={`w-full p-2 text-left text-sm rounded-lg transition-colors ${
                      activeSection === article.match(/Article ([IVXLCDM]+)/)?.[1]
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {article}
                  </button>
                ))}
              </div>

              {amendments.length > 0 && (
                <>
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Amendment History
                    </h3>
                    <div className="space-y-2">
                      {amendments.slice(0, 5).map((amendment, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono font-medium text-gray-900 dark:text-white">
                              {amendment.version}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {amendment.date}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{amendment.type}</span>
                            {amendment.rationale && (
                              <>
                                <br />
                                {amendment.rationale}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  About the Constitution
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <p>
                    The constitution establishes the foundational principles and rules
                    that govern all development in this project.
                  </p>
                  <p>
                    All features must comply with these articles. Use the compliance
                    validator to check adherence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amendment Modal */}
      {showAmendmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Constitutional Amendment
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are amending the project constitution. Please specify the type of
              change and provide a rationale for the amendment log.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Version Bump Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVersionBump('major')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      versionBump === 'major'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-bold">MAJOR</div>
                    <div className="text-xs">Breaking changes</div>
                  </button>
                  <button
                    onClick={() => setVersionBump('minor')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      versionBump === 'minor'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-bold">MINOR</div>
                    <div className="text-xs">New rules</div>
                  </button>
                  <button
                    onClick={() => setVersionBump('patch')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      versionBump === 'patch'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-bold">PATCH</div>
                    <div className="text-xs">Clarifications</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rationale for Amendment
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this constitutional amendment is necessary..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAmendmentModal(false);
                  setRationale('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConstitution}
                disabled={!rationale.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Amendment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
