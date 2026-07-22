# Insurance Policy Management System — Comprehensive Test Plan

## Application Overview

This plan covers the five pages of the Insurance Policy Management System frontend (React/Vite, MUI) backed by the Spring Boot REST API (MySQL for policy data, MongoDB for the event audit trail): PolicyListPage (`/policies`), CreatePolicyPage (`/policies/create`), EditPolicyPage (`/policies/edit/:id`), ViewPolicyPage (`/policies/view/:id`), and PolicyEventsPage (`/policies/:id/events`). Note the app's `/` route is a redirect to `/policies`, not a distinct page.

Ground truth confirmed by reading the actual source (not assumed):
- Client-side validation in Create/Edit is limited to native HTML5 `required`, `type="email"`, and numeric `min`/`step` (Premium & Coverage `min=0.01`, Deductible `min=0`). Neither `CreatePolicyRequest`/`UpdatePolicyRequest` (backend DTOs, both using only per-field `@NotBlank`/`@NotNull`/`@Positive`/`@Email` annotations) nor the frontend contain any check that Coverage End Date is after Coverage Start Date. There is no cross-field validation anywhere in the stack.
- Error handling is inconsistent by design: Create/Edit/Delete mutation failures and PolicyEventsPage fetch failures all render an Alert built from `getApiErrorMessage` (reads `response.data.message`, falls back to joining `response.data.errors` field-map, else a generic fallback string) — so real backend messages (e.g. `PolicyNotFoundException` → "Insurance policy not found with id: X") surface to the user. But PolicyListPage, EditPolicyPage, and ViewPolicyPage's initial-load fetch failures are caught with a bare `catch {}` and always show one fixed generic string ("Unable to load policies." / "Unable to load policy.") regardless of the real HTTP status or message.
- Route shapes are inconsistent: View is `/policies/view/:id`, Edit is `/policies/edit/:id` (action segment before id), but Events is `/policies/:id/events` (id segment before action).
- `riskScore`/`riskReason` come from a non-deterministic LLM call (Groq via Spring AI) on every Create, and conditionally on Update only when a risk-relevant field changes (`policyType`, `coverageAmount`, `deductible`, `coverageStartDate`, `coverageEndDate`). Never assert exact reason text or exact score value — only assert the chip is present, its label is one of LOW/MEDIUM/HIGH, and (on ViewPolicyPage) a non-empty reason string accompanies it. ViewPolicyPage has no separate "AI summary" UI element (only the risk chip + reason) even though the backend exposes a `GET /api/policies/{id}/summary` endpoint — this is a documented gap, not a scenario to test as a defect.
- `GetPolicyEventsQueryHandler` verifies the policy still exists in MySQL before returning events, throwing `PolicyNotFoundException` (404, message "Insurance policy not found with id: X") if not — so visiting the Events page for a deleted/non-existent policy id surfaces this real message via `getApiErrorMessage`, not a generic string.
- Ten named seed policies exist (`frontend/tests/seed.spec.ts`, mirrors `seed-policies.sh`) spanning all 5 `PolicyType`s and 6 `PolicyStatus`es. Their `coverageEndDate` values are hardcoded around 2025–2026 and were designed to exercise "Expiring Soon" states at the time they were written, but drift out of the 31-day window as real time passes (as of authoring, none of the ten seeded end dates fall inside the current 31-day window) — so List-page scenarios that depend on a specific "Expiring Soon"/expired state create dedicated policies with dates computed relative to "today" rather than relying on the seed file's fixed dates. General table-rendering/column-shape/risk-chip-presence scenarios may still use the seed data as-is.

Testing tooling note: live browser exploration in this authoring session was blocked because `frontend/tests/seed.spec.ts` only declares a Playwright `request`-fixture test (used purely to seed data via the API) and contains no `page`-fixture test, so the automated page-attach step could not complete. This plan was produced via full static analysis of the actual page components, service layer, date/format utilities, and backend controllers/DTOs/exception handler rather than live UI observation. Recommend adding a `page`-fixture smoke test to `tests/seed.spec.ts` (or a sibling file) so future automated execution of these scenarios can run without this blocker.

All scenarios assume a fresh browser session (no prior app state, e.g. an incognito/new context) unless a scenario's steps explicitly say otherwise, and all scenarios are independent and can run in any order except where explicitly noted as depending on a policy created by another named scenario.

## Test Scenarios

### 1. PolicyListPage

**Seed:** `tests/seed.spec.ts`

