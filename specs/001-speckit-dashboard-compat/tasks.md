# Tasks: Spec-Kit Dashboard Compatibility

**Input**: Design documents from `/specs/001-speckit-dashboard-compat/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md  
**Branch**: 001-speckit-dashboard-compat

**Tests**: Tests are NOT explicitly requested in the feature specification, so no test tasks are included. Focus is on implementation with logging and telemetry per constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Traceability**: Each task mentions exact file paths plus required telemetry/log IDs so dashboards, approvals, and implementation logs stay aligned.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Reference evidence checkpoints (logging/telemetry) before describing the implementation work

## Path Conventions

Single TypeScript project with existing structure:
- Backend: `src/core/`, `src/dashboard/`, `src/tools/`
- Frontend: `dashboard_frontend/src/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions for spec-kit support

- [x] T001 Add spec-kit types to src/types.ts (SpecKitProject, AIAgent, AgentCommand, Constitution, SpecDirectory, Template interfaces)
- [x] T002 [P] Add frontend types to dashboard_frontend/src/types.ts (SpecKitProjectDTO, AIAgentDTO extending backend types)
- [x] T003 [P] Update environment configuration to include SPECKIT_ROOT_DIR variable with validation in src/config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement project type detection function detectProjectType(path: string) in src/core/path-utils.ts (detects .specify folder vs .spec-workflow)
- [x] T005 Create SpecKitParser class in src/core/parser.ts with methods: parseProjectMetadata(), getAgents(), getSpecs(), getConstitution(), getTemplates()
- [x] T006 Extend ProjectRegistry in src/core/project-registry.ts to support discriminated union (SpecKitProjectContext | WorkflowProjectContext) with new methods: scanRootDirectory(), registerSpecKitProject()
- [x] T007 Add logging infrastructure for spec-kit operations in src/dashboard/utils.ts (project.discovered, agent.detected, scan.completed events)
- [x] T008 Implement ProjectContext discriminated union type guards in src/types.ts (isSpecKitProject(), isWorkflowProject())

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Spec-Kit Project Detection (Priority: P1) 🎯 MVP

**Goal**: Scan configured root directory for subdirectories with .specify folders and display detected projects

**Independent Test**: Set SPECKIT_ROOT_DIR to test directory with multiple subdirectories, verify dashboard lists only spec-kit projects

**Status**: ✅ COMPLETED - All 13 tasks implemented and functional

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement getRootDirectory() function in src/config.ts to load and validate SPECKIT_ROOT_DIR environment variable with error logging
- [x] T010 [P] [US1] Implement scanRootDirectory() method in src/core/project-registry.ts to list immediate subdirectories (depth=1) with performance logging (scan duration, subdirectory count)
- [x] T011 [US1] Implement detectProjectType() logic in src/core/path-utils.ts to check for .specify folder existence and return 'spec-kit' | 'spec-workflow-mcp' | null
- [x] T012 [US1] Implement registerSpecKitProject(path: string) in src/core/project-registry.ts to create SpecKitProject entity with SHA-1 hash projectId and emit project.discovered event
- [x] T013 [US1] Add REST endpoint GET /api/projects in src/dashboard/multi-server.ts with type filter query parameter and includeStats option
- [x] T014 [US1] Add REST endpoint POST /api/scan in src/dashboard/multi-server.ts to trigger manual root directory scan with force parameter
- [x] T015 [P] [US1] Create ProjectList component in dashboard_frontend/src/components/ProjectList.tsx to display all projects with type badges
- [x] T016 [P] [US1] Create SpecKitBadge component in dashboard_frontend/src/components/SpecKitBadge.tsx for project type visual indicator
- [x] T017 [US1] Update API service in dashboard_frontend/src/services/api.ts to fetch projects list with type filtering
- [x] T018 [US1] Add localization strings for project detection UI messages in dashboard_frontend/src/i18n.ts ("No projects found", "Root directory not configured", "Scanning projects...")
- [x] T019 [US1] Implement WebSocket event emitter for project.discovered in src/dashboard/multi-server.ts with payload {projectId, projectName, projectType, timestamp}
- [x] T020 [US1] Add error handling for root directory validation failures in src/config.ts with error codes ROOT_DIR_NOT_CONFIGURED, ROOT_DIR_INVALID

