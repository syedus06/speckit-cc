# Implementation Plan: Spec-Kit Dashboard Compatibility

**Branch**: `001-speckit-dashboard-compat` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-speckit-dashboard-compat/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Review `.specify/memory/constitution.md` before editing so every section satisfies the active governance rules.

## Summary

This feature extends the existing spec-workflow-mcp dashboard to support GitHub's spec-kit projects. The dashboard will scan a configured root directory for subdirectories containing `.specify` folders (indicating spec-kit projects), discover AI-specific agent folders (`.claude`, `.codex`, `.gemini`, `.cursor`) with their slash commands, parse the `specs/` folder structure with all specification artifacts, and display this information alongside existing spec-workflow-mcp projects. The system will maintain project type differentiation, support multi-project workflows, and provide real-time file system watching for updates.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20+ (matches existing project)  
**Primary Dependencies**: 
- Existing: @modelcontextprotocol/sdk, chokidar (file watching), express/fastify (API server)
- New: None required - leverage existing infrastructure
**Storage**: File system-based (read-only operations, no database changes needed)  
**Testing**: Vitest (matches existing test infrastructure)  
**Target Platform**: Node.js server running MCP server + web dashboard  
**Project Type**: Single TypeScript project with dashboard frontend (existing structure)  
**Performance Goals**: 
- Root directory scan with 100 subdirectories completes in <5 seconds
- Project list display in <2 seconds
- Spec hierarchy render for 50 specs in <1 second
**Constraints**: 
- Must maintain compatibility with existing spec-workflow-mcp projects
- Read-only file system operations only
- Support Linux, macOS, Windows file system differences (case sensitivity)
**Scale/Scope**: 
- Support 10+ concurrent spec-kit projects
- Handle root directories with 100+ subdirectories
- Parse 50+ spec directories per project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Specs Before Solutions** — Requirements (28 FRs), design research needs, and success criteria (15 SCs) are complete in spec.md; no code will start before Phase 0 research and Phase 1 design artifacts are created.
- [x] **Independent Story Slices** — Five user stories (P1: Project Detection, P1: Spec Visualization, P2: AI Agent Discovery, P2: Multi-Project, P3: Configuration Access) can be implemented independently with minimal cross-story dependencies.
- [x] **Evidence-Driven Implementation** — Unit tests, integration tests, logging requirements, and telemetry metrics are specified for each user story; contracts will be defined in Phase 1.
- [x] **Human-in-the-Loop Governance** — Feature follows standard approval workflow via dashboard; implementation logs will track progress; no material deviations from constitution.
- [x] **Transparency & Observability** — Localization surfaces identified (12+ UI messages), logging requirements specified (project detection, scan metrics, errors), file paths enumerated in functional requirements.

> **Violation Handling**: No violations - all gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single TypeScript project with existing structure
src/
├── core/                         # Existing core services
│   ├── project-registry.ts       # EXTEND: Add spec-kit project detection
│   ├── path-utils.ts             # EXTEND: Add .specify path helpers
│   └── parser.ts                 # NEW: Spec-kit project parser
├── dashboard/                    # Existing dashboard backend
│   ├── project-manager.ts        # EXTEND: Support spec-kit projects
│   ├── parser.ts                 # EXTEND: Parse spec-kit structures
│   └── speckit-detector.ts       # NEW: Spec-kit detection service
├── tools/                        # Existing MCP tools
│   └── speckit-tools.ts          # NEW: MCP tools for spec-kit projects
└── types.ts                      # EXTEND: Add spec-kit type definitions

dashboard_frontend/               # Existing React frontend
├── src/
│   ├── components/
│   │   ├── ProjectList.tsx       # EXTEND: Display spec-kit projects
│   │   ├── SpecKitBadge.tsx      # NEW: Project type indicator
│   │   ├── AgentList.tsx         # NEW: AI agent display component
│   │   └── SpecTree.tsx          # EXTEND: Render spec-kit hierarchy
│   ├── services/
│   │   └── api.ts                # EXTEND: Fetch spec-kit project data
│   └── types.ts                  # EXTEND: Frontend type definitions

tests/                            # Existing test infrastructure
├── core/
│   ├── speckit-parser.test.ts    # NEW: Spec-kit parser tests
│   └── path-utils.test.ts        # EXTEND: .specify path tests
├── dashboard/
│   └── speckit-detector.test.ts  # NEW: Detection service tests
└── integration/
    └── speckit-projects.test.ts  # NEW: End-to-end spec-kit tests
```

**Structure Decision**: Extend existing single TypeScript project structure. The codebase already has `src/core/` for business logic, `src/dashboard/` for backend services, and `dashboard_frontend/` for React UI. We'll add spec-kit detection as new modules within this structure and extend existing parsers/managers to support both project types. This maintains architectural consistency and leverages existing infrastructure (file watching, project registry, API endpoints).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations - table intentionally left empty.*
