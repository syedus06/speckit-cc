<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- Modified principles: Initial adoption (all principles new)
- Added sections: Operational Standards; Development Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Spec Workflow MCP Constitution

## Core Principles

### I. Specs Before Solutions (NON-NEGOTIABLE)
- Every feature begins with the Requirements → Design → Tasks sequence; no code, scripts, or migrations may start before specs and plans are ratified.
- Specs must document explicit goals, constraints, and testable success criteria so that downstream tools can generate deterministic plans and tasks.
Rationale: A shared source of truth prevents drift between dashboard data, VSCode extension output, and CLI automation.

### II. Independent Story Slices
- User stories in specs must be vertically sliced so each delivers demonstrable value, owns its tasks, and can be shipped/tested alone.
- Plans and tasks must preserve story isolation (no cross-story files unless documented in the Constitution Check) and must mention the files they touch.
Rationale: Independent slices let the dashboard track incremental progress and simplify approvals/reviews.

### III. Evidence-Driven Implementation
- Tests, contracts, or telemetry checkpoints must be defined before implementation; failing evidence precedes code (red → green → refactor).
- All work must emit traceable logs/statistics (implementation logs, approval notes, coverage where available) so reviewers can audit without guesswork.
Rationale: Evidence-first delivery keeps the approval workflow objective and auditable.

### IV. Human-in-the-Loop Governance
- Material changes (new principles, workflow deviations, risky migrations) require explicit approval through the dashboard before merging.
- Contributors must document decisions inside the plan/tasks artifacts and cross-link approvals so future agents understand context.
Rationale: Aligns AI+human collaboration with the MCP approval lifecycle and avoids shadow governance.

### V. Transparency & Observability
- Dashboards, CLI, and docs must share the same data surfaces: file paths, task IDs, statuses, and localization keys cannot diverge.
- Any feature exposing UI/UX MUST define required telemetry, logging, and localization artifacts within the plan/tasks deliverables.
Rationale: A transparent system ensures multi-interface parity (dashboard, VSCode, CLI) and simplifies troubleshooting.

## Operational Standards

- All constitutional artifacts reside under `.specify/`; repo-level docs (README, docs/*.md) must reference this location when describing the workflow.
- Plans must enumerate tooling context (language, dependencies, testing stack, target platform) so automated commands can scaffold correctly.
- Implementation logs, approvals, and dashboard metrics must reference canonical task IDs from `tasks.md` to guarantee traceability.
- Localization-ready features must note required locales (the product ships in 11 languages) and call out missing translations as TODO items in specs.

## Development Workflow & Quality Gates

1. **Constitution Check (Phase 0):** Validate that the planned work respects every principle (spec-first, slice independence, evidence coverage, approvals, observability). Document any intentional violation in the Complexity Tracking table before continuing.
2. **Plan Completion (Phase 0 → 1):** Populate the technical context, structure decision, and constitution gates before running `/speckit.tasks`. Missing information halts automation.
3. **Task Generation (Phase 2):** Organize tasks strictly by user story with `[Story]` labels; tests (if requested) must be enumerated ahead of implementation steps.
4. **Execution:** For each story, write/confirm failing evidence, implement, capture logs, then update approvals/dashboard entries.
5. **Review & Traceability:** PRs and approvals must link to plan sections, task IDs, and evidence artifacts so auditors can re-run or verify outcomes quickly.

## Governance

- The constitution supersedes ad-hoc conventions. Reviewers must block work that violates any principle without an approved Complexity Tracking entry.
- Amendments require: (1) proposal referencing impacted sections, (2) approval recorded in the dashboard, (3) version bump according to semantic rules (MAJOR for breaking/removals, MINOR for new principles/sections, PATCH for clarifications).
- Ratification history is immutable. `RATIFICATION_DATE` captures first adoption; `LAST_AMENDED_DATE` captures the latest approved change.
- Compliance reviews occur at spec creation, before task generation, and prior to release. Non-compliance must be documented with remediation tasks.

**Version**: 1.0.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11