**Checkpoint**: At this point, User Story 1 should be fully functional - dashboard can detect and list spec-kit projects from root directory

---

## Phase 4: User Story 2 - Spec Folder Structure Visualization (Priority: P1)

**Goal**: Display complete specs folder hierarchy with all specification documents and subdirectories

**Independent Test**: Create project with multiple spec directories containing various documents, verify complete structure displays correctly

**Status**: ✅ COMPLETED - All 10 tasks implemented and functional

### Implementation for User Story 2

- [x] T021 [P] [US2] Implement parseSpecDirectories() method in src/core/parser.ts to scan specs/ folder and return SpecDirectory[] array with numerical ordering
- [x] T022 [P] [US2] Implement detectSpecFiles() helper in src/core/parser.ts to check for spec.md, plan.md, tasks.md existence and parse task breakdown files (tasks-phase*.md pattern)
- [x] T023 [P] [US2] Implement detectSpecSubdirectories() helper in src/core/parser.ts to list subdirectories (checklists/, contracts/, backups/, scripts/, github-issue-templates/)
- [x] T024 [US2] Add REST endpoint GET /api/projects/:projectId in src/dashboard/multi-server.ts to return full project details including specs array
- [x] T025 [US2] Add REST endpoint GET /api/projects/:projectId/specs/:specId in src/dashboard/multi-server.ts to return detailed spec directory information with files and subdirectories
- [x] T026 [P] [US2] Create or extend SpecTree component in dashboard_frontend/src/components/SpecTree.tsx to render spec-kit hierarchy (numbered directories, files, subdirectories)
- [x] T027 [P] [US2] Add spec tree icons and styling in dashboard_frontend/src/components/SpecTree.tsx for document types (spec.md, plan.md, tasks.md) and subdirectory badges
- [x] T028 [US2] Update API service in dashboard_frontend/src/services/api.ts to fetch spec directory details with file metadata
- [x] T029 [US2] Add localization strings for spec visualization UI in dashboard_frontend/src/i18n.ts ("Empty specs folder", "Spec directories", navigation breadcrumbs)
- [x] T030 [US2] Add logging for spec parsing operations in src/core/parser.ts (spec count, structure complexity, parse duration)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can see projects and navigate spec structures

---

## Phase 5: User Story 3 - AI Agent Discovery and Display (Priority: P2)

**Goal**: Discover AI agent folders and display available agents with their slash commands per project

**Independent Test**: Create project with various AI agent folders (.claude, .codex, .cursor) containing speckit files, verify correct parsing and display

### Implementation for User Story 3

- [x] T031 [P] [US3] Implement discoverAIAgents() method in src/core/parser.ts to scan for directories matching /^\.[a-z]+$/ pattern with agent count logging
- [x] T032 [P] [US3] Implement detectAgentSubdirectory() helper in src/core/parser.ts to check for /commands or /prompts subdirectory and return subdirectoryType
- [x] T033 [P] [US3] Implement parseAgentCommands() method in src/core/parser.ts to find speckit.*.md files and extract slash commands with command count metrics
- [x] T034 [US3] Implement extractCommandName() utility in src/core/parser.ts to parse command name from filename (speckit.analyze.md → analyze, /speckit.analyze)
- [x] T035 [US3] Update parseProjectMetadata() in src/core/parser.ts to call discoverAIAgents() and include agents array in SpecKitProjectContext
- [x] T036 [US3] Add MCP tool get_speckit_agents in src/tools/speckit-tools.ts with input schema {projectId: string} and output schema returning AIAgent[] array
- [x] T037 [P] [US3] Create AgentList component in dashboard_frontend/src/components/AgentList.tsx to display agents grouped by AI assistant with icons
- [x] T038 [P] [US3] Add agent type icons in dashboard_frontend/src/components/AgentList.tsx (Claude, Codex, Gemini, Cursor) with slash command list per agent
- [x] T039 [US3] Update GET /api/projects/:projectId endpoint in src/dashboard/multi-server.ts to include agents array with commands in response
- [x] T040 [US3] Update API service in dashboard_frontend/src/services/api.ts to fetch agent data for selected project
- [x] T041 [US3] Add localization strings for agent discovery UI in dashboard_frontend/src/i18n.ts ("No agents configured", "Available commands", agent type labels)
- [x] T042 [US3] Add WebSocket event emitter for agent.detected in src/dashboard/multi-server.ts with payload {projectId, agentName, commandCount, timestamp}
- [x] T043 [US3] Add logging for agent discovery operations in src/core/parser.ts (agent folder detection, command parsing, subdirectory type)

