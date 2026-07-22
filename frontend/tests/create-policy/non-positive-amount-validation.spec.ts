// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

async function fillDate(page: Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

async function trackPost(page: Page): Promise<() => boolean> {
  let postSent = false;
  await page.route('**/api/policies', (route) => {
    if (route.request().method() === 'POST') postSent = true;
    return route.continue();
  });
  return () => postSent;
}

test.describe('CreatePolicyPage', () => {
  test('Non-positive Premium/Coverage Amount is blocked by native min/step constraints', async ({ page }) => {
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA Non-Positive Amount Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.nonpositive@example.com');
    await fillDate(page, 'Coverage Start Date', '01012026');
    await fillDate(page, 'Coverage End Date', '01012027');

    const postSent = await trackPost(page);

    // 1. Set Premium Amount = 0, then click Create.
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('0');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await page.getByRole('button', { name: 'Create' }).click();
    // expect: Submission is blocked client-side (native min=0.01 constraint); no POST request is sent.
    await expect(page).toHaveURL(/\/policies\/create$/);
    expect(postSent()).toBe(false);

    // 2. Change Premium Amount to valid, set Coverage Amount = 0, click Create.
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('0');
    await page.getByRole('button', { name: 'Create' }).click();
    // expect: Submission is blocked client-side the same way for Coverage Amount.
    await expect(page).toHaveURL(/\/policies\/create$/);
    expect(postSent()).toBe(false);

    // 3. Attempt to type a negative value directly into the Premium Amount field.
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('-100');
    await page.getByRole('button', { name: 'Create' }).click();
    // expect: Submission is still blocked (min=0.01 constraint); no POST request is sent.
    await expect(page).toHaveURL(/\/policies\/create$/);
    expect(postSent()).toBe(false);
  });
});
