// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Happy path — editing a risk-relevant field (Coverage Amount) still yields a populated risk chip', async ({ page, request }) => {
    // 1. Create a dedicated test policy via the API.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit Target - Coverage Change',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.coveragechange@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // 2. Open its Edit page, change Coverage Amount substantially, and click Save.
      await page.goto(`/policies/edit/${id}`);
      await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('9000000');
      await page.getByRole('button', { name: 'Save' }).click();

      // expect: The app navigates to /policies with no error.
      await expect(page).toHaveURL(/\/policies$/);
      await expect(page.getByRole('alert')).not.toBeVisible();

      // 3. Open the policy's View page.
      await page.goto(`/policies/view/${id}`);
      // expect: The updated Coverage Amount is shown.
      await expect(
        page.getByText('Coverage Amount', { exact: true }).locator('xpath=following-sibling::p')
      ).toHaveText('₹90,00,000.00');
      // expect: The AI Risk Assessment section still shows a chip labeled LOW/MEDIUM/HIGH with a
      // non-empty reason string.
      const section = page.getByRole('heading', { name: 'AI Risk Assessment' }).locator('xpath=..');
      await expect(section.getByText(/^(LOW|MEDIUM|HIGH)$/)).toBeVisible();
      const reasonText = await section.locator('p').textContent();
      expect(reasonText?.trim().length).toBeGreaterThan(0);
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
