# Product Specification
Name options: HandUp, GoodLoan, CircleFund, TideOver

**Community Lending Platform**
Peer-to-peer interest-free emergency loans (Qard Hasan)

---

## 1. Overview

### What is this?
A platform connecting people facing short-term emergencies with community members willing to give interest-free loans. 
Inspired by the Islamic prophetic tradition of benevolent loans (Qard Hasan).  

### Who is it for?
Working people who hit a temporary cash crunch. 
For Muslims and non-Muslims alike. Focus on community/local. 

### The Problem
Emergencies don't respect budgets. Current options are brutal:
- High-interest credit cards
- Predatory payday loans
- Humiliation of asking friends/family

Islamic teaching offers Qard Hasan (the beautiful loan without interest), but there's no infrastructure to connect those in need with those willing to lend.


### Islamic Background

The concept of Qard Hasan (قرض حسن - "Benevolent Loan") is deeply rooted in Islamic scripture:

**On giving respite to those in hardship:**

> وَإِن كَانَ ذُو عُسْرَةٍ فَنَظِرَةٌ إِلَىٰ مَيْسَرَةٍ ۚ وَأَن تَصَدَّقُوا خَيْرٌ لَّكُمْ ۖ إِن كُنتُمْ تَعْلَمُونَ
>
> *"And if the debtor is in hardship, then let there be postponement until a time of ease. But if you give it as charity, it is better for you, if only you knew."*
> — Quran 2:280 (Al-Baqarah)

**On lending to Allah:**

> مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ وَلَهُ أَجْرٌ كَرِيمٌ
>
> *"Who is it that will lend Allah a goodly loan, that He may multiply it for him and there will be a noble reward for him?"*
> — Quran 57:11 (Al-Hadid)

**On excellence in repayment:**

> عن أبي هريرة رضي الله عنه قال: استقرض رسول الله ﷺ سِنًّا فأعطاه سِنًّا خيرًا منه وقال: خياركم أحاسنكم قضاءً
>
> *"The Messenger of Allah ﷺ borrowed a young camel and repaid it with a better one, saying: 'The best of you are those who are best in repaying debts.'"*
> — Sahih Muslim 1601

**Principles derived:**
- Lenders should give respite (not pressure) when borrowers face hardship
- Forgiving a debt is spiritually better than demanding repayment
- Borrowers should strive to repay well, even exceeding what was borrowed
- Lending without interest is an act of worship, not merely a transaction


### The Solution
Community-based interest-free lending infrastructure:
- Anonymized requests to remove stigma
- Open banking to verify genuine need and ability to repay
- Lenders can extend deadlines or forgive loans (converting to Sadaqah)
- Local/community focus builds trust

### Core Principles
- **No interest** — Qard Hasan not debt trap
- **Dignity-preserving** — Anonymous requests, no shame
- **Community-based** — Help people near you
- **Verified need** — Open banking prevents misuse
- **Flexible mercy** — Lenders can forgive if borrower can't repay

