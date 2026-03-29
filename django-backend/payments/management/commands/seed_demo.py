"""
Seed demo campaigns for development/testing.
Usage: python manage.py seed_demo
Add --clear to remove existing demo data first.
"""
import secrets

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from borrow.models import BorrowRequest, Currency
from campaigns.models import Campaign, CampaignStatus
from endorsements.models import Endorsement, EndorsementStatus


DEMO_CAMPAIGNS = [
    {
        "title": "Emergency dental surgery",
        "story": "I've been putting off dental work for months due to cost. Last week an abscess developed and my dentist says I need urgent surgery. I'm a single mum working part-time and simply can't cover this right now. I'll repay within 3 months from my wages.",
        "category": "Medical & Health",
        "amount": 85000,  # £850
        "currency": "GBP",
        "return_days": 90,
        "location_area": "Hackney, London",
        "endorsement": {
            "name": "Ibrahim Hassan",
            "title": "Community Elder",
            "affiliation": "East London Mosque",
            "vouch": "I have known this sister for over 4 years through our community. She is a hard-working single mother who always fulfils her commitments. Her dental situation is genuine and urgent. I trust she will honour the repayment.",
            "contact_method": "phone",
            "email": "ibrahim.hassan@example.com",
        },
    },
    {
        "title": "Car repair to keep my job",
        "story": "My car broke down and I need it to get to work — there's no public transport to my shift pattern. The garage quoted £620 for the repair. Without the car I'll lose my job. I can repay over 2 months.",
        "category": "Employment & Business",
        "amount": 62000,  # £620
        "currency": "GBP",
        "return_days": 60,
        "location_area": "Bradford, West Yorkshire",
        "endorsement": {
            "name": "Fatima Begum",
            "title": "Social Worker",
            "affiliation": "Bradford Community Support",
            "vouch": "I've been working with this family for the past year. The father is genuinely committed to providing for his family and the car is essential for his night-shift work. This is a straightforward need with a clear repayment path.",
            "contact_method": "email",
            "email": "fatima.begum@example.com",
        },
    },
    {
        "title": "Rent shortfall after redundancy",
        "story": "I was made redundant 3 weeks ago. I've already secured a new position starting next month but I'm short on this month's rent. My landlord has been understanding but I need to pay by end of week. New job salary will cover repayment easily.",
        "category": "Housing & Rent",
        "amount": 120000,  # £1,200
        "currency": "GBP",
        "return_days": 45,
        "location_area": "Salford, Manchester",
        "endorsement": None,
    },
    {
        "title": "School uniform and supplies",
        "story": "My two children are starting at a new school and I can't afford the uniforms, shoes, bags and stationery they need. I've tried charity shops but the specific uniform items aren't available. I'm working full-time and can repay within 6 weeks.",
        "category": "Family Support",
        "amount": 35000,  # £350
        "currency": "GBP",
        "return_days": 42,
        "location_area": "Small Heath, Birmingham",
        "endorsement": {
            "name": "Yusuf Ali",
            "title": "Head Teacher",
            "affiliation": "Al-Noor Primary School",
            "vouch": "Both children are enrolled at our school starting next term. I can confirm the uniform requirements and costs. The family is well-known to us and I'm confident the funds will be used as described.",
            "contact_method": "email",
            "email": "yusuf.ali@example.com",
        },
    },
    {
        "title": "Professional certification course",
        "story": "I've been offered a promotion at work conditional on completing a safety certification. The course costs £480 and starts in 2 weeks. My employer won't cover it upfront but the promotion comes with a £3,000 pay rise. Clear investment, just need the bridging funds.",
        "category": "Education & Training",
        "amount": 48000,  # £480
        "currency": "GBP",
        "return_days": 30,
        "location_area": "Toxteth, Liverpool",
        "endorsement": None,
    },
]


class Command(BaseCommand):
    help = "Seed demo campaigns for development/testing"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Remove existing demo data first")

    def handle(self, *args, **options):
        if options["clear"]:
            titles = [c["title"] for c in DEMO_CAMPAIGNS]
            # Delete endorsements linked to demo borrow requests
            from borrow.models import BorrowRequest as BR
            demo_brs = BR.objects.filter(title__in=titles)
            Endorsement.objects.filter(borrow_request__in=demo_brs).delete()
            Campaign.objects.filter(title_public__in=titles).delete()
            demo_brs.delete()
            self.stdout.write(self.style.WARNING("Cleared existing demo campaigns + endorsements"))

        # Get or create a demo borrower
        demo_user, _ = User.objects.get_or_create(
            email="demo-borrower@handup.local",
            defaults={"first_name": "Demo", "last_name": "Borrower", "role": "borrower"},
        )

        created = 0
        for c in DEMO_CAMPAIGNS:
            if Campaign.objects.filter(title_public=c["title"]).exists():
                self.stdout.write(f"  Skipping '{c['title']}' (already exists)")
                continue

            br = BorrowRequest.objects.create(
                user=demo_user,
                title=c["title"],
                category=c["category"],
                situation=c["story"],
                use_of_funds=c["story"][:100],
                amount_cents=c["amount"],
                currency=c["currency"],
                return_days=c["return_days"],
                city=c["location_area"].split(",")[0].strip(),
                postcode="",
                status="VERIFIED",
            )

            Campaign.objects.create(
                borrow_request=br,
                title_public=c["title"],
                story_public=c["story"],
                terms_public=f"Repayment within {c['return_days']} days. Interest-free Qard Hasan loan.",
                category=c["category"],
                amount_needed_cents=c["amount"],
                amount_pooled_cents=0,
                expected_return_days=c["return_days"],
                currency=c["currency"],
                status=CampaignStatus.RUNNING,
                verified=True,
            )

            # Create endorsement if provided
            end = c.get("endorsement")
            if end:
                Endorsement.objects.create(
                    borrow_request=br,
                    invite_token=secrets.token_urlsafe(32),
                    invite_email=end["email"],
                    endorser_name=end["name"],
                    endorser_title=end["title"],
                    endorser_affiliation=end["affiliation"],
                    vouch_text=end["vouch"],
                    contact_method=end["contact_method"],
                    contact_value=end["email"],
                    status=EndorsementStatus.COMPLETED,
                    completed_at=timezone.now(),
                )
                self.stdout.write(f"    🤝 Endorsed by {end['name']}")

            created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ Created: {c['title']} ({c['location_area']})"))

        self.stdout.write(self.style.SUCCESS(f"\nDone! Created {created} demo campaigns."))
