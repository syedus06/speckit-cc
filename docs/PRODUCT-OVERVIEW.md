# Spec Workflow MCP — Product Overview

This document captures the end-to-end product story for Spec Workflow MCP: what the product delivers today, how it operates, and the initiatives currently in progress.

---

## 1. Product Snapshot
- **Mission**: Give AI-assisted builders a safe, structured workflow that keeps humans in control through sequential specs, approvals, and real-time project visibility.
- **Primary Users**: AI development copilots (Claude, Cursor, Continue, etc.) plus the developers, reviewers, and product owners collaborating with them.
- **Deployment Model**: Local-first Node.js MCP server with optional dashboard (`npm run dev -- --dashboard`) and VSCode extension. Supports traditional `.spec-workflow/` projects and spec-kit installations discovered under `SPECKIT_ROOT_DIR`.
- **Key Interfaces**: CLI/AI assistant via MCP tools, responsive web dashboard, and VSCode extension with editor-native controls.

---

## 2. Current Feature Set

### 2.1 Structured Spec Workflow
- **Three-Stage Specs**: Sequential Requirements → Design → Tasks flow with enforced approvals before the next artifact is generated (`docs/WORKFLOW.md`).
- **Hierarchical Tasks**: Multi-level numbering (1, 1.1, 1.1.1) with dependencies, estimates, and prompts optimized for AI task execution.
- **Steering Documents**: Product, Technical, and Structure steering files guide every spec with vision, architecture, and organization standards.
- **Template System**: Built-in templates for specs, bugs, steering docs, and tasks; supports custom overrides in `.spec-workflow/templates/` (`docs/TOOLS-REFERENCE.md`, `docs/USER-GUIDE.md`).

### 2.2 Real-Time Interfaces
- **Web Dashboard** (`docs/INTERFACES.md`):
  - Live spec cards, document tabs, approval actions, and hierarchical task boards with keyboard shortcuts and instant WebSocket updates.
  - Steering document viewers, connection health indicators, theme toggles, localization picker (11 languages), and accessibility options (high contrast, focus states).
  - Project-level metrics (task counts, completion %, recent activity) plus responsive layouts for desktop, tablet, and mobile.
- **VSCode Extension**:
  - Sidebar spec explorer, task list, archive browser, and document viewer with syntax highlighting and inline approvals.
  - Extension settings for refresh cadence, notifications (including audio cues), archive visibility, and theme sync.
  - Command palette entries (`Spec Workflow: Create Spec`, `List Specs`, `View Dashboard`, etc.) and context-menu actions on files/tasks.

### 2.3 Workflow Intelligence & MCP Tools
- **Tool Portfolio** (`docs/TOOLS-REFERENCE.md`):
  - Workflow guides (`spec-workflow-guide`, `steering-guide`).
  - Spec authoring (`create-spec-doc`), steering authoring, templates/context fetchers, and comprehensive status/task management (`spec-list`, `spec-status`, `manage-tasks`).
  - Approval flow helpers (`request-approval`, `get-approval-status`, `delete-approval`).
- **Context Engine**:
  - Smart caching of templates and spec content, lazy loading, and invalidation on file changes to keep MCP responses fast (architecture doc).

### 2.4 Task & Approval Management
- **Approval Lifecycle**: Automatic approval requests when documents are produced, dashboard/extension review panels, and explicit approve/changes/reject options with comment capture.
- **Task Execution Support**:
  - Task prompts copy-ready from dashboard or VSCode.
  - Manage tasks via MCP (update status, mark complete, list, inspect progress) with searchable implementation logs.
- **Implementation Guidance**: Documented strategies for sequential, parallel, and section-based task execution, plus blockers handling and verification phases (`docs/WORKFLOW.md`).

### 2.5 Multi-Project & Spec-Kit Support
- **Spec-Kit Discovery**: Automatic scan of `SPECKIT_ROOT_DIR` for `.specify/` directories, numbered specs, agent folders, and scripts, then surfaces them alongside spec-workflow projects (`docs/SPEC-KIT-COMPATIBILITY.md`).
- **Unified Dashboard Experience**: Type badges, agent inventories, constitution/templates visibility, and shared progress/performance metrics regardless of project type.
- **Performance Enhancements**: Cached project-type detection, negative-result caching, concurrency caps (max 10 FS ops), and telemetry panels showing scan time and cache hit rate.

### 2.6 Developer Experience & Operations
- **Quick Start & Multi-Client Setup**: Straightforward install/build instructions plus ready-made MCP config snippets for Augment, Claude, Cline, Cursor, Continue, OpenCode, etc. (`README.md`).
- **Dashboard Operations**: `--dashboard` flag (optional `--port`) launches the multi-project Fastify server; session file in `~/.spec-workflow-mcp/activeSession.json` prevents duplicate instances (`docs/CONFIGURATION.md`).
- **Environment Controls**: TOML config (deprecated but still supported), CLI precedence, language selection, and environment variables for scanning scope and performance tuning.
- **Docker Story**: Compose and Dockerfile support for isolated dashboard deployments with bind-mounted `.spec-workflow` data.

### 2.7 Performance, Reliability & Security
- **Performance Profile** (`docs/technical-documentation/architecture.md`, `docs/SPEC-KIT-COMPATIBILITY.md`):
  - Template cache (~50 KB), LRU spec cache, debounced watchers, <200 ms context loads, <50 ms dashboard API targets.
  - Recommended project limits (≤100 specs, ≤200 KB per document) and concurrency guardrails.
