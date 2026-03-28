import hashlib
import logging
from datetime import timedelta

from django.utils import timezone

from payments.models import Contribution, ContributionStatus

from .models import ContractConsent, ContractStatus, ConsentRole, QardHasanContract

logger = logging.getLogger(__name__)


def generate_contract_text(campaign, lender_ref, borrower_ref):
    """Render the full Qard Hasan agreement as plain text."""
    amount_eur = campaign.amount_needed_cents / 100
    repayment_date = ""
    if campaign.expected_return_date:
        repayment_date = campaign.expected_return_date.strftime("%d %B %Y")
    else:
        est = timezone.now().date() + timedelta(days=campaign.expected_return_days)
        repayment_date = est.strftime("%d %B %Y")

    borrower_name = borrower_ref.name or borrower_ref.email
    lender_name = lender_ref.name or lender_ref.email

    text = f"""QARD HASAN — INTEREST-FREE GOODWILL LOAN AGREEMENT

Date: {timezone.now().strftime("%d %B %Y")}
Contract reference: {campaign.id}

───────────────────────────────────────

1. PARTIES

   BORROWER:
   {borrower_name}
   (Identity verified by ReCircle platform)

   LENDER:
   {lender_name}
   (Identity verified by ReCircle platform)

   WITNESS / PLATFORM:
   ReCircle — Ethical Peer-to-Peer Lending Platform

───────────────────────────────────────

2. NATURE OF THE AGREEMENT

   This is a Qard Hasan — an interest-free goodwill loan. The Lender
   provides the Borrower with a loan on the basis of goodwill and
   compassion, expecting no financial return beyond the principal amount.
   This model of ethical lending has its roots in Islamic finance and is
   open to all, regardless of faith or background.

───────────────────────────────────────

3. LOAN AMOUNT

   Principal amount: EUR {amount_eur:,.2f}
   Currency: {campaign.currency}

   The Lender shall receive no interest, profit, fee, or any additional
   sum beyond the exact principal amount lent.

───────────────────────────────────────

4. ZERO-INTEREST CLAUSE

   This agreement explicitly prohibits:

   a) Any interest of any kind
   b) Any late-payment penalty that constitutes additional payment
   c) Any hidden fees or charges payable to the Lender
   d) Any form of benefit to the Lender conditional upon this loan

   The principle behind this clause comes from the Islamic prohibition of
   riba (interest/usury), which holds that lending should be an act of
   goodwill — not a means of profit.

───────────────────────────────────────

5. REPAYMENT TERMS

   The Borrower agrees to repay the full principal amount of
   EUR {amount_eur:,.2f} to the Lender by {repayment_date}.

   Repayment shall be made through the ReCircle platform.
   Partial repayments are permitted and encouraged.

───────────────────────────────────────

6. HARDSHIP & COMPASSION CLAUSE

   If the Borrower experiences genuine financial hardship:

   a) The Borrower may request an extension through the platform
   b) The Lender is encouraged (but not obligated) to grant an extension
   c) The Lender may forgive part or all of the debt as an act of
      generosity
   d) No penalty shall be imposed for late repayment due to hardship

   This clause is inspired by the Quranic principle (2:280) that if a
   debtor is in difficulty, creditors should grant time until it is
   easier to repay — and that forgiving the debt is even better.

───────────────────────────────────────

7. DISPUTE RESOLUTION

   Any disputes arising from this agreement shall be resolved through:
   a) Good-faith discussion between the parties via the platform
   b) Mediation by a mutually agreed-upon third party
   c) In accordance with applicable local law, if necessary

   Both parties agree to resolve disputes amicably and in good faith.

───────────────────────────────────────

8. PLATFORM ROLE

   ReCircle acts as a facilitator and witness to this agreement. The
   platform is not a party to the loan itself. ReCircle:
   a) Verifies the identity of both parties
   b) Facilitates fund collection and disbursement
   c) Provides repayment tracking
   d) Maintains this contract record

───────────────────────────────────────

9. WITNESS

   ReCircle Ethical Lending Platform acts as the independent witness
   to this agreement between the Lender and the Borrower.

───────────────────────────────────────

10. ACCEPTANCE

    By signing this agreement, the Borrower acknowledges receipt of the
    loan, confirms the terms above, and commits to repay the principal
    amount in good faith.

    The Lender has accepted these terms at the time of their
    contribution through the platform.

───────────────────────────────────────

This agreement follows the Qard Hasan model of ethical lending — rooted
in Islamic finance principles and open to all people of goodwill.
"""
    return text


def generate_contract_for_campaign(campaign):
    """Create a QardHasanContract when a campaign reaches FUNDED status.

    Also back-fills ContractConsent rows for all paid supporters.
    """
    if hasattr(campaign, "contract"):
        logger.info("Contract already exists for campaign %s", campaign.id)
        return campaign.contract

    borrow_request = campaign.borrow_request
    borrower = borrow_request.requester if borrow_request else None

    if not borrower:
        logger.error("No borrower found for campaign %s", campaign.id)
        return None

    paid_contributions = Contribution.objects.filter(
        campaign=campaign, status=ContributionStatus.PAID
    ).select_related("contributor")

    # 1-to-1 model: single lender per campaign
    first_contribution = paid_contributions.first()
    if not first_contribution:
        logger.error("No paid contributions found for campaign %s", campaign.id)
        return None
    lender = first_contribution.contributor

    contract_text = generate_contract_text(campaign, lender, borrower)
    contract_hash = hashlib.sha256(contract_text.encode("utf-8")).hexdigest()

    repayment_date = campaign.expected_return_date
    if not repayment_date:
        repayment_date = timezone.now().date() + timedelta(days=campaign.expected_return_days)

    contract = QardHasanContract.objects.create(
        campaign=campaign,
        borrow_request=borrow_request,
        borrower=borrower,
        contract_text=contract_text,
        contract_hash=contract_hash,
        amount_cents=campaign.amount_needed_cents,
        currency=campaign.currency,
        repayment_date=repayment_date,
        status=ContractStatus.GENERATED,
    )

    # Back-fill consent records for supporters who already paid
    seen_users = set()
    for contribution in paid_contributions:
        uid = contribution.contributor_id
        if uid in seen_users:
            continue
        seen_users.add(uid)
        ContractConsent.objects.create(
            contract=contract,
            user=contribution.contributor,
            role=ConsentRole.SUPPORTER,
        )

    logger.info(
        "Contract %s generated for campaign %s with %d supporter consent(s)",
        contract.id, campaign.id, len(seen_users),
    )
    return contract
