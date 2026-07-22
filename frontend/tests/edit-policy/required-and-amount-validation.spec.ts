// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Missing required fields and non-positive/negative amounts are blocked the same way as on Create', async ({ page, request }) => {
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit Validation Test Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.editvalidation@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        deductible: 1000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      let putSent = false;
      await page.route(`**/api/policies/${id}`, (route) => {
        if (route.request().method() === 'PUT') putSent = true;
        return route.continue();
      });

      // 1. Clear the Policy Name field entirely, and click Save.
      await page.goto(`/policies/edit/${id}`);
      await page.getByRole('textbox', { name: 'Policy Name' }).fill('');
      await page.getByRole('button', { name: 'Save' }).click();
      // expect: Submission is blocked client-side by native "required" validation; no PUT sent.
      await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));
      expect(putSent).toBe(false);

      // 2. Restore Policy Name, then set Premium Amount to 0 and click Save.
      await page.getByRole('textbox', { name: 'Policy Name' }).fill('Edit Validation Test Policy');
      await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('0');
      await page.getByRole('button', { name: 'Save' }).click();
      // expect: Submission is blocked client-side (min=0.01); no PUT request is sent.
      await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));
      expect(putSent).toBe(false);

      // 3. Restore Premium Amount, then set Deductible to -1 and click Save.
      await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
      await page.getByRole('spinbutton', { name: 'Deductible (optional)' }).fill('-1');
      await page.getByRole('button', { name: 'Save' }).click();
      // expect: Submission is blocked client-side (min=0); no PUT request is sent.
      await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));
      expect(putSent).toBe(false);
    } finally {
      await page.unrouteAll();
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
