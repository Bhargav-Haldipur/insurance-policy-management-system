// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test.describe('PolicyListPage', () => {
  test('"Expiring Soon" chip appears only for ACTIVE/PENDING/SUSPENDED policies whose Coverage End Date is within 31 days', async ({ page, request }) => {
    const basePolicy = {
      policyType: 'AUTO',
      holderName: 'QA Tester',
      holderEmail: 'qa.expiring@example.com',
      premiumAmount: 1000,
      coverageAmount: 100000,
      coverageStartDate: daysFromToday(0),
    };

    // 1. Create 4 policies: (A) ACTIVE, end = today + 10 days; (B) ACTIVE, end = today + 45 days;
    //    (C) EXPIRED, end = today + 10 days; (D) ACTIVE, already-past date range (end = yesterday).
    // Note: the backend DOES enforce coverageEndDate > coverageStartDate (a service-layer check,
    // not visible on the DTO annotations) — so Policy D's start date must ALSO be in the past.
    const policies = [
      { ...basePolicy, policyName: 'Expiring Soon Test A', status: 'ACTIVE', coverageEndDate: daysFromToday(10) },
      { ...basePolicy, policyName: 'Expiring Soon Test B', status: 'ACTIVE', coverageEndDate: daysFromToday(45) },
      { ...basePolicy, policyName: 'Expiring Soon Test C', status: 'EXPIRED', coverageEndDate: daysFromToday(10) },
      {
        ...basePolicy,
        policyName: 'Expiring Soon Test D',
        status: 'ACTIVE',
        coverageStartDate: daysFromToday(-60),
        coverageEndDate: daysFromToday(-1),
      },
    ];

    const createdIds: number[] = [];
    try {
      for (const policy of policies) {
        const response = await request.post(API_BASE_URL, { data: policy });
        expect(response.ok(), `Failed to create "${policy.policyName}"`).toBeTruthy();
        const body = await response.json();
        createdIds.push(body.id);
      }

      // 2. Navigate to /policies and locate each of the 4 newly created rows by their distinct policyName.
      await page.goto('/policies');
      const table = page.getByRole('table', { name: 'insurance policies table' });

      const rowFor = (name: string) =>
        table.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });

      // expect: Policy A shows an "Expiring Soon" chip (within 31 days AND an eligible status).
      await expect(rowFor('Expiring Soon Test A').getByText('Expiring Soon', { exact: true })).toBeVisible();

      // expect: Policy B shows NO "Expiring Soon" chip (45 days is outside the 31-day window).
      await expect(rowFor('Expiring Soon Test B').getByText('Expiring Soon', { exact: true })).not.toBeVisible();

      // expect: Policy C shows NO "Expiring Soon" chip (EXPIRED is not an eligible status, even
      // though the date is within 31 days).
      await expect(rowFor('Expiring Soon Test C').getByText('Expiring Soon', { exact: true })).not.toBeVisible();

      // expect: Policy D shows NO "Expiring Soon" chip (the date is already in the past).
      await expect(rowFor('Expiring Soon Test D').getByText('Expiring Soon', { exact: true })).not.toBeVisible();
    } finally {
      // 3. Cleanup: delete the 4 policies created for this scenario.
      for (const id of createdIds) {
        await request.delete(`${API_BASE_URL}/${id}`);
      }
    }
  });
});
