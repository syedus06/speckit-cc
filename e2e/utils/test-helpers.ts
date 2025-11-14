import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for dashboard E2E tests
 */

/**
 * Navigate to a specific project in the dashboard
 */
export async function navigateToProject(page: Page, projectName: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click on the project card or link
  const projectLink = page.locator(`text="${projectName}"`).first();
  await expect(projectLink).toBeVisible();
  await projectLink.click();

  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a specific feature within a project
 */
export async function navigateToFeature(page: Page, projectName: string, featureId: string) {
  await navigateToProject(page, projectName);

  // Click on the feature
  const featureLink = page.locator(`text="${featureId}"`).first();
  await expect(featureLink).toBeVisible();
  await featureLink.click();

  await page.waitForLoadState('networkidle');
}

/**
 * Wait for the split-view console to open
 */
export async function waitForConsoleToOpen(page: Page) {
  const console = page.locator('[data-testid="execution-console"]');
  await expect(console).toBeVisible({ timeout: 10000 });

  // Verify the layout changed to split-view
  const mainContent = page.locator('[data-testid="main-content"]');
  await expect(mainContent).toHaveCSS('width', /50%|calc/);
}

/**
 * Wait for the split-view console to close
 */
export async function waitForConsoleToClose(page: Page) {
  const console = page.locator('[data-testid="execution-console"]');
  await expect(console).not.toBeVisible({ timeout: 5000 });

  // Verify the layout returned to full width
  const mainContent = page.locator('[data-testid="main-content"]');
  await expect(mainContent).toHaveCSS('width', /100%|auto/);
}

/**
 * Verify progress bar state
 */
export async function verifyProgressBar(page: Page, expectedProgress: number) {
  const progressBar = page.locator('[data-testid="progress-bar"]');
  await expect(progressBar).toBeVisible();

  const progressText = await progressBar.locator('[data-testid="progress-percentage"]').textContent();
  expect(progressText).toContain(`${expectedProgress}%`);
}

/**
 * Verify terminal output contains expected text
 */
export async function verifyTerminalOutput(page: Page, expectedText: string | RegExp) {
  const terminal = page.locator('[data-testid="terminal-output"]');
  await expect(terminal).toBeVisible();

  if (typeof expectedText === 'string') {
    await expect(terminal).toContainText(expectedText);
  } else {
    const content = await terminal.textContent();
    expect(content).toMatch(expectedText);
  }
}

/**
 * Verify terminal output has specific color coding
 */
export async function verifyTerminalColorCoding(page: Page, messageType: 'info' | 'success' | 'error' | 'warning') {
  const terminal = page.locator('[data-testid="terminal-output"]');
  const colorClasses = {
    info: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400'
  };

  const message = terminal.locator(`.${colorClasses[messageType]}`).first();
  await expect(message).toBeVisible();
}

/**
 * Click the execute button for a specific task
 */
export async function executeTask(page: Page, taskId: string) {
  const taskRow = page.locator(`[data-testid="task-${taskId}"]`);
  await expect(taskRow).toBeVisible();

  const executeButton = taskRow.locator('[data-testid="execute-button"]');
  await expect(executeButton).toBeEnabled();
  await executeButton.click();
}

/**
 * Select multiple tasks for bulk execution
 */
export async function selectTasksForBulkExecution(page: Page, taskIds: string[]) {
  for (const taskId of taskIds) {
    const checkbox = page.locator(`[data-testid="task-checkbox-${taskId}"]`);
    await expect(checkbox).toBeVisible();
    await checkbox.click();
  }
}

/**
 * Verify bulk execute button state
 */
export async function verifyBulkExecuteButton(page: Page, expectedEnabled: boolean) {
  const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');

  if (expectedEnabled) {
    await expect(bulkExecuteButton).toBeEnabled();
  } else {
    await expect(bulkExecuteButton).toBeDisabled();
  }
}

/**
 * Open agent dropdown
 */
export async function openAgentDropdown(page: Page) {
  const agentDropdown = page.locator('[data-testid="agent-dropdown"]');
  await expect(agentDropdown).toBeVisible();
  await agentDropdown.click();

  // Wait for dropdown menu to appear
  const dropdownMenu = page.locator('[data-testid="agent-dropdown-menu"]');
  await expect(dropdownMenu).toBeVisible();
}

/**
 * Select agent from dropdown
 */
export async function selectAgent(page: Page, agentName: string) {
  await openAgentDropdown(page);

  const agentOption = page.locator(`[data-testid="agent-option-${agentName}"]`);
  await expect(agentOption).toBeVisible();
  await agentOption.click();

  // Verify dropdown closed and agent is selected
  const dropdownMenu = page.locator('[data-testid="agent-dropdown-menu"]');
  await expect(dropdownMenu).not.toBeVisible();

  const selectedAgent = page.locator('[data-testid="selected-agent"]');
  await expect(selectedAgent).toContainText(agentName);
}

/**
 * Wait for task execution to complete
 */
export async function waitForTaskCompletion(page: Page, timeout: number = 30000) {
  // Wait for progress to reach 100%
  await page.locator('[data-testid="progress-percentage"]:has-text("100%")').waitFor({ timeout });

  // Wait for completion message in terminal
  await verifyTerminalOutput(page, /completed|finished|success/i);
}

/**
 * Close execution console
 */
export async function closeExecutionConsole(page: Page) {
  const closeButton = page.locator('[data-testid="close-console-button"]');
  await expect(closeButton).toBeVisible();
  await closeButton.click();

  await waitForConsoleToClose(page);
}

/**
 * Verify layout is split-view (50/50)
 */
export async function verifySplitViewLayout(page: Page) {
  const mainContent = page.locator('[data-testid="main-content"]');
  const console = page.locator('[data-testid="execution-console"]');

  await expect(mainContent).toBeVisible();
  await expect(console).toBeVisible();

  // Both should be visible side by side
  const mainBox = await mainContent.boundingBox();
  const consoleBox = await console.boundingBox();

  expect(mainBox).toBeTruthy();
  expect(consoleBox).toBeTruthy();

  // Verify they're side by side (not overlapping)
  expect(mainBox!.x + mainBox!.width).toBeLessThanOrEqual(consoleBox!.x + 5); // small tolerance
}

/**
 * Verify layout is full-width (console closed)
 */
export async function verifyFullWidthLayout(page: Page) {
  const mainContent = page.locator('[data-testid="main-content"]');
  const console = page.locator('[data-testid="execution-console"]');

  await expect(mainContent).toBeVisible();
  await expect(console).not.toBeVisible();

  // Main content should take full width
  const mainBox = await mainContent.boundingBox();
  const pageBox = await page.locator('body').boundingBox();

  expect(mainBox).toBeTruthy();
  expect(pageBox).toBeTruthy();

  // Main content should be close to page width (with some padding)
  expect(mainBox!.width).toBeGreaterThan(pageBox!.width * 0.9);
}
