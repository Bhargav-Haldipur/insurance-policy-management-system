// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

const RISK_COLOR_CLASS: Record<string, RegExp> = {
  LOW: /MuiChip-colorSuccess/,
  MEDIUM: /MuiChip-colorWarning/,
  HIGH: /MuiChip-colorError/,
};

test.describe('PolicyListPage', () => {
  test('Risk Score chip renders with correct label/color and is absent only when riskScore is null', async ({ page }) => {
    // 1. Navigate to /policies with the seed data present (every seeded/created policy triggers
    //    AI risk scoring on creation, so riskScore should be non-null for all of them).
    await page.goto('/policies');

    const table = page.getByRole('table', { name: 'insurance policies table' });
    const dataRows = table.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      const riskCell = dataRows.nth(i).getByRole('cell').nth(9);

      // expect: Every row's Risk Score column shows a colored chip (not a "—" placeholder) whose
      // label is exactly one of LOW, MEDIUM, or HIGH.
      await expect(riskCell).toHaveText(/^(LOW|MEDIUM|HIGH)$/);

      // expect: A chip labeled LOW is green/success colored, MEDIUM is orange/warning colored,
      // HIGH is red/error colored. Do not assert which specific score any given policy has.
      const label = (await riskCell.textContent())?.trim() ?? '';
      const chip = riskCell.locator('.MuiChip-root');
      await expect(chip).toHaveClass(RISK_COLOR_CLASS[label]);
    }
  });
});
