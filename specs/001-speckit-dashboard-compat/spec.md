# Feature Specification: Spec-Kit Dashboard Compatibility

**Feature Branch**: `001-speckit-dashboard-compat`  
**Created**: November 12, 2025  
**Status**: Draft  
**Input**: User description: "Dashboard should be compatible with spec-kit. It should read speckit docs, scan all directories for .specify folder to identify spec-kit projects, check .AI agent folder for available agents (like speckit.analyze.md), and read the specs folder structure."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

Every user story must also declare the evidence (tests/contracts/telemetry) that will be run before implementation and any localization or UI surfaces involved so dashboards, CLI, and VSCode views stay in sync.

### User Story 1 - Automatic Spec-Kit Project Detection (Priority: P1)

When a user starts the dashboard application, they configure a root directory via environment variable. The system scans all subdirectories within that root, identifies spec-kit projects by detecting the presence of a `.specify` folder in each subdirectory, and displays a list of all discovered projects. Users can select any project to view its specifications without manual configuration.

**Why this priority**: This is the foundation for all spec-kit compatibility features. Without automatic project detection from a configured root directory, users cannot access any spec-kit project data through the dashboard.

**Independent Test**: Can be fully tested by setting a root directory containing multiple subdirectories (some with `.specify` folders, some without), then verifying the dashboard correctly identifies and lists only the spec-kit projects. Delivers immediate value by showing users which projects are available.

**Evidence & Telemetry**: 
- Unit tests validating `.specify` folder detection logic
- Integration tests scanning test directory structures with various depths
- Logging of root directory configuration, detected project paths, and scan duration
- Metrics tracking number of projects discovered per scan and scan performance

**Localization / UX Surfaces**: 
- Dashboard project list view
- "No projects found" message
- "Root directory not configured" warning
- Project scanning status indicator
- Error messages for inaccessible directories or invalid root paths

**Acceptance Scenarios**:

1. **Given** user sets root directory containing multiple subdirectories with `.specify` folders, **When** dashboard loads, **Then** all subdirectories containing `.specify` are listed as spec-kit projects
2. **Given** user adds a new subdirectory with `.specify` folder to the root, **When** dashboard refreshes, **Then** the new project appears in the project list
3. **Given** user has no spec-kit projects in root directory, **When** dashboard loads, **Then** a helpful message explains how to initialize a spec-kit project
4. **Given** a subdirectory contains `.specify` but is inaccessible due to permissions, **When** dashboard scans, **Then** the error is logged and user is notified
5. **Given** root directory environment variable is not set, **When** dashboard starts, **Then** user is prompted to configure the root directory

---

### User Story 2 - AI Agent Discovery and Display (Priority: P2)

After selecting a spec-kit project, users can view which AI agents are available in that project. The dashboard scans for AI-specific agent folders (`.claude`, `.codex`, `.gemini`, `.cursor`, etc.) and discovers the speckit prompt files within each agent's command/prompt directory. The dashboard displays available agents and their supported slash commands (e.g., `/speckit.analyze`, `/speckit.clarify`, `/speckit.plan`), showing users which AI assistants are configured and what workflow commands each supports.

**Why this priority**: Understanding available agents helps users know what capabilities are configured in their project and which AI assistants they can use. This is essential for workflow understanding but can be added after basic project detection.

**Independent Test**: Can be fully tested by creating a project with various AI agent folders containing speckit prompt files and verifying they are correctly parsed and displayed per agent. Delivers value by showing users their available AI assistants and workflow commands.

**Evidence & Telemetry**: 
- Unit tests for AI agent folder detection (`.claude`, `.codex`, `.gemini`, `.cursor`)
- Integration tests parsing commands/prompts subdirectories with various configurations
- Logging of discovered agents per project with command counts
- Metrics on most commonly configured agent types

**Localization / UX Surfaces**: 
- Agent list panel in project detail view grouped by AI assistant
- Agent type labels (Claude, Codex, Gemini, Cursor) with icons
- Slash command list per agent (e.g., "/speckit.analyze", "/speckit.plan")
- "No agents configured" message
- Agent file parse error notifications

