// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

async function fillDate(page: import('@playwright/test').Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

test.describe('CreatePolicyPage', () => {
  test('Happy path — valid submission creates a policy and returns to the list', async ({ page }) => {
    // 1. Navigate to /policies/create.
    await page.goto('/policies/create');
    // expect: The Create Policy form is displayed with Status defaulted to ACTIVE.
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText('ACTIVE');

    // 2. Fill all fields.
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Happy Path Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.tester@example.com');
    await page.getByRole('textbox', { name: 'Holder Phone (optional)' }).fill('+91-9000000000');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await page.getByRole('spinbutton', { name: 'Deductible (optional)' }).fill('5000');
    await fillDate(page, 'Coverage Start Date', '01012026');
    await fillDate(page, 'Coverage End Date', '01012027');

    // 3. Click Create.
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: The app navigates to /policies.
    await expect(page).toHaveURL(/\/policies$/);

    // expect: A new row for "QA Happy Path Policy" appears with the entered values.
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: 'QA Happy Path Policy', exact: true }),
    });
    await expect(row).toBeVisible();

    // expect: The Risk Score column shows a chip labeled LOW, MEDIUM, or HIGH.
    await expect(row.getByRole('cell').nth(9)).toHaveText(/^(LOW|MEDIUM|HIGH)$/);
  });
});
