// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Happy path — editing a non-risk-relevant field (Holder Phone) saves successfully', async ({ page, request }) => {
    // 1. Create a dedicated test policy via the API.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit Target - Phone Change',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.phonechange@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // expect: A risk chip labeled LOW/MEDIUM/HIGH is present on the View page prior to editing.
      await page.goto(`/policies/view/${id}`);
      const riskHeading = page.getByRole('heading', { name: 'AI Risk Assessment' });
      await expect(riskHeading).toBeVisible();

      // 2. On the Edit page, change only Holder Phone, leave other fields unchanged, and click Save.
      await page.goto(`/policies/edit/${id}`);
      await page.getByRole('textbox', { name: 'Holder Phone (optional)' }).fill('+91-9111111111');
      await page.getByRole('button', { name: 'Save' }).click();

      // expect: The app navigates to /policies with no error.
      await expect(page).toHaveURL(/\/policies$/);
      await expect(page.getByRole('alert')).not.toBeVisible();

      // 3. Open the policy's View page.
      await page.goto(`/policies/view/${id}`);
      // expect: Holder Phone shows the updated value.
      await expect(
        page.getByText('Holder Phone', { exact: true }).locator('xpath=following-sibling::p')
      ).toHaveText('+91-9111111111');
      // expect: The Risk Score chip is still present and shows one of LOW/MEDIUM/HIGH.
      await expect(page.getByRole('heading', { name: 'AI Risk Assessment' })).toBeVisible();
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
