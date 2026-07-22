// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('PolicyListPage', () => {
  test('Delete confirmation dialog — Failure path shows an API error Alert', async ({ page, request }) => {
    // 1. Create a new policy via the API for this test and load /policies.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Delete-Failure Test Policy',
        status: 'ACTIVE',
        policyType: 'AUTO',
        holderName: 'QA Tester',
        holderEmail: 'qa.delete-failure@example.com',
        premiumAmount: 1000,
        coverageAmount: 100000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      await page.goto('/policies');
      const table = page.getByRole('table', { name: 'insurance policies table' });
      const row = table.getByRole('row').filter({
        has: page.getByRole('cell', { name: 'Delete-Failure Test Policy', exact: true }),
      });
      await expect(row).toBeVisible();

      // 2. Intercept the DELETE request in the browser and force it to return a 404.
      await page.route(`**/api/policies/${id}`, (route) => {
        if (route.request().method() !== 'DELETE') return route.continue();
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: `Insurance policy not found with id: ${id}` }),
        });
      });

      // 3. Click Delete, then confirm in the dialog.
      await row.getByRole('button', { name: 'Delete' }).click();
      const dialog = page.getByRole('dialog', { name: 'Delete Policy' });
      await dialog.getByRole('button', { name: 'Delete' }).click();

      // expect: The dialog closes even on failure.
      await expect(dialog).not.toBeVisible();

      // expect: An error Alert appears above the table with the message derived from the API response.
      await expect(page.getByRole('alert')).toContainText(`Insurance policy not found with id: ${id}`);

      // expect: The stale row remains visible (local state filter only runs on the success branch).
      await expect(row).toBeVisible();
    } finally {
      await page.unrouteAll();
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
