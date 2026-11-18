# Doorstep: preliminary Kenyan legal and regulatory compliance assessment

**Status:** Preliminary product and engineering assessment, prepared 18 November 2026. This is not a legal opinion or a finding that Doorstep is compliant. Kenyan counsel should confirm the conclusions against the final business model, current laws and the counties in which Doorstep will operate. Where the scope of a licence is unclear, the platform should not publish or route the affected work until the relevant regulator or Kenyan counsel confirms the rule.

## Executive assessment

Doorstep is currently an early two-sided marketplace prototype. The code supports accounts, provider profiles, service listings, availability, booking and quotation requests, messaging, notifications, and a provider portfolio. The 16 service categories are listed in `lib/catalog.ts`. A compliance-control migration and draft workflows have now been added: private professional credential evidence, manual review, category release gates, privacy-request intake, safety/service reports, and a restricted staff queue. These are code-level safeguards only; the migration has not been applied to a Supabase project, workflows have not been operationally validated, and no legal compliance determination is made. Payments, refunds, provider payouts, identity-document/biometric verification, reviews, automated retention/deletion, and source-registry checks are not implemented.

The most important launch gates are:

1. Decide and document Doorstep's role in each service relationship, payment flow, and personal-data processing activity.
2. Establish the required ODPC registration status, privacy notice, lawful-basis map, data-subject request channel, retention schedule, processor contracts, and breach plan before using real customer or provider data.
3. Replace the generic `verified` profile flag with a controlled, evidence-backed verification and licensing process. Block regulated jobs when the required licence is missing, expired, suspended, or outside its scope.
4. Obtain Kenyan employment, worker-safety, consumer, payments, tax, and county-permit advice for the actual operating model. Do not describe providers as independent contractors or Doorstep as an escrow/payment service without that review.

No product feature should be described as legally compliant until the applicable obligations have been checked and the corresponding safeguards are operating.

## 1. Current product and data review

The existing prototype collects account email through Supabase Auth, profile name and optional phone, provider business/location/profile details, service descriptions and prices, availability, booking descriptions and locations, quote details, and in-product messages. It stores account and marketplace data in Supabase when configured. The Supabase project region, processor terms, and any cross-border transfer arrangements have not been established in this repository.

Current safeguards and gaps observed in the code:

- Row Level Security and participant-scoped access policies exist for marketplace records. They are a useful foundation, but must be reviewed against the final threat model and production Supabase configuration.
- The portfolio bucket is configured as private, but published portfolio images are intentionally readable under a storage policy. Portfolio images are not identity or licence documents; verification evidence uses a separate private bucket with owner/admin RLS and short-lived audited staff links. Malware scanning and a deletion schedule remain absent.
- Public “Verified” badges and filters have been removed and legacy true flags are reset by the new migration. A private credential workflow records scope, issuer, expiry, reviewer and evidence; it does not establish competence by itself and has not been applied or validated in Supabase.
- The new migration adds audit events for credential/privacy/report/category state changes and verification-document views. It does not yet log consent/notice versions, data exports, ordinary support access, or every account change.
- Draft `/privacy` and `/terms` pages, authenticated privacy-request intake, and a safety/service report intake are present. These are not final legal notices, do not execute deletion/export requests automatically, and require an operated review process. Consent records, retention/deletion automation, and a breach response runbook with named contacts are still missing; an incident procedure is documented in `docs/compliance-operations.md`.
- Category, listing, booking creation, and booking acceptance gates are encoded in the new migration. They remain inactive until the migration is applied, categories are reviewed against actual work scopes, and staff operations are established.
- There is no payment, wallet, escrow, refund, commission, or payout integration. The request form explicitly says no payment is collected.
- Customer and worker messages and job descriptions are free text. Users may put unnecessary identity, health, access, or safety details there; notices and UI should discourage that and access must remain limited to the job participants.

These are code observations, not a complete security audit. Production configuration, Supabase policies, deployment logs, backups, and vendor contracts were not available for review.

