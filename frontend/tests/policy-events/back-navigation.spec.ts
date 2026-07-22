// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyEventsPage', () => {
  test('"Back to Policies" button returns to the list', async ({ page }) => {
    // 1. Open the Events page for any policy and click "Back to Policies".
    await page.goto('/policies/1/events');
    await page.getByRole('button', { name: 'Back to Policies' }).click();

    // expect: The app navigates to /policies.
    await expect(page).toHaveURL(/\/policies$/);
  });
});
