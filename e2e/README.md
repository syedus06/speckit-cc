# E2E Testing Guide

This directory contains end-to-end tests for the spec-workflow-mcp dashboard using Playwright.

## Test Structure

```
e2e/
├── fixtures/                    # Test fixtures and utilities
│   └── dashboard-fixtures.ts    # Custom Playwright fixtures
├── utils/                       # Test helper functions
│   └── test-helpers.ts          # Common test operations
├── split-view-console.spec.ts   # Split-view console tests
├── agent-dropdown.spec.ts       # Agent dropdown tests
├── bulk-execute.spec.ts         # Bulk execution tests
└── README.md                    # This file
```

## Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode (step through)
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test e2e/split-view-console.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Required data-testid Attributes

For the tests to work correctly, the following `data-testid` attributes need to be added to the frontend components:

### Main Layout
- `data-testid="main-content"` - Main content area div (should have width transition)
- `data-testid="task-list"` - Container for the list of tasks

### Task Components
- `data-testid="task-{taskId}"` - Individual task row (e.g., `data-testid="task-T007"`)
- `data-testid="task-checkbox-{taskId}"` - Task selection checkbox
- `data-testid="execute-button"` - Execute button for each task
- `data-testid="assign-button"` - Assign button for each task

### Bulk Execution
- `data-testid="select-all-tasks"` - Select all checkbox
- `data-testid="bulk-execute-button"` - Bulk execute button
- `data-testid="selected-tasks-count"` - Display of selected task count
- `data-testid="bulk-progress"` - Bulk execution progress indicator
- `data-testid="estimated-execution-time"` - Estimated time display (optional)
- `data-testid="cancel-execution-button"` - Cancel button (optional)

### Agent Dropdown
- `data-testid="agent-dropdown"` - Agent dropdown button/trigger
- `data-testid="agent-dropdown-menu"` - Dropdown menu container
- `data-testid="agent-option-{agentName}"` - Individual agent option with `data-agent-name` attribute
- `data-testid="selected-agent"` - Display of currently selected agent
- `data-testid="agent-description"` - Agent description (if shown)
- `data-testid="agent-icon"` - Agent icon (if shown)
- `data-testid="agent-search"` - Search input (if implemented)

### Execution Console
- `data-testid="execution-console"` - Console panel container
- `data-testid="console-header"` - Console header section
- `data-testid="progress-bar"` - Progress bar container
- `data-testid="progress-percentage"` - Progress percentage text
- `data-testid="terminal-output"` - Terminal output container
- `data-testid="close-console-button"` - Close console button

## Implementation Checklist

### Phase 1: Split-View Console (Already Implemented)
- [x] Console opens on task execution
- [x] Layout changes to 50/50 split
- [x] Progress bar updates
- [x] Terminal output with color coding
- [x] Close button functionality
- [ ] Add data-testid attributes

### Phase 2: Agent Dropdown (To Be Implemented)
- [ ] Create dropdown component
- [ ] Show list of available agents
- [ ] Allow agent selection
- [ ] Persist selected agent
- [ ] Use selected agent for execution
- [ ] Add keyboard navigation
- [ ] Add data-testid attributes

### Phase 3: Bulk Execute (To Be Implemented)
- [ ] Add task checkboxes
- [ ] Add select all functionality
- [ ] Create bulk execute button
- [ ] Show selected count
- [ ] Execute multiple tasks sequentially
- [ ] Track bulk execution progress
- [ ] Handle errors gracefully
- [ ] Clear selection after completion
- [ ] Add data-testid attributes

### Phase 4: Assign Button Review
- [ ] Determine if Assign button should be kept or removed
- [ ] If kept: integrate with bulk selection
- [ ] If removed: clean up related code

## Adding data-testid Attributes

### Example: Task Row

```tsx
<div
  data-testid={`task-${task.id}`}
  className="flex items-start gap-3 p-3 rounded-lg"
>
  <input
    type="checkbox"
    data-testid={`task-checkbox-${task.id}`}
    // ... other props
  />
  <button
    data-testid="execute-button"
    onClick={() => handleExecuteTask(task)}
    // ... other props
  >
    Execute
  </button>
</div>
```

### Example: Console Panel

