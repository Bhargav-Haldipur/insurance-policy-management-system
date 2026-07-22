// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('CreatePolicyPage', () => {
  test('Backend field-validation errors (errors map) are joined and displayed', async ({ page }) => {
    // 1. Fill all required fields validly.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Field Errors Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.fielderrors@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    const startDay = page.getByRole('group', { name: 'Coverage Start Date' }).getByLabel('Day');
    await startDay.click();
    await startDay.pressSequentially('01012026');
    const endDay = page.getByRole('group', { name: 'Coverage End Date' }).getByLabel('Day');
    await endDay.click();
    await endDay.pressSequentially('01012027');

    // 2. Intercept POST /api/policies and force a 400 with a field-errors map.
    await page.route('**/api/policies', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: {
            holderEmail: 'must be a well-formed email address',
            premiumAmount: 'must be positive',
          },
        }),
      });
    });

    // 3. Click Create.
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: An error Alert shows both field errors joined in the "field: message" format.
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('holderEmail: must be a well-formed email address');
    await expect(alert).toContainText('premiumAmount: must be positive');
  });
});
