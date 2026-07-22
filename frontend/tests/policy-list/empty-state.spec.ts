// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080/api/policies';

type SeedPolicy = {
  policyName: string;
  status: string;
  policyType: string;
  holderName: string;
  holderEmail: string;
  holderPhone?: string;
  premiumAmount: number;
  coverageAmount: number;
  deductible?: number;
  coverageStartDate: string;
  coverageEndDate: string;
};

// Mirrors tests/seed.spec.ts's SEED_POLICIES — kept in sync with that file.
const SEED_POLICIES: SeedPolicy[] = [
  { policyName: "John's Auto Policy", status: 'ACTIVE', policyType: 'AUTO', holderName: 'John Doe', holderEmail: 'john.doe@example.com', holderPhone: '+91-9876543210', premiumAmount: 1200.0, coverageAmount: 500000.0, deductible: 5000.0, coverageStartDate: '2026-01-01', coverageEndDate: '2027-01-01' },
  { policyName: "Anita's Health Plan", status: 'ACTIVE', policyType: 'HEALTH', holderName: 'Anita Sharma', holderEmail: 'anita.sharma@example.com', premiumAmount: 3200.0, coverageAmount: 2000000.0, deductible: 10000.0, coverageStartDate: '2026-02-01', coverageEndDate: '2027-02-01' },
  { policyName: "Vikram's Life Cover", status: 'PENDING', policyType: 'LIFE', holderName: 'Vikram Singh', holderEmail: 'vikram.singh@example.com', holderPhone: '+91-9123456780', premiumAmount: 9500.0, coverageAmount: 25000000.0, coverageStartDate: '2026-01-15', coverageEndDate: '2056-01-15' },
  { policyName: "Priya's Home Shield", status: 'ACTIVE', policyType: 'HOME', holderName: 'Priya Nair', holderEmail: 'priya.nair@example.com', holderPhone: '+91-9988776655', premiumAmount: 9800.0, coverageAmount: 8000000.0, deductible: 15000.0, coverageStartDate: '2026-03-01', coverageEndDate: '2027-03-01' },
  { policyName: "Suresh's Property Guard", status: 'SUSPENDED', policyType: 'PROPERTY', holderName: 'Suresh Menon', holderEmail: 'suresh.menon@example.com', premiumAmount: 14000.0, coverageAmount: 20000000.0, coverageStartDate: '2026-01-10', coverageEndDate: '2027-01-10' },
  { policyName: "Deepa's Health Secure", status: 'ACTIVE', policyType: 'HEALTH', holderName: 'Deepa Iyer', holderEmail: 'deepa.iyer@example.com', holderPhone: '+91-9871234560', premiumAmount: 4100.0, coverageAmount: 300000.0, deductible: 8000.0, coverageStartDate: '2026-04-01', coverageEndDate: '2027-04-01' },
  { policyName: "Arjun's Auto Cover", status: 'INACTIVE', policyType: 'AUTO', holderName: 'Arjun Reddy', holderEmail: 'arjun.reddy@example.com', premiumAmount: 1750.0, coverageAmount: 1000.0, coverageStartDate: '2026-02-20', coverageEndDate: '2027-02-20' },
  { policyName: "Kavita's Home Assure", status: 'EXPIRED', policyType: 'HOME', holderName: 'Kavita Joshi', holderEmail: 'kavita.joshi@example.com', holderPhone: '+91-9012345678', premiumAmount: 13300.0, coverageAmount: 1500000.0, deductible: 20000.0, coverageStartDate: '2025-05-01', coverageEndDate: '2026-05-01' },
  { policyName: "Manoj's Life Secure", status: 'ACTIVE', policyType: 'LIFE', holderName: 'Manoj Pillai', holderEmail: 'manoj.pillai@example.com', holderPhone: '+91-9345678901', premiumAmount: 11200.0, coverageAmount: 5000000.0, deductible: 12000.0, coverageStartDate: '2026-01-25', coverageEndDate: '2041-01-25' },
  { policyName: "Sneha's Property Cover", status: 'CANCELLED', policyType: 'PROPERTY', holderName: 'Sneha Rao', holderEmail: 'sneha.rao@example.com', premiumAmount: 9900.0, coverageAmount: 3000000.0, coverageStartDate: '2025-06-01', coverageEndDate: '2026-06-01' },
];

test.describe('PolicyListPage', () => {
  // NOTE: this test temporarily deletes every policy in the shared dev database, then restores
  // the 10 named seed policies in a `finally` block. Because playwright.config.ts sets
  // `fullyParallel: true`, running the full suite concurrently could race with another test that
  // expects seed data to be present during this test's brief empty window.
  test('Empty state shows "No policies found." when zero policies exist', async ({ page, request }) => {
    // 1. Delete every existing policy via the API so the backend has zero policies.
    const existing = await request.get(API_BASE_URL);
    expect(existing.ok()).toBeTruthy();
    const existingPolicies: Array<{ id: number }> = await existing.json();
    for (const policy of existingPolicies) {
      const del = await request.delete(`${API_BASE_URL}/${policy.id}`);
      expect(del.ok()).toBeTruthy();
    }

    try {
      // 2. Navigate to /policies.
      await page.goto('/policies');

      // expect: The table shows a single centered row spanning all 12 columns with the text
      // "No policies found." and no data rows.
      const emptyRow = page.getByRole('row').filter({ hasText: 'No policies found.' });
      await expect(emptyRow).toBeVisible();
      await expect(emptyRow.getByRole('cell')).toHaveCount(1);

      // expect: No error Alert is shown (this is a legitimate empty result, not a fetch failure).
      await expect(page.getByRole('alert')).not.toBeVisible();
    } finally {
      // 3. Cleanup: re-run the seeding step (tests/seed.spec.ts logic) to restore the 10 named
      //    seed policies for subsequent test runs.
      for (const policy of SEED_POLICIES) {
        const response = await request.post(API_BASE_URL, { data: policy });
        expect(response.ok(), `Failed to restore "${policy.policyName}"`).toBeTruthy();
      }
    }
  });
});