**Acceptance Scenarios**:

1. **Given** a spec-kit project with `.claude/commands/` containing speckit prompt files, **When** user selects the project, **Then** Claude agent is shown with all available slash commands
2. **Given** a project has multiple agent folders (.claude, .codex, .cursor), **When** user views project details, **Then** all agents are displayed with their respective commands
3. **Given** a project without any AI agent folders, **When** user views project details, **Then** a message indicates no AI agents are configured
4. **Given** an agent folder uses `/prompts` subdirectory instead of `/commands`, **When** dashboard parses it, **Then** commands are still discovered correctly
5. **Given** user creates a new `.gemini/commands/speckit.analyze.md` file, **When** dashboard refreshes, **Then** Gemini agent appears with the analyze command
6. **Given** multiple agents have the same command (e.g., all have speckit.plan.md), **When** displayed, **Then** command is shown for each agent independently

---

### User Story 3 - Spec Folder Structure Visualization (Priority: P1)

Users can view the complete structure of the `specs` folder for a selected spec-kit project. The dashboard displays all spec directories (numbered like `001-architecture-refactor`), showing the hierarchy of specification documents (spec.md, plan.md, tasks.md), checklists, contracts, and related artifacts within each spec, enabling users to navigate and understand the project's specification organization.

**Why this priority**: This is a core value proposition - users need to see and navigate their specs. Equal priority with project detection as it's essential for the dashboard to be useful.

**Independent Test**: Can be fully tested by creating a project with multiple spec directories containing various documents, then verifying the complete structure is displayed correctly. Delivers value by providing a visual overview of all specifications.

**Evidence & Telemetry**: 
- Unit tests for spec directory parsing
- Integration tests with nested spec structures (spec.md, plan.md, tasks.md, checklists/, contracts/, backups/)
- Logging of spec count and structure per project
- Metrics on spec navigation patterns

**Localization / UX Surfaces**: 
- Spec tree view component
- Spec directory labels with feature numbers and names
- Document type indicators (spec.md, plan.md, tasks.md, checklists, contracts)
- Subdirectory badges (checklists, contracts, backups, scripts, github-issue-templates)
- Empty specs folder message
- Navigation breadcrumbs

**Acceptance Scenarios**:

1. **Given** a spec-kit project with multiple spec directories, **When** user views the project, **Then** all spec directories are displayed in numerical order with their contents
2. **Given** a spec directory contains spec.md, plan.md, tasks.md, and subdirectories, **When** user expands the directory, **Then** all files and subdirectories are shown with appropriate icons
3. **Given** a spec directory contains various task breakdown files (tasks-phase1-infrastructure.md, tasks-phase2.1-assessment-refactor.md), **When** user views it, **Then** all task files are grouped and displayed
4. **Given** specs folder doesn't exist, **When** user views project, **Then** a message guides user to create their first spec
5. **Given** spec directory has checklists/ and contracts/ subdirectories, **When** displayed, **Then** subdirectories are clearly marked with folder icons

---

### User Story 4 - Spec-Kit Configuration Access (Priority: P3)

Users can view spec-kit project configuration and templates directly from the dashboard. The system reads the `.specify` folder structure (memory/constitution.md, templates/, scripts/) and displays project governance documents, available templates, and helper scripts, providing users with quick access to project configuration without navigating the file system.

**Why this priority**: While helpful for understanding project setup, configuration access is a convenience feature that can be added after core functionality is working. Users can access these files directly through their editor initially.

**Independent Test**: Can be fully tested by verifying `.specify` folder contents are correctly loaded and displayed in a configuration panel. Delivers value by providing centralized access to project governance and templates.

**Evidence & Telemetry**: 
- Unit tests for `.specify` folder parsing
- Integration tests for markdown rendering of constitution documents
- Logging of configuration access patterns
- Metrics on most viewed templates and scripts

