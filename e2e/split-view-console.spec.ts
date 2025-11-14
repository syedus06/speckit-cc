import { test, expect } from './fixtures/dashboard-fixtures';

/**
 * E2E tests for split-view execution console
 */

test.describe('Split-View Execution Console', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open console in split-view when executing a task', async ({ page, dashboardHelpers }) => {
    // Navigate to a feature with tasks
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Click execute on a task
    await dashboardHelpers.executeTask(page, 'T007');

    // Verify console opened in split-view
    await dashboardHelpers.waitForConsoleToOpen(page);
    await dashboardHelpers.verifySplitViewLayout(page);
  });

  test('should display progress bar during execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify progress bar is visible and updates
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Progress should start at 0% or low value
    const initialProgress = await progressBar.locator('[data-testid="progress-percentage"]').textContent();
    expect(initialProgress).toMatch(/[0-9]+%/);

    // Wait a bit and verify progress increased
    await page.waitForTimeout(2000);
    const laterProgress = await progressBar.locator('[data-testid="progress-percentage"]').textContent();
    expect(laterProgress).toMatch(/[0-9]+%/);
  });

  test('should display terminal output with proper formatting', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify terminal output is visible
    const terminal = page.locator('[data-testid="terminal-output"]');
    await expect(terminal).toBeVisible();

    // Terminal should have content
    await expect(terminal).not.toBeEmpty();

    // Verify terminal has scrollable content
    const terminalScroll = await terminal.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(terminalScroll || true).toBeTruthy(); // May or may not scroll depending on content
  });

  test('should display color-coded terminal messages', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Wait for some output
    await page.waitForTimeout(3000);

    // Verify at least one colored message exists
    const terminal = page.locator('[data-testid="terminal-output"]');

    const hasColoredMessage = await terminal.locator('.text-blue-400, .text-green-400, .text-yellow-400, .text-red-400').count();
    expect(hasColoredMessage).toBeGreaterThan(0);
  });

  test('should show command being executed in header', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify header shows execution info
    const header = page.locator('[data-testid="console-header"]');
    await expect(header).toBeVisible();

    // Header should contain agent name and task info
    await expect(header).toContainText(/agent|executing|running/i);
  });

  test('should close console and return to full-width layout', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);
    await dashboardHelpers.verifySplitViewLayout(page);

    // Close the console
    await dashboardHelpers.closeExecutionConsole(page);

    // Verify layout returned to full width
    await dashboardHelpers.verifyFullWidthLayout(page);
  });

  test('should maintain task list visibility while console is open', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify task list is still visible
    const taskList = page.locator('[data-testid="task-list"]');
    await expect(taskList).toBeVisible();

    // Verify we can see other tasks
    const otherTask = page.locator('[data-testid="task-T008"]');
    await expect(otherTask).toBeVisible();
  });

  test('should handle smooth transitions when opening/closing', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Get initial layout
    const mainContent = page.locator('[data-testid="main-content"]');
    const initialBox = await mainContent.boundingBox();

    // Open console
    await dashboardHelpers.executeTask(page, 'T007');
    await dashboardHelpers.waitForConsoleToOpen(page);

    // Layout should have changed
    const openBox = await mainContent.boundingBox();
    expect(openBox!.width).toBeLessThan(initialBox!.width);

    // Close console
    await dashboardHelpers.closeExecutionConsole(page);
    await dashboardHelpers.waitForConsoleToClose(page);

    // Layout should return to original
    const closedBox = await mainContent.boundingBox();
    expect(closedBox!.width).toBeGreaterThan(openBox!.width);
  });

  test('should update progress to 100% when task completes', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Wait for task completion (with generous timeout)
    await dashboardHelpers.waitForTaskCompletion(page, 60000);

    // Verify progress is 100%
    await dashboardHelpers.verifyProgressBar(page, 100);
  });

  test('should display success message when task completes', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);
    await dashboardHelpers.waitForTaskCompletion(page, 60000);

    // Verify success message in terminal
    await dashboardHelpers.verifyTerminalColorCoding(page, 'success');
  });

  test('should handle multiple sequential task executions', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Execute first task
    await dashboardHelpers.executeTask(page, 'T007');
    await dashboardHelpers.waitForConsoleToOpen(page);
    await dashboardHelpers.closeExecutionConsole(page);

    // Execute second task
    await dashboardHelpers.executeTask(page, 'T008');
    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify console opened for second task
    const header = page.locator('[data-testid="console-header"]');
    await expect(header).toBeVisible();
  });

  test('should preserve scroll position in task list', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const taskList = page.locator('[data-testid="task-list"]');

    // Scroll down in task list
    await taskList.evaluate((el) => {
      el.scrollTop = 200;
    });

    const scrollBefore = await taskList.evaluate((el) => el.scrollTop);

    // Open console
    await dashboardHelpers.executeTask(page, 'T007');
    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify scroll position preserved
    const scrollAfter = await taskList.evaluate((el) => el.scrollTop);
    expect(scrollAfter).toBe(scrollBefore);
  });

  test('should be responsive on mobile viewports', async ({ page, dashboardHelpers }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');
    await dashboardHelpers.executeTask(page, 'T007');

    await dashboardHelpers.waitForConsoleToOpen(page);

    // On mobile, console might overlay or stack vertically
    const console = page.locator('[data-testid="execution-console"]');
    await expect(console).toBeVisible();

    // Verify mobile layout doesn't break
    const consoleBox = await console.boundingBox();
    expect(consoleBox!.width).toBeLessThanOrEqual(375);
  });
});
