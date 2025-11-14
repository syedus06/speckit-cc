# Quickstart: Spec-Kit Dashboard Compatibility

**Feature**: 001-speckit-dashboard-compat  
**Audience**: Developers implementing this feature  
**Prerequisites**: Familiarity with TypeScript, Node.js, React

## Getting Started

### 1. Environment Setup

Set the root directory environment variable:

```bash
# Linux/macOS
export SPECKIT_ROOT_DIR="/home/user/code"

# Windows (PowerShell)
$env:SPECKIT_ROOT_DIR = "C:\Users\user\code"

# Docker
docker run -e SPECKIT_ROOT_DIR=/workspace ...
```

### 2. Run the Dashboard

```bash
cd /path/to/speckit-cc
npm install
npm run dev
```

The dashboard will automatically scan `SPECKIT_ROOT_DIR` for spec-kit projects on startup.

### 3. Verify Detection

Open dashboard at `http://localhost:3000` and verify:
- [ ] Projects list shows both spec-kit and spec-workflow-mcp projects
- [ ] Spec-kit projects have distinct badge/icon
- [ ] Clicking a spec-kit project shows AI agents
- [ ] Spec directories are listed in numerical order

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Dashboard Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ProjectList  │  │  AgentList   │  │   SpecTree   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard Backend (MCP Server)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ProjectManager (Extended)                │  │
│  │  ┌────────────────────┐  ┌─────────────────────────┐ │  │
│  │  │ SpecWorkflowContext│  │  SpecKitContext (NEW)   │ │  │
│  │  └────────────────────┘  └─────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ProjectRegistry (Extended)                   │  │
│  │    • Root directory scanning (NEW)                    │  │
│  │    • Project type detection (NEW)                     │  │
│  │    • Dual project type support                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SpecKitParser (NEW)                         │  │
│  │    • AI agent discovery                               │  │
│  │    • Constitution parsing                             │  │
│  │    • Spec directory parsing                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ File system
┌─────────────────────────────────────────────────────────────┐
│                    Root Directory                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  PharmacyHub/    │  │  SpecKitCC/      │  │  MyApp/   │ │
│  │   .specify/      │  │   .specify/      │  │   .spec-  │ │
│  │   .claude/       │  │   .claude/       │  │   workflow│ │
│  │   specs/         │  │   specs/         │  │           │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
│    (spec-kit)            (spec-kit)           (workflow)    │
└─────────────────────────────────────────────────────────────┘
```

## Key Workflows

### Workflow 1: Project Discovery

**When**: Application startup or manual scan triggered

```typescript
// 1. Load root directory from environment
const rootDir = process.env.SPECKIT_ROOT_DIR || os.homedir();

// 2. Scan immediate subdirectories
const subdirs = await fs.readdir(rootDir, { withFileTypes: true });
const projectPaths = subdirs
  .filter(entry => entry.isDirectory())
  .map(entry => join(rootDir, entry.name));

// 3. Detect project types
for (const path of projectPaths) {
  const projectType = await detectProjectType(path);
  if (projectType === 'spec-kit') {
    await registerSpecKitProject(path);
  } else if (projectType === 'spec-workflow-mcp') {
    await registerWorkflowProject(path);
  }
}
```

**Output**: Map of registered projects by ID

---

### Workflow 2: AI Agent Discovery

**When**: Spec-kit project registered or .{agent} folder changes

```typescript
// 1. Find agent folders
const entries = await fs.readdir(projectPath, { withFileTypes: true });
const agentDirs = entries.filter(entry => 
  entry.isDirectory() && /^\.[a-z]+$/.test(entry.name)
);

// 2. For each agent folder
for (const agentDir of agentDirs) {
  const agentName = agentDir.name.slice(1); // Remove leading dot
  
  // 3. Check for commands or prompts subdirectory
  const commandsPath = join(projectPath, agentDir.name, 'commands');
  const promptsPath = join(projectPath, agentDir.name, 'prompts');
  
  const subdirPath = await exists(commandsPath) ? commandsPath : 
                     await exists(promptsPath) ? promptsPath : null;
  
  if (!subdirPath) continue;
  
  // 4. Find speckit command files
  const files = await fs.readdir(subdirPath);
  const commands = files
    .filter(f => /^speckit\.[a-z]+\.md$/.test(f))
    .map(f => ({
      commandName: f.match(/^speckit\.([a-z]+)\.md$/)[1],
      slashCommand: `/speckit.${f.match(/^speckit\.([a-z]+)\.md$/)[1]}`,
      filePath: join(subdirPath, f)
    }));
  
  // 5. Create AIAgent entity
  agents.push({
    agentName,
    folderPath: join(projectPath, agentDir.name),
    subdirectoryType: basename(subdirPath),
    commands
  });
}
```

**Output**: Array of AIAgent entities

---

### Workflow 3: Spec Directory Parsing

**When**: Spec-kit project registered or specs/ folder changes

```typescript
// 1. Read specs directory
const specsPath = join(projectPath, 'specs');
const entries = await fs.readdir(specsPath, { withFileTypes: true });

// 2. Filter numbered directories
const specDirs = entries.filter(entry =>
  entry.isDirectory() && /^\d{3}-[a-z0-9-]+$/.test(entry.name)
);

