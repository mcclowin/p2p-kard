import uuid

from django.conf import settings
from django.db import models


class ContractStatus(models.TextChoices):
    GENERATED = "GENERATED", "Generated"
    BORROWER_SIGNED = "BORROWER_SIGNED", "Borrower signed"
    ACTIVE = "ACTIVE", "Active"
    COMPLETED = "COMPLETED", "Completed"
    FORGIVEN = "FORGIVEN", "Forgiven"


class ConsentRole(models.TextChoices):
    BORROWER = "BORROWER", "Borrower"
    SUPPORTER = "SUPPORTER", "Supporter"


class QardHasanContract(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.OneToOneField(
        "campaigns.Campaign", related_name="contract", on_delete=models.CASCADE
    )
    borrow_request = models.ForeignKey(
        "borrow.BorrowRequest", related_name="contracts", on_delete=models.SET_NULL, null=True, blank=True
    )
    borrower = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="borrower_contracts", on_delete=models.CASCADE
    )
    contract_text = models.TextField()
    contract_hash = models.CharField(max_length=64)
    amount_cents = models.PositiveBigIntegerField()
    currency = models.CharField(max_length=3, default="EUR")
    repayment_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=ContractStatus.choices, default=ContractStatus.GENERATED
    )
    borrower_signed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"QardHasan {self.id} — {self.status}"


class ContractConsent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(
        QardHasanContract, related_name="consents", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="contract_consents", on_delete=models.CASCADE
    )
    role = models.CharField(max_length=20, choices=ConsentRole.choices)
    consented_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")

    class Meta:
        unique_together = [("contract", "user", "role")]
        ordering = ["-consented_at"]

    def __str__(self):
        return f"Consent {self.user_id} ({self.role}) on {self.contract_id}"
