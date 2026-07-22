// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('PolicyListPage', () => {
  test('Delete confirmation dialog — Confirm path removes the policy from the table', async ({ page }) => {
    // 1. Create a new policy via CreatePolicyPage specifically for this test.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('Delete-Confirm Test Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'AUTO' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.delete-confirm@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1000');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('100000');
    await page.getByRole('group', { name: 'Coverage Start Date' }).getByLabel('Day').click();
    await page.keyboard.type('01012026');
    await page.getByRole('group', { name: 'Coverage End Date' }).getByLabel('Day').click();
    await page.keyboard.type('01012027');
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: The policy is created and visible in the list.
    await expect(page).toHaveURL(/\/policies$/);
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: 'Delete-Confirm Test Policy', exact: true }),
    });
    await expect(row).toBeVisible();

    // 2. Find that row and click its Delete button.
    await row.getByRole('button', { name: 'Delete' }).click();

    // expect: The confirmation dialog opens referencing that policy.
    const dialog = page.getByRole('dialog', { name: 'Delete Policy' });
    await expect(dialog).toContainText('Delete-Confirm Test Policy');

    // 3. Click the red "Delete" button in the confirmation dialog.
    await dialog.getByRole('button', { name: 'Delete' }).click();

    // expect: On success, the dialog closes and the row disappears without a full page reload,
    // and no error Alert appears.
    await expect(dialog).not.toBeVisible();
    await expect(row).not.toBeVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();

    // 4. Reload /policies.
    await page.reload();

    // expect: The policy remains absent after reload, confirming it was actually deleted server-side.
    await expect(
      table.getByRole('row').filter({ has: page.getByRole('cell', { name: 'Delete-Confirm Test Policy', exact: true }) })
    ).not.toBeVisible();
  });
});
