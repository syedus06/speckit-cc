import React from 'react';
import { useTranslation } from 'react-i18next';

interface SpecKitBadgeProps {
  projectType: 'spec-kit' | 'spec-workflow-mcp';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SpecKitBadge({ projectType, className = '', size = 'md' }: SpecKitBadgeProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const isSpecKit = projectType === 'spec-kit';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        isSpecKit
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
      } ${sizeClasses[size]} ${className}`}
      title={isSpecKit ? t('badge.specKit', 'Spec-Kit Project') : t('badge.workflow', 'Workflow Project')}
    >
      {isSpecKit ? (
        <>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {t('badge.specKit.short', 'Spec-Kit')}
        </>
      ) : (
        <>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {t('badge.workflow.short', 'Workflow')}
        </>
      )}
    </span>
  );
}