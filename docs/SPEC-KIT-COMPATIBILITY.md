# Spec-Kit Compatibility Guide

This guide covers how to use Spec Workflow MCP with spec-kit projects, providing compatibility between the two development methodologies.

## Overview

Spec Workflow MCP now supports spec-kit projects alongside traditional spec-workflow-mcp projects. This compatibility allows you to:

- Use the dashboard to monitor spec-kit projects
- Track implementation progress across both project types
- Maintain unified project management
- Access performance metrics and caching benefits

## Project Detection

The system automatically detects spec-kit projects by looking for:
- `.specify/` directory in the project root
- AI agent folders (`.claude/`, `.codex/`, `.gemini/`, `.cursor/`, etc.)
- `specs/` directory with numbered spec folders (e.g., `001-feature-name/`)
- Compatible project structure following spec-kit conventions

## Setup

### Basic Configuration

The system is configured to scan `/home/syedu/code` for all spec-kit projects automatically.

**Set the environment variable:**

```bash
# Add to your ~/.bashrc or ~/.zshrc for permanent configuration
export SPECKIT_ROOT_DIR="/home/syedu/code"

# Or set temporarily for the current session
export SPECKIT_ROOT_DIR="/home/syedu/code"
```

**Start the dashboard from the project root:**

```bash
# From the speckit-cc project directory
npm run dev -- --dashboard

# Or for production build
npm start -- --dashboard
```

The system will automatically:
- Scan `/home/syedu/code` for all subdirectories
- Detect projects with `.specify/` directories
- Display all found spec-kit projects in the dashboard
- Watch for new projects being added or removed

### MCP Client Configuration

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "spec-workflow": {
      "command": "node",
      "args": ["/home/syedu/code/speckit-cc/dist/index.js", "/path/to/your/spec-kit/project"]
    }
  }
}
```

Note: Replace `/path/to/your/spec-kit/project` with the actual path to your spec-kit project.

## Architecture

### Project Types

Spec Workflow MCP now supports two project types:

1. **Spec-Workflow Projects** - Traditional workflow with specs, tasks, and approvals
2. **Spec-Kit Projects** - Feature-driven development with phases and checklists

### Unified Interface

Both project types are displayed in the same dashboard with:
- Project type indicators
- Type-specific statistics
- Unified progress tracking
- Performance metrics

## Dashboard Features

### Project List

The dashboard shows both project types with:
- **Project Type Badge** - Indicates "Spec-Kit" or "Spec-Workflow"
- **Status Indicators** - Current phase or workflow state
- **Progress Metrics** - Completion percentages and statistics
- **Performance Data** - Scan times and operation metrics

### Spec-Kit Project View

For spec-kit projects, the dashboard displays:
- **AI Agents**: Detected agents with available slash commands
- **Constitution**: Project governance document
- **Specs**: Numbered spec directories with artifacts
- **Templates**: Available templates for spec generation
- **Scripts**: Helper scripts from `.specify/scripts/bash/`

### Performance Monitoring

All projects benefit from:
- **Caching** - Reduced scan times for repeated operations
- **Concurrency Control** - Limited parallel operations (max 10)
- **Performance Tracking** - Operation timing and metrics
- **Negative Result Caching** - Faster detection of non-project directories

## Workflows

### Mixed Project Management

You can work with both project types simultaneously:

1. **Spec-Kit Projects**: Use feature-driven development with phases
2. **Spec-Workflow Projects**: Use traditional spec-driven workflows
3. **Unified Dashboard**: Monitor all projects from one interface

### Feature Development

For spec-kit projects:
1. Create features using spec-kit's phase system
2. Track progress through dashboard
3. Monitor performance metrics
4. Access implementation logs

### Migration Support

Existing spec-kit projects are automatically detected and integrated without requiring changes to your workflow.

## Performance Optimizations

### Caching Strategy

- **Project Type Cache**: 1-hour cache for project type detection
- **Negative Result Cache**: 5-minute cache for non-project directories
- **File Modification Tracking**: Automatic cache invalidation on changes

### Concurrency Limits

- Maximum 10 concurrent file system operations
- Prevents system overload during large directory scans
- Maintains responsive performance

### Performance Metrics

Track operation performance:
- Directory scan times
- File processing metrics
- Cache hit rates
- Operation throughput

## Troubleshooting

### Project Not Detected

If your spec-kit project isn't appearing:

1. **Check Directory Structure**:
   ```bash
   ls -la | grep speckit
   ```

2. **Verify Configuration**:
   - Ensure `.speckit/` directory exists
   - Check spec-kit configuration files are present

3. **Restart Dashboard**:
   ```bash
   # Stop current dashboard (Ctrl+C)
   # Restart from project root:
   npm run dev -- --dashboard
   ```

### Performance Issues

If scanning is slow:

1. **Check Cache Status**:
   - Dashboard shows cache hit rates
   - Clear cache if needed

2. **Monitor Concurrency**:
   - Reduce concurrent operations if system is overloaded
   - Check system resources during scans

3. **Large Directory Optimization**:
   - Consider excluding large directories
   - Use targeted scanning for specific paths

### Mixed Project Issues

When working with both project types:

1. **Type Confusion**: Check project type badges in dashboard
2. **Feature Compatibility**: Some spec-workflow features may not apply to spec-kit projects
3. **Progress Tracking**: Use appropriate metrics for each project type

## Configuration

### Advanced Settings

For performance tuning, you can configure:

```toml
# In .spec-workflow/config.toml
[performance]
max_concurrency = 10
cache_ttl_minutes = 60
negative_cache_ttl_minutes = 5
```

### Environment Variables

```bash
# Required: Root directory for spec-kit project scanning
SPECKIT_ROOT_DIR=/path/to/projects

# Optional: Performance tuning
SPEC_WORKFLOW_MAX_CONCURRENCY=5
SPEC_WORKFLOW_CACHE_TTL=30
SPEC_WORKFLOW_NEGATIVE_CACHE_TTL=2
```

## Best Practices

### Project Organization

1. **Clear Separation**: Keep spec-kit and spec-workflow projects in separate directories
2. **Naming Conventions**: Use descriptive names to identify project types
3. **Regular Maintenance**: Clean caches periodically for optimal performance

### Performance Monitoring

1. **Monitor Metrics**: Use dashboard to track performance trends
2. **Cache Management**: Clear caches when making structural changes
3. **Resource Planning**: Account for concurrent operation limits in large projects

### Workflow Integration

1. **Unified Monitoring**: Use single dashboard for all projects
2. **Type-Aware Operations**: Respect project type differences
3. **Migration Planning**: Plan transitions between project types carefully

## API Reference

### Project Types

```typescript
type ProjectType = 'spec-workflow' | 'spec-kit';

interface ProjectDTO {
  id: string;
  name: string;
  type: ProjectType;
  path: string;
  status: string;
  stats?: ProjectStats;
  lastScanned: Date;
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  scanTime: number;
  cacheHits: number;
  cacheMisses: number;
  operationsCount: number;
  averageOperationTime: number;
}
```

## Related Documentation

- [User Guide](USER-GUIDE.md) - General usage instructions
- [Configuration Guide](CONFIGURATION.md) - Advanced configuration options
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Development Guide](DEVELOPMENT.md) - Contributing and development setup