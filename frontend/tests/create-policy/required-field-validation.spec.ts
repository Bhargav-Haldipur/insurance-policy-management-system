// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function fillDate(page: Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

async function fillValidForm(page: Page, overrides: { skip?: string } = {}) {
  const { skip } = overrides;
  if (skip !== 'Policy Name') await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Required Field Policy');
  await page.getByRole('combobox', { name: 'Policy Type' }).click();
  await page.getByRole('option', { name: 'HEALTH' }).click();
  if (skip !== 'Holder Name') await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
  if (skip !== 'Holder Email') await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.required@example.com');
  if (skip !== 'Premium Amount') await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
  if (skip !== 'Coverage Amount') await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
  await fillDate(page, 'Coverage Start Date', '01012026');
  await fillDate(page, 'Coverage End Date', '01012027');
}

test.describe('CreatePolicyPage', () => {
  test('Missing required text/select fields block submission via native HTML5 validation', async ({ page }) => {
    for (const field of ['Policy Name', 'Holder Name', 'Holder Email', 'Premium Amount', 'Coverage Amount']) {
      await page.goto('/policies/create');
      await fillValidForm(page, { skip: field });

      let postSent = false;
      await page.route('**/api/policies', (route) => {
        if (route.request().method() === 'POST') postSent = true;
        return route.continue();
      });

      await page.getByRole('button', { name: 'Create' }).click();

      // expect: The form does not submit (no navigation away from /policies/create).
      await expect(page).toHaveURL(/\/policies\/create$/);
      // expect: No POST /api/policies request is sent.
      expect(postSent, `Expected no POST request when "${field}" is blank`).toBe(false);
    }
  });
});
