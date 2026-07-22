// spec: specs/policy-management-test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

async function fillDate(page: import('@playwright/test').Page, groupName: string, ddmmyyyy: string) {
  const day = page.getByRole('group', { name: groupName }).getByLabel('Day');
  await day.click();
  await day.pressSequentially(ddmmyyyy);
}

test.describe('PolicyEventsPage', () => {
  test('Create → Update → Delete produces corresponding sequential events with formatted payloads', async ({ page }) => {
    // 1. Create a new policy via CreatePolicyPage and note its id from the list.
    await page.goto('/policies/create');
    await page.getByRole('textbox', { name: 'Policy Name' }).fill('Audit Trail Test Policy');
    await page.getByRole('combobox', { name: 'Policy Type' }).click();
    await page.getByRole('option', { name: 'HEALTH' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester');
    await page.getByRole('textbox', { name: 'Holder Email' }).fill('qa.audittrail@example.com');
    await page.getByRole('spinbutton', { name: 'Premium Amount' }).fill('1500');
    await page.getByRole('spinbutton', { name: 'Coverage Amount' }).fill('500000');
    await fillDate(page, 'Coverage Start Date', '01012026');
    await fillDate(page, 'Coverage End Date', '01012027');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/policies$/);
    const table = page.getByRole('table', { name: 'insurance policies table' });
    const row = table.getByRole('row').filter({
      has: page.getByRole('cell', { name: 'Audit Trail Test Policy', exact: true }),
    });
    const id = await row.getByRole('cell').first().textContent();

    // 2. Navigate to its Events page.
    await row.getByRole('button', { name: 'Events' }).click();
    await expect(page).toHaveURL(new RegExp(`/policies/${id}/events$`));

    // expect: Exactly one row is shown, numbered "#1" (a sequential row number, not a raw ObjectId).
    const eventsTable = page.getByRole('table');
    let rows = eventsTable.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByRole('cell').first()).toHaveText('#1');

    // expect: That row's Event Type reflects the creation.
    await expect(rows.first().getByRole('cell').nth(1)).toHaveText('POLICY_CREATED');

    // expect: The Payload cell renders as a formatted "key: value" block, not a raw
    // "PolicyEvent(id=..., ...)" toString() dump.
    const payloadCell = rows.first().getByRole('cell').nth(3);
    await expect(payloadCell).toContainText('policyName: Audit Trail Test Policy');
    await expect(payloadCell).not.toContainText('PolicyEvent(');

    // 3. Go back, open Edit for the same policy, change Holder Name, and Save.
    await page.getByRole('button', { name: 'Back to Policies' }).click();
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Holder Name' }).fill('QA Tester Updated');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/policies$/);

    // 4. Return to the same policy's Events page.
    await row.getByRole('button', { name: 'Events' }).click();
    await expect(page).toHaveURL(new RegExp(`/policies/${id}/events$`));

    // expect: A second row now appears numbered "#2" with an Event Type reflecting the update,
    // and its Payload block reflects the changed field.
    rows = eventsTable.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1).getByRole('cell').first()).toHaveText('#2');
    await expect(rows.nth(1).getByRole('cell').nth(1)).toHaveText('POLICY_UPDATED');
    await expect(rows.nth(1).getByRole('cell').nth(3)).toContainText('holderName: QA Tester Updated');

    // 5. Go back to the list, delete the policy via the Delete dialog (Confirm).
    await page.getByRole('button', { name: 'Back to Policies' }).click();
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog', { name: 'Delete Policy' }).getByRole('button', { name: 'Delete' }).click();
    await expect(row).not.toBeVisible();

    // 6. Attempt to navigate directly to the same /policies/{id}/events URL again.
    await page.goto(`/policies/${id}/events`);

    // expect: Per GetPolicyEventsQueryHandler's existence check, this returns a 404 with message
    // "Insurance policy not found with id: {id}", surfaced via getApiErrorMessage since this page
    // (unlike List/Edit/View) uses that helper for its fetch-error path — confirm this is what happens.
    await expect(page.getByRole('alert')).toContainText(`Insurance policy not found with id: ${id}`);

    // expect: No actual event data rows are shown — the fetch failure leaves `events` as `[]`,
    // so the page renders its "No events found." empty-state row (1 row), same as a real empty list.
    const dataRows = eventsTable.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows).toContainText('No events found.');
  });
});