- **Reliability Mechanisms**: Graceful shutdown handling, single dashboard enforcement, per-project watchers, and active session tracking.
- **Security Posture**:
  - Local-only runtime (dashboard binds to localhost), sanitized paths limited to project directories, no telemetry; only outbound call is optional npm version check.
  - Data governance left entirely to the user (filesystem permissions, manual archival/deletion).

---

## 3. In-Flight Initiatives & Roadmap Signals
| Initiative | Goal | Status / Notes |
|------------|------|----------------|
| **Dashboard Task Execution** (`docs/DASHBOARD-TASK-EXECUTION-PROPOSAL.md`) | Add backend script runner plus UI controls so dashboard users can execute tasks/scripts without leaving the browser. | Design complete (Phase 1 focuses on secure script execution via Fastify endpoint + `ScriptExecutor`). |
| **Kiro-Style Execution** (`docs/KIRO-STYLE-EXECUTION.md`) | Deliver one-click “Run with \<Agent\>” actions that stream MCP execution output in the dashboard and auto-update tasks. | Architecture + phased plan drafted; Phase 1 leverages existing MCP servers, later phases add agent routing. |
| **Unified Mode** (`docs/UNIFIED-MODE-PROPOSAL.md`) | Run MCP server + dashboard in a single `--unified` process that scans an entire root dir and lets AI clients switch active projects. | Proposal defines new entry point, unified server coordinator, and project-selection tools (`list_projects`, `set_active_project`). |
| **Spec-Kit Enhancements** | Expand detection, caching, and telemetry for mixed project fleets. | Core shipped; further tuning controlled by env vars (`SPEC_WORKFLOW_MAX_CONCURRENCY`, TTL overrides). |

---

## 4. How Things Work

### 4.1 Architecture
- **MCP Server Core**: `SpecWorkflowMCPServer` registers 13+ tools, manages context, handles sessions, and writes/reads `.spec-workflow/` assets (`docs/technical-documentation/architecture.md`).
- **Dashboard Backend**: Fastify server with REST + WebSocket endpoints, per-project managers, job scheduler, session tracking, and static asset serving.
- **Frontend Stack**: React 18 + Vite + Tailwind; modules for pages, components, APIs, and WebSocket handling deliver live spec/task/approval views.
- **Context/Parser Services**: Markdown spec parser, task parser, archive service, approval storage, and watchers keep UI and tooling synced with filesystem truth.

### 4.2 Workflow Lifecycle
1. **Steering Setup** → Generate product/tech/structure docs for project alignment.
2. **Specification Loop** → Requirements authored (via templates/context), submitted for approval, then design and tasks follow sequentially.
3. **Review & Approval** → Dashboard/VSCode provide approve/changes/reject flows with feedback capture and revision tracking.
4. **Implementation Tracking** → Tasks executed via AI prompts or manual dev work; statuses managed through MCP tools or UI.
5. **Verification & Documentation** → Testing prompts (unit, integration, E2E) plus documentation updates ensure artifacts stay current.
6. **Archival** → Completed specs can be archived to keep active workspace focused while preserving history (`docs/WORKFLOW.md`, `docs/USER-GUIDE.md`).

### 4.3 Data & Context Flow
- MCP tools pull templates/specs/steering files from `.spec-workflow/`, apply caching, and return structured payloads to AI clients (no additional API calls).
- Dashboard/file watcher reacts to filesystem changes, broadcasting updates via WebSocket so UI stays real time.
- Approval data lives under `.spec-workflow/approvals`, enabling consistent state across dashboard and VSCode extension.

### 4.4 Configuration & Operations
- **CLI Flags**: `--dashboard`, `--port`, `--help`; unified mode proposal adds `--unified` and `--root`.
- **Configuration Precedence**: CLI > user-specified config > default `.spec-workflow/config.toml` > built-in defaults.
- **Environment Variables**:
  - `SPECKIT_ROOT_DIR` — required for auto-scanning spec-kit projects.
  - `SPEC_WORKFLOW_MAX_CONCURRENCY`, `SPEC_WORKFLOW_CACHE_TTL`, `SPEC_WORKFLOW_NEGATIVE_CACHE_TTL` — performance tuning.
- **Docker**: `containers/` directory provides Compose + Dockerfile for serving dashboard on port 5000 with bind-mounted workspace.

---

## 5. Competitive Positioning & Expansion Opportunities
- **Strengths Today**: Human-in-the-loop approvals, deterministic workflow enforcement, multi-interface parity, local-first security stance, and spec-kit interoperability.
- **Known Limitations**: No autonomous web scraping or external API orchestration, fixed workflow templates, single active project per MCP instance (resolved by unified mode proposal), dashboard can’t yet run tasks itself (addressed by Kiro/dashboard execution initiatives).
- **Future Directions** (from architecture insights): richer integrations (GitHub/Jira), smart templates, AI-driven quality gates, multi-agent orchestration, enterprise governance features.

---

## 6. Quick Reference
- **Primary Docs**: `README.md`, `QUICK-START.md`, `docs/USER-GUIDE.md`, `docs/WORKFLOW.md`, `docs/INTERFACES.md`, `docs/TOOLS-REFERENCE.md`.
- **Technical Deep Dives**: `docs/technical-documentation/architecture.md`, `docs/SPEC-KIT-COMPATIBILITY.md`, `docs/CONFIGURATION.md`.
- **Roadmap/Initiatives**: `docs/DASHBOARD-TASK-EXECUTION-PROPOSAL.md`, `docs/KIRO-STYLE-EXECUTION.md`, `docs/UNIFIED-MODE-PROPOSAL.md`.

This overview should give product, engineering, and leadership stakeholders a single source of truth for what Spec Workflow MCP delivers today, how it delivers it, and where the product is headed next.
