// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyEventsPage', () => {
  test('Route shape uses id-before-action ordering, distinct from View/Edit', async ({ page }) => {
    // 1. Navigate to /policies and click Events on any policy row.
    await page.goto('/policies');
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: "John's Auto Policy", exact: true }),
    });
    const id = await row.getByRole('cell').first().textContent();
    await row.getByRole('button', { name: 'Events' }).click();

    // expect: The URL is exactly /policies/{id}/events — id BEFORE the "events" action segment,
    // the opposite ordering from /policies/view/{id} and /policies/edit/{id}.
    await expect(page).toHaveURL(new RegExp(`/policies/${id}/events$`));

    // expect: The page shows the heading, "Policy ID: {id}", and a "Back to Policies" button.
    await expect(page.getByRole('heading', { name: 'Policy Event History' })).toBeVisible();
    await expect(page.getByText(`Policy ID: ${id}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Policies' })).toBeVisible();
  });
});
