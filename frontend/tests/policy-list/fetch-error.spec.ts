// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyListPage', () => {
  test('Fetch failure on initial load shows a fixed generic error regardless of actual server error', async ({ page }) => {
    // 1. Intercept GET /api/policies and force it to fail with a distinctive server error.
    await page.route('**/api/policies', (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Distinctive backend failure XYZ' }),
      });
    });

    // 2. Navigate to /policies.
    await page.goto('/policies');

    // expect: An Alert with severity error is shown containing the fixed literal string
    // "Unable to load policies." — NOT the distinctive backend message from the mocked response,
    // confirming the catch block on this page discards the real error and always shows the same
    // generic string.
    await expect(page.getByRole('alert')).toHaveText('Unable to load policies.');
    await expect(page.getByText('Distinctive backend failure XYZ')).not.toBeVisible();

    // expect: The table renders no policy data rows below the alert (policies state remains an
    // empty array) — just the header row plus the "No policies found." empty-state row, since the
    // component treats a failed fetch the same as a legitimately-empty list once isLoading clears.
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
    await expect(page.getByText('No policies found.')).toBeVisible();
  });
});
