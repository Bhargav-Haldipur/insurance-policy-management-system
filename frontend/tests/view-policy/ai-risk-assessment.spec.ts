// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('ViewPolicyPage', () => {
  test('AI Risk Assessment section is present with a valid chip label and non-empty reason', async ({ page, request }) => {
    // 1. Create a policy through the normal create flow (risk scoring runs on every create).
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'View AI Risk Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.viewairisk@example.com',
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

      // expect: Below the detail grid, an "AI Risk Assessment" section is present.
      const heading = page.getByRole('heading', { name: 'AI Risk Assessment' });
      await expect(heading).toBeVisible();
      const section = heading.locator('xpath=..');

      // expect: It contains a colored chip whose label is exactly one of LOW, MEDIUM, or HIGH,
      // and adjacent body text containing a non-empty reason string. Do NOT assert exact wording.
      await expect(section.getByText(/^(LOW|MEDIUM|HIGH)$/)).toBeVisible();
      const reasonText = await section.locator('p').textContent();
      expect(reasonText?.trim().length ?? 0).toBeGreaterThan(0);
    } finally {
      await request.delete(`${API_BASE_URL}/${id}`);
    }
  });
});
