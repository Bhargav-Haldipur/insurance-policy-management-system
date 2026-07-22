// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('CreatePolicyPage', () => {
  test('Cancel button discards the form and returns to the list without creating anything', async ({ page }) => {
    // 1. Fill in several fields with distinctive test data, then click Cancel.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('Should Not Be Created');

    let postSent = false;
    await page.route('**/api/policies', (route) => {
      if (route.request().method() === 'POST') postSent = true;
      return route.continue();
    });

    await page.getByRole('button', { name: 'Cancel' }).click();

    // expect: The app navigates to /policies without sending any POST request.
    await expect(page).toHaveURL(/\/policies$/);
    expect(postSent).toBe(false);

    // expect: No row named "Should Not Be Created" appears in the table.
    const table = page.getByRole('table', { name: 'insurance policies table' });
    await expect(
      table.getByRole('row').filter({ has: page.getByRole('cell', { name: 'Should Not Be Created', exact: true }) })
    ).not.toBeVisible();
  });
});
