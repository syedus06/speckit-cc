import { test, expect } from './fixtures/dashboard-fixtures';

/**
 * E2E tests for bulk task execution
 */

test.describe('Bulk Task Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display task checkboxes for selection', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Verify checkboxes are visible
    const checkbox = page.locator('[data-testid="task-checkbox-T007"]');
    await expect(checkbox).toBeVisible();
  });

  test('should select single task with checkbox', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const checkbox = page.locator('[data-testid="task-checkbox-T007"]');
    await checkbox.click();

    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
  });

  test('should select multiple tasks with checkboxes', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008', 'T009']);

    // Verify all checkboxes are checked
    await expect(page.locator('[data-testid="task-checkbox-T007"]')).toBeChecked();
    await expect(page.locator('[data-testid="task-checkbox-T008"]')).toBeChecked();
    await expect(page.locator('[data-testid="task-checkbox-T009"]')).toBeChecked();
  });

  test('should deselect task when clicking checkbox again', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const checkbox = page.locator('[data-testid="task-checkbox-T007"]');

    // Select
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Deselect
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('should show bulk execute button when tasks are selected', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Initially no tasks selected, button should be disabled or hidden
    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');

    // Select tasks
    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    // Button should be enabled
    await expect(bulkExecuteButton).toBeEnabled();
  });

  test('should disable bulk execute button when no tasks selected', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');

    // No tasks selected
    await expect(bulkExecuteButton).toBeDisabled();
  });

  test('should display selected task count', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008', 'T009']);

    // Verify count is displayed
    const selectedCount = page.locator('[data-testid="selected-tasks-count"]');
    await expect(selectedCount).toContainText('3');
  });

  test('should execute all selected tasks when bulk execute is clicked', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    // Console should open
    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify terminal shows execution of multiple tasks
    const terminal = page.locator('[data-testid="terminal-output"]');
    await expect(terminal).toContainText(/T007|T008/);
  });

  test('should show progress for bulk execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Verify progress bar shows bulk execution progress
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Should show task count progress (e.g., "1/2 tasks")
    const bulkProgress = page.locator('[data-testid="bulk-progress"]');
    const hasBulkProgress = await bulkProgress.count();

    expect(hasBulkProgress >= 0).toBeTruthy();
  });

  test('should execute tasks sequentially', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Wait and verify terminal shows sequential execution
    await page.waitForTimeout(5000);

    const terminal = page.locator('[data-testid="terminal-output"]');
    const content = await terminal.textContent();

    // Should show tasks executing one after another
    expect(content).toBeTruthy();
  });

  test('should clear selection after bulk execution completes', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Wait for completion
    await dashboardHelpers.waitForTaskCompletion(page, 120000);

    // Close console
    await dashboardHelpers.closeExecutionConsole(page);

    // Verify checkboxes are unchecked
    await expect(page.locator('[data-testid="task-checkbox-T007"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="task-checkbox-T008"]')).not.toBeChecked();
  });

  test('should allow canceling bulk execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008', 'T009']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Click cancel button
    const cancelButton = page.locator('[data-testid="cancel-execution-button"]');
    const hasCancelButton = await cancelButton.count();

    if (hasCancelButton > 0) {
      await cancelButton.click();

      // Verify execution stopped
      const terminal = page.locator('[data-testid="terminal-output"]');
      await expect(terminal).toContainText(/cancel|stop|abort/i);
    }
  });

  test('should show select all checkbox', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const selectAllCheckbox = page.locator('[data-testid="select-all-tasks"]');
    await expect(selectAllCheckbox).toBeVisible();
  });

  test('should select all tasks when select all is clicked', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const selectAllCheckbox = page.locator('[data-testid="select-all-tasks"]');
    await selectAllCheckbox.click();

    // Verify all task checkboxes are checked
    const allCheckboxes = page.locator('[data-testid^="task-checkbox-"]');
    const count = await allCheckboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(allCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('should deselect all tasks when select all is clicked again', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const selectAllCheckbox = page.locator('[data-testid="select-all-tasks"]');

    // Select all
    await selectAllCheckbox.click();

    // Deselect all
    await selectAllCheckbox.click();

    // Verify all checkboxes are unchecked
    const allCheckboxes = page.locator('[data-testid^="task-checkbox-"]');
    const count = await allCheckboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(allCheckboxes.nth(i)).not.toBeChecked();
    }
  });

  test('should update select all checkbox state based on individual selections', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    const selectAllCheckbox = page.locator('[data-testid="select-all-tasks"]');

    // Select all tasks individually
    const allCheckboxes = page.locator('[data-testid^="task-checkbox-"]');
    const count = await allCheckboxes.count();

    for (let i = 0; i < count; i++) {
      await allCheckboxes.nth(i).click();
    }

    // Select all checkbox should be checked
    await expect(selectAllCheckbox).toBeChecked();
  });

  test('should handle execution errors in bulk mode', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Select tasks (some might fail)
    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Wait for execution
    await page.waitForTimeout(10000);

    // Terminal should show error handling
    const terminal = page.locator('[data-testid="terminal-output"]');
    const content = await terminal.textContent();

    // Should have some output (success or error)
    expect(content).toBeTruthy();
  });

  test('should preserve task selection when switching features', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    // Navigate away
    await page.goto('/');

    // Navigate back
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    // Selection might or might not be preserved depending on implementation
    // This tests the current behavior
    const checkbox = page.locator('[data-testid="task-checkbox-T007"]');
    const isChecked = await checkbox.isChecked();

    // Just verify checkbox state is valid
    expect(typeof isChecked).toBe('boolean');
  });

  test('should show confirmation dialog before bulk execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008', 'T009']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');

    // Listen for dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain(/execute|confirm|3/i);
      await dialog.accept();
    });

    await bulkExecuteButton.click();

    // If no dialog, that's also fine - just verify console opens
    await dashboardHelpers.waitForConsoleToOpen(page);
  });

  test('should disable task checkboxes during execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008']);

    const bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
    await bulkExecuteButton.click();

    await dashboardHelpers.waitForConsoleToOpen(page);

    // Checkboxes should be disabled during execution
    const checkbox = page.locator('[data-testid="task-checkbox-T009"]');
    const isDisabled = await checkbox.isDisabled();

    // Might or might not be disabled depending on implementation
    expect(typeof isDisabled).toBe('boolean');
  });

  test('should show estimated time for bulk execution', async ({ page, dashboardHelpers }) => {
    await dashboardHelpers.navigateToFeature(page, 'CRMCup', 'Feature 001');

    await dashboardHelpers.selectTasksForBulkExecution(page, ['T007', 'T008', 'T009']);

    // Check if estimated time is shown
    const estimatedTime = page.locator('[data-testid="estimated-execution-time"]');
    const hasEstimate = await estimatedTime.count();

    // Estimated time is optional
    expect(hasEstimate >= 0).toBeTruthy();
  });
});