#### 1.1. Table renders seeded policies with correct columns

**File:** `tests/policy-list/table-render.spec.ts`

**Steps:**
  1. Ensure the ten seed policies exist by running the seed step (POST via API for any policy names not already present), then navigate to /policies.
    - expect: The URL is /policies (root / redirects here).
    - expect: A table renders with header columns in this exact order: ID, Policy Name, Type, Holder Name, Status, Coverage Start, Coverage End, Premium, Coverage, Risk Score, Created At, Actions.
    - expect: Each of the 10 seeded policies (e.g. "John's Auto Policy", "Anita's Health Plan", "Vikram's Life Cover", ...) appears as a row with correct policyType, holderName, and status values.
    - expect: Coverage Start/End dates are formatted as DD MMM YYYY (e.g. "01 Jan 2026"), not raw ISO strings.
    - expect: Premium and Coverage amounts are formatted with a ₹ prefix and thousands separators, no decimal places (e.g. ₹1,200).
    - expect: Created At is formatted as DD MMM YYYY, hh:mm AM/PM.
    - expect: Each row has View, Edit, Events, and Delete action buttons.

#### 1.2. Loading state shows a spinner before data arrives

**File:** `tests/policy-list/loading-state.spec.ts`

**Steps:**
  1. Throttle or delay the GET /api/policies response (e.g. via route interception adding a delay), then navigate to /policies.
    - expect: While the request is in flight, the table body shows a single centered row spanning all 12 columns containing a circular progress spinner, and no policy rows or "No policies found." text are shown yet.
  2. Allow the response to complete.
    - expect: The spinner is replaced by the policy rows (or the empty-state row if there are none).

#### 1.3. Empty state shows "No policies found." when zero policies exist

**File:** `tests/policy-list/empty-state.spec.ts`

**Steps:**
  1. As a setup step, delete every existing policy via the API (GET /api/policies then DELETE /api/policies/{id} for each) so the backend has zero policies. Record the deleted policies so they can be restored afterward.
    - expect: All policies are removed server-side.
  2. Navigate to /policies.
    - expect: The table shows a single centered row spanning all 12 columns with the text "No policies found." and no data rows.
    - expect: No error Alert is shown (this is a legitimate empty result, not a fetch failure).
  3. Cleanup: re-run the seeding step (tests/seed.spec.ts logic) to restore the 10 named seed policies for subsequent test runs.
    - expect: The 10 seed policies exist again.

#### 1.4. Fetch failure on initial load shows a fixed generic error regardless of actual server error

**File:** `tests/policy-list/fetch-error.spec.ts`

**Steps:**
  1. Intercept GET /api/policies and force it to fail with a distinctive server error (e.g. respond 500 with body {"message":"Distinctive backend failure XYZ"}, or abort the request entirely to simulate a network failure).
    - expect: The interception is armed.
  2. Navigate to /policies.
    - expect: An Alert with severity error is shown containing the fixed literal string "Unable to load policies." — NOT the distinctive backend message from the mocked response, confirming the catch block on this page discards the real error and always shows the same generic string.
    - expect: The table renders with no rows below the alert (policies state remains an empty array).

#### 1.5. Risk Score chip renders with correct label/color and is absent only when riskScore is null

**File:** `tests/policy-list/risk-chip.spec.ts`

**Steps:**
  1. Navigate to /policies with the seed data present (every seeded/created policy triggers AI risk scoring on creation, so riskScore should be non-null for all of them).
    - expect: Every row's Risk Score column shows a colored chip (not a "—" placeholder) whose label is exactly one of LOW, MEDIUM, or HIGH.
    - expect: A chip labeled LOW is green/success colored, MEDIUM is orange/warning colored, HIGH is red/error colored.
    - expect: Do not assert which specific score any given policy has — the AI scoring is non-deterministic; only assert label-to-color consistency.

#### 1.6. "Expiring Soon" chip appears only for ACTIVE/PENDING/SUSPENDED policies whose Coverage End Date is within 31 days

**File:** `tests/policy-list/expiring-soon-chip.spec.ts`

