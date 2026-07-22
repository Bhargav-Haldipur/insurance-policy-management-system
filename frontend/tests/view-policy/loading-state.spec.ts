// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ViewPolicyPage', () => {
  test('Loading state shows a spinner before the policy detail is fetched', async ({ page }) => {
    // 1. Delay the GET /api/policies/{id} response via route interception.
    let resolveDelay: () => void = () => {};
    const delay = new Promise<void>((resolve) => {
      resolveDelay = resolve;
    });
    await page.route('**/api/policies/1', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await delay;
      await route.continue();
    });

    await page.goto('/policies/view/1');

    // expect: While loading, a centered spinner shows inside the detail Card in place of the field rows.
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText('Policy Name', { exact: true })).not.toBeVisible();

    // expect: The AI Risk Assessment section does not render at all while policy is still null.
    await expect(page.getByRole('heading', { name: 'AI Risk Assessment' })).not.toBeVisible();

    resolveDelay();
    await expect(page.getByRole('progressbar')).not.toBeVisible();
  });
});
