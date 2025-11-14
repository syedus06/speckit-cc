import { test as base, expect } from '@playwright/test';
import * as helpers from '../utils/test-helpers';

/**
 * Custom fixtures for dashboard tests
 */

type DashboardFixtures = {
  dashboardHelpers: typeof helpers;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<DashboardFixtures>({
  dashboardHelpers: async ({}, use) => {
    // Make all helpers available in tests
    await use(helpers);
  },
});

export { expect };
