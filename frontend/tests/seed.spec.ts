import { test, expect } from '@playwright/test';

// Mirrors seed-policies.sh — keep the two in sync if sample data changes.
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

test.describe('Seed data', () => {
  // Uses both the `request` fixture (to seed via the API) and the `page` fixture
  // (so the Playwright Test Generator's page-attach mechanism has a page to work
  // with) — see specs/policy-management-test-plan.md's "Testing tooling note".
  test('seeds known policies via API', async ({ page, request }) => {
    const existing = await request.get(API_BASE_URL);
    expect(existing.ok()).toBeTruthy();
    const existingNames = new Set(
      (await existing.json()).map((policy: { policyName: string }) => policy.policyName)
    );

    let created = 0;
    let skipped = 0;

    for (const policy of SEED_POLICIES) {
      if (existingNames.has(policy.policyName)) {
        skipped++;
        continue;
      }

      const response = await request.post(API_BASE_URL, { data: policy });
      expect(response.ok(), `Failed to create "${policy.policyName}"`).toBeTruthy();
      const body = await response.json();
      expect(body.id).toBeDefined();
      created++;
    }

    console.log(`Seed complete: ${created} created, ${skipped} skipped (already existed).`);

    await page.goto('/');
  });
});
