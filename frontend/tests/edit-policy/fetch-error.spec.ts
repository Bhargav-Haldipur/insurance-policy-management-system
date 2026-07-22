// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('EditPolicyPage', () => {
  test('Fetch failure for a non-existent policy id shows a fixed generic error, not the real 404 message', async ({ page }) => {
    // 1. Navigate directly to /policies/edit/999999999 (an id that does not exist).
    await page.goto('/policies/edit/999999999');

    // expect: An error Alert is shown containing the fixed literal string "Unable to load policy."
    // — NOT the backend's actual 404 message.
    await expect(page.getByRole('alert')).toHaveText('Unable to load policy.');
    await expect(page.getByText(/Insurance policy not found/)).not.toBeVisible();

    // expect: The form fields below the alert reflect the untouched initial defaults.
    await expect(page.getByRole('textbox', { name: 'Policy Name' })).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText('ACTIVE');
  });
});