## 2. Regulatory obligations register

| Area | Preliminary obligation / trigger | Current position | Owner and next action |
|---|---|---|---|
| Data protection | Identify controller/processor roles; use a lawful basis; give clear notice; minimise data; secure it; honour data-subject rights; limit retention; manage processors and transfers. | Draft privacy notice and authenticated request intake exist; no approved lawful-basis map, consent ledger, retention/deletion process, or vendor-transfer review. | Product + privacy counsel: map every data flow and approve notice, basis, retention, processor terms, and user-rights process. |
| ODPC registration | Determine whether Doorstep must register as controller and/or processor under the Act and 2021 Registration Regulations; do not assume a small-entity exemption without checking both thresholds and excluded sectors/activities. | No ODPC registration evidence in repository. | Company + privacy counsel: assess activities, turnover, employees, and the Regulations' scheduled sectors; register before covered processing. |
| DPIA | Conduct a DPIA before processing likely to create high risk; biometric verification is specifically high risk in ODPC guidance. | No DPIA found. | Privacy lead: complete a screening and DPIA before ID/biometric verification or large-scale sensitive-data processing. |
| Professional licensing | Confirm the exact activity, provider entity, project value/scope, licence class, validity, and regulator for each regulated service. | Manual credential records, review fields, expiry checks, and category gates are coded but not deployed; detailed scope and source checks remain manual. | Operations + Kenyan regulatory counsel: complete the category matrix and regulator checks before listings/jobs go live. |
| Worker status and safety | Classification depends on the actual relationship and applicable law; employment, OSH and WIBA obligations may attach if workers are employees or the work arrangement otherwise triggers them. | Provider accounts and provider-controlled listings/availability exist; no worker terms, safety process, incident reporting, or insurance rules found. | Company + employment counsel: assess actual operational controls; prepare terms, safety and incident workflows, and applicable statutory obligations. |
| Consumer protection | Pre-contract disclosures, clear price/quote, supplier/platform responsibilities, cancellation/refund terms, complaint handling, and records for online agreements. | Draft terms, quote reminders, basic cancellation, and complaint intake exist; refund procedures, full pre-contract disclosure, final agreement copies, and confirmed role allocation remain absent. | Product + consumer counsel: define who supplies the service and what Doorstep supplies; publish compliant terms before accepting agreements. |
| Payments | Use an appropriately authorised PSP; assess whether Doorstep's role is itself regulated. Prevent unauthorised custody/transfer or an unapproved wallet/escrow model. | No payment integration exists. | Finance + payments counsel: choose a CBK-authorised PSP and documented funds flow before collecting or routing customer money. |
| Business, tax, permits | Register the business form; assess KRA, eTIMS, VAT and other tax duties; obtain applicable county permits and sector approvals. | No business/tax/permit evidence in repository. | Founders + Kenyan tax/corporate counsel: confirm entity, county footprint, tax principal/agent model, invoicing, and permits. |

## 3. Data protection assessment

### Data map and purpose controls

Create a data inventory covering: account credentials and contact details; provider identity and business records; licences and qualifications; customer addresses and job descriptions; messages; safety incidents and complaints; payment references; device/security logs; and support records. For each field, record its purpose, lawful basis, audience, storage location, recipients, retention, and rights/erasure constraints.

Collect only what is needed at each stage. For example, use an approximate service area for discovery and request an exact job address only when needed for an accepted job; do not show exact addresses to other providers or the public. Separate optional marketing consent from account/service terms. Do not treat a single “I agree” checkbox as the lawful basis for every purpose. Record notice version, timestamp, purpose, and consent withdrawal where consent is the selected basis.

### Data subject rights and retention

Provide a clear channel for access, correction, objection, restriction, portability, and erasure requests, with identity checks proportionate to the request and a case log for deadlines and outcomes. A deletion request must trigger a retention/legal-hold check; do not use indefinite retention as the default. Approve a record schedule with counsel for inactive accounts, failed verification, closed jobs, disputes, financial/tax records, safety incidents, and security logs. Delete or irreversibly anonymise data when its purpose and lawful retention period end.