// 3. Parse each spec directory
for (const specDir of specDirs) {
  const [featureNumber, ...nameParts] = specDir.name.split('-');
  const featureName = nameParts.join('-');
  const dirPath = join(specsPath, specDir.name);
  
  // 4. Check for standard files
  const hasSpec = await exists(join(dirPath, 'spec.md'));
  const hasPlan = await exists(join(dirPath, 'plan.md'));
  const hasTasks = await exists(join(dirPath, 'tasks.md'));
  
  // 5. Find subdirectories
  const subentries = await fs.readdir(dirPath, { withFileTypes: true });
  const subdirectories = subentries
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  // 6. Find task breakdown files
  const taskFiles = subentries
    .filter(e => e.isFile() && /^tasks-phase.*\.md$/.test(e.name))
    .map(e => e.name);
  
  specs.push({
    featureNumber,
    featureName,
    directoryName: specDir.name,
    directoryPath: dirPath,
    hasSpec,
    hasPlan,
    hasTasks,
    subdirectories,
    taskFiles
  });
}
```

**Output**: Array of SpecDirectory entities

## Testing Strategy

### Unit Tests

Test individual parsers and detectors in isolation:

```typescript
describe('SpecKitParser', () => {
  it('should detect AI agent folders', async () => {
    const mockFS = {
      '/project/.claude/commands/speckit.analyze.md': 'content',
      '/project/.codex/prompts/speckit.plan.md': 'content'
    };
    
    const parser = new SpecKitParser('/project');
    const agents = await parser.getAgents();
    
    expect(agents).toHaveLength(2);
    expect(agents[0].agentName).toBe('claude');
    expect(agents[1].subdirectoryType).toBe('prompts');
  });
});
```

### Integration Tests

Test full project detection flow:

```typescript
describe('ProjectRegistry', () => {
  it('should scan root directory and detect both project types', async () => {
    const testRoot = '/tmp/test-root';
    await setupTestProjects(testRoot);
    
    process.env.SPECKIT_ROOT_DIR = testRoot;
    const registry = new ProjectRegistry();
    await registry.scanRootDirectory();
    
    const projects = registry.getAllProjects();
    expect(projects).toHaveLength(3);
    expect(projects.filter(p => p.projectType === 'spec-kit')).toHaveLength(2);
    expect(projects.filter(p => p.projectType === 'spec-workflow-mcp')).toHaveLength(1);
  });
});
```

### E2E Tests

Test via dashboard API:

```typescript
describe('Dashboard API', () => {
  it('should return spec-kit projects with agents', async () => {
    const response = await fetch('http://localhost:3000/api/projects?type=spec-kit');
    const data = await response.json();
    
    expect(data.projects).toHaveLength(2);
    expect(data.projects[0].agentCount).toBeGreaterThan(0);
  });
});
```

## Common Patterns

### Pattern 1: Type-Safe Project Context

Use discriminated unions to maintain type safety:

```typescript
function handleProject(context: ProjectContext) {
  if (context.projectType === 'spec-kit') {
    // TypeScript knows context.agents exists
    const agentNames = context.agents.map(a => a.agentName);
  } else {
    // TypeScript knows context.watcher exists
    await context.watcher.start();
  }
}
```

### Pattern 2: Graceful Degradation

Handle missing optional components:

```typescript
async function loadConstitution(projectPath: string): Promise<Constitution | null> {
  try {
    const path = join(projectPath, '.specify', 'memory', 'constitution.md');
    const content = await fs.readFile(path, 'utf-8');
    return { content, filePath: path };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Constitution is optional
    }
    throw error; // Other errors are fatal
  }
}
```

### Pattern 3: Concurrent Scanning

Use concurrency limits for performance:

```typescript
async function scanProjects(paths: string[]) {
  const limit = pLimit(10); // Max 10 concurrent
  
  const results = await Promise.all(
    paths.map(path => limit(() => detectProjectType(path)))
  );
  
  return results;
}
```

## Troubleshooting

### Issue: Projects not appearing in dashboard

**Diagnosis**:
1. Check `SPECKIT_ROOT_DIR` environment variable is set
2. Verify root directory exists and is readable
3. Check projects have `.specify` folder
4. Review server logs for scan errors

**Resolution**:
```bash
# Verify environment
echo $SPECKIT_ROOT_DIR

# Check directory permissions
ls -la $SPECKIT_ROOT_DIR

# Trigger manual scan via API
curl -X POST http://localhost:3000/api/scan
```

### Issue: AI agents not detected

**Diagnosis**:
1. Verify agent folder names (must be `.{lowercase}`)
2. Check for `/commands` or `/prompts` subdirectory
3. Verify files match `speckit.*.md` pattern
4. Check file permissions

**Resolution**:
```bash
# Check agent folders
ls -la /path/to/project/.claude
ls -la /path/to/project/.claude/commands

# Verify file patterns
find /path/to/project -name "speckit.*.md"
```

### Issue: Spec directories not showing

**Diagnosis**:
1. Verify `specs/` folder exists
2. Check directory names match `###-name` pattern
3. Verify permissions on specs directory

**Resolution**:
```bash
# Check specs directory
ls -la /path/to/project/specs

# Verify naming pattern
ls /path/to/project/specs | grep -E '^\d{3}-'
```

## Next Steps

1. Run tests: `npm test`
2. Start dashboard: `npm run dev`
3. Create test projects in root directory
4. Verify all features working
5. Proceed to tasks implementation
