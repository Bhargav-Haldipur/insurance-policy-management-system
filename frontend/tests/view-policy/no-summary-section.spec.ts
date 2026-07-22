// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

test.describe('ViewPolicyPage', () => {
  test('No separate AI summary section exists on this page (documented gap, not a defect to fail on)', async ({ page, request }) => {
    // 1. Create a dedicated policy (rather than relying on any specific pre-existing id, since
    //    other tests in this suite delete/recreate policies and ids are never reused) and open its
    //    View page to inspect the full page content below the detail grid.
    const created = await request.post(API_BASE_URL, {
      data: {
        policyName: 'No Summary Section Test Policy',
        status: 'ACTIVE',
        policyType: 'HEALTH',
        holderName: 'QA Tester',
        holderEmail: 'qa.nosummary@example.com',
        premiumAmount: 1500,
        coverageAmount: 500000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2027-01-01',
      },
    });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();
    await page.goto(`/policies/view/${id}`);

    // expect: Confirm that only the AI Risk Assessment chip + reason text is present. There is no
    // separate "Summary"/"Event History Summary" UI section on this page, even though the backend
    // exposes GET /api/policies/{id}/summary. This is a documented current-state fact, not a bug.
    await expect(page.getByRole('heading', { name: 'AI Risk Assessment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Summary/i })).not.toBeVisible();
    await expect(page.getByText(/Event History Summary/i)).not.toBeVisible();

    await request.delete(`${API_BASE_URL}/${id}`);
  });
});
