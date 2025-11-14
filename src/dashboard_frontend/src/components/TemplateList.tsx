import React from 'react';
import { useTranslation } from 'react-i18next';
import { TemplateDTO } from '../types';

interface TemplateListProps {
  templates: TemplateDTO[];
  className?: string;
}

export function TemplateList({ templates, className = '' }: TemplateListProps) {
  const { t } = useTranslation();

  if (templates.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No Templates Available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No template files found in the .specify/templates/ directory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('configuration.templates', 'Templates')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Available document templates for the project
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.templateId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  template.templateType === 'spec' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  template.templateType === 'plan' ? 'bg-green-100 dark:bg-green-900/20' :
                  template.templateType === 'tasks' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  template.templateType === 'checklist' ? 'bg-purple-100 dark:bg-purple-900/20' :
                  'bg-gray-100 dark:bg-gray-900/20'
                }`}>
                  <svg className={`w-5 h-5 ${
                    template.templateType === 'spec' ? 'text-blue-600 dark:text-blue-400' :
                    template.templateType === 'plan' ? 'text-green-600 dark:text-green-400' :
                    template.templateType === 'tasks' ? 'text-yellow-600 dark:text-yellow-400' :
                    template.templateType === 'checklist' ? 'text-purple-600 dark:text-purple-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {template.templateName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {template.templateType} template
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                template.templateType === 'spec' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                template.templateType === 'plan' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                template.templateType === 'tasks' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                template.templateType === 'checklist' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
              }`}>
                {template.templateType}
              </span>
            </div>

            <div className="text-xs text-gray-400 dark:text-gray-500">
              <p>{template.fileName}</p>
              <p>Modified: {new Date(template.lastModified).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}