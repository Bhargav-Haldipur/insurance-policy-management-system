// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('EditPolicyPage', () => {
  test("Form pre-fills with the existing policy's current values", async ({ page }) => {
    // 1. Navigate to /policies and click Edit on a known seeded policy, noting its id.
    await page.goto('/policies');
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: "Anita's Health Plan", exact: true }),
    });
    const id = await row.getByRole('cell').first().textContent();
    await row.getByRole('button', { name: 'Edit' }).click();

    // expect: The URL is /policies/edit/{id}.
    await expect(page).toHaveURL(new RegExp(`/policies/edit/${id}$`));

    // 2. Wait for the fetch to complete.
    // expect: Every field is pre-populated with that policy's current stored values.
    await expect(page.getByRole('textbox', { name: 'Policy Name' })).toHaveValue("Anita's Health Plan");
    await expect(page.getByRole('combobox', { name: 'Policy Type' })).toHaveText('HEALTH');
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText('ACTIVE');
    await expect(page.getByRole('textbox', { name: 'Holder Name' })).toHaveValue('Anita Sharma');
    await expect(page.getByRole('textbox', { name: 'Holder Email' })).toHaveValue('anita.sharma@example.com');
    await expect(page.getByRole('spinbutton', { name: 'Premium Amount' })).toHaveValue('3200');
    await expect(page.getByRole('spinbutton', { name: 'Coverage Amount' })).toHaveValue('2000000');
    await expect(page.getByRole('spinbutton', { name: 'Deductible (optional)' })).toHaveValue('10000');
  });
});
