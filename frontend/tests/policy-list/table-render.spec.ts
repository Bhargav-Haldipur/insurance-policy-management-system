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
  {
    policyName: "John's Auto Policy",
    status: 'ACTIVE',
    policyType: 'AUTO',
    holderName: 'John Doe',
    holderEmail: 'john.doe@example.com',
    holderPhone: '+91-9876543210',
    premiumAmount: 1200.0,
    coverageAmount: 500000.0,
    deductible: 5000.0,
    coverageStartDate: '2026-01-01',
    coverageEndDate: '2027-01-01',
  },
  {
    policyName: "Anita's Health Plan",
    status: 'ACTIVE',
    policyType: 'HEALTH',
    holderName: 'Anita Sharma',
    holderEmail: 'anita.sharma@example.com',
    premiumAmount: 3200.0,
    coverageAmount: 2000000.0,
    deductible: 10000.0,
    coverageStartDate: '2026-02-01',
    coverageEndDate: '2027-02-01',
  },
  {
    policyName: "Vikram's Life Cover",
    status: 'PENDING',
    policyType: 'LIFE',
    holderName: 'Vikram Singh',
    holderEmail: 'vikram.singh@example.com',
    holderPhone: '+91-9123456780',
    premiumAmount: 9500.0,
    coverageAmount: 25000000.0,
    coverageStartDate: '2026-01-15',
    coverageEndDate: '2056-01-15',
  },
  {
    policyName: "Priya's Home Shield",
    status: 'ACTIVE',
    policyType: 'HOME',
    holderName: 'Priya Nair',
    holderEmail: 'priya.nair@example.com',
    holderPhone: '+91-9988776655',
    premiumAmount: 9800.0,
    coverageAmount: 8000000.0,
    deductible: 15000.0,
    coverageStartDate: '2026-03-01',
    coverageEndDate: '2027-03-01',
  },
  {
    policyName: "Suresh's Property Guard",
    status: 'SUSPENDED',
    policyType: 'PROPERTY',
    holderName: 'Suresh Menon',
    holderEmail: 'suresh.menon@example.com',
    premiumAmount: 14000.0,
    coverageAmount: 20000000.0,
    coverageStartDate: '2026-01-10',
    coverageEndDate: '2027-01-10',
  },
  {
    policyName: "Deepa's Health Secure",
    status: 'ACTIVE',
    policyType: 'HEALTH',
    holderName: 'Deepa Iyer',
    holderEmail: 'deepa.iyer@example.com',
    holderPhone: '+91-9871234560',
    premiumAmount: 4100.0,
    coverageAmount: 300000.0,
    deductible: 8000.0,
    coverageStartDate: '2026-04-01',
    coverageEndDate: '2027-04-01',
  },
  {
    policyName: "Arjun's Auto Cover",
    status: 'INACTIVE',
    policyType: 'AUTO',
    holderName: 'Arjun Reddy',
    holderEmail: 'arjun.reddy@example.com',
    premiumAmount: 1750.0,
    coverageAmount: 1000.0,
    coverageStartDate: '2026-02-20',
    coverageEndDate: '2027-02-20',
  },
  {
    policyName: "Kavita's Home Assure",
    status: 'EXPIRED',
    policyType: 'HOME',
    holderName: 'Kavita Joshi',
    holderEmail: 'kavita.joshi@example.com',
    holderPhone: '+91-9012345678',
    premiumAmount: 13300.0,
    coverageAmount: 1500000.0,
    deductible: 20000.0,
    coverageStartDate: '2025-05-01',
    coverageEndDate: '2026-05-01',
  },
  {
    policyName: "Manoj's Life Secure",
    status: 'ACTIVE',
    policyType: 'LIFE',
    holderName: 'Manoj Pillai',
    holderEmail: 'manoj.pillai@example.com',
    holderPhone: '+91-9345678901',
    premiumAmount: 11200.0,
    coverageAmount: 5000000.0,
    deductible: 12000.0,
    coverageStartDate: '2026-01-25',
    coverageEndDate: '2041-01-25',
  },
  {
    policyName: "Sneha's Property Cover",
    status: 'CANCELLED',
    policyType: 'PROPERTY',
    holderName: 'Sneha Rao',
    holderEmail: 'sneha.rao@example.com',
    premiumAmount: 9900.0,
    coverageAmount: 3000000.0,
    coverageStartDate: '2025-06-01',
    coverageEndDate: '2026-06-01',
  },
];