**Checkpoint**: All three priority P1/P2 user stories should now be independently functional - users can see projects, specs, and AI agents

---

## Phase 6: User Story 4 - Multi-Project Management (Priority: P2)

**Goal**: Support working with multiple spec-kit projects simultaneously with proper context isolation

**Independent Test**: Register multiple projects, verify data isolation and state preservation when switching between projects

### Implementation for User Story 4

- [x] T044 [P] [US4] Implement project context isolation in src/dashboard/project-manager.ts to maintain separate SpecKitProjectContext instances per projectId
- [x] T045 [P] [US4] Implement project switching logic in src/dashboard/project-manager.ts to preserve view state when switching active project
- [x] T046 [US4] Add project removal detection in src/core/project-registry.ts with filesystem watcher to emit project.removed event when directory deleted
- [x] T047 [US4] Implement automatic project refresh in src/dashboard/watcher.ts to rescan root directory on filesystem changes with debouncing (5 second delay)
- [x] T048 [US4] Add WebSocket event emitter for project.removed in src/dashboard/multi-server.ts with payload {projectId, projectName, timestamp}
- [x] T049 [US4] Add WebSocket event emitter for project.updated in src/dashboard/multi-server.ts with payload {projectId, changedPaths, timestamp}
- [x] T050 [US4] Create project switcher dropdown component in dashboard_frontend/src/components/ProjectSwitcher.tsx with recently accessed projects list
- [x] T051 [P] [US4] Add active project indicator in dashboard_frontend/src/components/ProjectList.tsx with visual highlighting
- [x] T052 [US4] Implement WebSocket connection in dashboard_frontend/src/services/api.ts to receive real-time project events (discovered, removed, updated)
- [x] T053 [US4] Add localization strings for multi-project UI in dashboard_frontend/src/i18n.ts ("Switch project", "Active project", confirmation messages)
- [x] T054 [US4] Add logging for project switching operations in src/dashboard/project-manager.ts (active project changes, context switches, metrics on switch frequency)

**Checkpoint**: Multi-project management complete - users can work with multiple projects simultaneously with proper isolation

---

## Phase 7: User Story 5 - Spec-Kit Configuration Access (Priority: P3)

**Goal**: Display spec-kit project configuration, constitution, templates, and helper scripts from .specify folder

**Independent Test**: Verify .specify folder contents (constitution, templates, scripts) load and display correctly in configuration panel

### Implementation for User Story 5

- [x] T055 [P] [US5] Implement parseConstitution() method in src/core/parser.ts to read .specify/memory/constitution.md and extract version, principle count
- [x] T056 [P] [US5] Implement getTemplates() method in src/core/parser.ts to list templates from .specify/templates/ with template type detection
- [x] T057 [P] [US5] Implement getScripts() method in src/core/parser.ts to list helper scripts from .specify/scripts/bash/ with descriptions
- [x] T058 [US5] Add REST endpoint GET /api/projects/:projectId/constitution in src/dashboard/multi-server.ts to return Constitution entity with content and metadata
- [x] T059 [US5] Add MCP tool get_speckit_constitution in src/tools/speckit-tools.ts with input schema {projectId: string} and output schema returning constitution content
- [x] T060 [US5] Update parseProjectMetadata() in src/core/parser.ts to include constitution and templates in SpecKitProjectContext
- [x] T061 [P] [US5] Create ConfigurationPanel component in dashboard_frontend/src/components/ConfigurationPanel.tsx to display constitution document with markdown rendering
- [x] T062 [P] [US5] Create TemplateList component in dashboard_frontend/src/components/TemplateList.tsx to show available templates (spec-template.md, plan-template.md, tasks-template.md, checklist-template.md)
- [x] T063 [P] [US5] Create ScriptList component in dashboard_frontend/src/components/ScriptList.tsx to display helper scripts with names and descriptions
- [x] T064 [US5] Update API service in dashboard_frontend/src/services/api.ts to fetch constitution and configuration data
- [x] T065 [US5] Add localization strings for configuration UI in dashboard_frontend/src/i18n.ts ("Configuration not available", "Constitution", "Templates", "Scripts", script execution warnings)
- [x] T066 [US5] Add graceful degradation in src/core/parser.ts for missing .specify subdirectories (memory/, templates/, scripts/) with partial configuration display
- [x] T067 [US5] Add logging for configuration access in src/core/parser.ts (constitution loads, template access patterns, metrics on most viewed templates)