**Localization / UX Surfaces**: 
- Configuration panel/sidebar
- Template list view
- Constitution document viewer
- "Configuration not available" message
- Script execution warnings

**Acceptance Scenarios**:

1. **Given** spec-kit project has memory/constitution.md, **When** user clicks configuration icon, **Then** constitution document is displayed with proper formatting
2. **Given** user is viewing available templates, **When** user requests template list, **Then** all templates from `.specify/templates/` are shown (spec-template.md, plan-template.md, tasks-template.md, checklist-template.md)
3. **Given** project has helper scripts in `.specify/scripts/bash/`, **When** user views scripts, **Then** script names and descriptions are listed
4. **Given** `.specify` folder is missing memory/ or templates/ subdirectories, **When** user requests configuration, **Then** partial configuration is shown with indicators for missing components

---

### User Story 5 - Multi-Project Management (Priority: P2)

Users can work with multiple spec-kit projects simultaneously. The dashboard maintains separate contexts for each project, allowing users to switch between projects and view their individual specs, agents, and documentation without losing state or mixing data between projects.

**Why this priority**: Many developers work on multiple projects. This significantly improves usability but requires the core single-project features to work first.

**Independent Test**: Can be fully tested by registering multiple projects and verifying data isolation and state preservation when switching. Delivers value by supporting real-world multi-project workflows.

**Evidence & Telemetry**: 
- Unit tests for project context isolation
- Integration tests for project switching
- Logging of active project changes
- Metrics on number of projects per user and switch frequency

**Localization / UX Surfaces**: 
- Project switcher dropdown/menu
- Active project indicator
- "Switch project" confirmation messages
- Recently accessed projects list

**Acceptance Scenarios**:

1. **Given** user has registered multiple projects, **When** user switches between them, **Then** each project shows its own specs and agents without data mixing
2. **Given** user is viewing a spec in Project A, **When** user switches to Project B, **Then** Project B's specs are displayed and Project A's view state is preserved
3. **Given** user makes changes in one project, **When** user switches to another project, **Then** changes are isolated and don't affect the other project
4. **Given** a project is removed from the filesystem, **When** user refreshes dashboard, **Then** that project is automatically removed from the project list

---

### Edge Cases

- What happens when the root directory environment variable is not set or points to invalid path?
  - **Evidence**: Validation tests ensure application provides clear error message and guidance to configure root directory
  - **Logging**: Record configuration errors with specific path validation failures
  
- What happens when a `.specify` folder exists but is empty or malformed within a subdirectory?
  - **Evidence**: Validation tests ensure empty/malformed folders are flagged as incomplete projects with helpful guidance
  - **Logging**: Record malformed project structures for debugging
  
- How does the system handle symbolic links within the root directory or within subdirectories?
  - **Evidence**: Integration tests verify symlink resolution and permissions checking
  - **Logging**: Track symlink usage and permission errors
  
- What happens when the root directory contains a very large number of subdirectories (e.g., 1000+)?
  - **Evidence**: Performance tests validate scan completes within acceptable time limits for large directory counts
  - **Logging**: Metrics on scan duration, subdirectory count, and projects found
  
- How are concurrent updates to spec files handled during dashboard viewing?
  - **Evidence**: File watching tests verify real-time updates are reflected
  - **Logging**: Track file change events and UI refresh triggers
  
- What happens when `.specify` folder naming conventions differ (case sensitivity on different operating systems)?
  - **Evidence**: Tests verify case-insensitive detection on case-insensitive filesystems (Windows, macOS) and case-sensitive on Linux
  - **Logging**: Record non-standard naming patterns encountered
  
- What happens when AI agent folders have different subdirectory patterns (some use `/commands`, others use `/prompts`)?
  - **Evidence**: Tests verify both patterns are supported and commands are discovered from either location
  - **Logging**: Track which pattern each agent uses for debugging
  
