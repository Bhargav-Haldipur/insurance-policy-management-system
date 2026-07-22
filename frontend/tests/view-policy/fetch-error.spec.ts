// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ViewPolicyPage', () => {
  test('Fetch failure for a non-existent policy id shows a fixed generic error', async ({ page }) => {
    // 1. Navigate directly to /policies/view/999999999 (a non-existent id).
    await page.goto('/policies/view/999999999');

    // expect: An error Alert shows the fixed literal string "Unable to load policy." — not the
    // backend's actual "Insurance policy not found with id: ..." message.
    await expect(page.getByRole('alert')).toHaveText('Unable to load policy.');
    await expect(page.getByText(/Insurance policy not found/)).not.toBeVisible();

    // expect: The detail Card shows no field rows and no AI Risk Assessment section is rendered.
    await expect(page.getByText('Policy Name', { exact: true })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Risk Assessment' })).not.toBeVisible();

    // expect: Back and Edit buttons are still present and clickable even in this error state.
    await expect(page.getByRole('button', { name: 'Back' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeEnabled();
  });
});