### Identity documents, verification, and biometrics

Prefer verification providers that return a minimal result (e.g. document type, outcome, checked-at time, and reference) without Doorstep retaining an ID image. If a document must be stored, use a separate private bucket, encryption, strict role-based access, short-lived signed URLs, malware scanning, access/download audit events, and a short documented retention period. No public profile, customer, ordinary provider, or client-side storage path should expose the document. Never use an ID check as proof of professional competence.

Do not collect fingerprints, facial templates, or other biometrics by default. If a future provider or identity service proposes biometric processing, assess necessity and less intrusive alternatives, obtain specialist advice, and complete the required DPIA before processing. ODPC guidance identifies biometric-data processing as high risk.

### Security, vendors, transfers, and breach response

Before production, review Supabase's data-processing terms, security controls, sub-processors, hosting region, backup location, support access, deletion handling, and incident notice commitments. Map any transfer or remote access outside Kenya and document the safeguards/conditions required by the Act. Use least privilege, MFA for privileged accounts, server-side secret handling, RLS tests, rate limits, secure recovery, and separate production credentials.

Adopt a written incident plan with an on-call owner, containment steps, evidence preservation, impact assessment, processor escalation, ODPC notification assessment and timing, affected-person communications where required, and a post-incident review. The controller's notification obligation can be 72 hours where the statutory risk threshold is met; confirm the triggering event and notice requirements with counsel and the current ODPC guidance.

## 4. Worker relationship and safety considerations

The product should not decide that a person is an independent contractor merely because they registered as a provider or accepted a platform agreement. Kenyan employment counsel should assess the facts and actual control: who sets prices and hours, whether a provider can reject work without penalty, whether work is allocated or ranked algorithmically, whether exclusivity is expected, who supplies tools/materials, who directs the work, and how discipline/deactivation works. The current product lets providers set listings/prices and availability and lets them accept/decline requests, but future matching, ranking, fixed pricing, penalties, or mandatory conduct rules could change the assessment.

For each job, provide a safety-information flow proportionate to the work: task scope, site hazards, access constraints, required PPE/qualifications, emergency contact, stop-work option, and incident/report process. Give both parties a way to report harassment, unsafe conditions, injury, non-payment, and misconduct; define escalation, response times, evidence handling, anti-retaliation, and appeal for suspensions. Require proof of insurance only where counsel/regulator/product risk analysis establishes the appropriate cover, and never imply that Doorstep itself insures a worker or customer without an actual policy covering that risk.

Assess Employment Act, Occupational Safety and Health Act, Work Injury Benefits Act, tax and social-security obligations against the real relationship and deployment. A label in the agreement cannot replace that assessment.

## 5. Service-category licensing matrix

This is a screening matrix, not a final statement that any category is unregulated. Exact service descriptions and project context matter. A category with no named regulator below is **not cleared**; counsel should check applicable national rules, county laws, premises permits, and activity-specific requirements before launch.