**Steps:**
  1. Via CreatePolicyPage (or a direct API POST for setup speed), create 4 policies, all with coverageStartDate = today: (A) status ACTIVE, coverageEndDate = today + 10 days; (B) status ACTIVE, coverageEndDate = today + 45 days; (C) status EXPIRED, coverageEndDate = today + 10 days; (D) status ACTIVE, coverageEndDate = yesterday (already past).
    - expect: All 4 policies are created successfully.
  2. Navigate to /policies and locate each of the 4 newly created rows by their distinct policyName.
    - expect: Policy A's Coverage End cell shows an orange "Expiring Soon" chip next to the date (within 31 days AND an eligible status).
    - expect: Policy B's Coverage End cell shows NO "Expiring Soon" chip (45 days is outside the 31-day window).
    - expect: Policy C's Coverage End cell shows NO "Expiring Soon" chip (EXPIRED is not one of ACTIVE/PENDING/SUSPENDED, even though the date is within 31 days).
    - expect: Policy D's Coverage End cell shows NO "Expiring Soon" chip (the date is already in the past, so it is not "after now").
  3. Cleanup: delete the 4 policies created for this scenario via the Delete dialog or API.
    - expect: The 4 test policies no longer appear in the list.

#### 1.7. View/Edit/Events row action buttons navigate to the correct route shapes

**File:** `tests/policy-list/row-navigation.spec.ts`

**Steps:**
  1. Navigate to /policies and pick any one seeded policy row, noting its id.
    - expect: The row is visible with a known id.
  2. Click that row's View button.
    - expect: The URL is exactly /policies/view/{id} (action segment before the id).
  3. Navigate back to /policies, then click the same row's Edit button.
    - expect: The URL is exactly /policies/edit/{id} (action segment before the id).
  4. Navigate back to /policies, then click the same row's Events button.
    - expect: The URL is exactly /policies/{id}/events (id segment BEFORE the action, the opposite ordering from View/Edit).

#### 1.8. "Create Policy" button navigates to the create form

**File:** `tests/policy-list/create-navigation.spec.ts`

**Steps:**
  1. Navigate to /policies and click the "Create Policy" button.
    - expect: The URL becomes /policies/create and the Create Policy form is displayed.

#### 1.9. Delete confirmation dialog — Cancel path leaves the policy untouched

**File:** `tests/policy-list/delete-cancel.spec.ts`

**Steps:**
  1. Navigate to /policies and note the policyName and id of one row (e.g. via a policy created specifically for this test, to avoid disturbing seed data), then click that row's Delete button.
    - expect: A Dialog titled "Delete Policy" opens containing the text "Are you sure you want to delete policy <policyName> (ID: <id>)? This action cannot be undone."
  2. Click Cancel in the dialog.
    - expect: The dialog closes.
    - expect: No DELETE request was sent (verify via network log/route interception).
    - expect: The policy row is still present in the table, unchanged.

#### 1.10. Delete confirmation dialog — Confirm path removes the policy from the table

**File:** `tests/policy-list/delete-confirm.spec.ts`

**Steps:**
  1. Create a new policy via CreatePolicyPage (or API) specifically for this test, e.g. named "Delete-Confirm Test Policy".
    - expect: The policy is created and visible in the list.
  2. Navigate to /policies, find that row, and click its Delete button.
    - expect: The confirmation dialog opens referencing that policy.
  3. In the confirmation dialog, click the red "Delete" button.
    - expect: While the delete request is in flight, the button briefly shows "Deleting..." and is disabled (and the Cancel button is also disabled).
    - expect: On success, the dialog closes and the row for "Delete-Confirm Test Policy" disappears from the table without a full page reload.
    - expect: No error Alert appears.
  4. Reload /policies.
    - expect: The policy remains absent after reload, confirming it was actually deleted server-side, not just removed from local UI state.

#### 1.11. Delete confirmation dialog — Failure path shows an API error Alert

**File:** `tests/policy-list/delete-failure.spec.ts`

