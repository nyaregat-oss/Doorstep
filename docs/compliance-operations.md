# Doorstep compliance operations

This file describes safeguards currently wired into the prototype. It is an operational checklist, not a legal opinion or final privacy notice. The legal assessment in [kenya-legal-compliance-assessment.md](kenya-legal-compliance-assessment.md) remains the list of external review gates.

## Apply and provision

1. Apply migrations 202611170001 through 202611170004, then 202611180001_compliance_controls.sql and 202611180002_compliance_security_hardening.sql. Confirm each succeeds in the intended Supabase project.
2. Create the staff account through the approved process and confirm it has a row in public.profiles.
3. Grant compliance access only from the Supabase SQL editor, using the staff user's verified profile UUID:

       insert into public.compliance_admins (user_id)
       select id from public.profiles
       where id = 'REPLACE-WITH-STAFF-PROFILE-UUID'
       on conflict (user_id) do nothing;

4. Require MFA and a named, least-privilege reviewer. Remove the compliance_admins row promptly when staff access ends. Never grant staff access through client metadata or public sign-up fields.
5. Validate the evidence bucket settings in Supabase Storage after applying migrations. doorstep-verification-evidence must remain private. Do not add public access policies or publish signed URLs.

Run `supabase test db` against a disposable local Supabase database before applying schema changes to a shared environment. `supabase/tests/compliance_security.test.sql` checks that provider roles cannot create identity verification records, upload to the identity evidence path, or read staff review notes. It also confirms that the allowed provider credential path remains available. This database check complements, but does not replace, review of every RLS policy and storage rule.

## Service-category release

Every category starts in pending state. This intentionally hides its live profiles, services, portfolio, and availability and prevents new customer requests from reaching that category.

Before changing a category to approved:

- Confirm exact service descriptions, work scopes, counties, project contexts, and applicable regulator requirements with Kenyan counsel or the regulator.
- Put the dated counsel/regulator decision reference in the review field.
- Configure exact required evidence kinds: professional_licence, qualification, reference, and identity only after a separate approved identity process and DPIA exist.
- Confirm evidence is current and in scope. An identity check does not establish professional competence. The application rejects expired licences for category eligibility.
- Reassess the category when laws, counties, products, or work scope change. Set it back to pending or blocked if the basis for approval no longer holds.

A reviewer without a documented basis must leave the category pending. The first deployment should show sample content only.

## Credential review

Providers can submit licence, qualification, and reference metadata and upload a related PDF/JPEG/PNG document to the private bucket. Identity-document and biometric submissions are rejected by both database row policies and storage-path policies, not only hidden from the form.

Staff must verify the document and issuing authority using an appropriate source; confirm holder, class/scope, expiry and linked contractor/project requirements; record an internal note in the staff-only review table and a separate provider-facing message; approve, reject, or suspend the record; and re-review after expiry or a regulator notice.

Admin page access is restricted by compliance_admins. Opening evidence records an audit event and creates a signed URL that expires after 60 seconds. Do not copy files into public storage or put document numbers in reviewer notes. The app does not automate source-registry checks, expiry notices, or a complete document-deletion schedule; manual review is required until those controls are built and approved.

## Privacy requests and trust reports

The /privacy page accepts authenticated privacy requests. The /report page accepts safety and service reports. RLS limits each record to its subject/reporter and compliance admins. Status changes and evidence-document access create compliance audit events.

A staff reviewer must verify the requestor proportionately, check applicable retention/legal holds, fulfil or decline a request on its merits, add an appropriate response note, and communicate the result through the approved channel. Marking a request “fulfilled” in Doorstep does not itself export, correct, restrict, or erase data. No automated account-erasure or retention job is currently implemented.

Reports are not an emergency channel. For an immediate threat, use local emergency services. Follow the incident procedure below for every suspected privacy/security incident.

## Privacy and security incident procedure

1. Assign an incident lead; contain access and preserve relevant logs/evidence without unnecessarily copying personal data.
2. Identify affected systems, data categories, people, dates, processors, and likely harm. Contact the relevant vendor under its incident terms.
3. Ask privacy counsel to determine whether statutory ODPC and data-subject notification thresholds apply and calculate deadlines from awareness. ODPC guidance describes a 72-hour controller notification where the legal risk threshold is met; escalate promptly without waiting for a complete forensic report.
4. Record decisions, notices, mitigations, and the reason for any delayed notification in the restricted incident register.
5. Restore only from known-good backups, rotate affected credentials, check RLS/storage policies, and complete a documented post-incident review.

This procedure still needs named on-call contacts, vendor escalation details, backup/restore steps, and a tabletop exercise before production.

## Launch blocks still outside the code

Do not enable a live paid marketplace until Kenyan counsel/founders have completed the open questions in the assessment, including ODPC registration and controller/processor roles, final lawful bases and privacy notice, retention/deletion periods, Supabase transfer/processor review, worker classification and safety duties, county/service permits, consumer terms, tax/eTIMS responsibilities, and the exact payment funds flow. No PSP, refunds, wallet, payouts, or escrow feature is wired into this prototype.