| Doorstep category | Initial licensing screen and product control |
|---|---|
| Electrical | Gate electrical installation, repair, inspection, and related regulated work behind the applicable current EPRA electrical-worker and electrical-contractor licence class/scope. Validate holder, class, status, expiry, and whether the provider is acting as a contractor. Where the work is construction contracting, also screen applicable NCA category/practising licence. Do not route a regulated job on identity verification alone. Ask EPRA/NCA counsel to distinguish minor tasks from licensed work. |
| Plumbing | Determine whether the specific job is ordinary maintenance or construction contracting within NCA scope; check any project/site approvals and county requirements. Do not assume every plumbing call has one identical licence rule. |
| Home repairs | Require a structured scope/risk screen. Structural changes or construction-contracting work may require NCA registration/practising licence and professional approvals. Block high-risk/structural tasks until the exact NCA and professional-body rules are confirmed. |
| Painting | Check whether work is part of an NCA-regulated construction contract/project; address chemicals, access-at-height and site safety. County and project approvals may apply. |
| Carpentry | Check construction-contracting and structural-work scope, NCA category, and any professional design/approval requirements before enabling those jobs. |
| Cleaning | Check county business/premises permits and public-health/chemical-handling requirements for the actual service; include chemical and site-safety screening. |
| Beauty | Check county business permits, public-health/premises rules, and any activity-specific hygiene requirements for salons/mobile services. Do not claim a generic beauty licence is sufficient. |
| Photography | No general professional licence conclusion made. Collect only necessary event/client data; give a consent and image-use workflow for identifiable people, especially children, and check venue/event permits where relevant. |
| Event planning | Determine who is responsible for venue, public-event, fire/capacity, public-health, noise, liquor, and county approvals for each event. Disclose responsibilities in the job agreement. |
| Moving | Check county business permits, vehicle/driver licensing, insurance, and whether the service is transport regulated for the proposed vehicle/use. Keep customer addresses private and disclose liability/claims terms. |
| Gardening | Check county requirements and any pest-control/pesticide licensing or product-use rules if pesticides are applied. Add chemical and equipment safety controls. |
| Catering | Verify food-premises, food-hygiene, handler, county, and event-site requirements for the actual operating model before listing food preparation or service. Capture allergen and food-safety responsibilities in quotes/terms. |
| IT support | No general professional licence conclusion made. Minimise access to customer devices/accounts; require explicit, scoped permission and prohibit credential collection unless strictly necessary and securely handled. |
| Web and design | No general professional licence conclusion made. Address intellectual-property ownership, deliverables, revisions, pricing, and privacy where provider processes client/customer data. |
| Tutoring | Check applicable education rules for the specific service/provider and add safeguarding requirements where children are involved. Confirm parental consent, safe communications, reporting, and any required background checks with counsel. |
| Automotive | Check county business/premises requirements, vehicle-related activity-specific licences, hazardous-waste/environmental handling, and insurance for the service scope. |

For each licence record, maintain regulator/source, verified legal entity/person, licence number, exact class and scope, issue/expiry dates, evidence reference, reviewer, outcome, review date, restrictions, suspension/revocation status, and linked service categories. Recheck expiry before accepting or assigning affected jobs; suspend only the affected regulated scope when evidence expires or is withdrawn. Give providers a correction/appeal path.

EPRA's Energy Act provisions establish licensing/certification for electrical workers and electrical contractors. NCA states a person must not carry on contractor business without registration and a valid practising licence; its materials identify EPRA as a specialist licence for electrical-installation subclasses. NCA project registration materials also describe project registration obligations. The application of these requirements to individual household jobs, subcontractors, and Doorstep's role should be confirmed with the Authority/counsel.

## 6. Payments and consumer protection

No payment capability currently exists. If added, select a PSP listed as currently authorised by the Central Bank of Kenya and confirm that the PSP's authorisation covers the actual product and funds flow. Have counsel assess whether Doorstep's role itself falls within regulated payment activity. The safest initial architecture is customer payment to the authorised PSP with provider settlement performed by that PSP or its authorised partner; Doorstep records references and status but does not hold customer money in its own account, create an internal wallet, or describe the arrangement as escrow.

For each transaction, use server-side signature/secret validation for callbacks, verify amount/currency/customer/job/reference, reject replayed or duplicate callbacks with idempotency keys, reconcile provider settlement and PSP statements, and keep an append-only record of charges, commissions, refunds, chargebacks, and payout references. Refunds should be PSP transactions with clear status and customer communication, not a database-only balance adjustment.

Before the customer commits online, display the service provider's identity/role, exact service scope, quote/price components and taxes/fees, timing, materials and exclusions, cancellation/rescheduling terms, complaint route, refund procedure, and what Doorstep versus the provider is responsible for. Provide an opportunity to accept/decline and correct errors and retain/send a copy of the agreement. The Consumer Protection Act has specific internet-agreement disclosures and cancellation provisions; counsel should determine whether Doorstep, the provider, or both are the “supplier” for each flow. Reviews must only follow genuine completed jobs, be tied to a transaction, and include moderation/dispute rules.