### Reference Projects
- [Qardus](https://www.qardus.com/news/qard-al-hassan-benevolent-lending) — UK-based Qard al-Hassan platform (previously FCA-registered)
- [Ansar Finance](https://ansarfinance.com/) — UK charity providing interest-free loans
- [LaunchGood](https://www.launchgood.com/) — Muslim crowdfunding (donations, not loans)

---

## 2. User Roles

### Borrower (Requester)
### Supporter (Lender)
### Admin (Platform)
 - Verification responsibility 
 - Conflict intermediation

---

## 3. Authentication & Onboarding

### 3.1 Authentication Method: SSO (Single Sign-On)

No guest checkout because need details for returns  
Email required at minimum. 

**SSO Providers to Support:**
- [ ] Google
- [ ] Email magic link (passwordless)

**Implementation Options:**
| Provider | Pros | Cons |
|----------|------|------|
| **Auth0** | Full-featured, easy setup | Paid after 7k MAU |
| **Clerk** | Modern UI, React-friendly | Paid after 10k MAU |
| **Supabase Auth** | Free tier generous, PostgreSQL | Less polished UI |
| **Firebase Auth** | Free tier, Google-native | Google lock-in |
| **NextAuth/Auth.js** | Open source, self-hosted | More setup work |

**Recommended:** Clerk or Supabase Auth


### 3.2 Onboarding Flow

For borrowers, need to sign up.  
fill form
complete banking/id links (scoped to user)

For lenders, need to sign up. 


### 3.3 Profile Fields

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| Email | Yes | SSO | Primary identifier |
| Name | Yes | SSO (editable) | Display name |
| Location | Yes* | User input | City or postcode (*for community features) |

---

## 4. User Flows

### 4.1 Supporter Flow

```
Browse Campaigns (not logged in)
    │
    ├── Filter by: Location (near me), Category, Amount needed
    │
    ▼
View Campaign Details
    │
    ▼
Click "Support This Request"
    │
    ▼
Enter Amount
    │
    ▼
Sign in required
    │
    ▼
Payment (Stripe)
    │
    ▼
Complete profile for payout
    │
    ▼
Track in Dashboard
```

### 4.2 Borrower Flow: Multi-Page Application

**LaunchGood-style page-by-page flow:**

```
Page 1: BASICS
    │
    ▼
Page 2: YOUR STORY
    │
    ▼
Page 3: AMOUNT & TERMS
    │
    ▼
Page 4: DOCUMENTS 
    │
    ▼
Page 5: VERIFICATION (IDV + Bank)
    │
    ▼
Page 6: REVIEW & SUBMIT
    │
    ▼
Submitted → Pending Review
```

---

## 5. Borrow Request Form Specification

### Page 1: BASICS

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| **Category** | Single select | Yes | Must select one |
| **Title** | Text (short) | Yes | 10-100 chars |
| **Location** | City/Postcode | Yes | Valid UK postcode or city |

**Categories:**
- Medical & Health
- Education & Training
- Housing & Rent
- Employment & Business
- Emergency & Crisis
- Essential Living Costs
- Family Support
- Other

**UI Notes:**
- Show category icons/cards for selection
- Auto-detect location from profile (allow override)
- Progress bar: Step 1 of 6

---

### Page 2: YOUR STORY

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| **What happened?** | Textarea | Yes | 100-2000 chars |
| **How will funds be used?** | Textarea | Yes | 50-500 chars |

**UI Notes:**
- Guidance: "Be honest and specific. Your identity stays protected."
- Character counter
- Prompts: "Explain your situation", "What will the money pay for?"

---

### Page 3: AMOUNT & TERMS

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| **Amount needed** | Currency input | Yes | £50 - £5,000 |
| **Repay by date** | Date picker | Yes | 3 days - 6 months from now |

**Simplification: Single repayment only**
- No monthly repayment schedule
- Borrower repays full amount by chosen date
- One lump sum, not installments

**UI Notes:**
- Preset buttons: £100, £250, £500, £1000, £2000, £5000
- Date presets: "2 weeks", "1 month", "3 months", "6 months"
- Show: "You'll repay £X by [date]"

---

### Page 4: DOCUMENTS

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| **Supporting documents** | File upload | Yes (default) | At least 1 file |
| **No documents checkbox** | Checkbox | No | Disables requirement |

**Simplification: Documents always required by default**
- Upfront expectation: you need to provide evidence
- Override: "I don't have documents to upload" checkbox
- If checked: request still submits but flagged for manual review

**Accepted Documents:**
- Payslip / proof of income
- Bank statement
- Utility bill / proof of address
- Medical bill / letter (for medical requests)
- Tenancy agreement (for housing requests)
- Screenshot of bill / invoice
- Other supporting evidence

**UI Notes:**
- Drag & drop upload area (prominent)
- Suggest documents based on category selected
- File types: PDF, JPG, PNG (max 10MB each)
- Checkbox at bottom: "I don't have documents right now" → triggers warning that approval less likely

---

### Page 5: VERIFICATION

| Step | Provider | Required | Notes |
|------|----------|----------|-------|
| **Identity Verification** | Didit | Yes | ID + selfie |
| **Bank Account Link** | TrueLayer | Yes | For affordability check |

**UI Notes:**
- Show verification status (pending/complete)
- Redirect to provider, return to app
- Can save progress and return later

---

### Page 6: REVIEW & SUBMIT

**Display all entered information:**
- Category, title, location
- Story summary
- Amount, term, monthly repayment
- Documents uploaded (count)
- Verification status

**Checkboxes:**
- [ ] I confirm this information is accurate
- [ ] I agree to the terms and repayment obligations
- [ ] I understand my request will be reviewed

**Submit Button:** "Submit for Review"

---

## 6. Location & Community Features

### 6.1 Why Location?

- Build trust: "Help someone in your community"
- Local connection: People more likely to help neighbors
- Transparency: See impact in your area

### 6.2 Location Data (V1 - UK Only)

**What we collect:**
- Full UK postcode (validated)

**What we display:**
- Area/borough name only (e.g., "Hackney", "Manchester City Centre")
- Never show exact postcode or address

**Implementation:**
```
User enters full postcode → Validate via Postcodes.io → Store postcode
Display: Look up area/borough name from postcode
Example: "E8 1DY" → displays as "Hackney, London"
```

### 6.3 Location-Based Features (V1)

**For Supporters:**
- "Near You" filter on campaign browse
- Area name shown on campaign cards
- Community stats (future: "£5,000 raised in your area this month")

**For Borrowers:**
- Enter postcode during application
- Area/borough automatically displayed (no visibility options in V1)

### 6.4 Database Changes for Location

```python
# Add to User model
class User:
    postcode = models.CharField(max_length=10, null=True)  # Full postcode stored
    location_area = models.CharField(max_length=100, null=True)  # Derived from postcode lookup

# Add to Campaign model (denormalized from BorrowRequest)
class Campaign:
    location_area = models.CharField(max_length=100, null=True)  # e.g., "Hackney, London"
```

### 6.5 Postcode Lookup

Use [Postcodes.io](https://postcodes.io) (free, no API key required):
```
GET https://api.postcodes.io/postcodes/E81DY
→ Returns: admin_district, admin_ward, region
→ We display: admin_ward + ", " + admin_district
```

---

## 7. Validation & Eligibility

### 7.1 Borrower Requirements
- Email verified (via SSO)
- Identity verified (Didit)
- Bank account linked (TrueLayer)
- No active loan
- Profile complete (including location)

### 7.2 Affordability Rules
- Maximum repayment: 30% of disposable income
- Minimum buffer: £200 after repayment
- Income stability check via bank data

### 7.3 Risk Scoring
- Auto-approve: score ≤ 30
- Manual review: score 31-60
- Auto-decline: score > 60

### 7.4 KYC/AML Checks

**Provider:** [KYC2020](https://www.kyc2020.com/) (~$0.03/scan)

**Lists checked:**
- UK HM Treasury sanctions list
- OFAC SDN (US sanctions)
- UN Security Council
- EU Consolidated List
- PEP (Politically Exposed Persons)

**When to check:**
- On borrower submission (before admin review)
- On supporter first contribution (before payment processed)

**If flagged:**
- Block transaction
- Flag for manual admin review
- Do not proceed without compliance sign-off

### 7.5 Manual/AI checks
- Supporting docs run through AI 
- Admin final check (sanity check above)

---

## 8. Money Flow & Escrow

### 8.1 Collection
- Payment via Stripe
- Account required (no guest)
- Money held in platform Stripe balance

### 8.2 Disbursement
- After campaign fully funded
- Admin approval required
- Bank transfer to borrower

### 8.3 Repayment
- **Single repayment** (not monthly installments)
- Borrower pays full amount by due date
- Stripe payment link
- Reminders: 7 days before, 1 day before, on due date

### 8.4 Distribution to Supporters
- Proportional split
- Requires payout account setup
- Options: Stripe Connect / Bank transfer

### 8.5 Extensions/Defaults remedies 
- escalation ladder: reminders, request grace period action/extension with reasoning. 
- For supporter, can decide to forgive. 
- For hard default, debt collection? credit score mess up? 
- Do we add a credit scoring internally for repeat borrowers? build up score/limits? 


---

## 9. Fees & Pricing

- Platform fee: Tiered flat fees. (eg. 0-500=$5, 500-2000=10, 2000-10,000=100)
- Payment processing: ~1.5-3% (Stripe)
- Who pays: Borrower

---

## 10. Notifications

### Borrower
- Application received
- Decision notification
- Campaign live
- New support received? 
- Fully funded
- Funds sent
- Repayment reminders
- Repayment confirmed

### Supporter
- Support confirmed
- Campaign funded
- Borrower received funds
- Repayment sent/processed
- Loan complete

---

## 11. Privacy & Anonymity

- Borrower name: Hidden (show initials or pseudonym)
- Borrower location: Area/neighbourhood only
- Borrower story: Visible
- Supporter names: Hidden from borrower (optional reveal)

---

## 12. Limits & Constraints

| Parameter | Value |
|-----------|-------|
| Min loan amount | £50 |
| Max loan amount | £5,000 |
| Min repayment window | 3 days |
| Max repayment window | 6 months |
| Repayment type | Single lump sum |
| Max active loans per borrower | 1 |
| Min support amount | £5 |
| Campaign funding timeout | 30 days |
| Documents | Required (with override) |

---

## 13. Technical Integrations

| Service | Provider | Purpose |
|---------|----------|---------|
| Auth/SSO | Clerk / Supabase | Login, signup |
| Payments | Stripe | Collection, payouts |
| IDV | Didit | Identity verification |
| Open Banking | TrueLayer | Income verification |
| AML/Sanctions | [KYC2020](https://www.kyc2020.com/) | PEP & sanctions screening |
| Email | SendGrid / Resend | Notifications |
| Location | Postcodes.io (free) | Postcode lookup |

---

## 14. Admin Portal

### 14.1 Why Admin Portal?

Every borrow request requires manual review before becoming a live campaign. Admin responsibilities:
- Review submitted requests and documents
- Verify identity/banking checks completed
- Approve or reject requests
- Create campaigns from approved requests
- Monitor active campaigns
- Handle disputes and extensions

### 14.2 Admin Functions (V1)

| Function | Description |
|----------|-------------|
| **List Requests** | View all borrow requests, filter by status |
| **Review Request** | See full details: story, docs, verification status |
| **Decide** | Approve (VERIFY) or Reject with internal note |
| **Create Campaign** | Set public title, confirm amount, launch |
| **View Campaigns** | Monitor funding progress |
| **Manage Repayments** | Track due dates, handle extensions |

### 14.3 Implementation Options

**Option A: Django Admin (Quickest)**
- Use built-in Django admin interface
- Customize with admin.py for our models
- Pros: Zero frontend work, already authenticated
- Cons: Not pretty, limited UX

**Option B: Simple React Admin Pages (Recommended for V1)**
- Add `/admin/*` routes to existing React app
- Reuse existing components (Card, Button, etc.)
- Protected by staff role check
- Backend API already exists in `staffapi/`

**Option C: Separate Admin App**
- Dedicated admin dashboard (React Admin, Retool, etc.)
- Overkill for V1

### 14.4 Existing Backend API

The `staffapi/` Django app already provides:
```
GET  /api/staff/borrow-requests/           # List all requests
GET  /api/staff/borrow-requests/{id}/      # Request details
POST /api/staff/borrow-requests/{id}/decision/  # Approve/Reject
POST /api/staff/borrow-requests/{id}/campaign/  # Create campaign
```

### 14.5 Admin Workflow

```
New Request Submitted
       │
       ▼
Request appears in Admin Queue (status: PENDING_REVIEW)
       │
       ▼
Admin reviews: story, documents, ID verification, bank link
       │
       ├── Reject → Request closed, borrower notified
       │
       ▼
Approve (VERIFIED)
       │
       ▼
Admin creates Campaign (sets public title)
       │
       ▼
Campaign goes live (RUNNING)
```

---

## 15. Open Questions

**Decided:**
- [x] Repayment plan or one-off? → **Single repayment only**
- [x] Documents required? → **Yes, always (with override checkbox)**
- [x] Location granularity → **UK postcode → area/borough display**
- [x] Admin portal → **Option B: React admin pages using existing staffapi**

**Still Open:**
- [ ] SSO provider: Clerk vs Supabase vs other?
- [ ] Multiple or single funder per campaign?
- [ ] Platform fee model: tiered fixed? 
- [ ] Default handling: Grace period? Platform guarantee?
- [ ] Partial funding: Allow borrower to accept less than requested?
- [ ] Loan forgiveness: How does supporter convert to Sadaqah?
- [ ] Do we allow option for borrower to be contacted by supporter?

To figure out:

- [ ] Terms & Conditions for both users   
- [ ] Legal & Compliance │ Is this FCA-regulated? Consumer credit rules? GDPR requirements? Dispute resolution process?    
   
---

## 16. Out of Scope/ potential extensions 

- Mobile app (web only)
- Multiple currencies (GBP only for V1)
- International (UK only for V1)
- Recurring/scheduled giving
- Social features (comments, updates)
- generate shareable whatsapp link
- guarantor/kafeel feature
- Lending for tax efficiency idea as incentive for lenders? 

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-01 | | Init |

