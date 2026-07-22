// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function fillDate(page: Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

async function fillValidForm(page: Page, policyName: string) {
  await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyName);
  await page.getByRole('combobox', { name: 'Policy Type' }).click();
  await page.getByRole('option', { name: 'HEALTH' }).click();
  await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
  await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.deductible@example.com');
  await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
  await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
  await fillDate(page, 'Coverage Start Date', '01012026');
  await fillDate(page, 'Coverage End Date', '01012027');
}

test.describe('CreatePolicyPage', () => {
  test('Negative Deductible is blocked; zero Deductible is allowed', async ({ page, request }) => {
    // 1. Set Deductible = 0 and click Create.
    await page.goto('/policies/create');
    await fillValidForm(page, 'QA Deductible Zero Policy');
    await page.getByRole('spinbutton', { name: 'Deductible (optional)' }).fill('0');
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: The policy is created successfully — 0 satisfies min=0.
    await expect(page).toHaveURL(/\/policies$/);
    const table = page.getByRole('table', { name: 'insurance policies table' });
    await expect(
      table.getByRole('row').filter({ has: page.getByRole('cell', { name: 'QA Deductible Zero Policy', exact: true }) })
    ).toBeVisible();

    // 2. Repeat with Deductible = -50.
    await page.goto('/policies/create');
    await fillValidForm(page, 'QA Deductible Negative Policy');

    let postSent = false;
    await page.route('**/api/policies', (route) => {
      if (route.request().method() === 'POST') postSent = true;
      return route.continue();
    });

    await page.getByRole('spinbutton', { name: 'Deductible (optional)' }).fill('-50');
    await page.getByRole('button', { name: 'Create' }).click();

    // expect: Submission is blocked client-side (native min=0 constraint); no POST request is sent.
    await expect(page).toHaveURL(/\/policies\/create$/);
    expect(postSent).toBe(false);

    // Cleanup
    const existing = await request.get('http://localhost:8080/api/policies');
    const all: Array<{ id: number; policyName: string }> = await existing.json();
    const toDelete = all.find((p) => p.policyName === 'QA Deductible Zero Policy');
    if (toDelete) await request.delete(`http://localhost:8080/api/policies/${toDelete.id}`);
  });
});