## 7. Business and tax assessment

Confirm Doorstep's legal entity and registration with the Business Registration Service, the operating counties and required single business permits, and activity-specific permits for any premises or services Doorstep itself operates. KRA's current eTIMS guidance says persons carrying on business generally need to onboard and issue electronic tax invoices, with a buyer-initiated process for qualifying small suppliers. KRA states VAT registration is required where taxable supplies reach KES 5 million annually; the treatment of Doorstep's commission, provider service revenue, platform-as-agent/principal status, turnover tax, withholding, and cross-border/digital-marketplace supplies requires Kenyan tax advice. Maintain separate ledgers and invoice responsibility for Doorstep fees and provider service charges.

## 8. Technical safeguards implementation plan

### Gate A — before using real data or opening a public pilot

- Complete a data-flow inventory, ODPC registration analysis, DPIA screening, vendor/transfer review, privacy notice, and purpose/lawful-basis matrix.
- Add versioned notice/consent records where consent is used, data-subject request intake and tracking, retention/deletion jobs, and a documented incident-response runbook.
- Keep ID, licence, reference, incident, and complaint evidence out of public profile tables and public storage. Add a private evidence store with explicit admin-only authorization, signed short-lived access, audit trail, and deletion schedule.
- Add administrator roles, MFA, separation of duties, and logs for sensitive reads/exports, verification decisions, account changes, and support access.
- Remove or suppress the unsupported public “Verified” badge until the evidence-backed process is approved. Keep sample profiles clearly labelled.
- Add complaint/report and worker-safety intake, and publish customer/provider terms that identify roles and responsibilities.

### Gate B — before enabling a regulated service or category

- Create a service-to-licence rule table reviewed by counsel/regulator, not only category names.
- Add licence evidence records, manual-review states, expiry/revocation checks, suspension and appeal, and server-side eligibility checks on listing publication and job acceptance.
- Add test cases proving a provider with an expired or wrong-class licence cannot publish or receive the affected work, while unrelated categories remain available.
- Add scope/risk questions for construction projects, electrical tasks, child-facing tutoring, food, transport, events, chemicals, and other identified regulated/hazardous work.

### Gate C — before collecting customer money

- Obtain CBK/payment counsel review; select and contract with an authorised PSP; document settlement ownership and funds flow.
- Implement signed callback validation, idempotency, reconciliation, refund/chargeback/payout records, customer receipts, and accounting exports.
- Do not deploy an internal stored-value balance, funds-holding account, or escrow claim unless separately approved and authorised.

### Gate D — before expanding locations or volume

- Confirm county permits and any county-by-county differences; reassess ODPC thresholds and DPIA as processing grows.
- Review classification and safety controls against actual matching, ranking, pricing, and performance policies.
- Conduct access-control and RLS tests, restore/retention exercises, incident tabletop, and periodic regulator/licence expiry audits.

## 9. Questions for Kenyan counsel and regulators

