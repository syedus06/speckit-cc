# SpecKit Control Center (SKCC)

## Overview

A web-based user interface designed to orchestrate and manage the entire Spec Kit and Specify CLI workflow. This Control Center will provide a centralized platform to initialize projects, manage the Spec-Driven Development (SDD) lifecycle, control AI agent interactions, and monitor logs and run statuses, replacing the need for multiple terminal windows and manual CLI commands.

## Implemented Features

### Initial Setup
- **Project Initialization**: Next.js project with TypeScript.
- **Styling**: Tailwind CSS for utility-first styling.
- **UI Components**: shadcn/ui for a modern and accessible component library.

## Development Plan

### Phase 1: Core UI and Layout
- [ ] **Main Layout**: Create a primary layout with a persistent sidebar for navigation and a main content area for dynamic views.
- [ ] **Navigation**: Implement a navigation component with links to all major sections of the application.
- [ ] **Component Library**: Configure and integrate `shadcn/ui`.
- [ ] **Styling Foundation**: Set up global styles and Tailwind CSS configuration.

### Phase 2: Project & Workspace Management
- [ ] **FR-1.1: Add Project**:
    - [ ] UI to register a new or existing project by selecting a local folder.
    - [ ] Logic to detect if a Spec Kit project is already initialized.
- [ ] **FR-1.2: Initialize with `specify init`**:
    - [ ] Create a form-based wizard to configure and run the `specify init` command.
    - [ ] Display a preview of the generated CLI command.
    - [ ] Stream the command's output logs to the UI in real-time.
- [ ] **FR-1.3: `specify check` Health View**:
    - [ ] Add a button to trigger a `specify check` run.
    - [ ] Parse and display the results in a structured health report, highlighting missing dependencies.

### Phase 3: SDD Flow Screens
- [ ] **FR-7.2.1: Constitution Screen**:
    - [ ] Rich text editor for managing the `/speckit.constitution` prompt.
    - [ ] "Run Constitution" button with agent selection.
    - [ ] Display the current constitution file content.
- [ ] **FR-7.2.2: Specify Screen**:
    - [ ] UI to manage the feature's main specification file.
    - [ ] "Run /speckit.specify" button to update the spec.
- [ ] **FR-7.2.3: Plan Screen**:
    - [ ] Form for defining tech stack and non-functional requirements.
    - [ ] Trigger and display the output of `/speckit.plan`.
- [ ] **FR-7.2.4: Tasks Screen**:
    - [ ] Render `tasks.md` as a table or Kanban board.
    - [ ] "Generate Tasks" button to run `/speckit.tasks`.
- [ ] **FR-7.2.5: Implement Screen**:
    - [ ] UI to select agents and task scope for an implementation run.
    - [ ] Live log panel to stream file modifications, progress, and errors from `/speit.implement`.

### Phase 4: Agent & Run Management
- [ ] **FR-4.1: Supported Agent List**:
    - [ ] Display a comprehensive list of all supported agents from `AGENTS.md`.
    - [ ] Show key metadata for each agent (directory, install URL, etc.).
- [ ] **FR-5.1: Run Timeline**:
    - [ ] Maintain and display a historical list of all runs with status and metadata.
- [ ] **FR-5.2: Log Viewer**:
    - [ ] A detailed view to tail and inspect logs from any run.

### Phase 5: Backend & Integration
- [ ] **CLI Adapter Layer**:
    - [ ] Develop a robust backend module (using Next.js API Routes or Server Actions) to wrap and execute `specify` CLI commands.
- [ ] **Agent Connector Abstraction**:
    - [ ] Design a system to manage and interact with different AI agents based on their configuration.
- [ ] **Configuration & Security**:
    - [ ] Implement secure local storage for sensitive tokens and environment variables.
