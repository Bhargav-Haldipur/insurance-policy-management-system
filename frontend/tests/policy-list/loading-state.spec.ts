// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyListPage', () => {
  test('Loading state shows a spinner before data arrives', async ({ page }) => {
    // 1. Throttle or delay the GET /api/policies response (e.g. via route interception adding a
    //    delay), then navigate to /policies.
    let resolveDelay: () => void = () => {};
    const delay = new Promise<void>((resolve) => {
      resolveDelay = resolve;
    });
    await page.route('**/api/policies', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await delay;
      await route.continue();
    });

    await page.goto('/policies');

    // expect: While the request is in flight, the table body shows a single centered row
    // spanning all 12 columns containing a circular progress spinner, and no policy rows or
    // "No policies found." text are shown yet.
    const spinnerRow = page.getByRole('row').filter({ has: page.getByRole('progressbar') });
    await expect(spinnerRow).toBeVisible();
    await expect(spinnerRow.getByRole('cell')).toHaveCount(1);
    await expect(page.getByText('No policies found.')).not.toBeVisible();

    // 2. Allow the response to complete.
    resolveDelay();

    // expect: The spinner is replaced by the policy rows (or the empty-state row if there are none).
    await expect(page.getByRole('progressbar')).not.toBeVisible();
  });
});