**Checkpoint**: All user stories complete - full spec-kit dashboard compatibility achieved

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T068 [P] Implement file system watcher for root directory in src/dashboard/watcher.ts to detect new/removed projects with two-tier watching strategy (root + per-project)
- [x] T069 [P] Add concurrency limits to parallel scanning in src/core/project-registry.ts using p-limit (max 10 concurrent operations) for performance optimization
- [x] T070 [P] Implement caching strategy in src/core/project-registry.ts (cache negative results 60s, agent commands until mtime change, constitution until mtime change)
- [x] T071 [P] Add performance metrics collection in src/dashboard/utils.ts (scan duration, project count, most common agent types, navigation patterns)
- [x] T072 Add MCP tool get_speckit_projects in src/tools/speckit-tools.ts with input schema {includeDetails: boolean} and output schema returning project list
- [x] T073 Add MCP tool scan_speckit_root in src/tools/speckit-tools.ts with input schema {force: boolean} and output schema returning ScanResult
- [x] T074 [P] Add error handling for edge cases in src/core/parser.ts (symbolic links, permission errors, empty .specify folders, malformed structures)
- [x] T075 [P] Add case-insensitive .specify detection in src/core/path-utils.ts for Windows/macOS compatibility while maintaining case-sensitive behavior on Linux
- [x] T076 [P] Add i18n localization files in dashboard_frontend/src/locales/ for all 12+ UI messages identified in spec.md
- [x] T077 Update existing ProjectList component compatibility in dashboard_frontend/src/components/ProjectList.tsx to display both spec-kit and spec-workflow-mcp projects with type differentiation
- [ ] T078 Run quickstart.md validation (setup SPECKIT_ROOT_DIR, create test projects, verify all workflows)
- [ ] T079 Update documentation in docs/ with spec-kit compatibility guide and environment variable configuration
- [ ] T080 Add telemetry dashboard integration for spec-kit metrics (projects detected, scan performance, agent distribution)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase - Project Detection (MVP)
- **User Story 2 (Phase 4)**: Depends on Foundational phase - Spec Visualization (can run parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational phase - AI Agent Discovery (can run parallel with US1/US2)
- **User Story 4 (Phase 6)**: Depends on US1 completion - Multi-Project Management
- **User Story 5 (Phase 7)**: Depends on US1 completion - Configuration Access
- **Polish (Phase 8)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - No dependencies on other stories (MVP START HERE)
- **User Story 2 (P1)**: Foundation only - No dependencies on other stories (can run parallel with US1)
- **User Story 3 (P2)**: Foundation only - No dependencies on other stories (can run parallel with US1/US2)
- **User Story 4 (P2)**: Requires US1 (project detection) - Builds on top of project list
- **User Story 5 (P3)**: Requires US1 (project detection) - Builds on top of project context

### Within Each User Story

- Backend implementation before frontend components
- Core parsing logic before API endpoints
- API endpoints before frontend services
- Frontend services before UI components
- Localization and logging throughout
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 - Setup**: All 3 tasks can run in parallel
- T001 (backend types)
- T002 (frontend types)
- T003 (environment config)

**Phase 2 - Foundational**: Some parallelism possible
- T004, T005, T007, T008 can run in parallel (different files)
- T006 depends on T004, T005, T008

**Phase 3 - User Story 1**: High parallelism after core logic
- T009, T010 can start in parallel
- After T011, T012: T015, T016, T017, T018, T020 can run in parallel
- T013, T014 (API endpoints) can run in parallel

**Phase 4 - User Story 2**: High parallelism
- T021, T022, T023 can run in parallel (parsing helpers)
- After T024, T025: T026, T027, T029, T030 can run in parallel

**Phase 5 - User Story 3**: High parallelism
- T031, T032, T033, T034 can run in parallel (parsing logic)
- After T035, T036, T039: T037, T038, T041, T043 can run in parallel

**Phase 6 - User Story 4**: Some parallelism
- T044, T045, T050, T051 can run in parallel
- After T046-T049: T052, T053, T054 can run in parallel

**Phase 7 - User Story 5**: High parallelism
- T055, T056, T057 can run in parallel (parsing methods)
- T061, T062, T063 can run in parallel (UI components)
- After T058-T060: T064, T065, T066, T067 can run in parallel

**Phase 8 - Polish**: Most tasks can run in parallel (marked with [P])

---

## Parallel Example: User Story 1

```bash
# After foundational tasks complete, launch these in parallel:
T009: "Implement getRootDirectory() in src/config.ts"
T010: "Implement scanRootDirectory() in src/core/project-registry.ts"

# After core detection logic (T011, T012), launch these together:
T015: "Create ProjectList component in dashboard_frontend/src/components/ProjectList.tsx"
T016: "Create SpecKitBadge component in dashboard_frontend/src/components/SpecKitBadge.tsx"
T017: "Update API service in dashboard_frontend/src/services/api.ts"
T018: "Add localization strings in dashboard_frontend/src/i18n.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (5 tasks) - CRITICAL GATE
3. Complete Phase 3: User Story 1 - Project Detection (12 tasks)
4. Complete Phase 4: User Story 2 - Spec Visualization (10 tasks)
5. **STOP and VALIDATE**: Test that dashboard can detect projects and display spec structures
6. Deploy/demo if ready - this is a viable MVP!

**Why this MVP**: Users can discover their spec-kit projects and navigate specifications - the two most essential features. AI agent discovery and configuration are helpful but not critical for initial value.

### Incremental Delivery

1. **Milestone 1**: Setup + Foundational → Infrastructure ready
2. **Milestone 2**: Add User Story 1 → Test independently → Deploy (Can detect projects!)
3. **Milestone 3**: Add User Story 2 → Test independently → Deploy (Can view specs!)
4. **Milestone 4**: Add User Story 3 → Test independently → Deploy (Can see agents!)
5. **Milestone 5**: Add User Story 4 → Test independently → Deploy (Multi-project support!)
6. **Milestone 6**: Add User Story 5 → Test independently → Deploy (Full configuration access!)
7. **Milestone 7**: Polish → Complete feature

Each milestone adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

**Week 1**: Team completes Setup + Foundational together (8 tasks)

**Week 2**: Once Foundational is done, split work:
- Developer A: User Story 1 (Project Detection) - 12 tasks
- Developer B: User Story 2 (Spec Visualization) - 10 tasks  
- Developer C: User Story 3 (AI Agent Discovery) - 13 tasks

**Week 3**: Integration and remaining stories:
- Developer A: User Story 4 (Multi-Project) - 11 tasks
- Developer B: User Story 5 (Configuration) - 13 tasks
- Developer C: Polish & Cross-Cutting - 13 tasks

Stories integrate independently due to proper discriminated union design.

---

## Summary

**Total Tasks**: 80 tasks across 8 phases

**Tasks per User Story**:
- Setup: 3 tasks
- Foundational: 5 tasks (BLOCKS all stories)
- User Story 1 (P1): 12 tasks - Project Detection 🎯 MVP
- User Story 2 (P1): 10 tasks - Spec Visualization 🎯 MVP
- User Story 3 (P2): 13 tasks - AI Agent Discovery
- User Story 4 (P2): 11 tasks - Multi-Project Management
- User Story 5 (P3): 13 tasks - Configuration Access
- Polish: 13 tasks

**Parallel Opportunities**: 45+ tasks marked [P] can run in parallel within their constraints

**Independent Test Criteria**:
- **US1**: Set root directory, verify project list shows only spec-kit projects
- **US2**: Create spec directories, verify complete hierarchy displays
- **US3**: Add agent folders, verify agents and commands display correctly
- **US4**: Register multiple projects, verify context isolation when switching
- **US5**: Verify constitution and templates display in configuration panel

**Suggested MVP Scope**: 
- Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1) + Phase 4 (US2) = **30 tasks**
- Delivers: Project detection from root directory + complete spec navigation
- Can be delivered in 1-2 weeks with proper parallelization

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, optional [P] and [Story] labels, and file paths