```tsx
<div data-testid="execution-console" className="w-1/2 flex flex-col bg-gray-900">
  <div data-testid="console-header" className="flex items-center justify-between">
    {/* ... header content ... */}
    <button data-testid="close-console-button" onClick={handleClose}>
      Close
    </button>
  </div>
  <div data-testid="progress-bar" className="px-4 py-2">
    <span data-testid="progress-percentage">{progress}%</span>
  </div>
  <div data-testid="terminal-output" className="flex-1 overflow-y-auto">
    {/* ... terminal output ... */}
  </div>
</div>
```

### Example: Agent Dropdown

```tsx
<button data-testid="agent-dropdown" onClick={toggleDropdown}>
  <span data-testid="selected-agent">{selectedAgent}</span>
</button>
{isOpen && (
  <div data-testid="agent-dropdown-menu">
    {agents.map(agent => (
      <div
        key={agent.id}
        data-testid={`agent-option-${agent.name}`}
        data-agent-name={agent.name}
        onClick={() => selectAgent(agent)}
      >
        {agent.icon && <img data-testid="agent-icon" src={agent.icon} />}
        <span>{agent.name}</span>
        {agent.description && (
          <span data-testid="agent-description">{agent.description}</span>
        )}
      </div>
    ))}
  </div>
)}
```

## Test Coverage

### Split-View Console (14 tests)
- Opens console in split-view
- Displays progress bar
- Shows terminal output with formatting
- Color-coded messages
- Shows command in header
- Closes and returns to full-width
- Maintains task list visibility
- Smooth transitions
- Updates to 100% on completion
- Success message display
- Multiple sequential executions
- Preserves scroll position
- Mobile responsive

### Agent Dropdown (18 tests)
- Displays dropdown button
- Opens menu on click
- Lists available agents
- Shows default selection
- Allows agent selection
- Closes after selection
- Closes on outside click
- Persists selection
- Uses selected agent for execution
- Shows agent descriptions
- Highlights selected agent
- Keyboard navigation
- Enter key selection
- Escape key closes
- Shows agent icons
- Handles empty list
- Search filtering (if implemented)

### Bulk Execute (18 tests)
- Shows task checkboxes
- Selects single task
- Selects multiple tasks
- Deselects tasks
- Shows bulk execute button
- Disables button when no selection
- Shows selected count
- Executes all selected tasks
- Shows progress for bulk execution
- Sequential execution
- Clears selection after completion
- Allows canceling execution
- Select all checkbox
- Deselect all
- Updates select all state
- Handles execution errors
- Preserves selection on navigation
- Shows confirmation dialog
- Disables checkboxes during execution
- Shows estimated time

## Debugging Tests

### View Test Results
```bash
# Run tests and show report
npm run test:e2e
npm run test:e2e:report
```

### Debug Specific Test
```bash
# Run single test in debug mode
npx playwright test -g "should open console in split-view" --debug
```

### Screenshots and Videos
- Screenshots are captured on failure
- Videos are recorded for failed tests
- Find them in `test-results/` directory

### Playwright Inspector
```bash
# Use Playwright Inspector for step-by-step debugging
npx playwright test --debug
```

## Best Practices

1. **Always use data-testid** - Don't rely on CSS classes or text content
2. **Make selectors specific** - Use unique testids for each component
3. **Test user flows** - Test complete user journeys, not just isolated features
4. **Handle async properly** - Use proper waiting strategies
5. **Clean up after tests** - Reset state between tests
6. **Use fixtures** - Leverage custom fixtures for common setup
7. **Keep tests independent** - Each test should work in isolation

## Continuous Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Single worker for stability
- HTML reporter for results
- Screenshots and videos for debugging

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check if dashboard is running
- Verify network connectivity

### Selectors Not Found
- Ensure data-testid attributes are added
- Check element is visible before interaction
- Use `page.waitForSelector()` for dynamic content

### Flaky Tests
- Add proper wait conditions
- Use `page.waitForLoadState('networkidle')`
- Avoid hard-coded timeouts

## Next Steps

1. Add all required data-testid attributes to frontend components
2. Implement agent dropdown feature
3. Implement bulk execute feature
4. Run full test suite
5. Fix any failing tests
6. Add to CI/CD pipeline
