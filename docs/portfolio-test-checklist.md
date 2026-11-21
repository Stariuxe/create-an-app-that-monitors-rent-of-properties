# PropertyOS AI preview test checklist

Use the preview deployment, not the production domain, for this round of testing.

## 1. Access and workspace
- [ ] Sign in with a landlord account.
- [ ] Open **Property operations** and confirm the correct organization is shown.
- [ ] Open **Portfolio Intelligence** from the navigation.
- [ ] Confirm a user without membership cannot view or write another organization's records.
- [ ] If the account belongs to multiple organizations, verify the displayed workspace is the intended one.

## 2. Property setup
- [ ] Add a property with name, address and county.
- [ ] Add at least two units to that property.
- [ ] Add a tenant and create an active lease for one unit.
- [ ] Raise a rent charge for the lease.
- [ ] Confirm the rent charge appears in the outstanding-charge selector.

## 3. Portfolio records
- [ ] Add an expense with amount and date.
- [ ] Add a maintenance record and set a due date/status.
- [ ] Add a compliance record with a due date.
- [ ] Add an other-income record.
- [ ] Refresh the page and confirm records persist and are assigned to the correct property.
- [ ] Verify totals and monthly chart against the saved records; note any mismatch.

## 4. Payment workflow
- [ ] Save a payment collection instruction (do not enter live credentials or secret keys).
- [ ] Record a partial cash receipt against a rent charge.
- [ ] Confirm the charge balance decreases by exactly the cash receipt.
- [ ] Record the remaining balance and confirm the charge becomes paid.
- [ ] Attempt an amount greater than the remaining balance; it must be rejected.
- [ ] If Daraja sandbox variables are configured, use only a Safaricom sandbox test number and confirm the prompt/callback status. Do not use a real tenant payment.

## 5. Isolation and resilience
- [ ] Test with a second organization and confirm no cross-organization property, tenant, rent or portfolio data is visible.
- [ ] Test empty states (new workspace with no properties/units/charges).
- [ ] Test invalid amounts, missing required fields and invalid dates.
- [ ] Refresh after each successful save and confirm no blank page or duplicate record.

## Report back
Send the preview URL and the exact page, action, and error text for any failed step. Do not send passwords, API keys, tenant personal data or payment credentials.