1. Is Doorstep a controller, processor, or both for each profile, verification, booking, message, payment, support, and safety process? Does it meet mandatory ODPC registration conditions or a scheduled-activity exception?
2. Which lawful bases apply to each processing purpose, and what exact retention periods and erasure exceptions apply to job, dispute, identity, tax, safety, and payment records?
3. Does the chosen Supabase/vendor setup satisfy Kenyan transfer requirements for the actual processing locations, sub-processors, backups, and support access? What transfer instruments/assessments are needed?
4. Does the proposed provider model create employment, agency, or other statutory duties under the actual pricing, scheduling, matching, supervision, suspension, and work-allocation design? Which NSSF/SHA, PAYE, WIBA and OSH duties apply?
5. For each Electrical, Plumbing, Home repairs, Painting, Carpentry and Automotive job scope, when does the work become NCA construction contracting or require EPRA/other licences? Which individual worker and business licences are both required? Which projects must be registered and by whom?
6. What permits and public-health requirements apply to Beauty, Cleaning, Catering, Events, Moving, Gardening, Tutoring and other categories in each pilot county? Which obligations belong to Doorstep, provider, customer, venue, or project owner?
7. Is Doorstep an intermediary or supplier under the Consumer Protection Act for each marketplace flow? Which cancellation rights, pre-contract information, invoice, refund, and complaint duties attach to Doorstep versus the provider?
8. Does any proposed payment orchestration or split settlement make Doorstep a payment service provider or agent? Which current CBK PSP authorization and contractual safeguards cover the planned flow? Can the PSP settle providers directly?
9. How should Doorstep and providers separately account for eTIMS invoices, commission invoices, VAT, turnover tax, withholding, refunds, and platform-facilitated supplies?
10. Which insurance products are mandatory for Doorstep or providers by worker status, service category, site/project, vehicle, and county? What wording may Doorstep lawfully use about insurance and safety?

## Sources reviewed

- [Kenya Data Protection Act (Kenya Law)](https://new.kenyalaw.org/akn/ke/act/2019/24/eng%402022-12-31/source), [Data Protection (General) Regulations, 2021](https://kenyalaw.org/kl/fileadmin/pdfdownloads/LegalNotices/2021/LN263_2021.pdf), and [Registration Regulations, 2021](https://kenyalaw.org/kl/fileadmin/pdfdownloads/LegalNotices/2021/LN265_2021.pdf).
- ODPC [Data Protection Compliance](https://www.odpc.go.ke/data-protection-compliance/), [Rights of a Data Subject](https://odpc.go.ke/rights-of-a-data-subject/index.html), [Registration Guidance](https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Note-on-Registration-of-Data-Controllers-and-Data-Processors.pdf), and [DPIA Guidance](https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Note-on-Data-Protection-Impact-Assessment-1.pdf).
- [Energy Act, 2019](https://www.epra.go.ke/sites/default/files/Documents/Energy-Act-2019.pdf) and [EPRA electricity regulatory information](https://epra.go.ke/electricity-1). A draft 2025 electrical-work regulation was located but is not treated here as enacted law.
- NCA [Local Contractor Registration](https://www.nca.go.ke/local-contractors), [Project Registration](https://www.nca.go.ke/project-registration), and [Contractor Registration FAQs](https://www.nca.go.ke/contractor_registration-FAQs).
- [Employment Act (Kenya Law)](https://new.kenyalaw.org/akn/ke/act/2007/11/eng%402023-07-01/source), [Occupational Safety and Health Act](https://new.kenyalaw.org/akn/ke/act/2007/15/eng%402022-12-31/source), and [Work Injury Benefits Act](https://new.kenyalaw.org/akn/ke/act/2007/13/eng%402022-12-31/source).
- [Consumer Protection Act (Kenya Law)](https://new.kenyalaw.org/akn/ke/act/2012/46/eng%402022-12-31/source).
- CBK [National Payments System overview and authorised PSP directory](https://www.centralbank.go.ke/national-payments-system/) and [National Payment System Act, 2011](https://www.centralbank.go.ke/wp-content/uploads/2016/08/NATIONAL-PAYMENT-SYSTEM-ACT-No-39-of-2011-21.pdf). A 2026 National Payment System Bill was located but is treated as a bill, not enacted law.
- KRA [VAT](https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax), [eTIMS](https://www.kra.go.ke/services/service/16), and BRS [Company Registry](https://brs.go.ke/companies-registry/).

## Limitations and maintenance

This review is based on the source code and official pages linked above, not interviews with founders, regulator rulings, signed vendor terms, production infrastructure, insurance documents, or a complete review of all national and county laws. Some regulator pages summarize rather than reproduce the governing rules. Re-check the current consolidated statutes, regulations, regulator notices, county laws, and any 2026 legislative changes with Kenyan counsel before launch and whenever the business model, location, category, payment flow, or data processing changes.
