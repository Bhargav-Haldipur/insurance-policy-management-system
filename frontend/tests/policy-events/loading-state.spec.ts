// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyEventsPage', () => {
  test('Loading state shows a spinner before events are fetched', async ({ page }) => {
    // 1. Delay the GET /api/events/{id} response via route interception.
    let resolveDelay: () => void = () => {};
    const delay = new Promise<void>((resolve) => {
      resolveDelay = resolve;
    });
    await page.route('**/api/events/1', async (route) => {
      await delay;
      await route.continue();
    });

    await page.goto('/policies/1/events');

    // expect: While loading, the table body shows a single centered row spanning all 4 columns
    // (#, Event Type, Timestamp, Payload) with a circular progress spinner.
    const spinnerRow = page.getByRole('row').filter({ has: page.getByRole('progressbar') });
    await expect(spinnerRow).toBeVisible();
    await expect(spinnerRow.getByRole('cell')).toHaveCount(1);

    resolveDelay();
    await expect(page.getByRole('progressbar')).not.toBeVisible();
  });
});