- How does the dashboard handle duplicate slash commands across multiple AI agents?
  - **Evidence**: Tests verify commands are properly associated with their respective agents
  - **Logging**: Track command duplication across agents for metrics
  
- What happens when an AI agent folder exists but contains no speckit command files?
  - **Evidence**: Tests validate empty agent folders are shown with "no commands configured" message
  - **Logging**: Record empty agent configurations
  
- What happens when multiple projects have the same subdirectory name in different root directory configurations?
  - **Evidence**: Tests verify unique project identification using full paths
  - **Logging**: Track project ID collisions and resolution

- How are deeply nested subdirectories handled (e.g., root/project/subproject with multiple `.specify` folders)?
  - **Evidence**: Tests verify only immediate subdirectories of root are scanned (depth = 1)
  - **Logging**: Document scan depth policy and ignored nested projects

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a root directory path via environment variable for project scanning
- **FR-002**: System MUST scan all immediate subdirectories within the configured root directory
- **FR-003**: System MUST identify each subdirectory containing `.specify` folder as a spec-kit project
- **FR-004**: System MUST extract project metadata from subdirectory name and `.specify` folder contents
- **FR-005**: System MUST discover AI agent folders by detecting directories matching pattern `.{agent-name}` (e.g., `.claude`, `.codex`, `.gemini`, `.cursor`)
- **FR-006**: System MUST scan both `/commands` and `/prompts` subdirectories within each agent folder for speckit files
- **FR-007**: System MUST parse speckit command files matching pattern `speckit.*.md` (e.g., `speckit.analyze.md`, `speckit.plan.md`)
- **FR-008**: System MUST extract slash command names from speckit filenames (e.g., `speckit.analyze.md` → `/speckit.analyze`)
- **FR-009**: System MUST associate discovered commands with their respective AI agent (Claude, Codex, Gemini, Cursor, etc.)
- **FR-010**: System MUST read and parse the `specs` folder structure including all numbered spec directories
- **FR-011**: System MUST recognize standard spec files (spec.md, plan.md, tasks.md) and subdirectories (checklists/, contracts/, backups/, scripts/, github-issue-templates/)
- **FR-012**: System MUST display hierarchical structure of spec directories and their contained files and subdirectories
- **FR-013**: System MUST differentiate between spec-kit projects and other project types in the dashboard
- **FR-014**: System MUST handle both spec-kit projects and existing spec-workflow-mcp projects simultaneously
- **FR-015**: System MUST maintain separate contexts for each registered spec-kit project
- **FR-016**: System MUST provide visual indicators for project type (spec-kit vs spec-workflow-mcp)
- **FR-017**: System MUST handle missing or optional subdirectories within `.specify` gracefully (memory/, templates/, scripts/)
- **FR-018**: System MUST log all project detection activities including root directory scans for debugging
- **FR-019**: System MUST refresh project list when filesystem changes are detected in root directory
- **FR-020**: System MUST read and display project constitution from `.specify/memory/constitution.md` when available
- **FR-021**: System MUST list available templates from `.specify/templates/` directory
- **FR-022**: System MUST support navigation between multiple registered spec-kit projects
- **FR-023**: System MUST validate root directory configuration and report errors for invalid paths
- **FR-024**: System MUST handle file system permission errors gracefully without crashing
- **FR-025**: System MUST parse task breakdown files with naming pattern `tasks-phase*.md`
- **FR-026**: System MUST display spec directories in numerical order by feature number
- **FR-027**: System MUST handle projects with no AI agent folders configured
- **FR-028**: System MUST support both `.github/prompts` (legacy) and `.{agent}/commands` or `.{agent}/prompts` folder structures

### Key Entities

- **Spec-Kit Project**: A subdirectory within the configured root directory containing a `.specify` folder with spec-kit configuration and templates
  - Attributes: project path, project name (from subdirectory), project ID, type (spec-kit), constitution document
  - Contains: AI agents (.github/prompts/), specs (specs/), steering documents, templates (.specify/templates/), scripts (.specify/scripts/)
  - Distinguished from spec-workflow-mcp projects by presence of `.specify` folder
  - Located as immediate subdirectories of configured root directory

