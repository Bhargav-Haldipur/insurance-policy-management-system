// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Coverage End Date before Coverage Start Date on Edit is rejected by the backend', async ({ page, request }) => {
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit End-Before-Start Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.editenddate@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // Set Coverage Start Date = today and Coverage End Date = 5 days before today, and click Save.
      await page.goto(`/policies/edit/${id}`);
      const startDay = page.getByRole('group', { name: 'Coverage Start Date' }).getByLabel('Day');
      await startDay.click();
      await startDay.pressSequentially('01012026');
      const endDay = page.getByRole('group', { name: 'Coverage End Date' }).getByLabel('Day');
      await endDay.click();
      await endDay.pressSequentially('27122025');

      await page.getByRole('button', { name: 'Save' }).click();

      // expect: Confirmed directly via API that UpdatePolicyRequest is rejected the same way as
      // Create when end < start (400, "Coverage end date must be after coverage start date").
      // The frontend has no client-side guard, so the form submits and stays on the Edit page.
      await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));
      await expect(page.getByRole('alert')).toContainText('Coverage end date must be after coverage start date');
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
