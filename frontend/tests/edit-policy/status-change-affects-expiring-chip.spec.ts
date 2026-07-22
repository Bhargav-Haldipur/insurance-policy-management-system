// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test.describe('EditPolicyPage', () => {
  test('Changing Status away from an expiry-eligible status removes the "Expiring Soon" chip on the list', async ({ page, request }) => {
    // 1. Create a policy with status ACTIVE and coverageEndDate = today + 10 days.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Status Chip Test Policy',
        status: 'ACTIVE',
        policyType: 'AUTO',
        holderName: 'QA Tester',
        holderEmail: 'qa.statuschip@example.com',
        premiumAmount: 1000,
        coverageAmount: 100000,
        coverageStartDate: daysFromToday(0),
        coverageEndDate: daysFromToday(10),
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // Confirm on /policies that its row shows the orange "Expiring Soon" chip.
      await page.goto('/policies');
      const table = page.getByRole('table', { name: 'insurance policies table' });
      const row = table.getByRole('row').filter({
        has: page.getByRole('cell', { name: 'Status Chip Test Policy', exact: true }),
      });
      await expect(row.getByText('Expiring Soon')).toBeVisible();

      // 2. Open its Edit page, change Status to EXPIRED, and Save.
      await page.goto(`/policies/edit/${id}`);
      await page.getByRole('combobox', { name: 'Status' }).click();
      await page.getByRole('option', { name: 'EXPIRED' }).click();
      await page.getByRole('button', { name: 'Save' }).click();

      // expect: The app navigates back to /policies with no error.
      await expect(page).toHaveURL(/\/policies$/);
      await expect(page.getByRole('alert')).not.toBeVisible();

      // 3. Inspect that row on /policies.
      // expect: The Coverage End cell no longer shows the "Expiring Soon" chip.
      await expect(row.getByText('Expiring Soon')).not.toBeVisible();
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