- **Root Directory**: A configured directory path (via environment variable) that contains multiple project subdirectories
  - Attributes: absolute path, scan depth (immediate subdirectories only), accessibility status
  - Purpose: Central location for scanning and discovering spec-kit projects
  - Configuration: Set via environment variable at application startup

- **AI Agent Folder**: A hidden directory named after an AI assistant containing speckit prompt files
  - Naming pattern: `.{agent-name}` (e.g., `.claude`, `.codex`, `.gemini`, `.cursor`)
  - Subdirectories: `/commands` or `/prompts` (both patterns supported)
  - Contains: speckit.*.md files (e.g., `speckit.analyze.md`, `speckit.plan.md`, `speckit.implement.md`)
  - Purpose: Provides slash commands specific to each AI assistant
  - Common agents: Claude, Codex, Gemini, Cursor, and others

- **AI Agent Prompt File**: A markdown file defining a workflow slash command
  - Attributes: command name (derived from filename), file path, prompt content
  - Naming pattern: `speckit.{command}.md` (e.g., `speckit.analyze.md` → `/speckit.analyze`)
  - Location: `.{agent}/commands/` or `.{agent}/prompts/` (e.g., `.claude/commands/speckit.analyze.md`)
  - Structure: Markdown with optional YAML frontmatter for metadata
  - Note: Same commands exist across multiple agents (each AI has its own copy)

- **Spec Directory**: A numbered directory within the `specs` folder containing specification artifacts
  - Attributes: feature number, feature name, creation date, status
  - Contains: spec.md, plan.md, tasks.md, and subdirectories (checklists/, contracts/, backups/, scripts/, github-issue-templates/)
  - Naming pattern: `###-feature-name` (e.g., `001-architecture-refactor`)
  - May contain multiple task breakdown files: `tasks-phase*.md` pattern

- **Spec-Kit Configuration**: Metadata and settings stored in `.specify` folder
  - Subdirectories: memory/ (constitution), templates/ (spec, plan, tasks, checklist templates), scripts/ (bash helper scripts)
  - Key files: memory/constitution.md (project principles), templates/*.md (document templates)
  - Purpose: Defines project governance, available commands, workflow configuration

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard correctly identifies 100% of subdirectories containing `.specify` folders within the configured root directory as spec-kit projects
- **SC-002**: Users can configure root directory via environment variable and view the complete list of detected spec-kit projects within 2 seconds of dashboard load
- **SC-003**: All AI agent folders (.claude, .codex, .gemini, .cursor) are discovered and their speckit command files are parsed with slash command names displayed
- **SC-004**: Complete `specs` folder hierarchy including all subdirectories is rendered within 1 second for projects with up to 50 specs
- **SC-005**: Users can navigate between multiple spec-kit projects without data mixing or context loss
- **SC-006**: Dashboard handles missing AI agent folders or specs subdirectories without errors or crashes
- **SC-007**: File system changes (new projects in root directory, new specs, new AI agent folders) are detected and reflected in UI within 5 seconds
- **SC-008**: 95% of spec-kit projects in configured root directory are successfully registered and accessible on first dashboard load
- **SC-009**: All project detection and parsing activities are logged with timestamps, root directory path, and project identifiers
- **SC-010**: Users can distinguish between spec-kit and spec-workflow-mcp projects at a glance through visual indicators
- **SC-011**: Dashboard supports viewing and managing at least 10 concurrent spec-kit projects without performance degradation
- **SC-012**: Commands from multiple AI agents (e.g., Claude, Codex, Cursor) are correctly grouped and displayed per agent
- **SC-013**: Invalid or missing root directory configuration provides clear error message within 1 second of application start
- **SC-014**: Scan of root directory with 100 subdirectories completes within 5 seconds
- **SC-015**: Dashboard correctly identifies and supports both `/commands` and `/prompts` subdirectory patterns in AI agent folders
