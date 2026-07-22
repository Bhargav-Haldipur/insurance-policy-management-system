// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('CreatePolicyPage', () => {
  test('Coverage End Date before Coverage Start Date is rejected by the backend', async ({ page, request }) => {
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('QA End-Before-Start Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.enddate@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');

    // Coverage Start Date = today, Coverage End Date = 10 days before today.
    const startDay = page.getByRole('group', { name: 'Coverage Start Date' }).getByLabel('Day');
    await startDay.click();
    await startDay.pressSequentially('01012026');
    const endDay = page.getByRole('group', { name: 'Coverage End Date' }).getByLabel('Day');
    await endDay.click();
    await endDay.pressSequentially('22122025');

    await page.getByRole('button', { name: 'Create' }).click();

    // expect: Although neither the frontend nor CreatePolicyRequest's field annotations enforce
    // end > start, a service-layer check on the backend does reject this — confirmed directly via
    // API: POST with end < start returns 400 {"message":"Coverage end date must be after coverage
    // start date"}. The frontend has no client-side guard, so the form submits and the app stays
    // on /policies/create showing that message via the error Alert.
    await expect(page).toHaveURL(/\/policies\/create$/);
    await expect(page.getByRole('alert')).toContainText('Coverage end date must be after coverage start date');

    // Cleanup, if the policy was in fact created.
    const existing = await request.get('http://localhost:8080/api/policies');
    const all: Array<{ id: number; policyName: string }> = await existing.json();
    const created = all.find((p) => p.policyName === 'QA End-Before-Start Policy');
    if (created) await request.delete(`http://localhost:8080/api/policies/${created.id}`);
  });
});
