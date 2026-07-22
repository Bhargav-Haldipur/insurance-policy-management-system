// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('EditPolicyPage', () => {
  test('Backend/network failure on save shows an API error Alert and keeps the form usable', async ({ page, request }) => {
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'Edit Submit Error Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.editsubmiterror@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      // 1. Open Edit for the policy.
      await page.goto(`/policies/edit/${id}`);
      await expect(page.getByRole('textbox', { name: 'Policy Name' })).toHaveValue('Edit Submit Error Policy');

      // 2. Intercept PUT and force it to fail.
      await page.route(`**/api/policies/${id}`, (route) => {
        if (route.request().method() !== 'PUT') return route.continue();
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Simulated update failure' }),
        });
      });

      // 3. Make a valid change and click Save.
      await page.getByRole('textbox', { name: 'Holder Phone (optional)' }).fill('+91-9222222222');
      const saveButton = page.getByRole('button', { name: 'Save' });
      await saveButton.click();

      // expect: The app stays on the Edit page (no navigation).
      await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));

      // expect: An error Alert shows "Simulated update failure".
      await expect(page.getByRole('alert')).toContainText('Simulated update failure');

      // expect: The Save button is re-enabled so the user can retry.
      await expect(saveButton).toBeEnabled();
    } finally {
      await page.unrouteAll();
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
