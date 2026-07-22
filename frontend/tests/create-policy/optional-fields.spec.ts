// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

async function fillDate(page: import('@playwright/test').Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

test.describe('CreatePolicyPage', () => {
  test('Optional fields (Holder Phone, Deductible) can be left blank', async ({ page }) => {
    // 1. Fill all required fields but leave Holder Phone and Deductible blank.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Optional Fields Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.optional@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await fillDate(page, 'Coverage Start Date', '01012026');
    await fillDate(page, 'Coverage End Date', '01012027');

    // expect: Holder Phone and Deductible remain empty while all other fields are filled.
    await expect(page.getByRole('textbox', { name: 'Holder Phone (optional)' })).toHaveValue('');
    await expect(page.getByRole('spinbutton', { name: 'Deductible (optional)' })).toHaveValue('');

    // 2. Click Create.
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: The policy is created successfully and the app navigates to /policies.
    await expect(page).toHaveURL(/\/policies$/);

    // 3. Open the new policy's View page.
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: 'QA Optional Fields Policy', exact: true }),
    });
    await row.getByRole('button', { name: 'View' }).click();

    // expect: Deductible shows "—" — the submit payload converts an empty numeric field to null,
    // and ViewPolicyPage's `?? '—'` fallback (and formatAmount) render that as "—".
    await expect(page.getByText('Deductible', { exact: true }).locator('xpath=following-sibling::p')).toHaveText('—');
    // expect: Holder Phone shows as an EMPTY value, not "—" — confirmed via source that (unlike
    // the numeric fields) CreatePolicyPage sends holderPhone as a raw string, so a blank field
    // round-trips as `""`, which `?? '—'` does NOT replace (only null/undefined are replaced).
    await expect(page.getByText('Holder Phone', { exact: true }).locator('xpath=following-sibling::p')).toHaveText('');
  });
});
