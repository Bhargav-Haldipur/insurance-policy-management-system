// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Cancel button discards changes and returns to the list', async ({ page, request }) => {
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit Cancel Test Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.editcancel@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // 1. Open Edit, change the Policy Name, then click Cancel instead of Save.
      await page.goto(`/policies/edit/${id}`);
      await page.getByRole('textbox', { name: 'Policy Name' }).fill('Should Not Persist');
      await page.getByRole('button', { name: 'Cancel' }).click();

      // expect: The app navigates to /policies without sending a PUT request.
      await expect(page).toHaveURL(/\/policies$/);

      // 2. Re-open that policy's View page.
      await page.goto(`/policies/view/${id}`);
      // expect: The ORIGINAL policy name is shown, confirming the change was discarded.
      await expect(
        page.getByText('Policy Name', { exact: true }).locator('xpath=following-sibling::p')
      ).toHaveText('Edit Cancel Test Policy');
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
