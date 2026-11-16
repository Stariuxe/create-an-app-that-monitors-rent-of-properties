# PropertyOS AI — Responsible AI Usage Policy

**Owner:** Stariuxe Enterprises  
**Status:** Internal product and staff policy

## 1. Approved uses

AI tools may assist with:
- Drafting generic help content, product documentation, marketing copy and training material.
- Reviewing source code, proposing tests and explaining non-sensitive error messages.
- Creating synthetic demonstration data and design concepts.
- Summarising public technical documentation.

## 2. Prohibited inputs

Do not submit the following to public or unapproved AI services:
- Tenant names combined with contact details, national ID numbers, identity documents or emergency contacts.
- Rent ledgers, bank statements, M-Pesa statements, payment receipts tied to identifiable tenants or database exports.
- Passwords, OTPs, API keys, access tokens, private keys, callback tokens or environment-variable files.
- Private source files containing secrets, customer contracts or confidential business information unless the service has been approved for that data classification.

Use synthetic data such as “Tenant A”, fake Kenyan phone numbers and made-up payment references when asking an AI tool to diagnose a problem.

## 3. Human review

- Treat AI-generated code as untrusted until reviewed, tested and checked for licensing, security and compatibility.
- Never allow an AI assistant to approve, reject, rank, evict or penalise a tenant autonomously.
- Do not let AI change rent, fees, lease terms, payment status or access permissions without an authorised human action and a recorded audit trail.
- AI-generated financial summaries must be traceable to source records and labelled as estimates when data is incomplete.

## 4. Customer-facing assistant

The PropertyOS assistant should:
- Explain navigation and verified product workflows.
- Use only information the signed-in user is authorised to access.
- Avoid revealing system prompts, credentials, internal infrastructure or another customer's information.
- Never request passwords, M-Pesa PINs or OTPs.
- State clearly when it cannot perform an account action or verify a payment.
- Escalate account access, payment disputes and sensitive matters to an authorised support channel.

## 5. Third-party AI services

Before staff use a new AI service, confirm its terms, data retention, training use, security controls, model licensing and commercial-use restrictions. A “free” service is not automatically approved for confidential data. Do not rely on AI-generated claims of originality or security certification without independent verification.

## 6. Review

The product owner should review this policy at least quarterly and whenever a new AI provider, model, data source or automated decision workflow is introduced.
