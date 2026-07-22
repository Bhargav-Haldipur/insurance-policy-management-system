// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyEventsPage', () => {
  test('Fetch error surfaces the real backend message (contrast with List/Edit/View\'s generic fallback)', async ({ page }) => {
    // 1. Intercept GET /api/events/{id} and force a 500 response with a distinctive message.
    await page.route('**/api/events/1', (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Distinctive events backend failure' }),
      });
    });

    // 2. Navigate to that policy's Events page.
    await page.goto('/policies/1/events');

    // expect: The error Alert shows the actual mocked message — NOT a generic fixed string.
    await expect(page.getByRole('alert')).toContainText('Distinctive events backend failure');

    // 3. Repeat, with an intercepted response that has an empty body.
    await page.unroute('**/api/events/1');
    await page.route('**/api/events/1', (route) => {
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/policies/1/events');

    // expect: The error Alert falls back to the literal fallback string.
    await expect(page.getByRole('alert')).toHaveText('Unable to load policy event history.');
  });
});
