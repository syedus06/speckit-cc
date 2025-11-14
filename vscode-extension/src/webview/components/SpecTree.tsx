import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CheckSquare,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpecDirectory {
  specId: string;
  projectId: string;
  featureNumber: string;
  featureName: string;
  directoryName: string;
  directoryPath: string;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  subdirectories: string[];
  taskFiles: string[];
  createdAt: string;
  lastModified: string;
}

export interface SpecFile {
  name: string;
  type: 'spec' | 'plan' | 'tasks' | 'task-breakdown' | 'other';
  size: number;
  lastModified: string;
}

export interface SpecSubdirectory {
  name: string;
  fileCount: number;
}

export interface SpecTreeNode {
  spec: SpecDirectory;
  files: SpecFile[];
  subdirectories: SpecSubdirectory[];
}

interface SpecTreeProps {
  specs: SpecTreeNode[];
  selectedSpecId?: string;
  onSpecSelect?: (specId: string) => void;
  onFileOpen?: (specId: string, fileName: string) => void;
  className?: string;
}

export function SpecTree({
  specs,
  selectedSpecId,
  onSpecSelect,
  onFileOpen,
  className
}: SpecTreeProps) {
  const [expandedSpecs, setExpandedSpecs] = React.useState<Set<string>>(new Set());

  const toggleSpecExpansion = (specId: string) => {
    setExpandedSpecs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(specId)) {
        newSet.delete(specId);
      } else {
        newSet.add(specId);
      }
      return newSet;
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'spec':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'plan':
        return <Settings className="h-4 w-4 text-green-500" />;
      case 'tasks':
        return <CheckSquare className="h-4 w-4 text-orange-500" />;
      case 'task-breakdown':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    switch (fileType) {
      case 'spec':
        return 'Specification';
      case 'plan':
        return 'Implementation Plan';
      case 'tasks':
        return 'Task Breakdown';
      case 'task-breakdown':
        return 'Task Phase';
      default:
        return 'Document';
    }
  };

  if (specs.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Empty specs folder</p>
            <p className="text-xs mt-1">No specification directories found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Spec Directories
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {specs.map((node) => {
            const { spec, files, subdirectories } = node;
            const isExpanded = expandedSpecs.has(spec.specId);
            const isSelected = selectedSpecId === spec.specId;
            const hasContent = files.length > 0 || subdirectories.length > 0;

            return (
              <div key={spec.specId} className="border-b border-border last:border-b-0">
                {/* Spec Directory Header */}
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                    isSelected && "bg-muted"
                  )}
                  onClick={() => {
                    if (hasContent) {
                      toggleSpecExpansion(spec.specId);
                    }
                    onSpecSelect?.(spec.specId);
                  }}
                >
                  {hasContent ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}

                  <FolderOpen className="h-4 w-4 text-blue-500" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {spec.directoryName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {spec.featureNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {spec.featureName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {spec.hasSpec && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Spec
                      </Badge>
                    )}
                    {spec.hasPlan && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Plan
                      </Badge>
                    )}
                    {spec.hasTasks && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Tasks
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && hasContent && (
                  <div className="ml-6 border-l border-border pl-4 pb-2">
                    {/* Files */}
                    {files.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {files.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded cursor-pointer transition-colors"
                            onClick={() => onFileOpen?.(spec.specId, file.name)}
                          >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate">{file.name}</span>
                              <p className="text-xs text-muted-foreground">
                                {getFileTypeLabel(file.type)}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subdirectories */}
                    {subdirectories.length > 0 && (
                      <div className="space-y-1">
                        {subdirectories.map((subdir) => (
                          <div
                            key={subdir.name}
                            className="flex items-center gap-2 p-2 text-muted-foreground"
                          >
                            <Folder className="h-4 w-4" />
                            <span className="text-sm">{subdir.name}/</span>
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {subdir.fileCount} files
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}