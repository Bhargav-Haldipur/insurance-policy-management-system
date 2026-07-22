// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyListPage', () => {
  test('"Create Policy" button navigates to the create form', async ({ page }) => {
    // 1. Navigate to /policies and click the "Create Policy" button.
    await page.goto('/policies');
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // expect: The URL becomes /policies/create and the Create Policy form is displayed.
    await expect(page).toHaveURL(/\/policies\/create$/);
    await expect(page.getByRole('heading', { name: 'Create Policy' })).toBeVisible();
  });
});
