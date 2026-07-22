// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ViewPolicyPage', () => {
  test('Back and Edit navigation buttons route correctly', async ({ page }) => {
    // 1. Open View for any existing policy, click Back.
    await page.goto('/policies/view/1');
    await page.getByRole('button', { name: 'Back' }).click();
    // expect: The app navigates to /policies.
    await expect(page).toHaveURL(/\/policies$/);

    // 2. Open View for the same policy again, click Edit.
    await page.goto('/policies/view/1');
    await page.getByRole('button', { name: 'Edit' }).click();
    // expect: The URL becomes /policies/edit/{id} (same id, action-before-id ordering).
    await expect(page).toHaveURL(/\/policies\/edit\/1$/);
  });
});