// DD MMM YYYY, anchored — used for cells that contain only the date (e.g. Coverage Start).
const exactDatePattern = /^\d{2} [A-Za-z]{3} \d{4}$/;
// DD MMM YYYY, unanchored — used for cells that may also render an "Expiring Soon" chip
// alongside the date (e.g. Coverage End).
const looseDatePattern = /\d{2} [A-Za-z]{3} \d{4}/;
// ₹ prefix, thousands separators, no decimal places (e.g. ₹1,200).
const compactAmountPattern = /^₹[\d,]+$/;
// DD MMM YYYY, hh:mm AM/PM (e.g. 14 Jul 2026, 04:06 PM).
const timestampPattern = /^\d{2} [A-Za-z]{3} \d{4}, \d{2}:\d{2} (AM|PM)$/;

test.describe('PolicyListPage', () => {
  test('Table renders seeded policies with correct columns', async ({ page, request }) => {
    // 1. Ensure the ten seed policies exist by running the seed step (POST via API for any policy names not already present), then navigate to /policies.
    const existing = await request.get(API_BASE_URL);
    expect(existing.ok()).toBeTruthy();
    const existingNames = new Set(
      (await existing.json()).map((policy: { policyName: string }) => policy.policyName)
    );
    for (const policy of SEED_POLICIES) {
      if (existingNames.has(policy.policyName)) continue;
      const response = await request.post(API_BASE_URL, { data: policy });
      expect(response.ok(), `Failed to create "${policy.policyName}"`).toBeTruthy();
    }

    await page.goto('/');

    // expect: The URL is /policies (root / redirects here).
    await expect(page).toHaveURL(/\/policies$/);

    // expect: A table renders with header columns in this exact order: ID, Policy Name, Type,
    // Holder Name, Status, Coverage Start, Coverage End, Premium, Coverage, Risk Score, Created At, Actions.
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const headerRow = table.getByRole('row').first();
    await expect(headerRow.getByRole('columnheader')).toHaveText([
      'ID',
      'Policy Name',
      'Type',
      'Holder Name',
      'Status',
      'Coverage Start',
      'Coverage End',
      'Premium',
      'Coverage',
      'Risk Score',
      'Created At',
      'Actions',
    ]);

    // expect: Each of the 10 seeded policies appears as a row with correct policyType, holderName, and status values.
    // expect: Coverage Start/End dates are formatted as DD MMM YYYY (e.g. "01 Jan 2026"), not raw ISO strings.
    // expect: Premium and Coverage amounts are formatted with a ₹ prefix and thousands separators, no decimal places (e.g. ₹1,200).
    // expect: Created At is formatted as DD MMM YYYY, hh:mm AM/PM.
    // expect: Each row has View, Edit, Events, and Delete action buttons.
    for (const policy of SEED_POLICIES) {
      const row = table.getByRole('row').filter({
        has: page.getByRole('cell', { name: policy.policyName, exact: true }),
      });
      await expect(row).toBeVisible();

      const cells = row.getByRole('cell');
      await expect(cells.nth(2)).toHaveText(policy.policyType);
      await expect(cells.nth(3)).toHaveText(policy.holderName);
      await expect(cells.nth(4)).toHaveText(policy.status);
      await expect(cells.nth(5)).toHaveText(exactDatePattern);
      await expect(cells.nth(6)).toContainText(looseDatePattern);
      await expect(cells.nth(7)).toHaveText(compactAmountPattern);
      await expect(cells.nth(8)).toHaveText(compactAmountPattern);
      await expect(cells.nth(10)).toHaveText(timestampPattern);

      await expect(row.getByRole('button', { name: 'View' })).toBeVisible();
      await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible();
      await expect(row.getByRole('button', { name: 'Events' })).toBeVisible();
      await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });
});
