import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Currency(models.TextChoices):
    GBP = "GBP", "GBP"
    EUR = "EUR", "EUR"
    USD = "USD", "USD"


class BorrowRequestStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    CAMPAIGN_CREATED = "CAMPAIGN_CREATED", "Campaign created"
    FUNDED = "FUNDED", "Funded"
    DISBURSED = "DISBURSED", "Disbursed"
    IN_REPAYMENT = "IN_REPAYMENT", "In repayment"
    COMPLETED = "COMPLETED", "Completed"


class BorrowDocumentStatus(models.TextChoices):
    PENDING_UPLOAD = "PENDING_UPLOAD", "Pending upload"
    UPLOADED = "UPLOADED", "Uploaded"
    CONFIRMED = "CONFIRMED", "Confirmed"


class BorrowRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="borrow_requests", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=100, blank=True)
    reason_detailed = models.TextField(blank=True)
    amount_requested_cents = models.PositiveBigIntegerField(
        validators=[MinValueValidator(0)], null=True, blank=True
    )
    currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.GBP)
    expected_return_days = models.PositiveIntegerField(
        validators=[MinValueValidator(0)], null=True, blank=True
    )
    status = models.CharField(
        max_length=30, choices=BorrowRequestStatus.choices, default=BorrowRequestStatus.SUBMITTED
    )
    city = models.CharField(max_length=100, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    what_happened = models.TextField(blank=True)
    how_funds_used = models.TextField(blank=True)
    current_step = models.PositiveIntegerField(default=1)
    admin_note_internal = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["status"])]


class BorrowDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    borrow_request = models.ForeignKey(
        BorrowRequest, related_name="documents", on_delete=models.CASCADE
    )
    file_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    storage_key = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20, choices=BorrowDocumentStatus.choices, default=BorrowDocumentStatus.PENDING_UPLOAD
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["status"])]
