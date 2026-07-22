// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('CreatePolicyPage', () => {
  test('Backend/network failure on submission shows an API error Alert and keeps the form usable', async ({ page }) => {
    // 1. Fill all required fields validly.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Submit Error Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.submiterror@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    const startDay = page.getByRole('group', { name: 'Coverage Start Date' }).getByLabel('Day');
    await startDay.click();
    await startDay.pressSequentially('01012026');
    const endDay = page.getByRole('group', { name: 'Coverage End Date' }).getByLabel('Day');
    await endDay.click();
    await endDay.pressSequentially('01012027');

    // 2. Intercept POST /api/policies and force it to fail.
    await page.route('**/api/policies', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Simulated backend outage' }),
      });
    });

    // 3. Click Create.
    const createButton = page.getByRole('button', { name: 'Create' });
    await createButton.click();

    // expect: The app stays on /policies/create (no navigation).
    await expect(page).toHaveURL(/\/policies\/create$/);

    // expect: An error Alert appears containing the message from the mocked response.
    await expect(page.getByRole('alert')).toContainText('Simulated backend outage');

    // expect: The Create button is re-enabled so the user can retry.
    await expect(createButton).toBeEnabled();
  });
});