**Steps:**
  1. Create a new policy via the API for this test (e.g. "Delete-Failure Test Policy") and load /policies.
    - expect: The policy is visible in the list.
  2. Delete that same policy directly via a raw API call (DELETE /api/policies/{id}) BEFORE interacting with the UI, so the row shown in the table now refers to an id that no longer exists server-side (simulating a stale/concurrent-delete race), or alternatively intercept the DELETE request in the browser and force it to return a 404/500.
    - expect: The policy no longer exists server-side, or the interception is armed, while the stale row is still shown in the already-loaded table.
  3. In the UI, click that row's Delete button, then click Delete in the confirmation dialog.
    - expect: The dialog closes (pendingDeletePolicy is cleared even on failure).
    - expect: An error Alert appears above the table containing the message derived from the API response (e.g. "Insurance policy not found with id: {id}" if the backend returned that message, per getApiErrorMessage's data.message lookup), or the fallback "Failed to delete policy." if the mocked/actual response has no message body.
    - expect: The stale row remains visible in the table (since the local state filter only runs in the success branch), which itself is worth flagging as a UI inconsistency — the row appears to still exist even though the delete either already happened or failed.

### 2. CreatePolicyPage

**Seed:** `tests/seed.spec.ts`

#### 2.1. Happy path — valid submission creates a policy and returns to the list

**File:** `tests/create-policy/happy-path.spec.ts`

**Steps:**
  1. Navigate to /policies/create.
    - expect: The Create Policy form is displayed with all fields empty and Status defaulted to ACTIVE.
  2. Fill Policy Name = "QA Happy Path Policy", Policy Type = HEALTH, Status = ACTIVE, Holder Name = "QA Tester", Holder Email = "qa.tester@example.com", Holder Phone = "+91-9000000000", Premium Amount = 1500, Coverage Amount = 500000, Deductible = 5000, Coverage Start Date = today, Coverage End Date = today + 1 year.
    - expect: All fields reflect the entered values.
  3. Click Create.
    - expect: The app navigates to /policies.
    - expect: A new row for "QA Happy Path Policy" appears in the table with the entered values.
    - expect: The Risk Score column for this row shows a chip labeled LOW, MEDIUM, or HIGH (AI scoring ran on create; do not assert which specific value).

#### 2.2. Optional fields (Holder Phone, Deductible) can be left blank

**File:** `tests/create-policy/optional-fields.spec.ts`

**Steps:**
  1. Navigate to /policies/create and fill all required fields (Policy Name, Policy Type, Status, Holder Name, Holder Email, Premium Amount, Coverage Amount, Coverage Start/End Date) but leave Holder Phone and Deductible blank.
    - expect: Holder Phone and Deductible remain empty while all other fields are filled.
  2. Click Create.
    - expect: The policy is created successfully (no client-side block, since Phone/Deductible are not `required`) and the app navigates to /policies.
  3. Open the new policy's View page.
    - expect: Holder Phone shows "—".
    - expect: Deductible shows "—" (confirming the '' → null conversion in the submit payload round-trips correctly through the backend).

#### 2.3. Missing required text/select fields block submission via native HTML5 validation

**File:** `tests/create-policy/required-field-validation.spec.ts`

**Steps:**
  1. Navigate to /policies/create. Fill in every field EXCEPT Policy Name, then click Create.
    - expect: The form does not submit (no navigation away from /policies/create) and the browser shows its native "required" validation message anchored to the Policy Name field.
    - expect: No POST /api/policies request is sent (verify via network log).
  2. Repeat the same check individually leaving Holder Name, Holder Email, Premium Amount, and Coverage Amount blank in turn (fill everything else).
    - expect: Each case is blocked client-side the same way, with no network request sent.

#### 2.4. Non-positive Premium/Coverage Amount is blocked by native min/step constraints

**File:** `tests/create-policy/non-positive-amount-validation.spec.ts`

**Steps:**
  1. Navigate to /policies/create, fill all required fields validly, but set Premium Amount = 0, then click Create.
    - expect: Submission is blocked client-side (native min=0.01 constraint) and no POST request is sent.
  2. Change Premium Amount to a valid positive value, then set Coverage Amount = 0 and click Create.
    - expect: Submission is blocked client-side the same way for Coverage Amount.
  3. Attempt to type a negative value (e.g. -100) directly into the Premium Amount field.
    - expect: Record whether the number input accepts the negative value while typing; if it does, confirm that clicking Create still blocks submission due to the min=0.01 constraint (no POST request sent) — since the app has no separate JS-level check, only the native input constraint prevents this.

#### 2.5. Negative Deductible is blocked; zero Deductible is allowed

**File:** `tests/create-policy/deductible-validation.spec.ts`

**Steps:**
  1. Navigate to /policies/create, fill all required fields validly, set Deductible = 0, and click Create.
    - expect: The policy is created successfully — 0 satisfies min=0, deductible is optional either way.
  2. Repeat with Deductible = -50.
    - expect: Submission is blocked client-side (native min=0 constraint) and no POST request is sent.

#### 2.6. Invalid email format is blocked by native email-type validation only

**File:** `tests/create-policy/email-validation.spec.ts`

**Steps:**
  1. Navigate to /policies/create, fill all required fields validly, but set Holder Email = "not-an-email" (no @), then click Create.
    - expect: Submission is blocked client-side by the native type="email" constraint; no POST request is sent.
  2. Change Holder Email to a minimally-valid-looking address the browser accepts (e.g. "a@b.c") and click Create.
    - expect: Record the actual outcome: since there is no additional email-format validation on the client or in the backend DTO beyond @Email/native type=email, this should be accepted and the policy created — confirm whether that is indeed what happens.

#### 2.7. Coverage End Date before Coverage Start Date — no cross-field validation exists anywhere

**File:** `tests/create-policy/end-before-start-date.spec.ts`

**Steps:**
  1. Navigate to /policies/create, fill all required fields validly, but set Coverage Start Date = today and Coverage End Date = 10 days before today (i.e. end date earlier than start date), then click Create.
    - expect: Observe and record the ACTUAL behavior — do not assume in advance which of these occurs: (a) the form silently submits and the app navigates to /policies with the policy created (since neither the frontend nor the CreatePolicyRequest backend DTO has any check that end > start), (b) the browser's native date-picker widget itself refuses to let an end date earlier than the start date be selected, or (c) the backend rejects the request and an error Alert appears on the Create page.
    - expect: Whichever occurs, record the exact UI/network evidence observed (screenshot or network response body) so this can be tracked as expected/unexpected behavior going forward.

#### 2.8. Backend/network failure on submission shows an API error Alert and keeps the form usable

**File:** `tests/create-policy/submit-error.spec.ts`

**Steps:**
  1. Navigate to /policies/create and fill all required fields validly.
    - expect: The form is fully and validly filled.
  2. Intercept POST /api/policies and force it to fail (e.g. respond 500 with body {"message":"Simulated backend outage"}, or abort the request).
    - expect: The interception is armed.
  3. Click Create.
    - expect: The app stays on /policies/create (no navigation).
    - expect: An error Alert appears containing the message from the mocked response ("Simulated backend outage") if a message body was provided, per getApiErrorMessage's data.message lookup — or the fallback "Unable to create policy." if no message/errors field was present.
    - expect: The Create button is re-enabled (isSubmitting reset to false) so the user can retry.

#### 2.9. Backend field-validation errors (errors map) are joined and displayed

**File:** `tests/create-policy/field-validation-errors.spec.ts`

**Steps:**
  1. Navigate to /policies/create and fill all required fields validly.
    - expect: The form is fully and validly filled.
  2. Intercept POST /api/policies and force a 400 response with body {"errors":{"holderEmail":"must be a well-formed email address","premiumAmount":"must be positive"}} (mirroring the shape MethodArgumentNotValidException produces on the backend).
    - expect: The interception is armed.
  3. Click Create.
    - expect: An error Alert appears showing both field errors joined in the "field: message" format, e.g. "holderEmail: must be a well-formed email address, premiumAmount: must be positive".

#### 2.10. Cancel button discards the form and returns to the list without creating anything

**File:** `tests/create-policy/cancel.spec.ts`

**Steps:**
  1. Navigate to /policies/create, fill in several fields with distinctive test data (e.g. Policy Name = "Should Not Be Created"), then click Cancel.
    - expect: The app navigates to /policies without sending any POST request.
    - expect: No row named "Should Not Be Created" appears in the table.

### 3. EditPolicyPage

**Seed:** `tests/seed.spec.ts`

#### 3.1. Form pre-fills with the existing policy's current values

**File:** `tests/edit-policy/prefill.spec.ts`

**Steps:**
  1. Navigate to /policies and click Edit on a known seeded policy (e.g. "Anita's Health Plan"), noting its id.
    - expect: The URL is /policies/edit/{id}.
    - expect: While loading, a centered spinner is shown in place of the form fields.
  2. Wait for the fetch to complete.
    - expect: Every field (Policy Name, Policy Type, Status, Holder Name, Holder Email, Holder Phone, Premium Amount, Coverage Amount, Deductible, Coverage Start Date, Coverage End Date) is pre-populated with that policy's current stored values, matching what is shown on its View page.

#### 3.2. Happy path — editing a non-risk-relevant field (Holder Phone) saves successfully

**File:** `tests/edit-policy/edit-non-risk-field.spec.ts`

**Steps:**
  1. Create a dedicated test policy via CreatePolicyPage (e.g. "Edit Target - Phone Change"), then open its Edit page and note the current Risk Score chip on its View page beforehand.
    - expect: A risk chip labeled LOW/MEDIUM/HIGH is present on the View page prior to editing.
  2. On the Edit page, change only Holder Phone to a new value, leaving Policy Type/Coverage Amount/Deductible/dates unchanged, and click Save.
    - expect: The app navigates to /policies with no error.
  3. Open the policy's View page.
    - expect: Holder Phone shows the updated value.
    - expect: The Risk Score chip is still present and shows one of LOW/MEDIUM/HIGH (a re-score is not guaranteed here since Holder Phone is not one of the risk-relevant fields, but the existing score/reason should not have been wiped out).

#### 3.3. Happy path — editing a risk-relevant field (Coverage Amount) still yields a populated risk chip

**File:** `tests/edit-policy/edit-risk-relevant-field.spec.ts`

**Steps:**
  1. Create a dedicated test policy via CreatePolicyPage (e.g. "Edit Target - Coverage Change").
    - expect: The policy is created and visible in the list.
  2. Open its Edit page, change Coverage Amount to a substantially different value (this is one of the fields — policyType, coverageAmount, deductible, coverageStartDate, coverageEndDate — that triggers a conditional AI re-score on update), and click Save.
    - expect: The app navigates to /policies with no error.
  3. Open the policy's View page.
    - expect: The updated Coverage Amount is shown.
    - expect: The AI Risk Assessment section still shows a chip labeled LOW/MEDIUM/HIGH with a non-empty reason string (confirming the conditional rescore path did not break the page even though the exact score cannot be asserted).

#### 3.4. Changing Status away from an expiry-eligible status removes the "Expiring Soon" chip on the list

**File:** `tests/edit-policy/status-change-affects-expiring-chip.spec.ts`

**Steps:**
  1. Create a policy with status ACTIVE and coverageEndDate = today + 10 days (e.g. "Status Chip Test Policy"). Confirm on /policies that its row shows the orange "Expiring Soon" chip.
    - expect: The "Expiring Soon" chip is visible on this row before editing.
  2. Open its Edit page, change Status to EXPIRED (leaving the end date unchanged), and Save.
    - expect: The app navigates back to /policies with no error.
  3. Inspect that row on /policies.
    - expect: The Coverage End cell no longer shows the "Expiring Soon" chip, since EXPIRED is not in the set of eligible statuses (ACTIVE/PENDING/SUSPENDED), even though the date itself is still within 31 days.

#### 3.5. Missing required fields and non-positive/negative amounts are blocked the same way as on Create

**File:** `tests/edit-policy/required-and-amount-validation.spec.ts`

**Steps:**
  1. Open Edit for any existing policy, clear the Policy Name field entirely, and click Save.
    - expect: Submission is blocked client-side by native "required" validation; no PUT request is sent.
  2. Restore Policy Name, then set Premium Amount to 0 and click Save.
    - expect: Submission is blocked client-side (min=0.01); no PUT request is sent.
  3. Restore Premium Amount, then set Deductible to -1 and click Save.
    - expect: Submission is blocked client-side (min=0); no PUT request is sent.

#### 3.6. Coverage End Date before Coverage Start Date on Edit — observe actual behavior

**File:** `tests/edit-policy/end-before-start-date.spec.ts`

**Steps:**
  1. Open Edit for a dedicated test policy, set Coverage Start Date = today and Coverage End Date = 5 days before today, and click Save.
    - expect: As with Create, observe and record the actual behavior without assuming an outcome in advance: silently accepted and saved, blocked by the date-picker widget itself, or rejected by the backend with an error Alert shown on the Edit page. UpdatePolicyRequest has the same lack of cross-field validation as CreatePolicyRequest, so this is expected to behave consistently with the Create-page equivalent scenario — confirm that it does.

#### 3.7. Fetch failure for a non-existent policy id shows a fixed generic error, not the real 404 message

**File:** `tests/edit-policy/fetch-error.spec.ts`

**Steps:**
  1. Navigate directly to /policies/edit/999999999 (an id that does not exist).
    - expect: An error Alert is shown containing the fixed literal string "Unable to load policy." — NOT the backend's actual 404 message ("Insurance policy not found with id: 999999999"), since the fetch catch block here discards the real error, unlike the mutation-failure paths.
    - expect: The form fields below the alert reflect the untouched initial defaults (Status defaults to ACTIVE, all other fields blank) since `policy` state was never updated from the failed fetch — record whether the (effectively blank/default) form is still shown and interactive, or whether it's otherwise hidden.

#### 3.8. Backend/network failure on save shows an API error Alert and keeps the form usable

**File:** `tests/edit-policy/submit-error.spec.ts`

**Steps:**
  1. Open Edit for any existing policy.
    - expect: The form loads with pre-filled values.
  2. Intercept PUT /api/policies/{id} and force it to fail (e.g. 500 with body {"message":"Simulated update failure"}).
    - expect: The interception is armed.
  3. Make a valid change and click Save.
    - expect: The app stays on the Edit page (no navigation).
    - expect: An error Alert shows "Simulated update failure" (or the fallback "Unable to update policy." if no message body is present).
    - expect: The Save button is re-enabled so the user can retry.

#### 3.9. Cancel button discards changes and returns to the list

**File:** `tests/edit-policy/cancel.spec.ts`

**Steps:**
  1. Open Edit for any existing policy, change the Policy Name to a distinctive value, then click Cancel instead of Save.
    - expect: The app navigates to /policies without sending a PUT request.
  2. Re-open that policy's View or Edit page.
    - expect: The ORIGINAL policy name is shown, confirming the change was discarded.

### 4. ViewPolicyPage

**Seed:** `tests/seed.spec.ts`

#### 4.1. All detail fields render correctly for an existing policy

**File:** `tests/view-policy/detail-render.spec.ts`

**Steps:**
  1. Navigate to /policies and click View on a known seeded policy with all optional fields populated (e.g. "John's Auto Policy", which has a Holder Phone and Deductible).
    - expect: The URL is /policies/view/{id}.
    - expect: A read-only detail card shows, in order: ID, Policy Name, Policy Type, Status, Holder Name, Holder Email, Holder Phone, Premium Amount, Coverage Amount, Deductible, Coverage Start Date, Coverage End Date, Created At, Updated At.
    - expect: Premium/Coverage/Deductible amounts show a ₹ prefix with exactly 2 decimal places (e.g. ₹1,200.00) — note this differs from the List page's 0-decimal compact format.
    - expect: Coverage Start/End Date show as DD MMM YYYY.
    - expect: Created At/Updated At show as DD MMM YYYY, hh:mm AM/PM.

#### 4.2. Optional fields with no value display as "—"

**File:** `tests/view-policy/optional-field-fallback.spec.ts`

**Steps:**
  1. Create a test policy leaving Holder Phone and Deductible blank, then open its View page.
    - expect: Holder Phone row shows "—".
    - expect: Deductible row shows "—".

#### 4.3. AI Risk Assessment section is present with a valid chip label and non-empty reason

**File:** `tests/view-policy/ai-risk-assessment.spec.ts`

**Steps:**
  1. Open the View page for any policy created through the normal Create flow (risk scoring runs on every create, so riskScore should be non-null).
    - expect: Below the detail grid, an "AI Risk Assessment" section is present.
    - expect: It contains a colored chip whose label is exactly one of LOW, MEDIUM, or HIGH (green/orange/red respectively), and adjacent body text containing a non-empty reason string.
    - expect: Do NOT assert the exact wording of the reason or which specific score is shown — only presence, valid label, and non-empty reason text.

#### 4.4. No separate AI summary section exists on this page (documented gap, not a defect to fail on)

**File:** `tests/view-policy/no-summary-section.spec.ts`

**Steps:**
  1. Open any policy's View page and inspect the full page content below the detail grid.
    - expect: Confirm that only the AI Risk Assessment chip + reason text is present. There is no separate "Summary"/"Event History Summary" UI section on this page, even though the backend exposes GET /api/policies/{id}/summary. Record this as a known current-state fact, not a bug — do not fail this scenario if no summary UI is found; only flag it if a summary section unexpectedly DOES appear with incorrect content.

#### 4.5. Loading state shows a spinner before the policy detail is fetched

**File:** `tests/view-policy/loading-state.spec.ts`

**Steps:**
  1. Delay the GET /api/policies/{id} response via route interception, then navigate to /policies/view/{id} for a valid id.
    - expect: While loading, a centered spinner shows inside the detail Card in place of the field rows.
    - expect: The AI Risk Assessment section does not render at all while policy is still null.

#### 4.6. Fetch failure for a non-existent policy id shows a fixed generic error

**File:** `tests/view-policy/fetch-error.spec.ts`

**Steps:**
  1. Navigate directly to /policies/view/999999999 (a non-existent id).
    - expect: An error Alert shows the fixed literal string "Unable to load policy." — not the backend's actual "Insurance policy not found with id: 999999999" message, confirming the same discard-the-real-error pattern as EditPolicyPage/PolicyListPage.
    - expect: The detail Card shows no field rows (policy remains null) and no AI Risk Assessment section is rendered.
    - expect: Back and Edit buttons are still present and clickable even in this error state (Edit would then hit its own equivalent fetch-error case).

#### 4.7. Back and Edit navigation buttons route correctly

**File:** `tests/view-policy/navigation.spec.ts`

**Steps:**
  1. Open View for any existing policy, click Back.
    - expect: The app navigates to /policies.
  2. Open View for the same policy again, click Edit.
    - expect: The URL becomes /policies/edit/{id} (same id, action-before-id ordering, matching the row-level Edit button's target).

### 5. PolicyEventsPage

**Seed:** `tests/seed.spec.ts`

#### 5.1. Route shape uses id-before-action ordering, distinct from View/Edit

**File:** `tests/policy-events/route-shape.spec.ts`

**Steps:**
  1. Navigate to /policies and click Events on any policy row with id {id}.
    - expect: The URL is exactly /policies/{id}/events — the id segment appears BEFORE the "events" action segment, which is the opposite ordering from /policies/view/{id} and /policies/edit/{id}.
    - expect: The page shows the heading "Policy Event History", the text "Policy ID: {id}", and a "Back to Policies" button.

#### 5.2. Create → Update → Delete produces corresponding sequential events with formatted payloads

**File:** `tests/policy-events/full-audit-trail.spec.ts`

**Steps:**
  1. Create a new policy via CreatePolicyPage (e.g. "Audit Trail Test Policy") and note its id from the list.
    - expect: The policy is created and visible in the list.
  2. Navigate to its Events page (/policies/{id}/events).
    - expect: Exactly one row is shown, numbered "#1" (a sequential row number, not a raw MongoDB ObjectId).
    - expect: That row's Event Type reflects the creation (e.g. CREATE/CREATED — record the exact literal value used by this deployment).
    - expect: The Payload cell renders as a formatted block of "key: value" lines (one per field, monospace, on its own row) rather than a raw Java toString() dump like "PolicyEvent(id=..., ...)".
  3. Go back, open Edit for the same policy, change Holder Name, and Save.
    - expect: The update succeeds and the app returns to /policies.
  4. Return to the same policy's Events page.
    - expect: A second row now appears numbered "#2" with an Event Type reflecting the update, and its Payload block reflects the changed field(s).
  5. Go back to the list, delete the policy via the Delete dialog (Confirm).
    - expect: The policy is removed from the list.
  6. Attempt to navigate directly to the same /policies/{id}/events URL again (id no longer exists in MySQL).
    - expect: Per GetPolicyEventsQueryHandler's existence check, this should now return a 404 with message "Insurance policy not found with id: {id}", which — because PolicyEventsPage's fetch failure path uses getApiErrorMessage (unlike List/Edit/View) — should surface that EXACT backend message text in the error Alert, not a generic fallback. Confirm this is what actually happens.
    - expect: No event rows are shown (table shows only the header, or the "No events found." empty-state row, alongside the error alert — record which).

#### 5.3. Loading state shows a spinner before events are fetched

**File:** `tests/policy-events/loading-state.spec.ts`

**Steps:**
  1. Delay the GET /api/events/{id} response via route interception, then navigate to a valid policy's Events page.
    - expect: While loading, the table body shows a single centered row spanning all 4 columns (#, Event Type, Timestamp, Payload) with a circular progress spinner.

#### 5.4. Fetch error surfaces the real backend message (contrast with List/Edit/View's generic fallback)

**File:** `tests/policy-events/fetch-error-message.spec.ts`

**Steps:**
  1. Intercept GET /api/events/{id} for a valid policy id and force a 500 response with body {"message":"Distinctive events backend failure"}.
    - expect: The interception is armed.
  2. Navigate to that policy's Events page.
    - expect: The error Alert shows "Distinctive events backend failure" — the actual mocked message — NOT a generic fixed string, confirming this page's fetch-error handling (via getApiErrorMessage) is intentionally different from PolicyListPage/EditPolicyPage/ViewPolicyPage, which always show a fixed generic string regardless of the real error.
  3. Repeat, but this time have the intercepted response return a 500 with an empty body (no message/errors field).
    - expect: The error Alert falls back to the literal string "Unable to load policy event history."

#### 5.5. "Back to Policies" button returns to the list

**File:** `tests/policy-events/back-navigation.spec.ts`

**Steps:**
  1. Open the Events page for any policy and click "Back to Policies".
    - expect: The app navigates to /policies.
