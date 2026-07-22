// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyListPage', () => {
  test('View/Edit/Events row action buttons navigate to the correct route shapes', async ({ page }) => {
    // 1. Navigate to /policies and pick any one seeded policy row, noting its id.
    await page.goto('/policies');
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: "John's Auto Policy", exact: true }),
    });
    await expect(row).toBeVisible();
    const id = await row.getByRole('cell').first().textContent();

    // 2. Click that row's View button.
    await row.getByRole('button', { name: 'View' }).click();
    // expect: The URL is exactly /policies/view/{id} (action segment before the id).
    await expect(page).toHaveURL(new RegExp(`/policies/view/${id}$`));

    // 3. Navigate back to /policies, then click the same row's Edit button.
    await page.goto('/policies');
    await row.getByRole('button', { name: 'Edit' }).click();
    // expect: The URL is exactly /policies/edit/{id} (action segment before the id).
    await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));

    // 4. Navigate back to /policies, then click the same row's Events button.
    await page.goto('/policies');
    await row.getByRole('button', { name: 'Events' }).click();
    // expect: The URL is exactly /policies/{id}/events — the opposite ordering from View/Edit.
    await expect(page).toHaveURL(new RegExp(`/policies/${id}/events$`));
  });
});
