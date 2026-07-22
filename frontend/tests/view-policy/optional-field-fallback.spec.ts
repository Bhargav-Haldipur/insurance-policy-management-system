// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('ViewPolicyPage', () => {
  test('Optional fields with no value display as "—"', async ({ page, request }) => {
    // 1. Create a test policy leaving Holder Phone and Deductible blank, then open its View page.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'View Optional Fallback Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.viewfallback@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();

    try {
      await page.goto(`/policies/view/${id}`);

      // expect: Holder Phone row shows "—".
      await expect(
        page.getByText('Holder Phone', { exact: true }).locator('xpath=following-sibling::p')
      ).toHaveText('—');
      // expect: Deductible row shows "—".
      await expect(
        page.getByText('Deductible', { exact: true }).locator('xpath=following-sibling::p')
      ).toHaveText('—');
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
