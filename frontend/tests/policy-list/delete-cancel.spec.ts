// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('PolicyListPage', () => {
  test('Delete confirmation dialog — Cancel path leaves the policy untouched', async ({ page, request }) => {
    // 1. Create a policy specifically for this test, to avoid disturbing seed data.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Delete-Cancel Test Policy',
        status: 'ACTIVE',
        policyType: 'AUTO',
        holderName: 'QA Tester',
        holderEmail: 'qa.delete-cancel@example.com',
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
        has: page.getByRole('cell', { name: 'Delete-Cancel Test Policy', exact: true }),
      });

      let deleteRequestSent = false;
      await page.route(`**/api/policies/${id}`, (route) => {
        if (route.request().method() === 'DELETE') deleteRequestSent = true;
        return route.continue();
      });

      // Click that row's Delete button.
      await row.getByRole('button', { name: 'Delete' }).click();

      // expect: A Dialog titled "Delete Policy" opens containing the expected confirmation text.
      const dialog = page.getByRole('dialog', { name: 'Delete Policy' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Delete-Cancel Test Policy');
      await expect(dialog).toContainText(`(ID: ${id})`);
      await expect(dialog).toContainText('This action cannot be undone.');

      // 2. Click Cancel in the dialog.
      await dialog.getByRole('button', { name: 'Cancel' }).click();

      // expect: The dialog closes.
      await expect(dialog).not.toBeVisible();

      // expect: No DELETE request was sent.
      expect(deleteRequestSent).toBe(false);

      // expect: The policy row is still present in the table, unchanged.
      await expect(row).toBeVisible();
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
