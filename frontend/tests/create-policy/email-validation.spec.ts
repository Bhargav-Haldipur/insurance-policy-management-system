// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function fillDate(page: Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

test.describe('CreatePolicyPage', () => {
  test('Invalid email format is blocked by native email-type validation only', async ({ page, request }) => {
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Email Validation Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await fillDate(page, 'Coverage Start Date', '01012026');
    await fillDate(page, 'Coverage End Date', '01012027');

    let postSent = false;
    await page.route('**/api/policies', (route) => {
      if (route.request().method() === 'POST') postSent = true;
      return route.continue();
    });

    // 1. Set Holder Email = "not-an-email" (no @), then click Create.
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('not-an-email');
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: Submission is blocked client-side by the native type="email" constraint; no POST sent.
    await expect(page).toHaveURL(/\/policies\/create$/);
    expect(postSent).toBe(false);

    // 2. Change Holder Email to a minimally-valid-looking address and click Create.
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('a@b.c');
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: Record the actual outcome — since there is no additional email-format validation
    // beyond @Email/native type=email, this should be accepted and the policy created.
    await expect(page).toHaveURL(/\/policies$/);
    const table = page.getByRole('table', { name: 'insurance policies table' });
    await expect(
      table.getByRole('row').filter({ has: page.getByRole('cell', { name: 'QA Email Validation Policy', exact: true }) })
    ).toBeVisible();

    // Cleanup
    const existing = await request.get('http://localhost:8080/api/policies');
    const all: Array<{ id: number; policyName: string }> = await existing.json();
    const toDelete = all.find((p) => p.policyName === 'QA Email Validation Policy');
    if (toDelete) await request.delete(`http://localhost:8080/api/policies/${toDelete.id}`);
  });
});
