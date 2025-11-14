import React, { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  onSave?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter markdown content...',
  height = '600px',
  readOnly = false,
  onSave
}) => {
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [renderedHtml, setRenderedHtml] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize markdown-it with syntax highlighting
  const md = useRef(
    new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (__) {}
        }
        return '';
      }
    })
  ).current;

  // Render markdown whenever value changes
  useEffect(() => {
    try {
      const html = md.render(value);
      setRenderedHtml(html);
    } catch (error) {
      console.error('Error rendering markdown:', error);
    }
  }, [value, md]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      }

      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && textareaRef.current) {
        e.preventDefault();
        insertMarkdown('**', '**');
      }

      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && textareaRef.current) {
        e.preventDefault();
        insertMarkdown('*', '*');
      }

      // Ctrl/Cmd + K for code
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && textareaRef.current) {
        e.preventDefault();
        insertMarkdown('`', '`');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  const insertMarkdown = (before: string, after: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertHeading = (level: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const prefix = '#'.repeat(level) + ' ';
    const newText = value.substring(0, start) + prefix + selectedText + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertList = (ordered: boolean) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const prefix = ordered ? '1. ' : '- ';
    const newText = value.substring(0, start) + prefix + value.substring(start);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertLink = () => {
    insertMarkdown('[', '](url)');
  };

  const insertCodeBlock = () => {
    insertMarkdown('\n```\n', '\n```\n');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <div className="flex bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-sm font-medium ${
                mode === 'edit'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1 text-sm font-medium border-x border-gray-300 dark:border-gray-600 ${
                mode === 'split'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-sm font-medium ${
                mode === 'preview'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Formatting buttons */}
          {(mode === 'edit' || mode === 'split') && !readOnly && (
            <>
              <button
                onClick={() => insertHeading(1)}
                className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => insertHeading(2)}
                className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => insertMarkdown('**', '**')}
                className="px-2 py-1 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Bold (Ctrl+B)"
              >
                B
              </button>
              <button
                onClick={() => insertMarkdown('*', '*')}
                className="px-2 py-1 text-sm italic text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Italic (Ctrl+I)"
              >
                I
              </button>
              <button
                onClick={() => insertMarkdown('`', '`')}
                className="px-2 py-1 text-sm font-mono text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Inline Code (Ctrl+K)"
              >
                &lt;/&gt;
              </button>
              <button
                onClick={() => insertList(false)}
                className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Bullet List"
              >
                • List
              </button>
              <button
                onClick={() => insertList(true)}
                className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Numbered List"
              >
                1. List
              </button>
              <button
                onClick={insertLink}
                className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Link"
              >
                🔗
              </button>
              <button
                onClick={insertCodeBlock}
                className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Code Block"
              >
                {'</>'}
              </button>
            </>
          )}
        </div>

        {onSave && !readOnly && (
          <button
            onClick={onSave}
            className="px-4 py-1 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
          >
            Save (Ctrl+S)
          </button>
        )}
      </div>

      {/* Editor content */}
      <div className="flex-1 flex overflow-hidden" style={{ height }}>
        {/* Edit pane */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              readOnly={readOnly}
              className="w-full h-full p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none"
              style={{ minHeight: height }}
            />
          </div>
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto`}>
            <div
              className="p-4 prose prose-sm dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                prose-p:text-gray-700 dark:prose-p:text-gray-300
                prose-a:text-blue-600 dark:prose-a:text-blue-400
                prose-code:text-gray-900 dark:prose-code:text-gray-100
                prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
                prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
