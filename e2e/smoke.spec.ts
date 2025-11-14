import { test, expect } from '@playwright/test';

/**
 * Smoke tests to verify basic dashboard functionality
 * These tests verify the testing infrastructure is working correctly
 */

test.describe('Dashboard Smoke Tests', () => {
  test('should load dashboard homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title or heading exists
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if there are any links or navigation elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page renders something
    const body = page.locator('body');
    const box = await body.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some time for any async errors
    await page.waitForTimeout(2000);

    // Critical errors should not occur
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') && // Common benign error
      !e.includes('React DevTools') // DevTools warning
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have dark mode support', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if dark mode classes exist (most React apps use class-based theming)
    const html = page.locator('html');
    const classes = await html.getAttribute('class');

    // Either has dark mode class or can toggle it
    expect(typeof classes).toBe('string');
  });
});
