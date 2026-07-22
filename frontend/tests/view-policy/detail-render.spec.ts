// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

function valueFor(page: import('@playwright/test').Page, label: string) {
  return page.getByText(label, { exact: true }).locator('xpath=following-sibling::p');
}

test.describe('ViewPolicyPage', () => {
  test('All detail fields render correctly for an existing policy', async ({ page }) => {
    // 1. Navigate to /policies and click View on a known seeded policy with all optional fields
    //    populated (John's Auto Policy has a Holder Phone and Deductible).
    await page.goto('/policies');
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: "John's Auto Policy", exact: true }),
    });
    const id = await row.getByRole('cell').first().textContent();
    await row.getByRole('button', { name: 'View' }).click();

    // expect: The URL is /policies/view/{id}.
    await expect(page).toHaveURL(new RegExp(`/policies/view/${id}$`));

    // expect: A read-only detail card shows the expected fields in order.
    await expect(valueFor(page, 'ID')).toHaveText(id ?? '');
    await expect(valueFor(page, 'Policy Name')).toHaveText("John's Auto Policy");
    await expect(valueFor(page, 'Policy Type')).toHaveText('AUTO');
    await expect(valueFor(page, 'Status')).toHaveText('ACTIVE');
    await expect(valueFor(page, 'Holder Name')).toHaveText('John Doe');
    await expect(valueFor(page, 'Holder Email')).toHaveText('john.doe@example.com');
    await expect(valueFor(page, 'Holder Phone')).toHaveText('+91-9876543210');

    // expect: Premium/Coverage/Deductible amounts show a ₹ prefix with exactly 2 decimal places
    // — note this differs from the List page's 0-decimal compact format.
    await expect(valueFor(page, 'Premium Amount')).toHaveText(/^₹[\d,]+\.\d{2}$/);
    await expect(valueFor(page, 'Coverage Amount')).toHaveText(/^₹[\d,]+\.\d{2}$/);

    // expect: Coverage Start/End Date show as DD MMM YYYY.
    await expect(valueFor(page, 'Coverage Start Date')).toHaveText(/^\d{2} [A-Za-z]{3} \d{4}$/);
    await expect(valueFor(page, 'Coverage End Date')).toHaveText(/^\d{2} [A-Za-z]{3} \d{4}$/);

    // expect: Created At/Updated At show as DD MMM YYYY, hh:mm AM/PM.
    await expect(valueFor(page, 'Created At')).toHaveText(/^\d{2} [A-Za-z]{3} \d{4}, \d{2}:\d{2} (AM|PM)$/);
    await expect(valueFor(page, 'Updated At')).toHaveText(/^\d{2} [A-Za-z]{3} \d{4}, \d{2}:\d{2} (AM|PM)$/);
  });
});
